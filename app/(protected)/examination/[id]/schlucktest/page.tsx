"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExaminationNav from "@/components/ExaminationNav";
import PatientBanner from "@/components/PatientBanner";
import StickyFooter from "@/components/StickyFooter";
import { suggestBodsII } from "@/lib/bods";
import {
  CONSISTENCIES,
  EMPTY_CONSISTENCY_DATA,
  type Consistency,
  type ConsistencyData,
  type ConsistencyMap,
  type SideFinding,
  type SchlucktestSummary,
} from "@/lib/types";

// ---- Optionen-Definitionen ----

const PRAEDEGLUTITIV_OPTIONS = [
  { key: "kein_leaking", label: "Kein Leaking" },
  { key: "fehlende_boluskontrolle", label: "Fehlende Boluskontrolle" },
  { key: "uebertritt", label: "Übertritt von Bolusanteilen (Leaking)" },
];

const SCHLUCKAKT_OPTIONS = [
  { key: "effizient", label: "Effizient" },
  { key: "verlangsamt", label: "Verlangsamt" },
  { key: "insuffizient", label: "Insuffizient" },
  { key: "kraftgemindert", label: "Kraftgemindert" },
];

const RETENTION_SEVERITY = ["dezent", "deutlich", "massiv"];

const CLEARING_OPTIONS = [
  { key: "vollständig", label: "Vollständig" },
  { key: "insuffizient", label: "Insuffizient" },
  { key: "nachschlucken", label: "Nachschlucken" },
  { key: "liquid_wash", label: "Liquid Wash" },
  { key: "capsaicin", label: "Capsaicin" },
  { key: "nicht_möglich", label: "Nicht möglich" },
];

const KOMPENSATION_OPTIONS = [
  { key: "chin_tuck", label: "Chin-Tuck" },
  { key: "chin_down", label: "Chin-down" },
  { key: "kopfrotation", label: "Kopfrotation" },
  { key: "kopfneigung", label: "Kopfneigung" },
  { key: "supraglottisch", label: "Supraglottisches Schlucken" },
  { key: "effortful_swallow", label: "Effortful Swallow" },
  { key: "sonstige", label: "Sonstige" },
];

const PAS_OPTIONS = [
  { value: 1, label: "PAS 1 — Kein Material im Atemweg" },
  { value: 2, label: "PAS 2 — Über Stimmlippen, ausgestoßen" },
  { value: 3, label: "PAS 3 — Über Stimmlippen, nicht ausgestoßen" },
  { value: 4, label: "PAS 4 — Erreicht Stimmlippen, ausgestoßen" },
  { value: 5, label: "PAS 5 — Erreicht Stimmlippen, nicht ausgestoßen" },
  { value: 6, label: "PAS 6 — Unter Stimmlippen, ausgestoßen" },
  { value: 7, label: "PAS 7 — Unter Stimmlippen, kein Ausstoßversuch" },
  { value: 8, label: "PAS 8 — Unter Stimmlippen, stumm aspiriert" },
];

const IDDSI_OPTIONS = [
  { value: 0, label: "Level 0 — Dünnflüssig" },
  { value: 1, label: "Level 1 — Leicht angedickt" },
  { value: 2, label: "Level 2 — Nektarähnlich" },
  { value: 3, label: "Level 3 — Puddingähnlich" },
  { value: 4, label: "Level 4 — Püriert" },
  { value: 5, label: "Level 5 — Gewürfelt / weich" },
  { value: 6, label: "Level 6 — Weich & mundgerecht" },
  { value: 7, label: "Level 7 — Normal / keine Einschränkung" },
];

const OVERALL_ASSESSMENT_OPTIONS = [
  { key: "vollstaendige_reinigung", label: "Vollständige Reinigung" },
  { key: "retentionen", label: "Retentionen erkennbar" },
  { key: "penetration_erkennbar", label: "Penetration erkennbar" },
  { key: "aspiration_erkennbar", label: "Aspiration erkennbar" },
];

const SENSITIVITY_OPTIONS = [
  { key: "unauffällig", label: "Unauffällig" },
  { key: "leicht", label: "Leicht eingeschränkt" },
  { key: "mittelgradig", label: "Mittelgradig eingeschränkt" },
  { key: "stark", label: "Stark eingeschränkt" },
];

// ---- Initiale Daten ----

