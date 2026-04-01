/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { RASS_OPTIONS } from "@/lib/constants";

// ============================================================
// Design-Konstanten
// ============================================================

const FONT = "Arial";
const SIZE_BODY = 22;      // 11pt (half-points)
const SIZE_HEADING = 24;   // 12pt
const SIZE_TITLE = 28;     // 14pt
const SP_AFTER = 120;      // 6pt in Twips (1/1440 inch)
const SP_HEADING_BEFORE = 200;
const SP_HEADING_AFTER = 80;

// Seitenränder in Twips: 2,5cm = 1417, 2cm = 1134
const PAGE_MARGIN = { top: 1417, bottom: 1417, left: 1134, right: 1134 };

// ============================================================
// Label-Maps
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

const IDDSI_LABELS: Record<number, string> = {
  0: "IDDSI Level 0 – Dünnflüssig",
  1: "IDDSI Level 1 – Leicht angedickt",
  2: "IDDSI Level 2 – Nektarähnlich",
  3: "IDDSI Level 3 – Puddingartig",
  4: "IDDSI Level 4 – Püriert",
  5: "IDDSI Level 5 – Gewürfelt/weich",
  6: "IDDSI Level 6 – Weich & mundgerecht",
  7: "IDDSI Level 7 – Normal",
};

const BEVERAGE_LABELS: Record<number, string> = {
  0: "unangedickt (IDDSI 0)",
  1: "leicht angedickt (IDDSI 1)",
  2: "nektarähnlich / ThickandEasy (IDDSI 2)",
  3: "stark angedickt (IDDSI 3)",
};

const LANGMORE_LABELS: Record<number, string> = {
  0: "Grad 0 – Normal (feucht)",
  1: "Grad 1 – Ansammlung in Valleculae/Sinus piriformes",
  2: "Grad 2 – Transiente Ansammlung im Larynxeingang",
  3: "Grad 3 – Permanente Ansammlung im Larynxeingang",
};

// ============================================================
// Paragraph-Helfer
// ============================================================

function body(text: string, opts?: { bold?: boolean; italic?: boolean }) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold: opts?.bold, italics: opts?.italic })],
    spacing: { after: SP_AFTER },
  });
}

function heading(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_HEADING, bold: true })],
    spacing: { before: SP_HEADING_BEFORE, after: SP_HEADING_AFTER },
  });
}

function bullet(text: string, level = 0) {
  return new Paragraph({
    bullet: { level },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
    spacing: { after: SP_AFTER },
  });
}

