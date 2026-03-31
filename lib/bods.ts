import type { NativbefundData, ConsistencyMap } from "./types";

/**
 * BODS I — Speichelbewältigung (1–8)
 * Auto-Vorschlag basierend auf Langmore-Score + Reflexe + Valleculae-Befund.
 * Immer manuell überschreibbar (TODO: Feinjustierung mit klinischem Feedback).
 */
export function suggestBodsI(data: NativbefundData): number {
  const langmore = data.langmore_score ?? 0;
  const cough = data.cough_reflex;
  const swallow = data.swallow_reflex;

  // Basis: Langmore als primärer Treiber
  // Langmore 0 → normal → BODS I 1–2
  // Langmore 1 → dezent → BODS I 2–3
  // Langmore 2 → deutlich → BODS I 4–5
  // Langmore 3 → massiv → BODS I 6–8
  let score = 1;
  if (langmore === 0) score = 1;
  else if (langmore === 1) score = 3;
  else if (langmore === 2) score = 5;
  else if (langmore >= 3) score = 7;

  // Korrekturfaktoren
  if (cough === "nicht auslösbar") score = Math.min(8, score + 1);
  if (cough === "insuffizient") score = Math.min(8, score + 1);
  if (swallow === "nicht möglich") score = Math.min(8, score + 1);

  if (cough === "auslösbar" && langmore <= 1) score = Math.max(1, score - 1);

  return Math.max(1, Math.min(8, score));
}

/**
 * BODS II — Ernährungsstatus (1–8)
 * Auto-Vorschlag basierend auf höchstem PAS-Score + Aspiration/Penetration-Befunden.
 * Immer manuell überschreibbar (TODO: Feinjustierung mit klinischem Feedback).
 *
 * BODS II Mapping (vereinfacht):
 * 1 = Normale orale Ernährung
 * 2 = Normale Ernährung mit leichter Anpassung
 * 3 = Weiche/pürierte Kost
 * 4 = Weiche Kost + angedickte Flüssigkeiten
 * 5 = Pürierte Kost + stark angedickte Flüssigkeiten
 * 6 = Sondenernährung + minimale orale Kost
 * 7 = Überwiegend Sondenernährung
 * 8 = Vollständige Sondenernährung, NPO
 */
export function suggestBodsII(consistencies: ConsistencyMap): number {
  const testedEntries = Object.values(consistencies).filter(
    (c) => !c.not_tested
  );

  if (testedEntries.length === 0) return 1;

  const hasAspiration = testedEntries.some((c) => c.pen_asp === "aspiration");
  const hasPenetration = testedEntries.some((c) => c.pen_asp === "penetration");
  const maxPas = testedEntries.reduce((max, c) => {
    return c.pas_score !== null ? Math.max(max, c.pas_score) : max;
  }, 0);

  const hasInsufficientClearing = testedEntries.some((c) =>
    c.clearing.includes("nicht_möglich")
  );

  // Aspiration mit PAS >= 6 (stille Aspiration oder ohne Reaktion)
  if (hasAspiration && maxPas >= 6) return 7;
  if (hasAspiration && maxPas >= 4) return 6;
  if (hasAspiration) return 5;

  // Penetration
  if (hasPenetration && maxPas >= 4) return 4;
  if (hasPenetration) return 3;

  // Kein Clearing möglich
  if (hasInsufficientClearing) return 4;

  // Unauffällig
  if (maxPas <= 1) return 1;

  return 2;
}
