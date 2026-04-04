/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Header, Tab, TabStopType, TabStopPosition,
} from "docx";
import { RASS_OPTIONS } from "@/lib/constants";

// ============================================================
// Design-Konstanten
// ============================================================

const FONT = "Arial";
const SIZE_BODY = 22;        // 11pt (half-points)
const SIZE_TITLE = 28;       // 14pt
const SP_AFTER_BODY = 120;   // 6pt spacing after body text
const SP_AFTER_SECTION = 240; // 12pt spacing after section / before heading
const TAB_STOP = 3500;       // 6cm Tab-Stop für Label/Wert-Zeilen

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
  0: "Grad 0 – Keine sichtbaren Sekrete oder nur transiente Bläschen in Valleculae/Sinus",
  1: "Grad 1 – Beidseits oder tief gepoolt in Valleculae/Sinus, kein Larynxeingang betroffen",
  2: "Grad 2 – Transiente Ansammlung im Larynxeingang",
  3: "Grad 3 – Permanente Ansammlung im Larynxeingang",
};

// ============================================================
// Paragraph-Helfer
// ============================================================

/** Fließtext 11pt, spacing after 120 */
function body(text: string, opts?: { bold?: boolean; italic?: boolean }): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold: opts?.bold, italics: opts?.italic })],
    spacing: { after: SP_AFTER_BODY },
  });
}

/** Abschnittsüberschrift: 11pt, fett, spacing before 240 / after 120 */
function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold: true })],
    spacing: { before: SP_AFTER_SECTION, after: SP_AFTER_BODY },
  });
}

/**
 * Label/Wert-Zeile mit Tab-Stop bei 3500 DXA.
 * Label fett, Wert normal — keine Bullets.
 */
function labelRow(label: string, value: string): Paragraph {
  return new Paragraph({
    tabStops: [{ type: TabStopType.LEFT, position: TAB_STOP }],
    children: [
      new TextRun({ text: `${label}:`, font: FONT, size: SIZE_BODY, bold: true }),
      new TextRun({ children: [new Tab()], font: FONT, size: SIZE_BODY }),
      new TextRun({ text: value || "—", font: FONT, size: SIZE_BODY }),
    ],
    spacing: { after: SP_AFTER_BODY },
  });
}

/** Echtes Word-Bullet mit Einzug */
function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    indent: { left: 720, hanging: 360 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
    spacing: { after: SP_AFTER_BODY },
  });
}

/** Leerzeile */
function gap(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: "", font: FONT, size: SIZE_BODY })],
    spacing: { after: SP_AFTER_BODY },
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

  if (t.praedeglutitiv?.length) {
    parts.push(`prädeglutitiv ${(t.praedeglutitiv as string[]).join(", ")}`);
  } else {
    parts.push("prädeglutitiv kein Leaking beobachtbar");
  }

  if (t.schluckakt?.length) {
    parts.push(`Schluckakt ${(t.schluckakt as string[]).join(", ")}`);
  }

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

  if (t.clearing?.length) {
    parts.push(`Clearing ${(t.clearing as string[]).join(", ")}`);
  }

  if (t.pen_asp && t.pen_asp !== "keine") {
    const pas = t.pas_score != null ? ` PAS ${t.pas_score}` : "";
    parts.push(`${t.pen_asp}${pas} sichtbar`);
  } else {
    parts.push("keine Hinweise auf Penetration/Aspiration");
  }

  if (t.kompensation?.length || t.kompensation_notes) {
    const komp = [...(t.kompensation ?? [])];
    if (t.kompensation_notes) komp.push(t.kompensation_notes);
    parts.push(`Kompensation: ${komp.join(", ")}`);
  }

  return body(`Schlucken von ${label}: ${parts.join(", ")}.`);
}

// ============================================================
// Nativbefund → Label/Wert-Zeilen
// ============================================================

function nativbefundRows(n: any): Paragraph[] {
  const items: Paragraph[] = [];

  const addRow = (label: string, values: string[], side = "") => {
    if (values?.length) {
      items.push(labelRow(label, values.join(", ") + sideLabel(side)));
    }
  };

  addRow("Schleimhäute", n.mucosa);
  addRow("Velum", n.velum, n.velum_side);
  addRow("Zungenbasis", n.tongue_base);
  addRow("Epiglottis", n.epiglottis);
  addRow("Pharynx", n.pharynx, n.pharynx_side);
  addRow("Larynx/Kehlkopf", n.larynx, n.larynx_side);

  // Valleculae und Sinus getrennt
  if (n.valleculae?.length) {
    addRow("Valleculae", n.valleculae, n.valleculae_side);
  }
  if (n.sinus_piriformes?.length) {
    addRow("Sinus piriformes", n.sinus_piriformes, n.sinus_piriformes_side);
  }
  if (!n.valleculae?.length && !n.sinus_piriformes?.length) {
    items.push(labelRow("Valleculae/Sinus pir.", "keine Retentionen"));
  }

  if (n.cough_reflex) items.push(labelRow("Hustenstoß spontan", n.cough_reflex));
  if (n.swallow_reflex) items.push(labelRow("Schluckversuch spontan", n.swallow_reflex));

  return items.length ? items : [body("Nativbefund nicht dokumentiert", { italic: true })];
}

