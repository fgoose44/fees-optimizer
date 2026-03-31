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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Nicht angemeldet.");
      setSaving(false);
      return;
    }

    // patientName wird NICHT gesendet — nur klinische Daten
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

    // patientName nur im Browser behalten — wird beim DOCX-Download übergeben
    const params = new URLSearchParams({ patientName: form.patientName });
    router.push(`/examination/${data.id}/befund?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">
        Neue Untersuchung
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patientenname — nur lokal */}
        <Field label="Patient/in (nur lokal, wird nicht gespeichert)">
          <input
            type="text"
            value={form.patientName}
            onChange={(e) => set("patientName", e.target.value)}
            placeholder="Name der Patient/in"
            className={inputClass}
          />
          <p className="text-xs text-amber-600 mt-1">
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
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
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
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.status === value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* RASS */}
        <Field label="RASS-Score">
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
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
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
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.hasTracheostomy === value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
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
            className={inputClass}
          />
        </Field>

        {/* Dysphagiologische Fragestellung */}
        <Field label="Dysphagiologische Fragestellung">
          <input
            type="text"
            value={form.dysphagia_question}
            onChange={(e) => set("dysphagia_question", e.target.value)}
            className={inputClass}
          />
        </Field>

        {/* Relevante Vorerkrankungen */}
        <Field label="Relevante Vorerkrankungen / Ausgangslage">
          <textarea
            value={form.medicalHistory}
            onChange={(e) => set("medicalHistory", e.target.value)}
            rows={4}
            className={inputClass + " resize-none"}
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Speichern …" : "Speichern & weiter"}
        </button>
      </form>
    </div>
  );
}

// ---- Hilfskomponenten ----

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
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
      <div className="flex flex-wrap gap-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full px-2 py-1 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
