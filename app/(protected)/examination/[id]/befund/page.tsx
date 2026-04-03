"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExaminationNav from "@/components/ExaminationNav";
import PatientBanner from "@/components/PatientBanner";
import StickyFooter from "@/components/StickyFooter";
import { suggestBodsI } from "@/lib/bods";
import type { NativbefundData, StructureFinding, SideFinding } from "@/lib/types";

// ---- Initiale Daten ----

function emptyStructure(): StructureFinding {
  return { selected: [], side: "", notes: "" };
}

const initialData: NativbefundData = {
  mucosa: emptyStructure(),
  velum: emptyStructure(),
  tongue_base: emptyStructure(),
  epiglottis: emptyStructure(),
  pharynx: emptyStructure(),
  larynx: emptyStructure(),
  valleculae: emptyStructure(),
  cough_reflex: "",
  swallow_reflex: "",
  vp_closure: "",
  vocal_fold_mobility: "",
  glissando: "",
  glottis_closure: "",
  voluntary_cough: "",
  langmore_score: null,
  bods_saliva: null,
};

// ---- Struktur-Definitionen ----

type StructureKey = keyof Pick<
  NativbefundData,
  "mucosa" | "velum" | "tongue_base" | "epiglottis" | "pharynx" | "larynx" | "valleculae"
>;

interface StructureDef {
  key: StructureKey;
  label: string;
  icon: string;
  options: string[];
  hasSide: boolean;
  notesPlaceholder: string;
}

const STRUCTURES: StructureDef[] = [
  {
    key: "mucosa",
    label: "SCHLEIMHÄUTE",
    icon: "texture",
    options: ["feucht", "gerötet", "geschwollen", "normal durchblutet", "keine Läsionen"],
    hasSide: false,
    notesPlaceholder: "Zusätzliche Befunde zur Schleimhaut …",
  },
  {
    key: "velum",
    label: "VELUM",
    icon: "navigation",
    options: ["symmetrisch", "asymmetrisch", "Insuffizienz"],
    hasSide: true,
    notesPlaceholder: "Bemerkung zum Gaumensegel …",
  },
  {
    key: "tongue_base",
    label: "ZUNGENBASIS",
    icon: "blur_on",
    options: ["unauffällig", "hypertroph", "atrophiert", "Coating (glasig/blasig)", "anatomisch korrekt"],
    hasSide: false,
    notesPlaceholder: "Bemerkung zur Zungenbasis …",
  },
  {
    key: "epiglottis",
    label: "EPIGLOTTIS",
    icon: "flip",
    options: ["symmetrisch", "Omegaepiglottis", "geschwollen"],
    hasSide: false,
    notesPlaceholder: "Bemerkung zur Epiglottis …",
  },
  {
    key: "pharynx",
    label: "PHARYNX",
    icon: "account_tree",
    options: ["unauffällig", "verengt", "Parese"],
    hasSide: true,
    notesPlaceholder: "Bemerkung zum Pharynx …",
  },
  {
    key: "larynx",
    label: "LARYNX / KEHLKOPF",
    icon: "record_voice_over",
    options: ["symmetrisch", "Ödem", "Aryknorpel auffällig", "hypertroph", "unauffällige Anatomie"],
    hasSide: true,
    notesPlaceholder: "Bemerkung zum Larynx …",
  },
  {
    key: "valleculae",
    label: "VALLECULAE / SINUS PIRIF.",
    icon: "water",
    options: ["keine Retentionen", "dezent", "deutlich", "massiv"],
    hasSide: true,
    notesPlaceholder: "Seitenbetonung der Retentionen …",
  },
];

