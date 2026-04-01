import fs from "fs";
import path from "path";

// ============================================================
// Stil-Referenz: Vorlagen einlesen (serverseitig)
// ============================================================

function loadStyleExamples(): string {
  const dir = path.join(process.cwd(), "prompts");
  const files = [
    "vorlage_fees_1.txt",
    "vorlage_fees_2.txt",
    "vorlage_fees_3.txt",
    "vorlage_fees_4.txt",
    "vorlage_fees_5.txt",
  ];
  return files
    .map((f, i) => {
      try {
        const content = fs.readFileSync(path.join(dir, f), "utf-8");
        return `--- Beispielbericht ${i + 1} ---\n${content.trim()}`;
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

// ============================================================
// Typen für die Befunddaten
// ============================================================

export interface ExamData {
  examination_date: string;
  status: string;
  rass_score: number;
  communication: string;
  has_tracheostomy: boolean;
  procedure_description: string;
  medical_diagnosis: string;
  dysphagia_question: string;
  medical_history: string;
  bods_nutrition: number | null;
  iddsi_level: number | null;
  overall_sensitivity: string;
  sensitivity_side: string;
  overall_assessment: string[];
}

export interface NativData {
  mucosa: string[];
  velum: string[];
  velum_side: string;
  tongue_base: string[];
  epiglottis: string[];
  pharynx: string[];
  pharynx_side: string;
  larynx: string[];
  larynx_side: string;
  valleculae: string[];
  valleculae_side: string;
  cough_reflex: string;
  swallow_reflex: string;
  vp_closure: string;
  vocal_fold_mobility: string;
  glissando: string;
  glottis_closure: string;
  voluntary_cough: string;
  langmore_score: number | null;
  bods_saliva: number | null;
}

export interface SwallowTestRow {
  consistency: string;
  not_tested: boolean;
  praedeglutitiv: string[];
  schluckakt: string[];
  retention_valleculae_l: string;
  retention_valleculae_r: string;
  retention_sinus_l: string;
  retention_sinus_r: string;
  retention_pharynx: string;
  pen_asp: string;
  pas_score: number | null;
  clearing: string[];
  kompensation: string[];
  kompensation_notes: string;
}

// ============================================================
// Konsistenz-Label-Map
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

// Konsistenzreihenfolge für den Bericht
const CONSISTENCY_ORDER = [
  "speichel",
  "brei",
  "nektar",
  "wasser_glas",
  "wasser_strohhalm",
  "wasser_kapi",
  "brot",
];

// ============================================================
// Hilfsfunktionen — Befunddaten → lesbarer Text
// ============================================================

function sideLabel(side: string): string {
  if (side === "L") return " (betont links)";
  if (side === "R") return " (betont rechts)";
  if (side === "beidseitig") return " (beidseitig)";
  return "";
}

function formatNativbefund(n: NativData): string {
  const lines: string[] = [];

  if (n.mucosa.length) lines.push(`Schleimhäute: ${n.mucosa.join(", ")}`);
  if (n.velum.length) lines.push(`Velum: ${n.velum.join(", ")}${sideLabel(n.velum_side)}`);
  if (n.tongue_base.length) lines.push(`Zungenbasis: ${n.tongue_base.join(", ")}`);
  if (n.epiglottis.length) lines.push(`Epiglottis: ${n.epiglottis.join(", ")}`);
  if (n.pharynx.length) lines.push(`Pharynx: ${n.pharynx.join(", ")}${sideLabel(n.pharynx_side)}`);
  if (n.larynx.length) lines.push(`Larynx/Kehlkopf: ${n.larynx.join(", ")}${sideLabel(n.larynx_side)}`);
  if (n.valleculae.length) lines.push(`Valleculae/Sinus piriformes: ${n.valleculae.join(", ")}${sideLabel(n.valleculae_side)}`);

  if (n.cough_reflex) lines.push(`Hustenstoß spontan: ${n.cough_reflex}`);
  if (n.swallow_reflex) lines.push(`Schluckversuch spontan: ${n.swallow_reflex}`);

  // Phonationskontrolle
  const phonation: string[] = [];
  if (n.vp_closure) phonation.push(`VP-Verschluss: ${n.vp_closure}`);
  if (n.vocal_fold_mobility) phonation.push(`Stimmlippenbeweglichkeit: ${n.vocal_fold_mobility}`);
  if (n.glissando) phonation.push(`Glissando: ${n.glissando}`);
  if (n.glottis_closure) phonation.push(`Glottisschluss: ${n.glottis_closure}`);
  if (n.voluntary_cough) phonation.push(`Willkürliches Husten/Räuspern: ${n.voluntary_cough}`);
  if (phonation.length) lines.push(`Phonationskontrolle: ${phonation.join("; ")}`);

  if (n.langmore_score !== null) {
    const lLabel = ["Normal (feucht)", "Ansammlung in Valleculae/Sinus piriformes", "Transiente Ansammlung im Larynxeingang", "Permanente Ansammlung im Larynxeingang"][n.langmore_score] ?? "";
    lines.push(`Langmore-Graduierung: Grad ${n.langmore_score} – ${lLabel}`);
  }

  return lines.join("\n");
}

function formatRetentions(t: SwallowTestRow): string {
  const parts: string[] = [];
  if (t.retention_valleculae_l) parts.push(`Valleculae links: ${t.retention_valleculae_l}`);
  if (t.retention_valleculae_r) parts.push(`Valleculae rechts: ${t.retention_valleculae_r}`);
  if (t.retention_sinus_l) parts.push(`Sinus pir. links: ${t.retention_sinus_l}`);
  if (t.retention_sinus_r) parts.push(`Sinus pir. rechts: ${t.retention_sinus_r}`);
  if (t.retention_pharynx) parts.push(`Pharynxwand: ${t.retention_pharynx}`);
  return parts.length ? `Retentionen: ${parts.join("; ")}` : "keine Retentionen";
}

function formatConsistency(t: SwallowTestRow): string {
  const label = CONSISTENCY_LABELS[t.consistency] ?? t.consistency;
  const lines: string[] = [`Schlucken von ${label}:`];

  if (t.praedeglutitiv.length) lines.push(`  Prädeglutitiv: ${t.praedeglutitiv.join(", ")}`);
  if (t.schluckakt.length) lines.push(`  Schluckakt: ${t.schluckakt.join(", ")}`);
  lines.push(`  Postdeglutitiv: ${formatRetentions(t)}`);
  if (t.pen_asp) {
    const pas = t.pas_score !== null ? ` (PAS ${t.pas_score})` : "";
    lines.push(`  Penetration/Aspiration: ${t.pen_asp}${pas}`);
  }
  if (t.clearing.length) lines.push(`  Clearing: ${t.clearing.join(", ")}`);
  if (t.kompensation.length) {
    const komp = [...t.kompensation];
    if (t.kompensation_notes) komp.push(t.kompensation_notes);
    lines.push(`  Kompensation: ${komp.join(", ")}`);
  }
  return lines.join("\n");
}

// ============================================================
// Haupt-Prompt-Builder
// ============================================================

export function buildAssessmentPrompt(
  exam: ExamData,
  nativ: NativData | null,
  swallowTests: SwallowTestRow[]
): string {
  const styleExamples = loadStyleExamples();

  const statusLabel = exam.status === "erstdiagnostik" ? "Erstdiagnostik" : "Verlaufsdiagnostik";
  const dateFormatted = new Date(exam.examination_date).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const bodsI = nativ?.bods_saliva ?? "—";
  const bodsII = exam.bods_nutrition ?? "—";
  const bodsTotal =
    nativ?.bods_saliva != null && exam.bods_nutrition != null
      ? nativ.bods_saliva + exam.bods_nutrition
      : "—";

  const testedTests = swallowTests
    .filter((t) => !t.not_tested)
    .sort((a, b) => CONSISTENCY_ORDER.indexOf(a.consistency) - CONSISTENCY_ORDER.indexOf(b.consistency));

  const nativText = nativ ? formatNativbefund(nativ) : "Kein Nativbefund vorhanden.";
  const schlucktestText = testedTests.length
    ? testedTests.map(formatConsistency).join("\n\n")
    : "Keine Schlucktests durchgeführt.";

  return `Du bist eine erfahrene Logopädin in einer stationären Rehabilitationsklinik und erstellst FEES-Befundberichte (Funktionelle Endoskopische Evaluation des Schluckens).

Schreibe den Bericht auf Deutsch in medizinisch präzisem, aber gut lesbarem Stil. Orientiere dich am Formulierungsstil der folgenden Beispielberichte:

${styleExamples}

---

Erstelle jetzt eine FEES-Beurteilung für folgende Untersuchungsdaten. Gib KEINEN Patientennamen an — verwende stattdessen immer den Platzhalter "[Patient/in]".

## UNTERSUCHUNGSDATEN

Status: ${statusLabel} vom ${dateFormatted}
RASS: ${exam.rass_score}
Verständigung: ${exam.communication || "nicht angegeben"}
Trachealkanüle: ${exam.has_tracheostomy ? "Ja" : "Nein"}
Verfahren: ${exam.procedure_description || "nicht angegeben"}
Medizinische Diagnose: ${exam.medical_diagnosis || "nicht angegeben"}
Dysphagiologische Fragestellung: ${exam.dysphagia_question || "nicht angegeben"}
Vorerkrankungen/Ausgangslage: ${exam.medical_history || "nicht angegeben"}

## NATIVBEFUND

${nativText}

## DIREKTE SCHLUCKUNTERSUCHUNG

${schlucktestText}

## SCORING

BODS I (Speichelbewältigung): ${bodsI}
BODS II (Ernährungsstatus): ${bodsII}
BODS Gesamt: ${bodsTotal}
Langmore: Grad ${nativ?.langmore_score ?? "—"}
Sensibilität: ${exam.overall_sensitivity || "nicht angegeben"}${exam.sensitivity_side ? ` (${exam.sensitivity_side})` : ""}
IDDSI: Level ${exam.iddsi_level ?? "—"}

---

Erstelle folgende Abschnitte als JSON mit genau diesen Schlüsseln:

{
  "beurteilung": "Fließtext, 3-5 Sätze. Beginne mit: 'Die Überprüfung der Schluckfunktionen zeigte nach dem Bogenhausener Dysphagiescore (BODS) eine [Schweregrad] Dysphagie: (BODS I (Score X) + BODS II (Score Y) = Z)'. Beschreibe dann die Hauptbefunde, verwende Schluckakt-Charakterisierung aus: regelrecht / altersgerecht / presbyphagisch / hypoton / verzögert / verlangsamt / unkoordiniert / dyskoordiniert. Erwähne PAS-Scores bei Penetration/Aspiration. Kein Patientenname, nur [Patient/in].",
  "pathophysiologie": "Fließtext, 2-3 Sätze. Erkläre die pathophysiologischen Ursachen der Dysphagie basierend auf Diagnose und Befunden. Nur ausfüllen wenn klinisch plausibel, sonst leerer String.",
  "kostformempfehlung": "1-2 Sätze: DYS-Stufe (I / IIa / IIb / III) + IDDSI Level + Getränke-Empfehlung. Prägnant und konkret.",
  "therapieempfehlungen": ["Stichpunkt 1", "Stichpunkt 2", "..."]
}

Antworte NUR mit dem JSON-Objekt, kein Text drumherum.`;
}
