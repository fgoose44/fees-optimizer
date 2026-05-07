// ============================================================
// Stammdaten (Phase 1)
// ============================================================

export type ExaminationStatus = "erstdiagnostik" | "verlaufsdiagnostik";

export interface ExaminationFormData {
  patientName: string; // NUR Browser-State, wird NICHT gespeichert
  examinationDate: string; // ISO date string
  status: ExaminationStatus;
  rassScore: number;
  communication: string;
  hasTracheostomy: boolean;
  cannulaType: string;       // Freitext, nur wenn TK = true
  cuffStatus: string;        // 'geblockt' | 'entblockt' | ''
  speakingValve: string;     // 'vorhanden' | 'nicht_vorhanden' | ''
  procedureDescription: string;
  medicalDiagnosis: string;
  dysphagia_question: string;
  medicalHistory: string;
}

// Was in die DB gespeichert wird — KEIN Patientenname
export type ExaminationInsert = Omit<ExaminationFormData, "patientName">;

// ============================================================
// Nativbefund (Phase 2)
// ============================================================

export type SideFinding = "L" | "R" | "beidseitig" | "";

export interface StructureFinding {
  selected: string[];
  side: SideFinding;
  notes: string;
}

export interface NativbefundData {
  mucosa: StructureFinding;
  velum: StructureFinding;
  tongue_base: StructureFinding;
  epiglottis: StructureFinding;
  pharynx: StructureFinding;
  larynx: StructureFinding;
  valleculae: StructureFinding;
  sinus_piriformes: StructureFinding;

  // Transstomatal (nur wenn TK = true)
  trachea_mucosa: string[];
  trachea_structures: string[];
  trachea_structures_notes: string;
  tk_position: string; // 'mittig' | 'nicht_mittig' | ''

  // TK Kanülenlage (nur wenn TK = true)
  cannula_changed: boolean;
  cannula_position_before: string; // 'mittig' | 'nicht_mittig' | ''
  cannula_note_before: string;
  cannula_position_after: string;  // 'mittig' | 'nicht_mittig' | ''
  cannula_note_after: string;

  // Reflexe
  cough_reflex: string; // 'auslösbar' | 'insuffizient' | 'nicht auslösbar' | ''
  swallow_reflex: string; // 'möglich' | 'verzögert' | 'nicht möglich' | ''

  // Phonationskontrolle (optional)
  vp_closure: string;
  vocal_fold_mobility: string;
  vocal_fold_weakness_side: string; // 'links' | 'rechts' | '' — nur wenn vocal_fold_mobility = 'asymmetrisch'
  glissando: string;
  glissando_weakness_side: string;  // 'links' | 'rechts' | '' — nur wenn glissando = 'asymmetrisch'
  glottis_closure: string;
  voluntary_cough: string;

  // Scoring
  langmore_score: number | null; // 0–3
  bods_saliva: number | null; // BODS I (1–8), auto-vorgeschlagen, überschreibbar
}

// ============================================================
// Schlucktests (Phase 2)
// ============================================================

export type Consistency =
  | "speichel"
  | "brei"
  | "nektar"
  | "wasser_glas"
  | "wasser_strohhalm"
  | "wasser_kapi"
  | "brot";

export const CONSISTENCIES: { key: Consistency; label: string }[] = [
  { key: "speichel", label: "Speichel" },
  { key: "brei", label: "Brei/Aqua" },
  { key: "nektar", label: "Nektar" },
  { key: "wasser_glas", label: "Wasser (Glas)" },
  { key: "wasser_strohhalm", label: "Wasser (Strohhalm)" },
  { key: "wasser_kapi", label: "Wasser (Kapi-Cup)" },
  { key: "brot", label: "Brot" },
];

export interface ConsistencyData {
  not_tested: boolean;
  praedeglutitiv: string[];
  schluckakt: string[];
  retention_valleculae_l: string; // 'dezent' | 'deutlich' | 'massiv' | ''
  retention_valleculae_r: string;
  retention_sinus_l: string;
  retention_sinus_r: string;
  retention_pharynx: string;
  retention_hintere_kommissur: string;
  retention_oesophagussphinkter: string;
  pen_asp: string; // 'keine' | 'penetration' | 'aspiration' | ''
  pas_score: number | null; // 1–8
  clearing: string[];
  kompensation: string[];
  kompensation_notes: string;
}

export const EMPTY_CONSISTENCY_DATA: ConsistencyData = {
  not_tested: false,
  praedeglutitiv: [],
  schluckakt: [],
  retention_valleculae_l: "",
  retention_valleculae_r: "",
  retention_sinus_l: "",
  retention_sinus_r: "",
  retention_pharynx: "",
  retention_hintere_kommissur: "",
  retention_oesophagussphinkter: "",
  pen_asp: "",
  pas_score: null,
  clearing: [],
  kompensation: [],
  kompensation_notes: "",
};

export type ConsistencyMap = Record<Consistency, ConsistencyData>;

export interface SchlucktestSummary {
  overall_assessment: string[]; // 'vollstaendige_reinigung' | 'retentionen' | 'penetration_erkennbar' | 'aspiration_erkennbar'
  overall_sensitivity: string; // 'unauffällig' | 'leicht' | 'mittelgradig' | 'stark'
  sensitivity_side: SideFinding;
  bods_nutrition: number | null; // BODS II (1–8), auto-vorgeschlagen, überschreibbar
  // Kostformempfehlung (neu ab Phase 13)
  nutrition_mode: "npo" | "adaption" | "vollkost" | null;
  nutrition_route: string | null; // nur bei npo
  nutrition_notes: string | null; // optional bei npo
  dys_stufe: string | null; // 'DYS I' | 'DYS IIa' | 'DYS IIb' | 'DYS III'
  iddsi_food_level: number | null; // 4 | 5 | 6
  iddsi_drink_level: number | null; // 0 | 1 | 2 | 3
  tablets: "crushed" | "normal" | null;
}