function buildInitialConsistencies(): ConsistencyMap {
  const map = {} as ConsistencyMap;
  for (const c of CONSISTENCIES) {
    map[c.key] = { ...EMPTY_CONSISTENCY_DATA };
  }
  return map;
}

const initialSummary: SchlucktestSummary = {
  overall_assessment: [],
  overall_sensitivity: "",
  sensitivity_side: "",
  bods_nutrition: null,
  iddsi_level: null,
};

// ============================================================
// Helper Chip Button
// ============================================================

function ChipButton({
  active,
  onClick,
  children,
  variant = "neutral",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "neutral" | "wnl" | "path";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-all active:scale-95 ${
        active
          ? variant === "wnl"
            ? "bg-secondary text-on-secondary font-bold"
            : variant === "path"
            ? "bg-tertiary text-on-tertiary font-bold"
            : "bg-primary text-on-primary font-bold"
          : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40"
      }`}
    >
      {children}
    </button>
  );
}

// ---- Retention row ----
function RetentionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-on-surface-variant w-28 shrink-0">{label}</span>
      <div className="flex gap-1">
        {RETENTION_SEVERITY.map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => onChange(value === sev ? "" : sev)}
            className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-[11px] font-medium transition-all ${
              value === sev
                ? sev === "dezent"
                  ? "bg-primary text-on-primary font-bold"
                  : sev === "deutlich"
                  ? "bg-primary-container text-on-primary font-bold"
                  : "bg-tertiary text-on-tertiary font-bold"
                : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
            }`}
          >
            {sev}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

type View = "selection" | "testing";

export default function SchlucktestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const patientName = searchParams.get("patientName") ?? "";

  const [patientNr, setPatientNr] = useState<number | null>(null);

  // Welche Konsistenzen wurden ausgewählt
  const [selected, setSelected] = useState<Consistency[]>([]);
  const [view, setView] = useState<View>("selection");
  const [loadingSelection, setLoadingSelection] = useState(true);

  const [activeTab, setActiveTab] = useState<Consistency>("speichel");
  const [consistencies, setConsistencies] = useState<ConsistencyMap>(buildInitialConsistencies);
  const [summary, setSummary] = useState<SchlucktestSummary>(initialSummary);
  const [bodsOverride, setBodsOverride] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Beim Laden: bestehende Daten aus DB holen
  useEffect(() => {
    async function loadExisting() {
      const supabase = createClient();

      // Alle Schlucktest-Daten laden (nicht nur Auswahl)
      const { data: swallowRows } = await supabase
        .from("swallow_tests")
        .select(
          "consistency, not_tested, praedeglutitiv, schluckakt, retention_valleculae_l, retention_valleculae_r, retention_sinus_l, retention_sinus_r, retention_pharynx, pen_asp, pas_score, clearing, kompensation, kompensation_notes"
        )
        .eq("examination_id", id);

      if (swallowRows && swallowRows.length > 0) {
        const tested = swallowRows
          .filter((t) => !t.not_tested)
          .map((t) => t.consistency as Consistency);

        if (tested.length > 0) {
          setSelected(tested);
          setActiveTab(tested[0]);
          setView("testing");

          // Konsistenz-Daten in State mappen
          const loaded = buildInitialConsistencies();
          for (const row of swallowRows) {
            if (!row.not_tested) {
              loaded[row.consistency as Consistency] = {
                not_tested: false,
                praedeglutitiv:         row.praedeglutitiv ?? [],
                schluckakt:             row.schluckakt ?? [],
                retention_valleculae_l: row.retention_valleculae_l ?? "",
                retention_valleculae_r: row.retention_valleculae_r ?? "",
                retention_sinus_l:      row.retention_sinus_l ?? "",
                retention_sinus_r:      row.retention_sinus_r ?? "",
                retention_pharynx:      row.retention_pharynx ?? "",
                pen_asp:                row.pen_asp ?? "",
                pas_score:              row.pas_score ?? null,
                clearing:               row.clearing ?? [],
                kompensation:           row.kompensation ?? [],
                kompensation_notes:     row.kompensation_notes ?? "",
              };
            }
          }
          setConsistencies(loaded);
        }
      }

      // Gesamtbeurteilung + BODS II aus examinations laden
      const { data: exam } = await supabase
        .from("examinations")
        .select("overall_assessment, overall_sensitivity, sensitivity_side, bods_nutrition, iddsi_level, patient_nr")
        .eq("id", id)
        .single();

      if (exam) {
        setSummary({
          overall_assessment:  exam.overall_assessment ?? [],
          overall_sensitivity: exam.overall_sensitivity ?? "",
          sensitivity_side:    exam.sensitivity_side ?? "",
          bods_nutrition:      exam.bods_nutrition ?? null,
          iddsi_level:         exam.iddsi_level ?? null,
        });
        if (exam.bods_nutrition !== null) setBodsOverride(true);
        if (exam.patient_nr != null) setPatientNr(exam.patient_nr);
      }

      setLoadingSelection(false);
    }
    loadExisting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // BODS II auto-suggestion
  const suggestedBodsII = suggestBodsII(consistencies);
  useEffect(() => {
    if (!bodsOverride) {
      setSummary((prev) => ({ ...prev, bods_nutrition: suggestedBodsII }));
    }
  }, [suggestedBodsII, bodsOverride]);

  function toggleSelected(key: Consistency) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function startTesting() {
    if (selected.length === 0) return;
    // Reihenfolge gemäß CONSISTENCIES-Reihenfolge
    const ordered = CONSISTENCIES.map((c) => c.key).filter((k) =>
      selected.includes(k)
    ) as Consistency[];
    setSelected(ordered);
    setActiveTab(ordered[0]);
    setView("testing");
  }

  // Updater für aktuelle Konsistenz
  function updateCurrent(patch: Partial<ConsistencyData>) {
    setConsistencies((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...patch },
    }));
  }

  function toggleArray(
    field: keyof Pick<ConsistencyData, "praedeglutitiv" | "schluckakt" | "clearing" | "kompensation">,
    value: string
  ) {
    const arr = consistencies[activeTab][field] as string[];
    const updated = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    updateCurrent({ [field]: updated });
  }

  function toggleSummaryAssessment(key: string) {
    const arr = summary.overall_assessment;
    setSummary((p) => ({
      ...p,
      overall_assessment: arr.includes(key)
        ? arr.filter((v) => v !== key)
        : [...arr, key],
    }));
  }

  const current = consistencies[activeTab];

  // Speichern
  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Nicht angemeldet."); setSaving(false); return; }

    // Alle 7 Konsistenzen als Rows — not_tested=true für nicht ausgewählte
    const rows = CONSISTENCIES.map(({ key }) => {
      const isSelected = selected.includes(key);
      const c = consistencies[key];
      return {
        examination_id: id,
        user_id: user.id,
        consistency: key,
        not_tested: !isSelected,
        praedeglutitiv: isSelected ? c.praedeglutitiv : [],
        schluckakt: isSelected ? c.schluckakt : [],
        retention_valleculae_l: isSelected ? c.retention_valleculae_l : "",
        retention_valleculae_r: isSelected ? c.retention_valleculae_r : "",
        retention_sinus_l: isSelected ? c.retention_sinus_l : "",
        retention_sinus_r: isSelected ? c.retention_sinus_r : "",
        retention_pharynx: isSelected ? c.retention_pharynx : "",
        pen_asp: isSelected ? c.pen_asp : "",
        pas_score: isSelected ? c.pas_score : null,
        clearing: isSelected ? c.clearing : [],
        kompensation: isSelected ? c.kompensation : [],
        kompensation_notes: isSelected ? c.kompensation_notes : "",
        updated_at: new Date().toISOString(),
      };
    });

    const { error: swError } = await supabase
      .from("swallow_tests")
      .upsert(rows, { onConflict: "examination_id,consistency" });

    if (swError) {
      setError("Fehler beim Speichern der Schlucktests: " + swError.message);
      setSaving(false);
      return;
    }

    const { error: exError } = await supabase
      .from("examinations")
      .update({
        overall_assessment: summary.overall_assessment,
        overall_sensitivity: summary.overall_sensitivity,
        sensitivity_side: summary.sensitivity_side,
        bods_nutrition: summary.bods_nutrition,
        iddsi_level: summary.iddsi_level,
      })
      .eq("id", id);

    if (exError) {
      setError("Fehler beim Speichern: " + exError.message);
      setSaving(false);
      return;
    }

    const qs = patientName ? `?patientName=${encodeURIComponent(patientName)}` : "";
    router.refresh();
    router.push(`/examination/${id}/export${qs}`);
  }

  if (loadingSelection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-on-surface-variant text-sm">Lade …</span>
      </div>
    );
  }

  // ============================================================
  // ANSICHT 1: Konsistenz-Auswahl
  // ============================================================

  if (view === "selection") {
    return (
      <div className="px-4 pt-6 pb-32 space-y-6">
        {/* Patient-Banner */}
        <PatientBanner
          patientNr={patientNr}
          patientName={patientName}
          stepLabel="Schlucktest"
          badgeClass="bg-primary-fixed text-on-primary-fixed-variant"
        />

        {/* Seiten-Header */}
        <header className="space-y-1">
          <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
            Schlucktest
          </h2>
          <p className="text-on-surface-variant text-[14px] font-medium">
            Welche Konsistenzen wurden getestet?
          </p>
        </header>

        <p className="text-on-surface-variant text-sm -mt-2">
          Nur ausgewählte Konsistenzen werden dokumentiert und im Bericht aufgeführt.
        </p>

        {/* Konsistenz-Liste */}
        <div className="bg-surface-container-low rounded-card p-4 space-y-2">
          {CONSISTENCIES.map(({ key, label }) => {
            const isSelected = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSelected(key)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
                    : "bg-surface-container-lowest text-on-surface border border-outline-variant/30 hover:bg-surface-container"
                }`}
              >
                <span>{label}</span>
                {isSelected ? (
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-base text-outline-variant">
                    radio_button_unchecked
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <p className="text-sm text-on-surface-variant text-center">
            <span className="font-semibold text-primary">{selected.length}</span> von 7 Konsistenzen ausgewählt
          </p>
        )}

        <ExaminationNav
          examinationId={id}
          patientName={patientName}
          activeStep="schlucktest"
        />

        <StickyFooter
          submitLabel="Weiter zur Dokumentation"
          disabled={selected.length === 0}
          onSubmit={startTesting}
        />
      </div>
    );
  }

  // ============================================================
  // ANSICHT 2: Befundeingabe pro Konsistenz
  // ============================================================

  // Nur ausgewählte Konsistenzen in korrekter Reihenfolge
  const selectedOrdered = CONSISTENCIES.filter((c) => selected.includes(c.key));

  return (
    <div className="px-4 pt-6 pb-32 space-y-4">
      {/* Patient-Banner */}
      <PatientBanner
        patientName={patientName}
        stepLabel="Schlucktest"
        badgeClass="bg-primary-fixed text-on-primary-fixed-variant"
      />

      {/* Seiten-Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
            Schlucktest
          </h2>
          <p className="text-on-surface-variant text-[14px] font-medium">
            {selectedOrdered.find((c) => c.key === activeTab)?.label} · {selected.length} Konsistenzen
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView("selection")}
          className="text-xs text-primary underline font-medium"
        >
          Auswahl ändern
        </button>
      </header>

      {/* Konsistenz-Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {selectedOrdered.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap min-h-[36px] ${
              activeTab === key
                ? "bg-primary text-on-primary shadow-md shadow-primary/20 font-bold"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- PRÄDEGLUTITIV ---- */}
      <section className="bg-surface-container-low rounded-card p-4 border-l-4 border-primary">
        <h3 className="text-[11px] font-bold text-primary mb-3 tracking-widest uppercase font-label">
          Prädeglutitiv
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRAEDEGLUTITIV_OPTIONS.map(({ key, label }) => (
            <ChipButton
              key={key}
              active={current.praedeglutitiv.includes(key)}
              onClick={() => toggleArray("praedeglutitiv", key)}
              variant={key === "kein_leaking" ? "wnl" : "path"}
            >
              {label}
            </ChipButton>
          ))}
        </div>
      </section>

      {/* ---- SCHLUCKAKT ---- */}
      <section className="bg-surface-container-low rounded-card p-4 border-l-4 border-secondary">
        <h3 className="text-[11px] font-bold text-secondary mb-3 tracking-widest uppercase font-label">
          Schluckakt
        </h3>
        <div className="flex flex-wrap gap-2">
          {SCHLUCKAKT_OPTIONS.map(({ key, label }) => (
            <ChipButton
              key={key}
              active={current.schluckakt.includes(key)}
              onClick={() => toggleArray("schluckakt", key)}
              variant={key === "effizient" ? "wnl" : "path"}
            >
              {label}
            </ChipButton>
          ))}
        </div>
      </section>

      {/* ---- POSTDEGLUTITIV ---- */}
      <section className="bg-surface-container-low rounded-card p-4 border-l-4 border-outline-variant">
        <h3 className="text-[11px] font-bold text-on-surface-variant mb-3 tracking-widest uppercase font-label">
          Postdeglutitiv — Retentionen
        </h3>
        <div className="bg-surface-container-lowest rounded-xl p-3 space-y-1">
          <RetentionRow
            label="Valleculae L"
            value={current.retention_valleculae_l}
            onChange={(v) => updateCurrent({ retention_valleculae_l: v })}
          />
          <RetentionRow
            label="Valleculae R"
            value={current.retention_valleculae_r}
            onChange={(v) => updateCurrent({ retention_valleculae_r: v })}
          />
          <RetentionRow
            label="Sinus pir. L"
            value={current.retention_sinus_l}
            onChange={(v) => updateCurrent({ retention_sinus_l: v })}
          />
          <RetentionRow
            label="Sinus pir. R"
            value={current.retention_sinus_r}
            onChange={(v) => updateCurrent({ retention_sinus_r: v })}
          />
          <RetentionRow
            label="Pharynxwand"
            value={current.retention_pharynx}
            onChange={(v) => updateCurrent({ retention_pharynx: v })}
          />
        </div>
      </section>

      {/* ---- PENETRATION / ASPIRATION ---- */}
      <section className="bg-[#a10012]/5 rounded-card p-4 border-l-4 border-[#a10012]">
        <h3 className="text-[11px] font-bold text-[#a10012] mb-3 tracking-widest uppercase font-label">
          Penetration / Aspiration
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {["keine", "penetration", "aspiration"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => updateCurrent({ pen_asp: current.pen_asp === opt ? "" : opt })}
              className={`px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all active:scale-95 capitalize ${
                current.pen_asp === opt
                  ? opt === "keine"
                    ? "bg-secondary text-on-secondary font-bold"
                    : "bg-tertiary text-on-tertiary font-bold"
                  : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        {(current.pen_asp === "penetration" || current.pen_asp === "aspiration") && (
          <div>
            <label className="block text-[11px] font-bold text-[#a10012] uppercase tracking-wider mb-1">
              PAS-Score (Rosenbek)
            </label>
            <select
              value={current.pas_score ?? ""}
              onChange={(e) =>
                updateCurrent({ pas_score: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a10012]/20"
            >
              <option value="">— PAS-Score wählen —</option>
              {PAS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* ---- CLEARING ---- */}
      <section className="bg-surface-container-low rounded-card p-4 border-l-4 border-primary-fixed-dim">
        <h3 className="text-[11px] font-bold text-primary mb-3 tracking-widest uppercase font-label">
          Clearing
        </h3>
        <div className="flex flex-wrap gap-2">
          {CLEARING_OPTIONS.map(({ key, label }) => (
            <ChipButton
              key={key}
              active={current.clearing.includes(key)}
              onClick={() => toggleArray("clearing", key)}
              variant={key === "vollständig" ? "wnl" : key === "nicht_möglich" ? "path" : "neutral"}
            >
              {label}
            </ChipButton>
          ))}
        </div>
      </section>

      {/* ---- KOMPENSATIONSSTRATEGIEN ---- */}
      <section className="bg-surface-container-low rounded-card p-4 border-l-4 border-primary">
        <h3 className="text-[11px] font-bold text-primary mb-3 tracking-widest uppercase font-label">
          Kompensationsstrategien
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {KOMPENSATION_OPTIONS.map(({ key, label }) => (
            <ChipButton
              key={key}
              active={current.kompensation.includes(key)}
              onClick={() => toggleArray("kompensation", key)}
            >
              {label}
            </ChipButton>
          ))}
        </div>
        {current.kompensation.includes("sonstige") && (
          <textarea
            value={current.kompensation_notes}
            onChange={(e) => updateCurrent({ kompensation_notes: e.target.value })}
            placeholder="Spezifische Strategie oder Freitext …"
            rows={2}
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        )}
      </section>

      {/* ---- GESAMTBEURTEILUNG ---- */}
      <section className="bg-surface-container-high rounded-card p-5 space-y-5">
        <h3 className="font-headline font-bold text-lg text-on-surface">
          Gesamtbeurteilung
        </h3>

        {/* Befundzusammenfassung */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
            Befundzusammenfassung
          </p>
          <div className="flex flex-wrap gap-2">
            {OVERALL_ASSESSMENT_OPTIONS.map(({ key, label }) => {
              const active = summary.overall_assessment.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSummaryAssessment(key)}
                  className={`px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    active
                      ? key === "vollstaendige_reinigung"
                        ? "bg-secondary text-on-secondary font-bold"
                        : "bg-tertiary text-on-tertiary font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sensibilität */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
            Sensibilität
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {SENSITIVITY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSummary((p) => ({
                    ...p,
                    overall_sensitivity: p.overall_sensitivity === key ? "" : key,
                  }))
                }
                className={`px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all active:scale-95 ${
                  summary.overall_sensitivity === key
                    ? key === "unauffällig"
                      ? "bg-secondary text-on-secondary font-bold"
                      : "bg-tertiary text-on-tertiary font-bold"
                    : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {summary.overall_sensitivity &&
            summary.overall_sensitivity !== "unauffällig" && (
              <div className="flex gap-2 mt-1">
                {(["L", "R", "beidseitig"] as SideFinding[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSummary((p) => ({
                        ...p,
                        sensitivity_side: p.sensitivity_side === s ? "" : s,
                      }))
                    }
                    className={`px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all ${
                      summary.sensitivity_side === s
                        ? "bg-primary text-on-primary font-bold"
                        : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* BODS II */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              BODS II — Ernährungsstatus
            </p>
            <span className="text-xs text-on-surface-variant">1–8</span>
          </div>
          {/* Legende */}
          <div className="space-y-1 mb-3">
            {[
              { score: 1, desc: "Voll oral ohne Einschränkung" },
              { score: 2, desc: "Voll oral mit geringen Einschränkungen: mehrere Konsistenzen ohne Kompensation oder Kompensation ohne Diäteinschränkung" },
              { score: 3, desc: "Voll oral mit mäßigen Einschränkungen: mehrere Konsistenzen mit Kompensation" },
              { score: 4, desc: "Voll oral mit gravierenden Einschränkungen: nur eine Konsistenz mit oder ohne Kompensation" },
              { score: 5, desc: "Überwiegend oral, ergänzend Sonde/parenteral" },
              { score: 6, desc: "Partiell oral (>10 TL täglich), überwiegend Sonde/parenteral" },
              { score: 7, desc: "Geringfügig oral (≤10 TL täglich), hauptsächlich Sonde/parenteral" },
              { score: 8, desc: "Ausschließlich Sonde/parenteral" },
            ].map(({ score, desc }) => (
              <p key={score} className="text-[11px] text-on-surface-variant">
                <span className="font-bold text-on-surface">{score}</span> — {desc}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="range"
                min={1}
                max={8}
                value={summary.bods_nutrition ?? suggestedBodsII}
                onChange={(e) => {
                  setBodsOverride(true);
                  setSummary((p) => ({ ...p, bods_nutrition: Number(e.target.value) }));
                }}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-outline mt-0.5 px-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                (summary.bods_nutrition ?? suggestedBodsII) <= 2
                  ? "bg-secondary-container text-secondary"
                  : (summary.bods_nutrition ?? suggestedBodsII) <= 5
                  ? "bg-primary-fixed text-primary"
                  : "bg-tertiary-fixed text-tertiary"
              }`}
            >
              {summary.bods_nutrition ?? suggestedBodsII}
            </div>
          </div>
          {bodsOverride ? (
            <button
              type="button"
              onClick={() => {
                setBodsOverride(false);
                setSummary((p) => ({ ...p, bods_nutrition: suggestedBodsII }));
              }}
              className="text-xs text-primary underline mt-1"
            >
              Vorschlag wiederherstellen ({suggestedBodsII})
            </button>
          ) : (
            <p className="text-[11px] text-on-surface-variant mt-1">
              Auto-Vorschlag aus PAS-Scores. Slider zum Überschreiben.
            </p>
          )}
        </div>

        {/* IDDSI */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-widest">
            IDDSI — Kostformempfehlung
          </label>
          <select
            value={summary.iddsi_level ?? ""}
            onChange={(e) =>
              setSummary((p) => ({
                ...p,
                iddsi_level: e.target.value !== "" ? Number(e.target.value) : null,
              }))
            }
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— IDDSI-Level wählen —</option>
            {IDDSI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <p className="text-sm text-tertiary bg-tertiary-fixed/40 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </p>
      )}

      <ExaminationNav
        examinationId={id}
        patientName={patientName}
        activeStep="schlucktest"
      />

      <StickyFooter
        onSubmit={handleSave}
        loading={saving}
      />
    </div>
  );
}