const PHONATION_FIELDS: { key: keyof Pick<NativbefundData, "vp_closure" | "vocal_fold_mobility" | "glissando" | "glottis_closure" | "voluntary_cough">; label: string; options: string[] }[] = [
  {
    key: "vp_closure",
    label: "Velopharyngealer Verschluss",
    options: ["vollständig", "eingeschränkt", "nicht durchführbar"],
  },
  {
    key: "vocal_fold_mobility",
    label: "Stimmlippenbeweglichkeit",
    options: ["seitengleich", "asymmetrisch", "eingeschränkt", "nicht durchführbar"],
  },
  {
    key: "glissando",
    label: "Glissando",
    options: ["symmetrisch", "eingeschränkt", "nicht durchführbar"],
  },
  {
    key: "glottis_closure",
    label: "Glottisschluss / Taschenfaltenschluss",
    options: ["vollständig", "inkomplett", "nicht durchführbar"],
  },
  {
    key: "voluntary_cough",
    label: "Willkürliches Husten / Räuspern",
    options: ["kräftig", "kraftgemindert", "nicht möglich"],
  },
];

const LANGMORE_LABELS: Record<number, string> = {
  0: "Normal (feucht)",
  1: "Ansammlung in Valleculae / Sinus piriformes",
  2: "Transiente Ansammlung im Larynxeingang",
  3: "Permanente Ansammlung im Larynxeingang",
};

// ============================================================
// Main Component
// ============================================================