// ============================================================
// Transstomatal-Befund → Label/Wert-Zeilen
// ============================================================

function transstomatalRows(n: any): Paragraph[] {
  const items: Paragraph[] = [];
  if (n.trachea_mucosa?.length) items.push(labelRow("Schleimhäute Trachea", n.trachea_mucosa.join(", ")));
  if (n.trachea_structures?.length) {
    const val = n.trachea_structures.join(", ") + (n.trachea_structures_notes ? ` (${n.trachea_structures_notes})` : "");
    items.push(labelRow("Strukturveränderungen", val));
  }
  if (n.tk_position) {
    items.push(labelRow("TK-Position", n.tk_position === "mittig" ? "Mittig im Lumen" : "Nicht mittig im Lumen"));
  }
  return items.length ? items : [body("(Transstomatal-Befund nicht dokumentiert)", { italic: true })];
}

// ============================================================
// Phonationskontrolle → Label/Wert-Zeilen
// ============================================================

function phonationRows(n: any): Paragraph[] | null {
  const fields: [string, string][] = [
    ["Velopharyngealer Verschluss", n.vp_closure],
    ["Stimmlippenbeweglichkeit", n.vocal_fold_mobility
      ? n.vocal_fold_mobility + (n.vocal_fold_mobility === "asymmetrisch" && n.vocal_fold_weakness_side ? ` — Schwäche ${n.vocal_fold_weakness_side}` : "")
      : ""],
    ["Konstriktorenkontraktion (Glissando)", n.glissando
      ? n.glissando + (n.glissando === "asymmetrisch" && n.glissando_weakness_side ? ` — Schwäche ${n.glissando_weakness_side}` : "")
      : ""],
    ["Glottisschluss/Taschenfaltenschluss", n.glottis_closure],
    ["Willkürliches Husten/Räuspern", n.voluntary_cough],
  ];
  const filled = fields.filter(([, v]) => v);
  if (!filled.length) return null;
  return filled.map(([k, v]) => labelRow(k, v));
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

  const [examRes, nativRes, swallowRes, profileRes] = await Promise.all([
    supabase.from("examinations").select("*").eq("id", examinationId).single(),
    supabase.from("native_findings").select("*").eq("examination_id", examinationId).maybeSingle(),
    supabase.from("swallow_tests").select("*").eq("examination_id", examinationId),
    supabase.from("profiles").select("first_name, last_name, title").eq("id", user.id).maybeSingle(),
  ]);

  if (examRes.error || !examRes.data) {
    return NextResponse.json({ error: "Untersuchung nicht gefunden." }, { status: 404 });
  }

  const exam = examRes.data;
  const nativ = nativRes.data;
  const profile = profileRes.data;
  const testedTests = (swallowRes.data ?? [])
    .filter((t) => !t.not_tested)
    .sort((a, b) => CONSISTENCY_ORDER.indexOf(a.consistency) - CONSISTENCY_ORDER.indexOf(b.consistency));

  const displayName = patientName?.trim() || "[Patient/in]";
  const examDate = new Date(exam.examination_date);
  const dateFormatted = examDate.toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const yy = String(examDate.getFullYear()).slice(-2);
  const mm = String(examDate.getMonth() + 1).padStart(2, "0");
  const dd = String(examDate.getDate()).padStart(2, "0");
  const patNr = String(exam.patient_nr ?? 0).padStart(4, "0");
  const docxFilename = `${yy}${mm}${dd}_FEES-Bericht_${patNr}.docx`;

  const statusLabel = exam.status === "erstdiagnostik" ? "Erstbefund" : "Verlaufskontrolle";
  const rassLabel = RASS_OPTIONS.find((o) => o.value === exam.rass_score)?.label ?? String(exam.rass_score);
  const bodsI = nativ?.bods_saliva;
  const bodsII = exam.bods_nutrition;
  const bodsTotal = bodsI != null && bodsII != null ? bodsI + bodsII : null;

  const authorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Logopädie";
  const authorTitle = profile?.title || "";

  // ============================================================
  // Kopfzeile (erscheint auf jeder Seite)
  // ============================================================

  const pageHeader = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `FEES-Bericht  |  Patient-ID: ${patNr}  |  ${dateFormatted}`,
            font: FONT,
            size: 18, // 9pt
            color: "888888",
          }),
        ],
        spacing: { after: 0 },
      }),
    ],
  });

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
      spacing: { after: SP_AFTER_SECTION },
    })
  );

  // --- Patient/in (Platzhalter, nie vorausgefüllt) ---
  children.push(labelRow("Patient/in", displayName));
  children.push(gap());

  // --- Stammdaten ---
  children.push(labelRow("Status", `${statusLabel} vom ${dateFormatted}`));
  children.push(labelRow("RASS", rassLabel));
  if (exam.communication) children.push(labelRow("Verständigung", exam.communication));
  children.push(labelRow("Trachealkanüle", exam.has_tracheostomy ? "Ja" : "Nein"));
  if (exam.has_tracheostomy) {
    if (exam.cannula_type) children.push(labelRow("Kanülentyp", exam.cannula_type));
    if (exam.cuff_status) children.push(labelRow("Cuff-Status", exam.cuff_status === "geblockt" ? "Geblockt" : "Entblockt"));
    if (exam.speaking_valve) children.push(labelRow("Sprechventil", exam.speaking_valve === "vorhanden" ? "Vorhanden" : "Nicht vorhanden"));
  }
  if (exam.procedure_description) children.push(labelRow("Verfahren", exam.procedure_description));
  children.push(gap());

  // --- Medizinische Diagnose + Anamnese ---
  if (exam.medical_diagnosis || exam.dysphagia_question || exam.medical_history) {
    children.push(heading("Medizinische Diagnose / Anamnese"));
    if (exam.medical_diagnosis) children.push(labelRow("Diagnose", exam.medical_diagnosis));
    if (exam.dysphagia_question) children.push(labelRow("Fragestellung", exam.dysphagia_question));
    if (exam.medical_history) children.push(labelRow("Vorerkrankungen", exam.medical_history));
    children.push(gap());
  }

  // --- Nativbefund transstomatal (nur bei TK) ---
  if (exam.has_tracheostomy && nativ) {
    children.push(heading("Inspektion/Nativbefund transstomatal"));
    children.push(...transstomatalRows(nativ));
    children.push(gap());
  }

  // --- Nativbefund ---
  if (nativ) {
    children.push(heading("Inspektion/Nativbefund"));
    children.push(...nativbefundRows(nativ));
    children.push(gap());

    // Phonationskontrolle
    const phonation = phonationRows(nativ);
    if (phonation) {
      children.push(heading("Phonationskontrolle"));
      children.push(...phonation);
      children.push(gap());
    }

    // Langmore
    if (nativ.langmore_score != null) {
      children.push(heading("Graduierung der hypopharyngealen Speichelansammlung (Langmore 2001)"));
      children.push(labelRow("Grad", LANGMORE_LABELS[nativ.langmore_score as number] ?? `Grad ${nativ.langmore_score}`));
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
    children.push(labelRow("BODS-Score", `BODS I: ${bodsI}  |  BODS II: ${bodsII}  |  Gesamt: ${bodsTotal}`));
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
  if (exam.dys_level) children.push(labelRow("Kost (DYS)", exam.dys_level));
  if (exam.iddsi_level != null) {
    children.push(labelRow("Kost (IDDSI)", IDDSI_LABELS[exam.iddsi_level as number] ?? `IDDSI Level ${exam.iddsi_level}`));
  }
  if (exam.beverage_iddsi != null) {
    children.push(labelRow("Getränke", BEVERAGE_LABELS[exam.beverage_iddsi as number] ?? `IDDSI ${exam.beverage_iddsi}`));
  }
  if (!exam.dys_level && exam.iddsi_level == null && exam.beverage_iddsi == null) {
    children.push(body("(Kostformempfehlung – bitte manuell ergänzen)", { italic: true }));
  }
  if (exam.has_tracheostomy && exam.tracheostomy_recommendation) {
    children.push(labelRow("Trachealkanüle", exam.tracheostomy_recommendation));
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
    children.push(body("(Therapieempfehlungen – bitte manuell ergänzen)", { italic: true }));
  }
  children.push(gap());
  children.push(gap());

  // --- Abschlussformel ---
  children.push(body("Für Folgeuntersuchungen bzw. Rückfragen stehen wir Ihnen zur Verfügung."));
  children.push(gap());
  children.push(body("Mit freundlichen Grüßen"));
  children.push(gap());
  children.push(body(authorName));
  if (authorTitle) children.push(body(authorTitle, { italic: true }));

  // ============================================================
  // DOCX generieren
  // ============================================================

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1417, bottom: 1417, left: 1134, right: 1134 },
        },
      },
      headers: {
        default: pageHeader,
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${docxFilename}"`,
    },
  });
}