function gap() {
  return new Paragraph({
    children: [new TextRun({ text: "", font: FONT, size: SIZE_BODY })],
    spacing: { after: SP_AFTER },
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

function swallowTestToProse(t: any): Paragraph {
  const label = CONSISTENCY_LABELS[t.consistency] ?? t.consistency;
  const parts: string[] = [];

  // Prädeglutitiv
  if (t.praedeglutitiv?.length) {
    parts.push(`prädeglutitiv ${(t.praedeglutitiv as string[]).join(", ")}`);
  } else {
    parts.push("prädeglutitiv kein Leaking beobachtbar");
  }

  // Schluckakt
  if (t.schluckakt?.length) {
    parts.push(`Schluckakt ${(t.schluckakt as string[]).join(", ")}`);
  }

  // Postdeglutitiv — Retentionen
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
    const pas = t.pas_score != null ? ` PAS ${t.pas_score}` : "";
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

  const text = `Schlucken von ${label}: ${parts.join(", ")}.`;
  return body(text);
}

// ============================================================
// Nativbefund → Stichpunkte
// ============================================================

function nativbefundBullets(n: any): Paragraph[] {
  const items: Paragraph[] = [];

  const add = (label: string, values: string[], side = "") => {
    if (values?.length) {
      items.push(bullet(`${label}: ${values.join(", ")}${sideLabel(side)}`));
    }
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
  const fields: [string, string][] = [
    ["Velopharyngealer Verschluss", n.vp_closure],
    ["Stimmlippenbeweglichkeit", n.vocal_fold_mobility],
    ["Glissando", n.glissando],
    ["Glottisschluss/Taschenfaltenschluss", n.glottis_closure],
    ["Willkürliches Husten/Räuspern", n.voluntary_cough],
  ];
  const filled = fields.filter(([, v]) => v);
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

  const reqBody = await req.json();
  const { examinationId, patientName } = reqBody;
  if (!examinationId) {
    return NextResponse.json({ error: "examinationId fehlt." }, { status: 400 });
  }

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
  const testedTests = (swallowRes.data ?? [])
    .filter((t) => !t.not_tested)
    .sort((a, b) => CONSISTENCY_ORDER.indexOf(a.consistency) - CONSISTENCY_ORDER.indexOf(b.consistency));

  const displayName = patientName?.trim() || "[Patient/in]";
  const dateFormatted = new Date(exam.examination_date).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const statusLabel = exam.status === "erstdiagnostik" ? "Erstbefund" : "Verlaufskontrolle";
  const rassLabel = RASS_OPTIONS.find((o) => o.value === exam.rass_score)?.label ?? String(exam.rass_score);
  const bodsI = nativ?.bods_saliva;
  const bodsII = exam.bods_nutrition;
  const bodsTotal = bodsI != null && bodsII != null ? bodsI + bodsII : null;

  // ============================================================
  // Dokument aufbauen
  // ============================================================

  const children: Paragraph[] = [];

  // --- Titel ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: "Funktionelle endoskopische (Kontroll-) Untersuchung des Schluckaktes",
        font: FONT, size: SIZE_TITLE, bold: true,
      })],
      spacing: { after: 240 },
    })
  );

  // --- Patient/in (Platzhalter, nie vorausgefüllt) ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Patient/in: ", font: FONT, size: SIZE_BODY, bold: true }),
        new TextRun({ text: displayName, font: FONT, size: SIZE_BODY }),
      ],
      spacing: { after: SP_AFTER },
    })
  );
  children.push(gap());

  // --- Kopfdaten ---
  children.push(bullet(`Status: ${statusLabel} vom ${dateFormatted}`));
  children.push(bullet(`RASS (Richmond Agitation Sedation Scale): ${rassLabel}`));
  if (exam.communication) {
    children.push(bullet(`Kommunikation/Verständigung: ${exam.communication}`));
  }
  children.push(bullet(`Trachealkanüle: ${exam.has_tracheostomy ? "Ja" : "Nein"}`));
  if (exam.procedure_description) {
    children.push(bullet(`Angewandtes Verfahren: ${exam.procedure_description}`));
  }
  children.push(gap());

  // --- Medizinische Diagnose + Anamnese ---
  if (exam.medical_diagnosis || exam.dysphagia_question || exam.medical_history) {
    children.push(heading("Medizinische Diagnose / Anamnese"));
    if (exam.medical_diagnosis) children.push(bullet(`Diagnose: ${exam.medical_diagnosis}`));
    if (exam.dysphagia_question) children.push(bullet(`Fragestellung: ${exam.dysphagia_question}`));
    if (exam.medical_history) children.push(bullet(`Vorerkrankungen/Ausgangslage: ${exam.medical_history}`));
    children.push(gap());
  }

  // --- Nativbefund transstomatal (nur bei TK) ---
  if (exam.has_tracheostomy) {
    children.push(heading("Inspektion/Nativbefund transstomatal"));
    children.push(body("(Befund transstomatal – bitte manuell ergänzen)", { italic: true }));
    children.push(gap());
  }

  // --- Nativbefund ---
  if (nativ) {
    children.push(heading("Inspektion/Nativbefund"));
    children.push(...nativbefundBullets(nativ));
    children.push(gap());

    // Phonationskontrolle
    const phonation = phonationBullets(nativ);
    if (phonation) {
      children.push(heading("Phonationskontrolle"));
      children.push(...phonation);
      children.push(gap());
    }

    // Langmore
    if (nativ.langmore_score != null) {
      children.push(heading("Graduierung der hypopharyngealen Speichelansammlung (Langmore 2001)"));
      children.push(bullet(LANGMORE_LABELS[nativ.langmore_score as number] ?? `Grad ${nativ.langmore_score}`));
      children.push(gap());
    }
  }

  // --- Direkte Schluckuntersuchung ---
  if (testedTests.length > 0) {
    children.push(heading("Direkte Schluckuntersuchung"));
    for (const t of testedTests) {
      children.push(swallowTestToProse(t));
    }
    children.push(gap());
  }

  // --- Sensibilität ---
  if (exam.overall_sensitivity) {
    const SENS_LABELS: Record<string, string> = {
      "unauffällig": "unauffällig",
      "leicht": "leicht eingeschränkt",
      "mittelgradig": "mittelgradig eingeschränkt",
      "stark": "stark eingeschränkt",
    };
    const sensText = (SENS_LABELS[exam.overall_sensitivity] ?? exam.overall_sensitivity)
      + (exam.sensitivity_side ? sideLabel(exam.sensitivity_side) : "");
    children.push(heading("Sensibilität"));
    children.push(body(sensText));
    children.push(gap());
  }

  // --- Befund / Zusammenfassende Beurteilung ---
  children.push(heading("Befund/Zusammenfassende Beurteilung"));

  if (bodsTotal != null) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: `BODS I (Score ${bodsI}) + BODS II (Score ${bodsII}) = ${bodsTotal}`,
          font: FONT, size: SIZE_BODY, bold: true,
        })],
        spacing: { after: SP_AFTER },
      })
    );
  }

  if (exam.assessment_text) {
    children.push(body(exam.assessment_text));
  } else {
    children.push(body("(Beurteilungstext – bitte KI-Beurteilung generieren oder manuell ergänzen)", { italic: true }));
  }

  if (exam.pathophysiology_text) {
    children.push(body(exam.pathophysiology_text));
  }
  children.push(gap());

  // --- Kostformempfehlung ---
  children.push(heading("Kostformempfehlung"));
  const kostParts: string[] = [];
  if (exam.dys_level) kostParts.push(`DYS ${exam.dys_level}`);
  if (exam.iddsi_level != null) {
    kostParts.push(IDDSI_LABELS[exam.iddsi_level as number] ?? `IDDSI Level ${exam.iddsi_level}`);
  }
  if (kostParts.length) {
    children.push(bullet(`Kost: ${kostParts.join(" / ")}`));
  }
  if (exam.beverage_iddsi != null) {
    children.push(bullet(`Getränke: ${BEVERAGE_LABELS[exam.beverage_iddsi as number] ?? `IDDSI ${exam.beverage_iddsi}`}`));
  }
  if (!kostParts.length && exam.beverage_iddsi == null) {
    children.push(bullet("(Kostformempfehlung – bitte manuell ergänzen)", ));
  }

  // TK-Empfehlung
  if (exam.has_tracheostomy && exam.tracheostomy_recommendation) {
    children.push(bullet(`Trachealkanüle: ${exam.tracheostomy_recommendation}`));
  }
  children.push(gap());

  // --- Therapieempfehlungen ---
  children.push(heading("Empfehlung Therapie"));
  const therapyItems: string[] = [...(exam.therapy_recommendations ?? [])];
  if (exam.therapy_notes) {
    for (const line of exam.therapy_notes.split("\n").filter(Boolean)) {
      therapyItems.push(line);
    }
  }
  if (therapyItems.length) {
    for (const item of therapyItems) {
      children.push(bullet(item));
    }
  } else {
    children.push(bullet("(Therapieempfehlungen – bitte manuell ergänzen)", ));
  }
  children.push(gap());
  children.push(gap());

  // --- Abschlussformel ---
  children.push(body("Für Folgeuntersuchungen bzw. Rückfragen stehen wir Ihnen zur Verfügung."));
  children.push(gap());
  children.push(body("Mit freundlichen Grüßen"));
  children.push(gap());
  children.push(gap());
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "________________________________", font: FONT, size: SIZE_BODY })],
      spacing: { after: SP_AFTER },
    })
  );
  children.push(body("Logopädie", { italic: true }));

  // ============================================================
  // DOCX generieren
  // ============================================================

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: PAGE_MARGIN },
      },
      children,
    }],
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
