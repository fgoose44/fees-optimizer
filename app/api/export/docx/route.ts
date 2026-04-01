/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { RASS_OPTIONS } from "@/lib/constants";

// ============================================================
// Hilfs-Konstanten
// ============================================================

const CONSISTENCY_LABELS: Record<string, string> = {
  speichel: "Speichel",
  brei: "glatter, breiförmiger Kost (Aqua / DYS I)",
  nektar: "nektarartig angedickten Flüssigkeiten (ThickandEasy)",
  wasser_glas: "unangedickten Flüssigkeiten (Glas)",
  wasser_strohhalm: "unangedickten Flüssigkeiten (Strohhalm)",
  wasser_kapi: "unangedickten Flüssigkeiten (Dysphagie-Becher/Kapi-Cup)",
  brot: "festem Bolusmaterial (Brot)",
};

const CONSISTENCY_ORDER = [
  "speichel", "brei", "nektar",
  "wasser_glas", "wasser_strohhalm", "wasser_kapi", "brot",
];

const SENSITIVITY_LABELS: Record<string, string> = {
  "unauffällig": "unauffällig",
  "leicht": "leicht eingeschränkt",
  "mittelgradig": "mittelgradig eingeschränkt",
  "stark": "stark eingeschränkt",
};

const IDDSI_LABELS: Record<number, string> = {
  0: "Level 0 — Dünnflüssig",
  1: "Level 1 — Leicht angedickt",
  2: "Level 2 — Nektarähnlich",
  3: "Level 3 — Puddingartig",
  4: "Level 4 — Püriert",
  5: "Level 5 — Gewürfelt/weich",
  6: "Level 6 — Weich & mundgerecht",
  7: "Level 7 — Normal",
};

const LANGMORE_LABELS: Record<number, string> = {
  0: "Grad 0 — Normal (feucht)",
  1: "Grad 1 — Ansammlung in Valleculae/Sinus piriformes",
  2: "Grad 2 — Transiente Ansammlung im Larynxeingang",
  3: "Grad 3 — Permanente Ansammlung im Larynxeingang",
};

// ============================================================
// Helfer — DOCX-Bausteine
// ============================================================

function emptyLine() {
  return new Paragraph({ children: [new TextRun("")] });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 240, after: 80 },
  });
}

function bullet(text: string, level = 0) {
  return new Paragraph({
    bullet: { level },
    children: [new TextRun({ text })],
    spacing: { after: 40 },
  });
}

function prose(text: string) {
  return new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 120 },
  });
}

function sideLabel(side: string): string {
  if (side === "L") return " (betont links)";
  if (side === "R") return " (betont rechts)";
  if (side === "beidseitig") return " (beidseitig)";
  return "";
}

// ============================================================
// Schlucktest → Fließtext-Absatz
// ============================================================

