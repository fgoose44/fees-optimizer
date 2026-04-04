import type { NativbefundData, ConsistencyMap } from "./types";

/**
 * BODS I — Speichelbewältigung (1–8)
 * Quelle: Bartolome & Schröter-Morasch (2006)
 * 1 = keine Störung, 8 = schwerste Störung
 */
export function suggestBodsI(data: NativbefundData): number {
  const langmore = data.langmore_score ?? 0;
  const cough = data.cough_reflex;
  const swallow = data.swallow_reflex;

  let score = 1;
  if (langmore === 0) score = 1;
  else if (langmore === 1) score = 3;
  else if (langmore === 2) score = 5;
  else if (langmore >= 3) score = 7;

  if (cough === "nicht auslösbar") score = Math.min(8, score + 1);
  if (cough === "insuffizient") score = Math.min(8, score + 1);
  if (swallow === "nicht möglich") score = Math.min(8, score + 1);
  if (cough === "auslösbar" && langmore <= 1) score = Math.max(1, score - 1);

  return Math.max(1, Math.min(8, score));
}

/**
 * BODS II — Ernährungsstatus (1–8)
 * Quelle: Bartolome & Schröter-Morasch (2006)
 * 1 = voll oral ohne Einschränkung, 8 = ausschließlich Sonde/parenteral
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

  if (hasAspiration && maxPas >= 6) return 7;
  if (hasAspiration && maxPas >= 4) return 6;
  if (hasAspiration) return 5;
  if (hasPenetration && maxPas >= 4) return 4;
  if (hasPenetration) return 3;
  if (hasInsufficientClearing) return 4;
  if (maxPas <= 1) return 1;

  return 2;
}
