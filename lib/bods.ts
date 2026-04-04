import type { NativbefundData, ConsistencyMap } from "./types";

/**
 * BODS I — Speichelbewältigung (0–3)
 * 0 = kein Speichelmanagement nötig
 * 1 = gelegentliches Abwischen
 * 2 = häufiges Abwischen / Absaugen nötig
 * 3 = kontinuierliches Absaugen, orale Sekretmenge nicht beherrschbar
 */
export function suggestBodsI(data: NativbefundData): number {
  const langmore = data.langmore_score ?? 0;
  const cough = data.cough_reflex;
  const swallow = data.swallow_reflex;

  let score = 0;
  if (langmore === 0) score = 0;
  else if (langmore === 1) score = 1;
  else if (langmore === 2) score = 2;
  else if (langmore >= 3) score = 3;

  if (cough === "nicht auslösbar") score = Math.min(3, score + 1);
  if (swallow === "nicht möglich") score = Math.min(3, score + 1);
  if (cough === "auslösbar" && langmore <= 1) score = Math.max(0, score - 1);

  return Math.max(0, Math.min(3, score));
}

/**
 * BODS II — Ernährungsstatus (0–3)
 * 0 = vollständige orale Ernährung möglich
 * 1 = orale Ernährung mit Einschränkungen
 * 2 = orale Ernährung mit erheblichen Einschränkungen / supplementär
 * 3 = keine orale Ernährung möglich
 */
export function suggestBodsII(consistencies: ConsistencyMap): number {
  const testedEntries = Object.values(consistencies).filter(
    (c) => !c.not_tested
  );

  if (testedEntries.length === 0) return 0;

  const hasAspiration = testedEntries.some((c) => c.pen_asp === "aspiration");
  const hasPenetration = testedEntries.some((c) => c.pen_asp === "penetration");
  const maxPas = testedEntries.reduce((max, c) => {
    return c.pas_score !== null ? Math.max(max, c.pas_score) : max;
  }, 0);
  const hasInsufficientClearing = testedEntries.some((c) =>
    c.clearing.includes("nicht_möglich")
  );

  if (hasAspiration && maxPas >= 6) return 3;
  if (hasAspiration) return 2;
  if (hasPenetration && maxPas >= 4) return 2;
  if (hasPenetration || hasInsufficientClearing) return 1;

  return 0;
}
