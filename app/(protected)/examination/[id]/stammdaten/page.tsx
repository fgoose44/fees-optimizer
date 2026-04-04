"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ExaminationNav from "@/components/ExaminationNav";
import PatientBanner from "@/components/PatientBanner";
import { RASS_OPTIONS } from "@/lib/constants";

export default function StammdatenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const patientName = searchParams.get("patientName") ?? "";

  const [patientNr, setPatientNr] = useState<number | null>(null);
  const [exam, setExam] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("examinations")
        .select("patient_nr, examination_date, status, rass_score, communication, has_tracheostomy, cannula_type, cuff_status, speaking_valve, procedure_description, medical_diagnosis, dysphagia_question, medical_history")
        .eq("id", id)
        .single();
      if (data) {
        setExam(data);
        setPatientNr(data.patient_nr as number ?? null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  const rassLabel = RASS_OPTIONS.find((o) => o.value === exam?.rass_score)?.label ?? String(exam?.rass_score ?? "");
  const dateFormatted = exam?.examination_date
    ? new Date(exam.examination_date as string).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  return (
    <div className="px-4 pt-6 pb-32 space-y-6">
      <PatientBanner
        patientNr={patientNr}
        patientName={patientName}
        stepLabel="Stammdaten"
        badgeClass="bg-secondary-container text-on-secondary-container"
      />

      <header className="space-y-1">
        <h2 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
          Stammdaten
        </h2>
        <p className="text-on-surface-variant text-[14px] font-medium">
          Gespeicherte Angaben — Bearbeitung über Dashboard geplant
        </p>
      </header>

      <div className="bg-white rounded-card p-5 space-y-3">
        {[
          ["Datum", dateFormatted],
          ["Status", exam?.status === "erstdiagnostik" ? "Erstdiagnostik" : "Verlaufsdiagnostik"],
          ["RASS", rassLabel],
          ["Verständigung", exam?.communication as string || "—"],
          ["Trachealkanüle", exam?.has_tracheostomy ? "Ja" : "Nein"],
          ...(exam?.has_tracheostomy ? [
            ["Kanülentyp", (exam?.cannula_type as string) || "—"],
            ["Cuff-Status", (exam?.cuff_status as string) || "—"],
            ["Sprechventil", (exam?.speaking_valve as string) || "—"],
          ] : []),
          ["Verfahren", exam?.procedure_description as string || "—"],
          ["Diagnose", exam?.medical_diagnosis as string || "—"],
          ["Fragestellung", exam?.dysphagia_question as string || "—"],
          ["Vorerkrankungen", exam?.medical_history as string || "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-3 py-1 border-b border-outline-variant/20 last:border-0">
            <span className="text-sm font-bold text-on-surface-variant w-32 shrink-0">{label}</span>
            <span className="text-sm text-on-surface">{value || "—"}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-on-surface-variant text-center px-4">
        <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
        Patientenname wird nicht gespeichert (Datenschutz).
      </p>

      <ExaminationNav
        examinationId={id}
        patientName={patientName}
        activeStep="stammdaten"
      />
    </div>
  );
}
