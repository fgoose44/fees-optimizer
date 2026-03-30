export const RASS_OPTIONS = [
  { value: 4, label: "+4 — Streitlustig, gewalttätig, Gefahr für Personal" },
  { value: 3, label: "+3 — Sehr agitiert, zieht Schläuche/Katheter" },
  { value: 2, label: "+2 — Agitiert, häufige ungezielte Bewegungen" },
  { value: 1, label: "+1 — Unruhig, ängstlich, aber Bewegungen nicht aggressiv" },
  { value: 0, label: "0 — Wach und ruhig" },
  { value: -1, label: "−1 — Schläfrig, öffnet Augen auf Ansprache (>10 s)" },
  { value: -2, label: "−2 — Leichte Sedierung, kurzes Erwachen auf Ansprache (<10 s)" },
  { value: -3, label: "−3 — Moderate Sedierung, Bewegung auf Ansprache, kein Augenkontakt" },
  { value: -4, label: "−4 — Tiefe Sedierung, keine Reaktion auf Ansprache, Bewegung auf Schmerzreiz" },
  { value: -5, label: "−5 — Nicht erweckbar, keine Reaktion auf Stimuli" },
];

export const PROCEDURE_SUGGESTIONS = [
  "Untersuchung sitzend",
  "Untersuchung im Rollstuhl",
  "Untersuchung halbsitzend (ca. 60°)",
  "Untersuchung im Bett (Oberkörper 30° erhöht)",
];

export const COMMUNICATION_SUGGESTIONS = [
  "Kommunikationsziele können erreicht werden",
  "Kommunikation eingeschränkt möglich",
  "Kommunikation nur nonverbal möglich",
  "Keine Reaktion auf Ansprache",
];
