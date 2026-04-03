interface PatientBannerProps {
  stepLabel: string;
  /** Tailwind bg class for the step badge */
  badgeClass?: string;
  /** Fortlaufende Patienten-Nr aus DB — wird als #001 angezeigt */
  patientNr?: number | null;
  /** Fallback-Name (z.B. auf Stammdaten-Seite vor erstem Speichern) */
  patientName?: string;
}

export default function PatientBanner({
  stepLabel,
  badgeClass = "bg-secondary-container text-on-secondary-container",
  patientNr,
  patientName,
}: PatientBannerProps) {
  const displayText =
    patientNr != null
      ? `#${String(patientNr).padStart(3, "0")}`
      : patientName || "[Patient/in]";

  const displayLabel = patientNr != null ? "UNTERSUCHUNG" : "UNTERSUCHUNG FÜR";

  return (
    <section className="bg-surface-container-low p-3 rounded-card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-outline font-bold leading-none mb-1">
            {displayLabel}
          </p>
          <p className="font-headline font-bold text-on-surface text-base">
            {displayText}
          </p>
        </div>
      </div>

      <div className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 min-h-[32px] ${badgeClass}`}>
        <span className="w-2 h-2 rounded-full bg-current opacity-60" />
        <span className="text-[11px] font-bold uppercase tracking-wide">
          {stepLabel}
        </span>
      </div>
    </section>
  );
}
