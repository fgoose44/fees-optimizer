"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ExaminationNav from "@/components/ExaminationNav";
import PatientBanner from "@/components/PatientBanner";
import StickyFooter from "@/components/StickyFooter";

// ---- Konstanten ----

const DYS_OPTIONS = [
  { value: "I", label: "DYS I — Püriert / IDDSI 4" },
  { value: "IIa", label: "DYS IIa — Weich-cremig / IDDSI 5" },
  { value: "IIb", label: "DYS IIb — Weiche Übergangskost / IDDSI 6" },
  { value: "III", label: "DYS III — Leichte Vollkost / IDDSI 7" },
];

const IDDSI_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: i,
  label: `Level ${i} — ${["Dünnflüssig", "Leicht angedickt", "Nektarähnlich", "Puddingartig", "Püriert", "Gewürfelt/weich", "Weich & mundgerecht", "Normal"][i]}`,
}));

const BEVERAGE_OPTIONS = [
  { value: 0, label: "IDDSI 0 — Dünnflüssig (unangedickt)" },
  { value: 1, label: "IDDSI 1 — Leicht angedickt" },
  { value: 2, label: "IDDSI 2 — Nektarähnlich (ThickandEasy)" },
  { value: 3, label: "IDDSI 3 — Stark angedickt" },
];

const TK_SUGGESTIONS = ["Sprechventil", "Entblockungstraining", "Blockungsschema", "Geblockt nachts / entblockt tagsüber"];

const THERAPY_OPTIONS = [
  "Masako-Manöver",
  "Mendelsohn-Manöver",
  "Shaker-Übung",
  "PNF",
  "Spannungsaufbau nach Logemann",
  "F.O.T.T.",
  "Intraorale Stimulation",
  "Essensbegleitung",
  "Zungenkraftübungen",
  "Pharynxkontraktion",
  "Suprahyoidale Muskulatur",
  "Mundschluss",
  "Kopfrotation",
  "Zungenbasisretraktion",
  "Supraglottisches Schlucken",
  "Effortful Swallow",
];

// ---- Typen ----

interface ExportState {
  bodsI: number | null;
  bodsII: number | null;
  beurteilung: string;
  pathophysiologie: string;
  dysLevel: string;
  iddsiLevel: number | null;
  beverageIddsi: number | null;
  tracheostomyRec: string;
  therapySelected: string[];
  therapyNotes: string;
  hasTracheostomy: boolean;
}

const initialState: ExportState = {
  bodsI: null,
  bodsII: null,
  beurteilung: "",
  pathophysiologie: "",
  dysLevel: "",
  iddsiLevel: null,
  beverageIddsi: null,
  tracheostomyRec: "",
  therapySelected: [],
  therapyNotes: "",
  hasTracheostomy: false,
};

// ============================================================
// Main Component
// ============================================================

