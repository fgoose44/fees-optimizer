"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExaminationNav from "@/components/ExaminationNav";
import PatientBanner from "@/components/PatientBanner";
import StickyFooter from "@/components/StickyFooter";
import SaveIndicator from "@/components/SaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
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
  nutrition_mode: null,
  nutrition_route: null,
  nutrition_notes: null,
  dys_stufe: null,
  iddsi_food_level: null,
  iddsi_drink_level: null,
  tablets: null,
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
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);

  // Welche Konsistenzen wurden ausgewählt
  const [selected, setSelected] = useState<Consistency[]>([]);
  const [view, setView] = useState<View>("selection");
  const [loadingSelection, setLoadingSelection] = useState(true);

  const [activeTab, setActiveTab] = useState<Consistency>("speichel");
  const [consistencies, setConsistencies] = useState<ConsistencyMap>(buildInitialConsistencies);
  const [summary, setSummary] = useState<SchlucktestSummary>(initialSummary);
  const [bodsOverride, setBodsOverride] = useState(false);

  // Beim Laden: bestehende Daten aus DB holen
  useEffect(() => {
    async function loadExisting() {
      const supabase = createClient();

      // Alle Schlucktest-Daten laden (nicht nur Auswahl)
      const { data: swallowRows } = await supabase
        .from("swallow_tests")
        .select(
          "consistency, not_tested, praedeglutitiv, schluckakt, retention_valleculae_l, retention_valleculae_r, retention_sinus_l, retention_sinus_r, retention_pharynx, retention_hintere_kommissur, retention_oesophagussphinkter, pen_asp, pas_score, clearing, kompensation, kompensation_notes"
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
                retention_valleculae_l:       row.retention_valleculae_l ?? "",
                retention_valleculae_r:       row.retention_valleculae_r ?? "",
                retention_sinus_l:            row.retention_sinus_l ?? "",
                retention_sinus_r:            row.retention_sinus_r ?? "",
                retention_pharynx:            row.retention_pharynx ?? "",
                retention_hintere_kommissur:  row.retention_hintere_kommissur ?? "",
                retention_oesophagussphinkter: row.retention_oesophagussphinkter ?? "",
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
        .select("overall_assessment, overall_sensitivity, sensitivity_side, bods_nutrition, nutrition_mode, nutrition_route, nutrition_notes, dys_stufe, iddsi_food_level, iddsi_drink_level, tablets, patient_nr, status")
        .eq("id", id)
        .single();

      if (exam) {
        setSummary({
          overall_assessment:  exam.overall_assessment ?? [],
          overall_sensitivity: exam.overall_sensitivity ?? "",
          sensitivity_side:    exam.sensitivity_side ?? "",
          bods_nutrition:    exam.bods_nutrition ?? null,
          nutrition_mode:    exam.nutrition_mode ?? null,
          nutrition_route:   exam.nutrition_route ?? null,
          nutrition_notes:   exam.nutrition_notes ?? null,
          dys_stufe:         exam.dys_stufe ?? null,
          iddsi_food_level:  exam.iddsi_food_level ?? null,
          iddsi_drink_level: exam.iddsi_drink_level ?? null,
          tablets:           exam.tablets ?? null,
        });
        if (exam.bods_nutrition !== null) setBodsOverride(true);
        if (exam.patient_nr != null) setPatientNr(exam.patient_nr);
        setCompletionStatus(exam.status ?? null);
      }

      setLoadingSelection(false);
    }
    loadExisting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // BODS II auto-suggestion (calls setSummary directly — no save trigger intentional)
  const suggestedBodsII = suggestBodsII(consistencies);
  useEffect(() => {
    if (!bodsOverride) {
      setSummary((prev) => ({ ...prev, bods_nutrition: suggestedBodsII }));
    }
  }, [suggestedBodsII, bodsOverride]);

  // ---- Auto-Save ----

  const saveFn = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (signal.aborted || !user) return;

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
        retention_valleculae_l:       isSelected ? c.retention_valleculae_l : "",
        retention_valleculae_r:       isSelected ? c.retention_valleculae_r : "",
        retention_sinus_l:            isSelected ? c.retention_sinus_l : "",
        retention_sinus_r:            isSelected ? c.retention_sinus_r : "",
        retention_pharynx:            isSelected ? c.retention_pharynx : "",
        retention_hintere_kommissur:  isSelected ? c.retention_hintere_kommissur : "",
        retention_oesophagussphinkter: isSelected ? c.retention_oesophagussphinkter : "",
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

    if (signal.aborted) return;
    if (swError) throw new Error(swError.message);

    const { error: exError } = await supabase
      .from("examinations")
      .update({
        overall_assessment: summary.overall_assessment,
        overall_sensitivity: summary.overall_sensitivity,
        sensitivity_side: summary.sensitivity_side,
        bods_nutrition: summary.bods_nutrition,
        nutrition_mode:    summary.nutrition_mode,
        nutrition_route:   summary.nutrition_route,
        nutrition_notes:   summary.nutrition_notes,
        dys_stufe:         summary.dys_stufe,
        iddsi_food_level:  summary.iddsi_food_level,
        iddsi_drink_level: summary.iddsi_drink_level,
        tablets:           summary.tablets,
      })
      .eq("id", id);

    if (signal.aborted) return;
    if (exError) throw new Error(exError.message);
  }, [selected, consistencies, summary, id]);

  const autoSave = useAutoSave(saveFn);
  const { scheduleAutoSave, saveNow } = autoSave;

  const setSummaryAndSave = useCallback(
    (updater: SchlucktestSummary | ((prev: SchlucktestSummary) => SchlucktestSummary)) => {
      setSummary(updater);
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const navigateSafely = useCallback(async (href: string) => {
    const success = await saveNow();
    if (!success) {
      const proceed = window.confirm(
        "Speichern fehlgeschlagen. Trotzdem weiter und Änderungen verlieren?"
      );
      if (!proceed) return;
    }
    router.refresh();
    router.push(href);
  }, [saveNow, router]);

  function toggleSelected(key: Consistency) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    scheduleAutoSave();
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
    scheduleAutoSave();
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
    setSummaryAndSave((p) => ({
      ...p,
      overall_assessment: arr.includes(key)
        ? arr.filter((v) => v !== key)
        : [...arr, key],
    }));
  }

  const current = consistencies[activeTab];

  const qs = patientName ? `?patientName=${encodeURIComponent(patientName)}` : "";

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
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
              Schlucktest
            </h2>
            <SaveIndicator status={autoSave.status} />
          </div>
          <p className="text-on-surface-variant text-[14px] font-medium">
            Welche Konsistenzen wurden getestet?
          </p>
        </header>

        {/* Abgeschlossen-Banner */}
        {completionStatus === "completed" && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#006e1c]/10 rounded-card border border-[#006e1c]/20">
            <span className="material-symbols-outlined text-[#006e1c] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <p className="text-sm font-medium text-[#006e1c]">
              Diese Untersuchung wurde bereits abgeschlossen. Änderungen werden automatisch gespeichert.
            </p>
          </div>
        )}

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
          onBeforeNavigate={saveNow}
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
        patientNr={patientNr}
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
        <div className="flex items-center gap-2">
          <SaveIndicator status={autoSave.status} />
          <button
            type="button"
            onClick={() => setView("selection")}
            className="text-xs text-primary underline font-medium"
          >
            Auswahl ändern
          </button>
        </div>
      </header>

      {/* Abgeschlossen-Banner */}
      {completionStatus === "completed" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#006e1c]/10 rounded-card border border-[#006e1c]/20">
          <span className="material-symbols-outlined text-[#006e1c] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <p className="text-sm font-medium text-[#006e1c]">
            Diese Untersuchung wurde bereits abgeschlossen. Änderungen werden automatisch gespeichert.
          </p>
        </div>
      )}

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

      {/* ---- PRÄDEGLUTITIV (nicht bei Speichel) ---- */}
      {activeTab !== "speichel" && (
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
      )}

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
          <RetentionRow
            label="Hint. Kommissur"
            value={current.retention_hintere_kommissur}
            onChange={(v) => updateCurrent({ retention_hintere_kommissur: v })}
          />
          <RetentionRow
            label="Ösophagussph."
            value={current.retention_oesophagussphinkter}
            onChange={(v) => updateCurrent({ retention_oesophagussphinkter: v })}
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
                  setSummaryAndSave((p) => ({
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
                      setSummaryAndSave((p) => ({
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
                  setSummaryAndSave((p) => ({ ...p, bods_nutrition: Number(e.target.value) }));
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
                setSummaryAndSave((p) => ({ ...p, bods_nutrition: suggestedBodsII }));
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

        {/* KOSTFORMEMPFEHLUNG */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest">
            Kostformempfehlung
          </label>

          {/* Drei-Wege-Radio */}
          <div className="flex gap-2 mb-4">
            {(["npo", "adaption", "vollkost"] as const).map((mode) => {
              const labels: Record<string, string> = {
                npo: "Non per os",
                adaption: "Koststufenadaption",
                vollkost: "Vollkost",
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setSummaryAndSave((p) => ({
                      ...p,
                      nutrition_mode: p.nutrition_mode === mode ? null : mode,
                      // reset sub-fields when switching mode
                      nutrition_route: null,
                      nutrition_notes: null,
                      dys_stufe: null,
                      iddsi_food_level: null,
                      iddsi_drink_level: null,
                      tablets: null,
                    }))
                  }
                  className={`flex-1 py-2 px-3 rounded-xl text-sm border transition-colors ${
                    summary.nutrition_mode === mode
                      ? "bg-primary text-on-primary border-primary font-medium"
                      : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant"
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>

          {/* NPO-Felder */}
          {summary.nutrition_mode === "npo" && (
            <div className="space-y-3 pl-2 border-l-2 border-primary/30">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Ernährungsweg <span className="text-tertiary">*</span>
                </label>
                <select
                  value={summary.nutrition_route ?? ""}
                  onChange={(e) =>
                    setSummaryAndSave((p) => ({
                      ...p,
                      nutrition_route: e.target.value || null,
                    }))
                  }
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Ernährungsweg wählen —</option>
                  <option value="nasogastrale_sonde">Nasogastrale Sonde</option>
                  <option value="peg">PEG</option>
                  <option value="parenteral">Parenteral</option>
                  <option value="sonstige">Sonstige</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Notiz (optional)
                </label>
                <input
                  type="text"
                  value={summary.nutrition_notes ?? ""}
                  onChange={(e) =>
                    setSummaryAndSave((p) => ({
                      ...p,
                      nutrition_notes: e.target.value || null,
                    }))
                  }
                  placeholder="Freitext…"
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* ADAPTION-Felder */}
          {summary.nutrition_mode === "adaption" && (
            <div className="space-y-3 pl-2 border-l-2 border-primary/30">
              {/* DYS-Stufe */}
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  DYS-Stufe
                </label>
                <select
                  value={summary.dys_stufe ?? ""}
                  onChange={(e) =>
                    setSummaryAndSave((p) => ({
                      ...p,
                      dys_stufe: e.target.value || null,
                    }))
                  }
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— DYS-Stufe wählen —</option>
                  <option value="DYS I">DYS I</option>
                  <option value="DYS IIa">DYS IIa</option>
                  <option value="DYS IIb">DYS IIb</option>
                  <option value="DYS III">DYS III</option>
                </select>
              </div>

              {/* IDDSI Kostlevel */}
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Kostlevel (IDDSI)
                </label>
                <select
                  value={summary.iddsi_food_level ?? ""}
                  onChange={(e) =>
                    setSummaryAndSave((p) => ({
                      ...p,
                      iddsi_food_level: e.target.value !== "" ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Kostlevel wählen —</option>
                  <option value={4}>IDDSI 4 — Püriert</option>
                  <option value={5}>IDDSI 5 — Weich & in Stücken</option>
                  <option value={6}>IDDSI 6 — Weich & mundgerecht</option>
                </select>
              </div>

              {/* Getränkestufe */}
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Getränkestufe (IDDSI)
                </label>
                <select
                  value={summary.iddsi_drink_level ?? ""}
                  onChange={(e) =>
                    setSummaryAndSave((p) => ({
                      ...p,
                      iddsi_drink_level: e.target.value !== "" ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Getränkestufe wählen —</option>
                  <option value={0}>IDDSI 0 — Dünnflüssig</option>
                  <option value={1}>IDDSI 1 — Leicht angedickt</option>
                  <option value={2}>IDDSI 2 — Mäßig angedickt (nektarartig)</option>
                  <option value={3}>IDDSI 3 — Stark angedickt (puddingartig)</option>
                </select>
              </div>

              {/* Tabletten */}
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Tabletteneinnahme
                </label>
                <div className="flex gap-2">
                  {(["normal", "crushed"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setSummaryAndSave((p) => ({
                          ...p,
                          tablets: p.tablets === t ? null : t,
                        }))
                      }
                      className={`flex-1 py-2 px-3 rounded-xl text-sm border transition-colors ${
                        summary.tablets === t
                          ? "bg-primary text-on-primary border-primary font-medium"
                          : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant"
                      }`}
                    >
                      {t === "normal" ? "Normal" : "Gemörsert"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VOLLKOST-Felder */}
          {summary.nutrition_mode === "vollkost" && (
            <div className="space-y-3 pl-2 border-l-2 border-primary/30">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Tabletteneinnahme
                </label>
                <div className="flex gap-2">
                  {(["normal", "crushed"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setSummaryAndSave((p) => ({
                          ...p,
                          tablets: p.tablets === t ? null : t,
                        }))
                      }
                      className={`flex-1 py-2 px-3 rounded-xl text-sm border transition-colors ${
                        summary.tablets === t
                          ? "bg-primary text-on-primary border-primary font-medium"
                          : "bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant"
                      }`}
                    >
                      {t === "normal" ? "Normal" : "Gemörsert"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ExaminationNav
        examinationId={id}
        patientName={patientName}
        activeStep="schlucktest"
        onBeforeNavigate={saveNow}
      />

      <StickyFooter
        submitLabel="Weiter"
        onSubmit={() => navigateSafely(`/examination/${id}/export${qs}`)}
        loading={autoSave.status === "saving"}
      />
    </div>
  );
}