// eslint-disable-next-line
function swallowTestToProse(t: any): Paragraph {
  const label = CONSISTENCY_LABELS[t.consistency] ?? t.consistency;
  const parts: string[] = [];

  // Prädeglutitiv
  if (t.praedeglutitiv?.length) {
    const pre = (t.praedeglutitiv as string[]).join(", ");
    parts.push(`prädeglutitiv ${pre}`);
  } else {
    parts.push("prädeglutitiv ohne Besonderheiten");
  }

  // Schluckakt
  if (t.schluckakt?.length) {
    parts.push(`Schluckakt ${(t.schluckakt as string[]).join(", ")}`);
  }

  // Postdeglutitiv
  const retentions: string[] = [];
  if (t.retention_valleculae_l) retentions.push(`Valleculae links ${t.retention_valleculae_l}`);
  if (t.retention_valleculae_r) retentions.push(`Valleculae rechts ${t.retention_valleculae_r}`);
  if (t.retention_sinus_l) retentions.push(`Sinus piriformes links ${t.retention_sinus_l}`);
  if (t.retention_sinus_r) retentions.push(`Sinus piriformes rechts ${t.retention_sinus_r}`);
  if (t.retention_pharynx) retentions.push(`Pharynxwand ${t.retention_pharynx}`);
  if (retentions.length) {
    parts.push(`postdeglutitiv Retentionen in ${retentions.join(", ")}`);
  } else {
    parts.push("postdeglutitiv keine Retentionen sichtbar");
  }

  // Clearing
  if (t.clearing?.length) {
    parts.push(`Clearing ${(t.clearing as string[]).join(", ")}`);
  }

  // Penetration/Aspiration
  if (t.pen_asp && t.pen_asp !== "keine") {
    const pas = t.pas_score != null ? ` (PAS ${t.pas_score})` : "";
    parts.push(`${t.pen_asp}${pas} sichtbar`);
  } else {
    parts.push("keine Hinweise auf Penetration/Aspiration");
  }

  // Kompensation
  if (t.kompensation?.length || t.kompensation_notes) {
    const komp = [...(t.kompensation ?? [])];
    if (t.kompensation_notes) komp.push(t.kompensation_notes);
    parts.push(`Kompensation: ${komp.join(", ")}`);
  }

  const text = `Schlucken von ${label}: ${parts.join("; ")}.`;
  return prose(text);
}

// ============================================================
// Nativbefund → Stichpunkte
// ============================================================

function nativbefundBullets(n: any): Paragraph[] {
  const items: Paragraph[] = [];

  const add = (label: string, values: string[], side = "") => {
    if (values?.length) items.push(bullet(`${label}: ${values.join(", ")}${sideLabel(side)}`));
  };

  add("Schleimhäute", n.mucosa);
  add("Velum", n.velum, n.velum_side);
  add("Zungenbasis", n.tongue_base);
  add("Epiglottis", n.epiglottis);
  add("Pharynx", n.pharynx, n.pharynx_side);
  add("Larynx/Kehlkopf", n.larynx, n.larynx_side);
  add("Valleculae/Sinus piriformes", n.valleculae, n.valleculae_side);

  if (n.cough_reflex) items.push(bullet(`Hustenstoß spontan: ${n.cough_reflex}`));
  if (n.swallow_reflex) items.push(bullet(`Schluckversuch spontan: ${n.swallow_reflex}`));

  return items.length ? items : [bullet("Nativbefund nicht dokumentiert")];
}

// ============================================================
// Phonationskontrolle → Stichpunkte
// ============================================================

function phonationBullets(n: any): Paragraph[] | null {
  const items: [string, string][] = [
    ["Velopharyngealer Verschluss", n.vp_closure],
    ["Stimmlippenbeweglichkeit", n.vocal_fold_mobility],
    ["Glissando", n.glissando],
    ["Glottisschluss/Taschenfaltenschluss", n.glottis_closure],
    ["Willkürliches Husten/Räuspern", n.voluntary_cough],
  ];
  const filled = items.filter(([, v]) => v);
  if (!filled.length) return null;
  return filled.map(([k, v]) => bullet(`${k}: ${v}`));
}