export default function ExportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [patientName, setPatientName] = useState(
    searchParams.get("patientName") ?? ""
  );

  const [state, setState] = useState<ExportState>(initialState);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ---- Daten laden ----
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: exam } = await supabase
        .from("examinations")
        .select("has_tracheostomy, bods_nutrition, iddsi_level, assessment_text, pathophysiology_text, dys_level, beverage_iddsi, therapy_recommendations, therapy_notes, tracheostomy_recommendation")
        .eq("id", id)
        .single();
      const { data: nativ } = await supabase
        .from("native_findings")
        .select("bods_saliva")
        .eq("examination_id", id)
        .maybeSingle();

      if (exam) {
        setState((prev) => ({
          ...prev,
          bodsI: nativ?.bods_saliva ?? null,
          bodsII: exam.bods_nutrition ?? null,
          hasTracheostomy: exam.has_tracheostomy ?? false,
          iddsiLevel: exam.iddsi_level ?? null,
          beurteilung: exam.assessment_text ?? "",
          pathophysiologie: exam.pathophysiology_text ?? "",
          dysLevel: exam.dys_level ?? "",
          beverageIddsi: exam.beverage_iddsi ?? null,
          therapySelected: exam.therapy_recommendations ?? [],
          therapyNotes: exam.therapy_notes ?? "",
          tracheostomyRec: exam.tracheostomy_recommendation ?? "",
        }));
      }
      setLoaded(true);
    }
    loadData();
  }, [id]);

  const set = useCallback(<K extends keyof ExportState>(key: K, value: ExportState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  function toggleTherapy(item: string) {
    setState((prev) => ({
      ...prev,
      therapySelected: prev.therapySelected.includes(item)
        ? prev.therapySelected.filter((t) => t !== item)
        : [...prev.therapySelected, item],
    }));
  }

  // ---- KI generieren ----
  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examinationId: id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body.detail ? ` (${body.detail})` : "";
        throw new Error((body.error ?? "Unbekannter Fehler") + detail);
      }
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        beurteilung: data.beurteilung ?? prev.beurteilung,
        pathophysiologie: data.pathophysiologie ?? prev.pathophysiologie,
      }));
      // Therapieempfehlungen aus KI-Antwort zuordnen
      if (Array.isArray(data.therapieempfehlungen) && data.therapieempfehlungen.length > 0) {
        const matched = data.therapieempfehlungen.filter((t: string) =>
          THERAPY_OPTIONS.some((opt) => t.toLowerCase().includes(opt.toLowerCase().split(" ")[0]))
        );
        const unmatched = data.therapieempfehlungen.filter(
          (t: string) => !matched.includes(t)
        );
        setState((prev) => ({
          ...prev,
          therapySelected: [...new Set([...prev.therapySelected, ...matched])],
          therapyNotes: unmatched.join("\n"),
        }));
      }
    } catch (e) {
      setGenError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // ---- Zwischenspeichern ----
  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("examinations")
      .update({
        assessment_text: state.beurteilung,
        pathophysiology_text: state.pathophysiologie,
        dys_level: state.dysLevel,
        beverage_iddsi: state.beverageIddsi,
        therapy_recommendations: state.therapySelected,
        therapy_notes: state.therapyNotes,
        tracheostomy_recommendation: state.tracheostomyRec,
      })
      .eq("id", id);
    if (error) setSaveError("Fehler beim Speichern: " + error.message);
    setSaving(false);
  }

  // ---- DOCX Download ----
  async function handleDownload() {
    await handleSave();
    setDownloading(true);
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examinationId: id, patientName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? "Fehler beim DOCX-Export.");
      setDownloading(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FEES-Bericht.docx";
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
    setDownloaded(true);
  }

  const bodsTotal =
    state.bodsI != null && state.bodsII != null
      ? state.bodsI + state.bodsII
      : null;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-[160px] space-y-6">
      {/* Patient-Banner mit editierbarem Namen */}
      <div className="bg-surface-container-low p-3 rounded-card flex items-center justify-between">
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
              UNTERSUCHUNG FÜR
            </p>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="[Patient/in] — nur für DOCX"
              className="font-headline font-bold text-on-surface bg-transparent focus:outline-none text-base w-48"
            />
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-full flex items-center gap-1.5 min-h-[32px] bg-secondary-container text-on-secondary-container">
          <span className="w-2 h-2 rounded-full bg-current opacity-60" />
          <span className="text-[11px] font-bold uppercase tracking-wide">Export</span>
        </div>
      </div>

      {/* ---- BODS Score ---- */}
      <section className="space-y-3">
        <h3 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
          BODS-Score
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {/* BODS I */}
          <div className="bg-surface-container-lowest rounded-card p-4 flex flex-col items-center">
            <span className="text-[10px] font-bold text-outline uppercase mb-1">Teil I</span>
            <input
              type="number"
              min={1} max={8}
              value={state.bodsI ?? ""}
              onChange={(e) => set("bodsI", e.target.value ? Number(e.target.value) : null)}
              className="text-2xl font-black text-on-surface bg-transparent text-center w-12 focus:outline-none"
              placeholder="—"
            />
            <span className="text-[9px] text-outline mt-1">Speichel</span>
          </div>
          {/* BODS II */}
          <div className="bg-surface-container-lowest rounded-card p-4 flex flex-col items-center">
            <span className="text-[10px] font-bold text-outline uppercase mb-1">Teil II</span>
            <input
              type="number"
              min={1} max={8}
              value={state.bodsII ?? ""}
              onChange={(e) => set("bodsII", e.target.value ? Number(e.target.value) : null)}
              className="text-2xl font-black text-on-surface bg-transparent text-center w-12 focus:outline-none"
              placeholder="—"
            />
            <span className="text-[9px] text-outline mt-1">Ernährung</span>
          </div>
          {/* Gesamt */}
          <div className={`rounded-card p-4 flex flex-col items-center shadow-lg ${
            bodsTotal !== null
              ? bodsTotal <= 4 ? "bg-secondary text-on-secondary shadow-secondary/20"
              : bodsTotal <= 8 ? "bg-primary text-on-primary shadow-primary/20"
              : "bg-[#a10012] text-white shadow-[#a10012]/20"
              : "bg-surface-container text-on-surface-variant"
          }`}>
            <span className="text-[10px] font-bold opacity-80 uppercase mb-1">Gesamt</span>
            <span className="text-2xl font-black">{bodsTotal ?? "—"}</span>
            <span className="text-[9px] opacity-70 mt-1">
              {bodsTotal !== null
                ? bodsTotal <= 4 ? "leicht"
                : bodsTotal <= 8 ? "mittel"
                : "schwer"
                : ""}
            </span>
          </div>
        </div>
      </section>

      {/* ---- KI generieren ---- */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-3.5 border-2 border-primary text-primary rounded-card font-headline font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {generating ? (
          <>
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            Wird generiert...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            KI-Beurteilung generieren
          </>
        )}
      </button>

      {genError && (
        <p className="text-sm text-tertiary bg-tertiary-fixed/40 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {genError}
        </p>
      )}

      {/* ---- Zusammenfassende Beurteilung ---- */}
      <section className="space-y-2">
        <label className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">description</span>
          Zusammenfassende Beurteilung
        </label>
        <div className="relative bg-surface-container-highest rounded-card group">
          <textarea
            value={state.beurteilung}
            onChange={(e) => set("beurteilung", e.target.value)}
            onBlur={handleSave}
            rows={6}
            placeholder="KI-generierter Text erscheint hier nach dem Klick auf 'KI-Beurteilung generieren' — oder direkt eingeben…"
            className="w-full bg-transparent p-4 text-sm text-on-surface placeholder:text-outline/60 leading-relaxed focus:outline-none resize-none"
          />
          <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-outline-variant group-focus-within:bg-primary transition-colors rounded-full" />
        </div>
      </section>

      {/* ---- Pathophysiologie ---- */}
      <section className="space-y-2">
        <label className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">psychology</span>
          Pathophysiologie
        </label>
        <div className="relative bg-surface-container-highest rounded-card group">
          <textarea
            value={state.pathophysiologie}
            onChange={(e) => set("pathophysiologie", e.target.value)}
            onBlur={handleSave}
            rows={4}
            placeholder="Pathophysiologische Erklärung (optional — nur wenn klinisch relevant)…"
            className="w-full bg-transparent p-4 text-sm text-on-surface placeholder:text-outline/60 leading-relaxed focus:outline-none resize-none"
          />
          <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-outline-variant group-focus-within:bg-primary transition-colors rounded-full" />
        </div>
      </section>

      {/* ---- Kostformempfehlung ---- */}
      <section className="space-y-3">
        <h3 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
          Kostformempfehlung
        </h3>
        <div className="bg-surface-container-low rounded-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                DYS-Stufe
              </label>
              <select
                value={state.dysLevel}
                onChange={(e) => { set("dysLevel", e.target.value); }}
                onBlur={handleSave}
                className="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— wählen —</option>
                {DYS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                IDDSI Kost
              </label>
              <select
                value={state.iddsiLevel ?? ""}
                onChange={(e) => { set("iddsiLevel", e.target.value !== "" ? Number(e.target.value) : null); }}
                onBlur={handleSave}
                className="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— wählen —</option>
                {IDDSI_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
              Getränke
            </label>
            <select
              value={state.beverageIddsi ?? ""}
              onChange={(e) => { set("beverageIddsi", e.target.value !== "" ? Number(e.target.value) : null); }}
              onBlur={handleSave}
              className="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— wählen —</option>
              {BEVERAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ---- TK-Empfehlung (nur bei Trachealkanüle) ---- */}
      {state.hasTracheostomy && (
        <section className="space-y-3">
          <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">air</span>
            Empfehlung Trachealkanüle
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {TK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const current = state.tracheostomyRec;
                  const has = current.includes(s);
                  set("tracheostomyRec", has ? current.replace(s, "").replace(/\n\n/g, "\n").trim() : current ? current + "\n" + s : s);
                }}
                className={`px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-all ${
                  state.tracheostomyRec.includes(s)
                    ? "bg-primary text-on-primary font-bold"
                    : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={state.tracheostomyRec}
            onChange={(e) => set("tracheostomyRec", e.target.value)}
            onBlur={handleSave}
            rows={3}
            placeholder="Freitext TK-Empfehlung…"
            className="w-full bg-surface-container-highest rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </section>
      )}

      {/* ---- Therapieempfehlungen ---- */}
      <section className="space-y-3">
        <h3 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
          Therapieempfehlungen
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {THERAPY_OPTIONS.map((opt) => {
            const active = state.therapySelected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-4 rounded-card cursor-pointer active:scale-[0.98] transition-all min-h-[56px] ${
                  active ? "bg-primary/10 border border-primary/30" : "bg-surface-container-low"
                }`}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleTherapy(opt)}
                    className="peer appearance-none w-5 h-5 border-2 border-primary rounded-md checked:bg-primary transition-all"
                  />
                  <span
                    className="material-symbols-outlined absolute text-white scale-0 peer-checked:scale-100 transition-transform text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
                <span className="text-sm font-medium text-on-surface leading-tight">{opt}</span>
              </label>
            );
          })}
        </div>
        <textarea
          value={state.therapyNotes}
          onChange={(e) => set("therapyNotes", e.target.value)}
          onBlur={handleSave}
          rows={2}
          placeholder="Weitere Therapieempfehlungen (Freitext)…"
          className="w-full bg-surface-container-highest rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </section>

      {/* Fehler */}
      {saveError && (
        <p className="text-sm text-tertiary bg-tertiary-fixed/40 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {saveError}
        </p>
      )}

      {/* ---- Zwischenspeichern ---- */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-lg">save</span>
        {saving ? "Speichern…" : "Zwischenspeichern"}
      </button>

      {/* ---- Erfolgs-Hinweis nach Download ---- */}
      {downloaded && (
        <div className="bg-secondary-container rounded-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="text-sm font-semibold text-on-secondary-container">
              Bericht wurde heruntergeladen.
            </p>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Sie können den Bericht auch später über das Dashboard erneut herunterladen.
          </p>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 border border-secondary/40 text-secondary rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Zurück zum Dashboard
          </Link>
        </div>
      )}

      {/* Info-Hinweis */}
      <div className="flex items-start gap-3 bg-primary-fixed/30 p-4 rounded-card">
        <span className="material-symbols-outlined text-primary text-xl shrink-0">info</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Patientenname wird nach dem Export im DOCX ergänzt. Sensible Daten werden lokal verarbeitet.
          Der Name oben im Feld wird <strong>nur</strong> für das DOCX verwendet — nicht gespeichert.
        </p>
      </div>

      <ExaminationNav
        examinationId={id}
        patientName={patientName}
        activeStep="export"
      />

      <StickyFooter
        submitLabel="DOCX exportieren"
        submitIcon="file_download"
        loading={downloading}
        onSubmit={handleDownload}
      />
    </div>
  );
}
