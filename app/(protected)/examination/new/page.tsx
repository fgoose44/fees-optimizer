"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  RASS_OPTIONS,
  PROCEDURE_SUGGESTIONS,
  COMMUNICATION_SUGGESTIONS,
} from "@/lib/constants";
import type { ExaminationFormData } from "@/lib/types";
import PatientBanner from "@/components/PatientBanner";
import StickyFooter from "@/components/StickyFooter";

const today = new Date().toISOString().split("T")[0];

const initialForm: ExaminationFormData = {
  patientName: "",
  examinationDate: today,
  status: "erstdiagnostik",
  rassScore: 0,
  communication: "",
  hasTracheostomy: false,
  procedureDescription: "",
  medicalDiagnosis: "",
  dysphagia_question: "",
  medicalHistory: "",
};

export default function NewExaminationPage() {
  const [form, setForm] = useState<ExaminationFormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof ExaminationFormData>(
    key: K,
    value: ExaminationFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Nicht angemeldet.");
      setSaving(false);
      return;
    }

    const { error: dbError, data } = await supabase
      .from("examinations")
      .insert({
        user_id: user.id,
        examination_date: form.examinationDate,
        status: form.status,
        rass_score: form.rassScore,
        communication: form.communication,
        has_tracheostomy: form.hasTracheostomy,
        procedure_description: form.procedureDescription,
        medical_diagnosis: form.medicalDiagnosis,
        dysphagia_question: form.dysphagia_question,
        medical_history: form.medicalHistory,
      })
      .select("id")
      .single();

    if (dbError) {
      setError("Fehler beim Speichern: " + dbError.message);
      setSaving(false);
      return;
    }

    const params = new URLSearchParams({ patientName: form.patientName });
    router.push(`/examination/${data.id}/befund?${params.toString()}`);
  }

  return (
    <div className="px-4 pt-6 pb-32 space-y-6">
      {/* Patient-Banner */}
      <PatientBanner
        patientName={form.patientName}
        stepLabel="Stammdaten"
        badgeClass="bg-secondary-container text-on-secondary-container"
      />

      {/* Seiten-Header */}
      <header className="space-y-1">
        <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
          Neue Untersuchung
        </h2>
        <p className="text-on-surface-variant text-[14px] font-medium">
          Stammdaten und klinische Angaben
        </p>
      </header>

      {/* Formular */}
      <div className="space-y-5">

        {/* Patientenname — lokal */}
        <Field label="Patient/in (nur lokal — wird nicht gespeichert)">
          <input
            type="text"
            value={form.patientName}
            onChange={(e) => set("patientName", e.target.value)}
            placeholder="Name der Patient/in"
            className={inputClass}
          />
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">lock</span>
            Wird nicht in der Datenbank gespeichert.
          </p>
        </Field>

        {/* Datum */}
        <Field label="Datum der Untersuchung">
          <input
            type="date"
            value={form.examinationDate}
            onChange={(e) => set("examinationDate", e.target.value)}
            required
            className={inputClass}
          />
        </Field>

        {/* Status */}
        <Field label="Status">
          <div className="flex rounded-xl overflow-hidden bg-surface-container-high p-1 gap-1">
            {(
              [
                ["erstdiagnostik", "Erstdiagnostik"],
                ["verlaufsdiagnostik", "Verlaufsdiagnostik"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => set("status", value)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  form.status === value
                    ? "bg-primary text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* RASS */}
        <Field label="RASS-Score (Richmond Agitation Sedation Scale)">
          <select
            value={form.rassScore}
            onChange={(e) => set("rassScore", Number(e.target.value))}
            className={inputClass}
          >
            {RASS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Verständigung */}
        <Field label="Verständigung">
          <SuggestionInput
            value={form.communication}
            onChange={(v) => set("communication", v)}
            suggestions={COMMUNICATION_SUGGESTIONS}
            placeholder="z.B. Kommunikationsziele können erreicht werden"
          />
        </Field>

        {/* Trachealkanüle */}
        <Field label="Trachealkanüle vorhanden">
          <div className="flex rounded-xl overflow-hidden bg-surface-container-high p-1 gap-1">
            {(
              [
                [false, "Nein"],
                [true, "Ja"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => set("hasTracheostomy", value)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                  form.hasTracheostomy === value
                    ? value
                      ? "bg-tertiary text-on-tertiary font-bold shadow-sm"
                      : "bg-secondary text-on-secondary font-bold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* Angewandtes Verfahren */}
        <Field label="Angewandtes Verfahren">
          <SuggestionInput
            value={form.procedureDescription}
            onChange={(v) => set("procedureDescription", v)}
            suggestions={PROCEDURE_SUGGESTIONS}
            placeholder="z.B. Untersuchung sitzend"
          />
        </Field>

        {/* Medizinische Diagnose */}
        <Field label="Medizinische Diagnose">
          <input
            type="text"
            value={form.medicalDiagnosis}
            onChange={(e) => set("medicalDiagnosis", e.target.value)}
            placeholder="z.B. Z.n. Schlaganfall, Larynxkarzinom…"
            className={inputClass}
          />
        </Field>

        {/* Dysphagiologische Fragestellung */}
        <Field label="Dysphagiologische Fragestellung">
          <input
            type="text"
            value={form.dysphagia_question}
            onChange={(e) => set("dysphagia_question", e.target.value)}
            placeholder="z.B. Aspirationsgefahr bei Flüssigkeiten?"
            className={inputClass}
          />
        </Field>

        {/* Relevante Vorerkrankungen */}
        <Field label="Relevante Vorerkrankungen / Ausgangslage">
          <textarea
            value={form.medicalHistory}
            onChange={(e) => set("medicalHistory", e.target.value)}
            rows={4}
            placeholder="Relevante Vorerkrankungen, Medikamente, bisherige Therapie…"
            className={inputClass + " resize-none"}
          />
        </Field>

        {error && (
          <p className="text-sm text-tertiary bg-tertiary-fixed/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </p>
        )}
      </div>

      {/* StickyFooter */}
      <StickyFooter
        backHref="/dashboard"
        backLabel="← Dashboard"
        submitLabel="Speichern & Weiter"
        loading={saving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// ---- Hilfskomponenten ----

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}

function SuggestionInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="text-xs bg-surface-container text-on-surface-variant rounded-full px-3 py-1.5 min-h-[32px] hover:bg-surface-container-high transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-highest border border-[#e5e7eb] focus:border-primary focus:outline-none px-3 py-2.5 text-sm rounded-lg text-on-surface placeholder:text-outline/60 transition-colors";