// ============================================================
// POST Handler
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const body = await req.json();
  const { examinationId, patientName } = body;
  if (!examinationId) {
    return NextResponse.json({ error: "examinationId fehlt." }, { status: 400 });
  }

  // Alle Daten laden
  const [examRes, nativRes, swallowRes] = await Promise.all([
    supabase.from("examinations").select("*").eq("id", examinationId).single(),
    supabase.from("native_findings").select("*").eq("examination_id", examinationId).maybeSingle(),
    supabase.from("swallow_tests").select("*").eq("examination_id", examinationId),
  ]);

  if (examRes.error || !examRes.data) {
    return NextResponse.json({ error: "Untersuchung nicht gefunden." }, { status: 404 });
  }

  const exam = examRes.data;
  const nativ = nativRes.data;
  const swallowTests = (swallowRes.data ?? []).sort(
    (a, b) => CONSISTENCY_ORDER.indexOf(a.consistency) - CONSISTENCY_ORDER.indexOf(b.consistency)
  );
  const testedTests = swallowTests.filter((t) => !t.not_tested);

  // Hilfswerte
  const displayName = patientName?.trim() || "[Patient/in]";
  const dateFormatted = new Date(exam.examination_date).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const statusLabel = exam.status === "erstdiagnostik" ? "Erstdiagnostik" : "Verlaufsdiagnostik";
  const rassLabel = RASS_OPTIONS.find((o) => o.value === exam.rass_score)?.label ?? String(exam.rass_score);
  const bodsI = nativ?.bods_saliva;
  const bodsII = exam.bods_nutrition;
  const bodsTotal = bodsI != null && bodsII != null ? bodsI + bodsII : null;

  // ============================================================
  // Dokument aufbauen
  // ============================================================

  const children: Paragraph[] = [];

  // 1. Titel
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({
        text: "Funktionelle endoskopische (Kontroll-) Untersuchung des Schluckaktes",
        bold: true,
      })],
      spacing: { after: 120 },
    })
  );

  // 2. [Patient/in] — NIEMALS vorausgefüllt
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Patient/in: ", bold: true }),
        new TextRun({ text: displayName }),
      ],
      spacing: { after: 80 },
    })
  );
  children.push(emptyLine());

  // 3. Kopfdaten
  children.push(sectionHeading("Untersuchungsdaten"));
  children.push(bullet(`Status: ${statusLabel} vom ${dateFormatted}`));
  children.push(bullet(`RASS: ${rassLabel}`));
  if (exam.communication) children.push(bullet(`Verständigung: ${exam.communication}`));
  children.push(bullet(`Trachealkanüle: ${exam.has_tracheostomy ? "Ja" : "Nein"}`));
  if (exam.procedure_description) children.push(bullet(`Angewandtes Verfahren: ${exam.procedure_description}`));
  children.push(emptyLine());

  // 4. Medizinische Diagnose + Anamnese
  if (exam.medical_diagnosis || exam.dysphagia_question || exam.medical_history) {
    children.push(sectionHeading("Medizinische Diagnose / Anamnese"));
    if (exam.medical_diagnosis) children.push(bullet(`Diagnose: ${exam.medical_diagnosis}`));
    if (exam.dysphagia_question) children.push(bullet(`Fragestellung: ${exam.dysphagia_question}`));
    if (exam.medical_history) children.push(bullet(`Vorerkrankungen/Ausgangslage: ${exam.medical_history}`));
    children.push(emptyLine());
  }

  // 5. Nativbefund transstomatal (nur bei TK)
  if (exam.has_tracheostomy) {
    children.push(sectionHeading("Inspektion/Nativbefund transstomatal"));
    children.push(prose("(Befund transstomatal — bitte manuell ergänzen)"));
    children.push(emptyLine());
  }

  // 6. Nativbefund
  if (nativ) {
    children.push(sectionHeading("Inspektion/Nativbefund"));
    children.push(...nativbefundBullets(nativ));
    children.push(emptyLine());

    // 7. Phonationskontrolle
    const phonation = phonationBullets(nativ);
    if (phonation) {
      children.push(sectionHeading("Phonationskontrolle"));
      children.push(...phonation);
      children.push(emptyLine());
    }

    // 8. Langmore
    if (nativ.langmore_score != null) {
      children.push(sectionHeading("Graduierung der hypopharyngealen Speichelansammlung (Langmore)"));
      children.push(bullet(LANGMORE_LABELS[nativ.langmore_score as number] ?? `Grad ${nativ.langmore_score}`));
      children.push(emptyLine());
    }
  }

  // 9. Direkte Schluckuntersuchung
  if (testedTests.length > 0) {
    children.push(sectionHeading("Direkte Schluckuntersuchung"));
    for (const t of testedTests) {
      children.push(swallowTestToProse(t));
    }
    children.push(emptyLine());
  }

  // 10. Sensibilität
  if (exam.overall_sensitivity) {
    children.push(sectionHeading("Sensibilität"));
    const sensLabel = SENSITIVITY_LABELS[exam.overall_sensitivity] ?? exam.overall_sensitivity;
    const sensLine = exam.sensitivity_side
      ? `${sensLabel}${sideLabel(exam.sensitivity_side)}`
      : sensLabel;
    children.push(bullet(sensLine));
    children.push(emptyLine());
  }

  // 11. Befund / Zusammenfassende Beurteilung (inkl. BODS)
  children.push(sectionHeading("Befund/Zusammenfassende Beurteilung"));
  if (bodsTotal != null) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `BODS I (${bodsI}) + BODS II (${bodsII}) = ${bodsTotal}`,
            bold: true,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }
  if (exam.assessment_text) {
    children.push(prose(exam.assessment_text));
  } else {
    children.push(prose("(Beurteilungstext — bitte manuell ergänzen oder KI-Beurteilung generieren)"));
  }
  if (exam.pathophysiology_text) {
    children.push(emptyLine());
    children.push(new Paragraph({
      children: [new TextRun({ text: "Pathophysiologie:", bold: true })],
    }));
    children.push(prose(exam.pathophysiology_text));
  }
  children.push(emptyLine());

  // 12. Kostformempfehlung
  children.push(sectionHeading("Kostformempfehlung"));
  const kostelements: string[] = [];
  if (exam.dys_level) kostelements.push(`DYS ${exam.dys_level}`);
  if (exam.iddsi_level != null) kostelements.push(IDDSI_LABELS[exam.iddsi_level as number] ?? `IDDSI Level ${exam.iddsi_level}`);
  if (kostelements.length) children.push(bullet(`Kost: ${kostelements.join(" / ")}`));
  if (exam.beverage_iddsi != null) {
    const bevLabel = ["Unangedickt (IDDSI 0)", "Leicht angedickt (IDDSI 1)", "Nektarähnlich / ThickandEasy (IDDSI 2)", "Stark angedickt (IDDSI 3)"][exam.beverage_iddsi as number] ?? `IDDSI ${exam.beverage_iddsi}`;
    children.push(bullet(`Getränke: ${bevLabel}`));
  }
  if (!kostelements.length && exam.beverage_iddsi == null) {
    children.push(bullet("(Kostformempfehlung — bitte manuell ergänzen)"));
  }

  // TK-Empfehlung
  if (exam.has_tracheostomy && exam.tracheostomy_recommendation) {
    children.push(emptyLine());
    children.push(new Paragraph({
      children: [new TextRun({ text: "Empfehlung Trachealkanüle:", bold: true })],
    }));
    for (const line of exam.tracheostomy_recommendation.split("\n").filter(Boolean)) {
      children.push(bullet(line));
    }
  }
  children.push(emptyLine());

  // 13. Therapieempfehlungen
  children.push(sectionHeading("Empfehlung Therapie"));
  const therapyItems: string[] = exam.therapy_recommendations ?? [];
  if (exam.therapy_notes) therapyItems.push(exam.therapy_notes);
  if (therapyItems.length) {
    for (const item of therapyItems) {
      for (const line of item.split("\n").filter(Boolean)) {
        children.push(bullet(line));
      }
    }
  } else {
    children.push(bullet("(Therapieempfehlungen — bitte manuell ergänzen)"));
  }
  children.push(emptyLine());
  children.push(emptyLine());

  // 14. Abschlussformel + Unterschrift
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Für Folgeuntersuchungen bzw. Rückfragen stehen wir Ihnen zur Verfügung." })],
      spacing: { after: 120 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Mit freundlichen Grüßen" })],
      spacing: { after: 480 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "________________________________" })],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Logopädin", italics: true, color: "666666" })],
    })
  );

  // ============================================================
  // DOCX generieren
  // ============================================================

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="FEES-Bericht.docx"`,
    },
  });
}