export default function BefundPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const patientName = searchParams.get("patientName") ?? "";

  const [data, setData] = useState<NativbefundData>(initialData);
  const [patientNr, setPatientNr] = useState<number | null>(null);
  const [bodsOverride, setBodsOverride] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<StructureKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Bestehende Daten aus DB laden
  useEffect(() => {
    async function loadFromDB() {
      const supabase = createClient();

      // patient_nr für Header
      const { data: examRow } = await supabase
        .from("examinations")
        .select("patient_nr")
        .eq("id", id)
        .single();
      if (examRow) setPatientNr(examRow.patient_nr ?? null);

      const { data: nativ } = await supabase
        .from("native_findings")
        .select(
          "mucosa, mucosa_notes, velum, velum_side, velum_notes, tongue_base, tongue_base_notes, epiglottis, epiglottis_notes, pharynx, pharynx_side, pharynx_notes, larynx, larynx_side, larynx_notes, valleculae, valleculae_side, valleculae_notes, cough_reflex, swallow_reflex, vp_closure, vocal_fold_mobility, glissando, glottis_closure, voluntary_cough, langmore_score, bods_saliva"
        )
        .eq("examination_id", id)
        .maybeSingle();

      if (nativ) {
        setData({
          mucosa:       { selected: nativ.mucosa ?? [],       side: "",                          notes: nativ.mucosa_notes ?? "" },
          velum:        { selected: nativ.velum ?? [],        side: nativ.velum_side ?? "",       notes: nativ.velum_notes ?? "" },
          tongue_base:  { selected: nativ.tongue_base ?? [],  side: "",                          notes: nativ.tongue_base_notes ?? "" },
          epiglottis:   { selected: nativ.epiglottis ?? [],   side: "",                          notes: nativ.epiglottis_notes ?? "" },
          pharynx:      { selected: nativ.pharynx ?? [],      side: nativ.pharynx_side ?? "",    notes: nativ.pharynx_notes ?? "" },
          larynx:       { selected: nativ.larynx ?? [],       side: nativ.larynx_side ?? "",     notes: nativ.larynx_notes ?? "" },
          valleculae:   { selected: nativ.valleculae ?? [],   side: nativ.valleculae_side ?? "", notes: nativ.valleculae_notes ?? "" },
          cough_reflex:       nativ.cough_reflex ?? "",
          swallow_reflex:     nativ.swallow_reflex ?? "",
          vp_closure:         nativ.vp_closure ?? "",
          vocal_fold_mobility: nativ.vocal_fold_mobility ?? "",
          glissando:          nativ.glissando ?? "",
          glottis_closure:    nativ.glottis_closure ?? "",
          voluntary_cough:    nativ.voluntary_cough ?? "",
          langmore_score:     nativ.langmore_score ?? null,
          bods_saliva:        nativ.bods_saliva ?? null,
        });
        // Wenn ein BODS-Wert gespeichert wurde, Override aktivieren (verhindert Auto-Überschreiben)
        if (nativ.bods_saliva !== null) setBodsOverride(true);
        // Notizfelder mit Inhalt aufklappen
        const withNotes: StructureKey[] = (
          ["mucosa", "velum", "tongue_base", "epiglottis", "pharynx", "larynx", "valleculae"] as StructureKey[]
        ).filter((k) => {
          const notesKey = `${k}_notes` as keyof typeof nativ;
          return !!(nativ[notesKey]);
        });
        if (withNotes.length > 0) setExpandedNotes(withNotes);
      }
      setLoadingData(false);
    }
    loadFromDB();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const suggestedBods = suggestBodsI(data);
  useEffect(() => {
    if (!bodsOverride) {
      setData((prev) => ({ ...prev, bods_saliva: suggestedBods }));
    }
  }, [suggestedBods, bodsOverride]);

  const updateStructure = useCallback(
    (key: StructureKey, patch: Partial<StructureFinding>) => {
      setData((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...patch },
      }));
    },
    []
  );

  function toggleChip(key: StructureKey, option: string) {
    const current = data[key].selected;
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    updateStructure(key, { selected: updated });
  }

  function setSide(key: StructureKey, side: SideFinding) {
    updateStructure(key, { side: data[key].side === side ? "" : side });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Nicht angemeldet."); setSaving(false); return; }

    const row = {
      examination_id: id,
      user_id: user.id,
      mucosa: data.mucosa.selected,
      mucosa_notes: data.mucosa.notes,
      velum: data.velum.selected,
      velum_side: data.velum.side,
      velum_notes: data.velum.notes,
      tongue_base: data.tongue_base.selected,
      tongue_base_notes: data.tongue_base.notes,
      epiglottis: data.epiglottis.selected,
      epiglottis_notes: data.epiglottis.notes,
      pharynx: data.pharynx.selected,
      pharynx_side: data.pharynx.side,
      pharynx_notes: data.pharynx.notes,
      larynx: data.larynx.selected,
      larynx_side: data.larynx.side,
      larynx_notes: data.larynx.notes,
      valleculae: data.valleculae.selected,
      valleculae_side: data.valleculae.side,
      valleculae_notes: data.valleculae.notes,
      cough_reflex: data.cough_reflex,
      swallow_reflex: data.swallow_reflex,
      vp_closure: data.vp_closure,
      vocal_fold_mobility: data.vocal_fold_mobility,
      glissando: data.glissando,
      glottis_closure: data.glottis_closure,
      voluntary_cough: data.voluntary_cough,
      langmore_score: data.langmore_score,
      bods_saliva: data.bods_saliva,
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from("native_findings")
      .upsert(row, { onConflict: "examination_id" });

    if (dbError) {
      setError("Fehler beim Speichern: " + dbError.message);
      setSaving(false);
      return;
    }

    const qs = patientName ? `?patientName=${encodeURIComponent(patientName)}` : "";
    router.push(`/examination/${id}/schlucktest${qs}`);
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  const filledCount = STRUCTURES.filter((s) => data[s.key].selected.length > 0).length;

  const WNL_OPTS = ["unauffällig", "symmetrisch", "feucht", "normal durchblutet", "keine Läsionen", "anatomisch korrekt"];

  return (
    <div className="px-4 pt-6 pb-32 space-y-6">
      {/* Patient-Banner */}
      <PatientBanner
        patientNr={patientNr}
        patientName={patientName}
        stepLabel="Befund"
        badgeClass="bg-secondary-container text-on-secondary-container"
      />

      {/* Seiten-Header */}
      <header className="space-y-1">
        <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
          Nativbefund
        </h2>
        <p className="text-on-surface-variant text-[14px] font-medium">
          Anatomische Strukturen und Reflexe · {filledCount}/{STRUCTURES.length} dokumentiert
        </p>
      </header>

      {/* ---- Anatomische Strukturen ---- */}
      <div className="space-y-4">
        {STRUCTURES.map((struct) => {
          const finding = data[struct.key];
          const isPathological =
            struct.key === "valleculae"
              ? finding.selected.some((s) => ["dezent", "deutlich", "massiv"].includes(s))
              : finding.selected.some((s) => !WNL_OPTS.includes(s));

          return (
            <div
              key={struct.key}
              className={`bg-white p-5 rounded-card border-l-4 ${
                isPathological ? "border-[#a10012]" : "border-[#006e1c]"
              }`}
            >
              {/* Strukturkopf */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest font-label ${
                  isPathological ? "text-[#a10012]" : "text-[#006e1c]"
                }`}>
                  {struct.label}
                </h3>
                {struct.hasSide && (
                  <div className="flex bg-surface-container-high rounded-lg p-0.5 gap-0.5">
                    {(["L", "R", "beidseitig"] as SideFinding[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSide(struct.key, s)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md min-h-[32px] transition-colors ${
                          finding.side === s
                            ? "bg-primary text-on-primary shadow-sm"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {struct.options.map((opt) => {
                  const active = finding.selected.includes(opt);
                  const isWnl = WNL_OPTS.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleChip(struct.key, opt)}
                      className={`px-4 py-3 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        active
                          ? isWnl
                            ? "bg-secondary-container text-on-secondary-container border border-secondary/20"
                            : "bg-tertiary text-on-tertiary"
                          : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Freitext — ausklappbar */}
              {(expandedNotes.includes(struct.key) || finding.notes.length > 0) ? (
                <input
                  type="text"
                  value={finding.notes}
                  onChange={(e) => updateStructure(struct.key, { notes: e.target.value })}
                  placeholder={struct.notesPlaceholder}
                  className="w-full bg-surface-container-highest border-b-2 border-outline-variant/50 focus:border-primary focus:outline-none px-3 py-2 text-sm rounded-t-lg placeholder:text-outline/60 transition-colors"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setExpandedNotes((prev) => [...prev, struct.key])}
                  className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-0.5 mt-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Notiz hinzufügen
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Reflexe ---- */}
      <div className="bg-white p-5 rounded-card border-l-4 border-primary">
        <h3 className="text-xs font-bold text-primary mb-4 tracking-widest uppercase font-label">
          REFLEXE
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Hustenstoß */}
          <div className="bg-surface-container-low p-3 rounded-xl space-y-2">
            <p className="text-[10px] font-bold uppercase text-outline tracking-widest">
              Hustenstoß spontan
            </p>
            {["auslösbar", "insuffizient", "nicht auslösbar"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setData((p) => ({ ...p, cough_reflex: p.cough_reflex === opt ? "" : opt }))}
                className={`w-full py-2.5 rounded-lg text-[11px] font-bold min-h-[40px] transition-all active:scale-95 ${
                  data.cough_reflex === opt
                    ? opt === "auslösbar"
                      ? "bg-secondary text-on-secondary"
                      : "bg-tertiary text-on-tertiary"
                    : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* Schluckversuch */}
          <div className="bg-surface-container-low p-3 rounded-xl space-y-2">
            <p className="text-[10px] font-bold uppercase text-outline tracking-widest">
              Schluckversuch spontan
            </p>
            {["möglich", "verzögert", "nicht möglich"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setData((p) => ({ ...p, swallow_reflex: p.swallow_reflex === opt ? "" : opt }))}
                className={`w-full py-2.5 rounded-lg text-[11px] font-bold min-h-[40px] transition-all active:scale-95 ${
                  data.swallow_reflex === opt
                    ? opt === "möglich"
                      ? "bg-secondary text-on-secondary"
                      : "bg-tertiary text-on-tertiary"
                    : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Phonationskontrolle (optional) ---- */}
      <details className="bg-surface-container-low rounded-card overflow-hidden group">
        <summary className="p-4 flex items-center justify-between cursor-pointer list-none select-none min-h-[52px]">
          <span className="font-headline font-bold text-sm text-on-surface">
            Phonationskontrolle (optional)
          </span>
          <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-on-surface-variant">
            expand_more
          </span>
        </summary>
        <div className="px-4 pb-4 space-y-3">
          {PHONATION_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                {field.label}
              </label>
              <select
                value={data[field.key]}
                onChange={(e) => setData((p) => ({ ...p, [field.key]: e.target.value }))}
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              >
                <option value="">— nicht bewertet —</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </details>

      {/* ---- Langmore-Graduierung ---- */}
      <div className="bg-surface-container-low rounded-card p-5 space-y-4">
        <h3 className="text-xs font-bold text-primary tracking-widest uppercase font-label">
          LANGMORE-GRADUIERUNG
        </h3>
        <div className="flex justify-between bg-surface-container-lowest p-2 rounded-xl gap-2">
          {[0, 1, 2, 3].map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() =>
                setData((p) => ({ ...p, langmore_score: p.langmore_score === grade ? null : grade }))
              }
              className={`flex-1 h-12 rounded-xl font-extrabold text-lg transition-all active:scale-95 ${
                data.langmore_score === grade
                  ? grade === 0
                    ? "bg-secondary text-on-secondary shadow-md"
                    : grade <= 1
                    ? "bg-primary text-on-primary shadow-md"
                    : "bg-tertiary text-on-tertiary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
        {data.langmore_score !== null && (
          <p className="text-xs text-on-surface-variant text-center px-2">
            Grad {data.langmore_score}: {LANGMORE_LABELS[data.langmore_score]}
          </p>
        )}
      </div>

      {/* ---- BODS I ---- */}
      <div className="bg-surface-container-low rounded-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary tracking-widest uppercase font-label">
            BODS I — SPEICHELBEWÄLTIGUNG
          </h3>
          <span className="text-xs text-on-surface-variant">1 = normal · 8 = schwer</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="range"
              min={1}
              max={8}
              value={data.bods_saliva ?? suggestedBods}
              onChange={(e) => {
                setBodsOverride(true);
                setData((p) => ({ ...p, bods_saliva: Number(e.target.value) }));
              }}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-outline mt-0.5 px-0.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${
            (data.bods_saliva ?? suggestedBods) <= 2
              ? "bg-secondary-container text-secondary"
              : (data.bods_saliva ?? suggestedBods) <= 5
              ? "bg-primary-fixed text-primary"
              : "bg-tertiary-fixed text-tertiary"
          }`}>
            {data.bods_saliva ?? suggestedBods}
          </div>
        </div>
        {bodsOverride && (
          <button
            type="button"
            onClick={() => { setBodsOverride(false); setData((p) => ({ ...p, bods_saliva: suggestedBods })); }}
            className="text-xs text-primary underline"
          >
            Vorschlag wiederherstellen ({suggestedBods})
          </button>
        )}
        {!bodsOverride && (
          <p className="text-[11px] text-on-surface-variant">
            Auto-Vorschlag aus Langmore + Reflexen. Slider verschieben zum Überschreiben.
          </p>
        )}
      </div>

      {/* Fehler */}
      {error && (
        <p className="text-sm text-tertiary bg-tertiary-fixed/50 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </p>
      )}

      {/* ExaminationNav (Mobile) */}
      <ExaminationNav
        examinationId={id}
        patientName={patientName}
        activeStep="befund"
      />

      {/* Sticky Footer */}
      <StickyFooter
        backHref={`/dashboard`}
        submitLabel="Speichern & Weiter"
        loading={saving}
        onSubmit={handleSave}
      />
    </div>
  );
}
