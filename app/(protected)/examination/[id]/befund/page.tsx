"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExaminationNav from "@/components/ExaminationNav";
import PatientBanner from "@/components/PatientBanner";
import StickyFooter from "@/components/StickyFooter";
import SaveIndicator from "@/components/SaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
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
  sinus_piriformes: emptyStructure(),
  trachea_mucosa: [],
  trachea_structures: [],
  trachea_structures_notes: "",
  tk_position: "",
  cannula_changed: false,
  cannula_position_before: "",
  cannula_note_before: "",
  cannula_position_after: "",
  cannula_note_after: "",
  cough_reflex: "",
  swallow_reflex: "",
  vp_closure: "",
  vocal_fold_mobility: "",
  vocal_fold_weakness_side: "",
  glissando: "",
  glissando_weakness_side: "",
  glottis_closure: "",
  voluntary_cough: "",
  langmore_score: null,
  bods_saliva: null,
};

// ---- Struktur-Definitionen ----

type StructureKey = keyof Pick<
  NativbefundData,
  "mucosa" | "velum" | "tongue_base" | "epiglottis" | "pharynx" | "larynx" | "valleculae" | "sinus_piriformes"
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
    options: ["unauffällig", "verengt", "Parese", "Schwäche"],
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
    label: "VALLECULAE",
    icon: "water",
    options: ["keine Retentionen", "dezent", "deutlich", "massiv", "serös", "mukös", "sero-mukös", "Speiseretentionen"],
    hasSide: true,
    notesPlaceholder: "Seitenbetonung / weitere Angaben …",
  },
  {
    key: "sinus_piriformes",
    label: "SINUS PIRIFORMES",
    icon: "water",
    options: ["keine Retentionen", "dezent", "deutlich", "massiv", "serös", "mukös", "sero-mukös", "Speiseretentionen"],
    hasSide: true,
    notesPlaceholder: "Seitenbetonung / weitere Angaben …",
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
    label: "Konstriktorenkontraktion (Glissando)",
    options: ["symmetrisch", "asymmetrisch", "eingeschränkt", "nicht durchführbar"],
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
  0: "Grad 0: Normal (feucht)",
  1: "Grad 1: Ansammlung in Valleculae/Sinus piriformes",
  2: "Grad 2: Transiente Ansammlung im Larynxeingang",
  3: "Grad 3: Permanente Ansammlung im Larynxeingang",
};

