"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ExamRow {
  id: string;
  examination_date: string;
  status: string;
  medical_diagnosis: string | null;
  assessment_text: string | null;
  has_nativbefund: boolean;
  has_schlucktest: boolean;
}

function nextStep(row: ExamRow): string {
  if (!row.has_nativbefund) return `/examination/${row.id}/befund`;
  if (!row.has_schlucktest) return `/examination/${row.id}/schlucktest`;
  return `/examination/${row.id}/export`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email ?? "");

      // Untersuchungen laden
      const { data: examData } = await supabase
        .from("examinations")
        .select("id, examination_date, status, medical_diagnosis, assessment_text")
        .order("examination_date", { ascending: false });

      if (!examData) { setLoading(false); return; }

      // Prüfen welche Befunde + Schlucktests vorhanden sind
      const ids = examData.map((e) => e.id);

      const [nativRes, swallowRes] = await Promise.all([
        supabase.from("native_findings").select("examination_id").in("examination_id", ids),
        supabase
          .from("swallow_tests")
          .select("examination_id")
          .in("examination_id", ids)
          .eq("not_tested", false),
      ]);

      const nativSet = new Set((nativRes.data ?? []).map((r) => r.examination_id));
      const swallowSet = new Set((swallowRes.data ?? []).map((r) => r.examination_id));

      setExams(
        examData.map((e) => ({
          ...e,
          has_nativbefund: nativSet.has(e.id),
          has_schlucktest: swallowSet.has(e.id),
        }))
      );
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm("Untersuchung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    setDeletingId(id);
    const supabase = createClient();
    // Kinder zuerst löschen (falls kein CASCADE konfiguriert)
    await supabase.from("swallow_tests").delete().eq("examination_id", id);
    await supabase.from("native_findings").delete().eq("examination_id", id);
    await supabase.from("examinations").delete().eq("id", id);
    setExams((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examinationId: id }),
      });
      if (!res.ok) throw new Error("Download fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FEES-Bericht.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("DOCX-Download fehlgeschlagen.");
    }
    setDownloadingId(null);
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

  const statusLabel = (s: string) =>
    s === "erstdiagnostik" ? "Erstdiagnostik" : "Verlaufsdiagnostik";

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div>
        <h1 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
          FEES Dokumentation
        </h1>
        {userEmail && (
          <p className="text-sm text-on-surface-variant mt-0.5">{userEmail}</p>
        )}
      </div>

      {/* Neue Untersuchung */}
      <Link
        href="/examination/new"
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-headline font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined text-xl">add_circle</span>
        Neue FEES-Dokumentation
      </Link>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-on-surface-variant text-sm">Lade Untersuchungen …</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant">
            folder_open
          </span>
          <p className="text-on-surface-variant text-sm">
            Noch keine Untersuchungen. Starte jetzt deine erste FEES-Dokumentation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
            Bisherige Untersuchungen ({exams.length})
          </p>
          {exams.map((exam) => {
            const done = !!(exam.assessment_text && exam.assessment_text.length > 10);
            const diagDisplay = exam.medical_diagnosis
              ? exam.medical_diagnosis.length > 45
                ? exam.medical_diagnosis.slice(0, 42) + "…"
                : exam.medical_diagnosis
              : "Keine Diagnose eingetragen";

            return (
              <div
                key={exam.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3"
              >
                {/* Kopfzeile */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline font-bold text-base text-on-surface">
                        {formatDate(exam.examination_date)}
                      </span>
                      <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                        {statusLabel(exam.status)}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-0.5 truncate">
                      {diagDisplay}
                    </p>
                  </div>
                  {/* Status-Badge */}
                  <span
                    className={`flex-none text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      done
                        ? "bg-secondary-container text-secondary"
                        : "bg-primary-fixed text-primary"
                    }`}
                  >
                    {done ? "Abgeschlossen" : "In Bearbeitung"}
                  </span>
                </div>

                {/* Aktionen */}
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={nextStep(exam)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {done ? "visibility" : "edit_note"}
                    </span>
                    {done ? "Ansehen" : "Fortsetzen"}
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDownload(exam.id)}
                    disabled={downloadingId === exam.id}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-container-high text-on-surface rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      {downloadingId === exam.id ? "hourglass_empty" : "download"}
                    </span>
                    DOCX
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-tertiary-fixed/30 text-tertiary rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      {deletingId === exam.id ? "hourglass_empty" : "delete"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
