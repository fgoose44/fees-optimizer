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

      const { data: examData } = await supabase
        .from("examinations")
        .select("id, examination_date, status, medical_diagnosis, assessment_text")
        .order("examination_date", { ascending: false });

      if (!examData) { setLoading(false); return; }

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
      day: "2-digit", month: "long", year: "numeric",
    });

  const statusLabel = (s: string) =>
    s === "erstdiagnostik" ? "Erstdiagnostik" : "Verlaufsdiagnostik";

  // Stats
  const totalExams = exams.length;
  const thisWeek = exams.filter((e) => {
    const d = new Date(e.examination_date);
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return (
    <div className="px-4 py-6 pb-24 space-y-8">
      {/* Welcome Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-[28px] font-headline font-extrabold tracking-tight text-on-surface">
            Willkommen zurück
          </h1>
          {userEmail && (
            <p className="text-on-surface-variant font-medium text-sm mt-0.5">{userEmail}</p>
          )}
        </div>
        <Link
          href="/examination/new"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-headline font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Neue FEES-Dokumentation
        </Link>
      </header>

      {/* Untersuchungs-Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-on-surface-variant text-sm">Lade Untersuchungen …</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant">folder_open</span>
          <p className="text-on-surface-variant text-sm">
            Noch keine Untersuchungen. Starte jetzt die erste FEES-Dokumentation.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
            Letzte Untersuchungen
          </p>

          {exams.map((exam) => {
            const done = !!(exam.assessment_text && exam.assessment_text.length > 10);
            const diagDisplay = exam.medical_diagnosis
              ? exam.medical_diagnosis.length > 60
                ? exam.medical_diagnosis.slice(0, 57) + "…"
                : exam.medical_diagnosis
              : "Keine Diagnose eingetragen";

            return (
              <div
                key={exam.id}
                className="bg-surface-container-lowest rounded-card relative overflow-hidden flex flex-col transition-transform hover:-translate-y-px"
              >
                {/* Linker Accent-Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    done ? "bg-secondary" : "bg-primary"
                  }`}
                />

                <div className="pl-5 pr-4 pt-4 pb-3 flex-grow">
                  {/* Kopfzeile */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-outline mb-1 font-label">
                        {formatDate(exam.examination_date)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-block px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold rounded-full"
                        >
                          {statusLabel(exam.status)}
                        </span>
                      </div>
                    </div>
                    {/* Status-Badge */}
                    <span
                      className={`flex-none text-[10px] font-bold px-3 py-1 rounded-full ${
                        done
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-primary-fixed text-on-primary-fixed-variant"
                      }`}
                    >
                      {done ? "ABGESCHLOSSEN" : "IN BEARBEITUNG"}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface-variant line-clamp-1 mb-4">
                    {diagDisplay}
                  </p>
                </div>

                {/* Action-Footer */}
                <div className="px-5 py-3 bg-surface-container-low flex justify-between items-center">
                  <Link
                    href={nextStep(exam)}
                    className="flex items-center gap-1 text-primary font-bold text-sm hover:underline active:scale-95"
                  >
                    {done ? "Ansehen" : "Fortsetzen"}
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(exam.id)}
                      disabled={downloadingId === exam.id}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                      title="DOCX herunterladen"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {downloadingId === exam.id ? "hourglass_empty" : "download"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(exam.id)}
                      disabled={deletingId === exam.id}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-tertiary-fixed/30 text-tertiary hover:bg-tertiary/10 transition-colors disabled:opacity-50"
                      title="Löschen"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {deletingId === exam.id ? "hourglass_empty" : "delete"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Stats-Bento */}
      {!loading && totalExams > 0 && (
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-card flex flex-col justify-between h-32">
            <span className="material-symbols-outlined text-secondary text-[28px]">clinical_notes</span>
            <div>
              <div className="text-2xl font-headline font-extrabold text-on-surface">{thisWeek}</div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Diese Woche
              </div>
            </div>
          </div>
          <div className="bg-primary-fixed p-4 rounded-card flex flex-col justify-between h-32">
            <span className="material-symbols-outlined text-primary text-[28px]">history</span>
            <div>
              <div className="text-2xl font-headline font-extrabold text-primary">{totalExams}</div>
              <div className="text-[10px] font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                Gesamt
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