function suggestLangmore(valleculae: string[], sinus: string[]): number | null {
  const all = [...valleculae, ...sinus];
  if (all.length === 0) return null;
  const allNone = all.every((s) => s === "keine Retentionen");
  if (allNone) return 0;
  const hasRetention = all.some((s) => ["dezent", "deutlich", "massiv"].includes(s));
  if (hasRetention) return 1;
  return null;
}

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
  const [hasTracheostomy, setHasTracheostomy] = useState(false);
  const [bodsOverride, setBodsOverride] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<StructureKey[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);

  // Bestehende Daten aus DB laden
  useEffect(() => {
    async function loadFromDB() {
      const supabase = createClient();

      // patient_nr + has_tracheostomy für Header und bedingte Blöcke
      const { data: examRow } = await supabase
        .from("examinations")
        .select("patient_nr, has_tracheostomy, status")
        .eq("id", id)
        .single();
      if (examRow) {
        setPatientNr(examRow.patient_nr ?? null);
        setHasTracheostomy(examRow.has_tracheostomy ?? false);
        setCompletionStatus(examRow.status ?? null);
      }

      const { data: nativ } = await supabase
        .from("native_findings")
        .select(
          "mucosa, mucosa_notes, velum, velum_side, velum_notes, tongue_base, tongue_base_notes, epiglottis, epiglottis_notes, pharynx, pharynx_side, pharynx_notes, larynx, larynx_side, larynx_notes, valleculae, valleculae_side, valleculae_notes, sinus_piriformes, sinus_piriformes_side, sinus_piriformes_notes, trachea_mucosa, trachea_structures, trachea_structures_notes, tk_position, cannula_changed, cannula_position_before, cannula_note_before, cannula_position_after, cannula_note_after, cough_reflex, swallow_reflex, vp_closure, vocal_fold_mobility, vocal_fold_weakness_side, glissando, glissando_weakness_side, glottis_closure, voluntary_cough, langmore_score, bods_saliva"
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
          valleculae:       { selected: nativ.valleculae ?? [],       side: nativ.valleculae_side ?? "",       notes: nativ.valleculae_notes ?? "" },
          sinus_piriformes: { selected: nativ.sinus_piriformes ?? [], side: nativ.sinus_piriformes_side ?? "", notes: nativ.sinus_piriformes_notes ?? "" },
          trachea_mucosa:           nativ.trachea_mucosa ?? [],
          trachea_structures:       nativ.trachea_structures ?? [],
          trachea_structures_notes: nativ.trachea_structures_notes ?? "",
          tk_position:              nativ.tk_position ?? "",
          cannula_changed:          nativ.cannula_changed ?? false,
          cannula_position_before:  nativ.cannula_position_before ?? "",
          cannula_note_before:      nativ.cannula_note_before ?? "",
          cannula_position_after:   nativ.cannula_position_after ?? "",
          cannula_note_after:       nativ.cannula_note_after ?? "",
          cough_reflex:       nativ.cough_reflex ?? "",
          swallow_reflex:     nativ.swallow_reflex ?? "",
          vp_closure:               nativ.vp_closure ?? "",
          vocal_fold_mobility:      nativ.vocal_fold_mobility ?? "",
          vocal_fold_weakness_side: nativ.vocal_fold_weakness_side ?? "",
          glissando:                nativ.glissando ?? "",
          glissando_weakness_side:  nativ.glissando_weakness_side ?? "",
          glottis_closure:          nativ.glottis_closure ?? "",
          voluntary_cough:    nativ.voluntary_cough ?? "",
          langmore_score:     nativ.langmore_score ?? null,
          bods_saliva:        nativ.bods_saliva ?? null,
        });
        // Wenn ein BODS-Wert gespeichert wurde, Override aktivieren (verhindert Auto-Überschreiben)
        if (nativ.bods_saliva !== null) setBodsOverride(true);
        // Notizfelder mit Inhalt aufklappen
        const withNotes: StructureKey[] = (
          ["mucosa", "velum", "tongue_base", "epiglottis", "pharynx", "larynx", "valleculae", "sinus_piriformes"] as StructureKey[]
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

  // Langmore-Autovorschlag: Vorauswahl setzen wenn noch kein Wert gespeichert
  const suggestedLangmore = suggestLangmore(data.valleculae.selected, data.sinus_piriformes.selected);
  useEffect(() => {
    if (data.langmore_score === null && suggestedLangmore !== null) {
      setData((p) => ({ ...p, langmore_score: suggestedLangmore }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedLangmore]);

  const suggestedBods = suggestBodsI(data);
  useEffect(() => {
    if (!bodsOverride) {
      setData((prev) => ({ ...prev, bods_saliva: suggestedBods }));
    }
  }, [suggestedBods, bodsOverride]);

  // ---- Auto-Save ----

  const saveFn = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (signal.aborted || !user) return;
    // Snapshot des aktuellen data-States — via Closure immer aktuell (saveFnRef im Hook)
    const d = data;
    const row = {
      examination_id: id,
      user_id: user.id,
      mucosa: d.mucosa.selected,
      mucosa_notes: d.mucosa.notes,
      velum: d.velum.selected,
      velum_side: d.velum.side,
      velum_notes: d.velum.notes,
      tongue_base: d.tongue_base.selected,
      tongue_base_notes: d.tongue_base.notes,
      epiglottis: d.epiglottis.selected,
      epiglottis_notes: d.epiglottis.notes,
      pharynx: d.pharynx.selected,
      pharynx_side: d.pharynx.side,
      pharynx_notes: d.pharynx.notes,
      larynx: d.larynx.selected,
      larynx_side: d.larynx.side,
      larynx_notes: d.larynx.notes,
      valleculae: d.valleculae.selected,
      valleculae_side: d.valleculae.side,
      valleculae_notes: d.valleculae.notes,
      sinus_piriformes: d.sinus_piriformes.selected,
      sinus_piriformes_side: d.sinus_piriformes.side,
      sinus_piriformes_notes: d.sinus_piriformes.notes,
      trachea_mucosa: d.trachea_mucosa,
      trachea_structures: d.trachea_structures,
      trachea_structures_notes: d.trachea_structures_notes,
      tk_position: d.tk_position,
      cannula_changed: d.cannula_changed,
      cannula_position_before: d.cannula_position_before || null,
      cannula_note_before: d.cannula_note_before || null,
      cannula_position_after: d.cannula_position_after || null,
      cannula_note_after: d.cannula_note_after || null,
      cough_reflex: d.cough_reflex,
      swallow_reflex: d.swallow_reflex,
      vp_closure: d.vp_closure,
      vocal_fold_mobility: d.vocal_fold_mobility,
      vocal_fold_weakness_side: d.vocal_fold_weakness_side,
      glissando: d.glissando,
      glissando_weakness_side: d.glissando_weakness_side,
      glottis_closure: d.glottis_closure,
      voluntary_cough: d.voluntary_cough,
      langmore_score: d.langmore_score,
      bods_saliva: d.bods_saliva,
      updated_at: new Date().toISOString(),
    };
    const { error: dbError } = await supabase
      .from("native_findings")
      .upsert(row, { onConflict: "examination_id" });
    if (signal.aborted) return;
    if (dbError) throw new Error(dbError.message);
  }, [data, id]);

  const autoSave = useAutoSave(saveFn);
  const { scheduleAutoSave, saveNow } = autoSave;

  /** Wrapper: setzt State UND plant Auto-Save. Nur für User-Änderungen verwenden. */
  const setDataAndSave = useCallback((updater: NativbefundData | ((prev: NativbefundData) => NativbefundData)) => {
    setData(updater);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  /** Navigiert sicher: speichert zuerst, fragt bei Fehler per Confirm-Dialog. */
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

  // ---- Struktur-Helfer ----

  const updateStructure = useCallback(
    (key: StructureKey, patch: Partial<StructureFinding>) => {
      setData((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...patch },
      }));
      scheduleAutoSave();
    },
    [scheduleAutoSave]
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
      <header>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
              Nativbefund
            </h2>
            <p className="text-on-surface-variant text-[14px] font-medium">
              Anatomische Strukturen und Reflexe · {filledCount}/{STRUCTURES.length} dokumentiert
            </p>
          </div>
          <SaveIndicator status={autoSave.status} errorMessage={autoSave.errorMessage} />
        </div>
      </header>

      {/* Completed-Hinweis */}
      {completionStatus === "completed" && (
        <div className="bg-primary-fixed/30 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
          Dieser Befund wurde bereits abgeschlossen. Änderungen werden weiterhin gespeichert.
        </div>
      )}

      {/* ---- Nativbefund transstomatal (nur bei TK) ---- */}
      {hasTracheostomy && (
        <div className="bg-white p-5 rounded-card border-l-4 border-tertiary space-y-4">
          <h3 className="text-xs font-bold text-tertiary tracking-widest uppercase font-label">
            NATIVBEFUND TRANSSTOMATAL
          </h3>

          {/* Schleimhäute Trachea */}
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Schleimhäute Trachea
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "normal durchblutet",
                "Läsion",
                "gerötet",
                "endotracheales Sekret/Speichelaspirat sichtbar",
              ].map((opt) => {
                const active = data.trachea_mucosa.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setDataAndSave((p) => ({
                        ...p,
                        trachea_mucosa: active
                          ? p.trachea_mucosa.filter((o) => o !== opt)
                          : [...p.trachea_mucosa, opt],
                      }))
                    }
                    className={`px-4 py-3 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      active
                        ? opt === "normal durchblutet"
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
          </div>

          {/* Strukturveränderungen */}
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Strukturveränderungen
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {["keine", "Stenose"].map((opt) => {
                const active = data.trachea_structures.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setDataAndSave((p) => ({
                        ...p,
                        trachea_structures: active
                          ? p.trachea_structures.filter((o) => o !== opt)
                          : [...p.trachea_structures, opt],
                      }))
                    }
                    className={`px-4 py-3 min-h-[44px] rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      active
                        ? opt === "keine"
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
            <input
              type="text"
              value={data.trachea_structures_notes}
              onChange={(e) =>
                setDataAndSave((p) => ({ ...p, trachea_structures_notes: e.target.value }))
              }
              placeholder="Weitere Angaben zu Strukturveränderungen …"
              className="w-full bg-surface-container-highest border-b-2 border-outline-variant/50 focus:border-primary focus:outline-none px-3 py-2 text-sm rounded-t-lg placeholder:text-outline/60 transition-colors"
            />
          </div>

          {/* TK-Position */}
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              TK-Position
            </p>
            <div className="flex rounded-xl overflow-hidden bg-surface-container-high p-1 gap-1">
              {(
                [
                  ["mittig", "Mittig im Lumen"],
                  ["nicht_mittig", "Nicht mittig im Lumen"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setDataAndSave((p) => ({
                      ...p,
                      tk_position: p.tk_position === value ? "" : value,
                    }))
                  }
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                    data.tk_position === value
                      ? value === "mittig"
                        ? "bg-secondary text-on-secondary font-bold shadow-sm"
                        : "bg-tertiary text-on-tertiary font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* TK Kanülenlage */}
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              TK Kanülenlage
            </p>

            {/* Toggle: Kanüle gewechselt */}
            <button
              type="button"
              onClick={() =>
                setDataAndSave((p) => ({
                  ...p,
                  cannula_changed: !p.cannula_changed,
                  // reset sub-fields when unchecking
                  ...(p.cannula_changed
                    ? { cannula_position_before: "", cannula_note_before: "", cannula_position_after: "", cannula_note_after: "" }
                    : {}),
                }))
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all mb-3 min-h-[44px] ${
                data.cannula_changed
                  ? "bg-tertiary text-on-tertiary border-tertiary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/30"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {data.cannula_changed ? "check_box" : "check_box_outline_blank"}
              </span>
              Kanüle gewechselt
            </button>

            {data.cannula_changed && (
              <div className="space-y-3 pl-2 border-l-2 border-tertiary/40">
                {/* Vor Wechsel */}
                <div>
                  <p className="text-[11px] text-on-surface-variant mb-1.5">Lage VOR Wechsel</p>
                  <div className="flex rounded-xl overflow-hidden bg-surface-container-high p-1 gap-1 mb-2">
                    {(
                      [
                        ["mittig", "Mittig"],
                        ["nicht_mittig", "Nicht mittig"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setDataAndSave((p) => ({
                            ...p,
                            cannula_position_before: p.cannula_position_before === value ? "" : value,
                          }))
                        }
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all min-h-[40px] ${
                          data.cannula_position_before === value
                            ? value === "mittig"
                              ? "bg-secondary text-on-secondary font-bold shadow-sm"
                              : "bg-tertiary text-on-tertiary font-bold shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={data.cannula_note_before}
                    onChange={(e) => setDataAndSave((p) => ({ ...p, cannula_note_before: e.target.value }))}
                    placeholder="Notiz zur Lage vor Wechsel …"
                    className="w-full bg-surface-container-highest border-b-2 border-outline-variant/50 focus:border-primary focus:outline-none px-3 py-2 text-sm rounded-t-lg placeholder:text-outline/60 transition-colors"
                  />
                </div>

                {/* Nach Wechsel */}
                <div>
                  <p className="text-[11px] text-on-surface-variant mb-1.5">Lage NACH Wechsel</p>
                  <div className="flex rounded-xl overflow-hidden bg-surface-container-high p-1 gap-1 mb-2">
                    {(
                      [
                        ["mittig", "Mittig"],
                        ["nicht_mittig", "Nicht mittig"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setDataAndSave((p) => ({
                            ...p,
                            cannula_position_after: p.cannula_position_after === value ? "" : value,
                          }))
                        }
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all min-h-[40px] ${
                          data.cannula_position_after === value
                            ? value === "mittig"
                              ? "bg-secondary text-on-secondary font-bold shadow-sm"
                              : "bg-tertiary text-on-tertiary font-bold shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={data.cannula_note_after}
                    onChange={(e) => setDataAndSave((p) => ({ ...p, cannula_note_after: e.target.value }))}
                    placeholder="Notiz zur Lage nach Wechsel …"
                    className="w-full bg-surface-container-highest border-b-2 border-outline-variant/50 focus:border-primary focus:outline-none px-3 py-2 text-sm rounded-t-lg placeholder:text-outline/60 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Anatomische Strukturen ---- */}
      <div className="space-y-4">
        {STRUCTURES.map((struct) => {
          const finding = data[struct.key];
          const isPathological =
            struct.key === "valleculae" || struct.key === "sinus_piriformes"
              ? finding.selected.some((s) => ["dezent", "deutlich", "massiv", "serös", "mukös", "sero-mukös", "Speiseretentionen"].includes(s))
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
                onClick={() => setDataAndSave((p) => ({ ...p, cough_reflex: p.cough_reflex === opt ? "" : opt }))}
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
                onClick={() => setDataAndSave((p) => ({ ...p, swallow_reflex: p.swallow_reflex === opt ? "" : opt }))}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setDataAndSave((p) => ({
                    ...p,
                    [field.key]: val,
                    // Seitenfeld zurücksetzen wenn nicht mehr asymmetrisch
                    ...(field.key === "vocal_fold_mobility" && val !== "asymmetrisch"
                      ? { vocal_fold_weakness_side: "" }
                      : {}),
                    ...(field.key === "glissando" && val !== "asymmetrisch"
                      ? { glissando_weakness_side: "" }
                      : {}),
                  }));
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              >
                <option value="">— nicht bewertet —</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {/* Schwäche-Seite für Stimmlippenbeweglichkeit */}
              {field.key === "vocal_fold_mobility" && data.vocal_fold_mobility === "asymmetrisch" && (
                <div className="mt-2 flex gap-2 pl-1">
                  {(["links", "rechts"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() =>
                        setDataAndSave((p) => ({
                          ...p,
                          vocal_fold_weakness_side: p.vocal_fold_weakness_side === side ? "" : side,
                        }))
                      }
                      className={`px-4 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all ${
                        data.vocal_fold_weakness_side === side
                          ? "bg-tertiary text-on-tertiary"
                          : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                      }`}
                    >
                      Schwäche {side}
                    </button>
                  ))}
                </div>
              )}

              {/* Schwäche-Seite für Konstriktorenkontraktion */}
              {field.key === "glissando" && data.glissando === "asymmetrisch" && (
                <div className="mt-2 flex gap-2 pl-1">
                  {(["links", "rechts"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() =>
                        setDataAndSave((p) => ({
                          ...p,
                          glissando_weakness_side: p.glissando_weakness_side === side ? "" : side,
                        }))
                      }
                      className={`px-4 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all ${
                        data.glissando_weakness_side === side
                          ? "bg-tertiary text-on-tertiary"
                          : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                      }`}
                    >
                      Schwäche {side}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </details>

      {/* ---- Langmore-Graduierung ---- */}
      {(() => {
        const suggested = suggestLangmore(data.valleculae.selected, data.sinus_piriformes.selected);
        const isOverridden = data.langmore_score !== null && data.langmore_score !== suggested;
        return (
          <div className="bg-surface-container-low rounded-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-primary tracking-widest uppercase font-label">
              LANGMORE-GRADUIERUNG
            </h3>

            {suggested !== null && data.langmore_score === suggested && (
              <p className="text-[11px] text-primary bg-primary/5 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Vorschlag basierend auf Nativbefund — bitte bestätigen
              </p>
            )}

            <select
              value={data.langmore_score ?? ""}
              onChange={(e) =>
                setDataAndSave((p) => ({
                  ...p,
                  langmore_score: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
            >
              <option value="">— Grad wählen —</option>
              {[0, 1, 2, 3].map((grade) => (
                <option key={grade} value={grade}>
                  Grad {grade}
                </option>
              ))}
            </select>

            {/* Immer sichtbare Beschreibungen */}
            <div className="space-y-1 pt-1">
              {[0, 1, 2, 3].map((grade) => (
                <p
                  key={grade}
                  className={`text-[11px] px-2 py-1 rounded transition-colors ${
                    data.langmore_score === grade
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-on-surface-variant"
                  }`}
                >
                  {LANGMORE_LABELS[grade]}
                </p>
              ))}
            </div>

            {isOverridden && suggested !== null && (
              <button
                type="button"
                onClick={() => setDataAndSave((p) => ({ ...p, langmore_score: suggested }))}
                className="text-xs text-primary underline"
              >
                Vorschlag wiederherstellen (Grad {suggested})
              </button>
            )}
          </div>
        );
      })()}

      {/* ---- BODS I ---- */}
      <div className="bg-surface-container-low rounded-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-primary tracking-widest uppercase font-label">
            BODS I — SPEICHELBEWÄLTIGUNG
          </h3>
          <span className="text-xs text-on-surface-variant">1–8</span>
        </div>

        {/* Legende mit Gruppierung nach TK-Status */}
        <div className="space-y-1">
          {/* Gruppe: ohne TK (1–3) */}
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${hasTracheostomy ? "text-outline/50" : "text-on-surface-variant"}`}>
            Ohne Trachealkanüle
          </p>
          {[
            { score: 1, desc: "Keine Störung: normale Speichelbewältigung" },
            { score: 2, desc: "Leichte Störung: gelegentlich gurgelnde Stimmqualität oder gelegentliches Husten/Räuspern durch Speichel (>1 × pro Stunde)" },
            { score: 3, desc: "Mäßige Störung: häufig gurgelnde Stimmqualität oder häufiges Husten/Räuspern durch Speichel (<1 × pro Stunde)" },
          ].map(({ score, desc }) => (
            <p key={score} className={`text-[11px] transition-opacity ${hasTracheostomy ? "opacity-40" : "text-on-surface-variant"}`}>
              <span className="font-bold text-on-surface">{score}</span> — {desc}
            </p>
          ))}

          {/* Gruppe: mit TK (4–8) */}
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${!hasTracheostomy ? "text-outline/50" : "text-on-surface-variant"}`}>
            Mit Trachealkanüle
          </p>
          {[
            { score: 4, desc: "Mittelschwere Störung: TK dauerhaft entblockt oder Sprechkanüle/Platzhalter" },
            { score: 5, desc: "Mittelschwere Störung: TK vorwiegend entblockt (>12–24 Std./Tag)" },
            { score: 6, desc: "Schwere Störung: TK zeitweise entblockt (>1–12 Std./Tag)" },
            { score: 7, desc: "Schwere Störung: TK kurzzeitig entblockt (≤1 Std.)" },
            { score: 8, desc: "Schwerste Störung: TK dauerhaft geblockt" },
          ].map(({ score, desc }) => (
            <p key={score} className={`text-[11px] transition-opacity ${!hasTracheostomy ? "opacity-40" : "text-on-surface-variant"}`}>
              <span className="font-bold text-on-surface">{score}</span> — {desc}
            </p>
          ))}
        </div>

        {/* Slider */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="range"
              min={1}
              max={8}
              value={data.bods_saliva ?? suggestedBods}
              onChange={(e) => {
                setBodsOverride(true);
                setDataAndSave((p) => ({ ...p, bods_saliva: Number(e.target.value) }));
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
            onClick={() => { setBodsOverride(false); setDataAndSave((p) => ({ ...p, bods_saliva: suggestedBods })); }}
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

      {/* ExaminationNav (Mobile) */}
      <ExaminationNav
        examinationId={id}
        patientName={patientName}
        activeStep="befund"
        onBeforeNavigate={saveNow}
      />

      {/* Sticky Footer */}
      <StickyFooter
        backHref={`/dashboard`}
        submitLabel="Weiter"
        loading={autoSave.status === "saving"}
        onSubmit={() => {
          const qs = patientName ? `?patientName=${encodeURIComponent(patientName)}` : "";
          navigateSafely(`/examination/${id}/schlucktest${qs}`);
        }}
      />
    </div>
  );
}
