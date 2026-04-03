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
  patient_nr: number | null;
  user_id: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

function nextStep(row: ExamRow): string {
  if (!row.has_nativbefund) return `/examination/${row.id}/befund`;
  if (!row.has_schlucktest) return `/examination/${row.id}/schlucktest`;
  return `/examination/${row.id}/export`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: examData } = await supabase
        .from("examinations")
        .select("id, examination_date, status, medical_diagnosis, assessment_text, user_id, patient_nr")
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

      const rows = examData.map((e) => ({
        ...e,
        patient_nr: e.patient_nr ?? null,
        has_nativbefund: nativSet.has(e.id),
        has_schlucktest: swallowSet.has(e.id),
      }));
      setExams(rows);

      // Profile für Logopäden-Namen laden
      const userIds = [...new Set(rows.map((e) => e.user_id))];
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      if (profileData) {
        const map: Record<string, Profile> = {};
        profileData.forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      }

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
    <div className="px-4 py-5 pb-10 space-y-5 max-w-[800px] mx-auto">

      {/* Welcome Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-headline font-extrabold tracking-tight text-on-surface">
            Willkommen zurück
          </h1>
          <Link href="/account" className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-sm">manage_accounts</span>
            Profil bearbeiten
          </Link>
        </div>
        <Link
          href="/examination/new"
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-md shadow-primary/20 active:scale-95 transition-all whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Neue FEES
        </Link>
      </header>

      {/* Stats-Bento — ÜBER der Liste */}
      {!loading && totalExams > 0 && (
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low p-3.5 rounded-card flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[24px]">clinical_notes</span>
            <div>
              <div className="text-xl font-headline font-extrabold text-on-surface leading-none">{thisWeek}</div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                Diese Woche
              </div>
            </div>
          </div>
          <div className="bg-primary-fixed p-3.5 rounded-card flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">history</span>
            <div>
              <div className="text-xl font-headline font-extrabold text-primary leading-none">{totalExams}</div>
              <div className="text-[10px] font-bold text-on-primary-fixed-variant uppercase tracking-wider mt-0.5">
                Gesamt
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Untersuchungs-Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-on-surface-variant text-sm">Lade Untersuchungen …</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant">folder_open</span>
          <p className="text-on-surface-variant text-sm">
            Noch keine Untersuchungen. Starte jetzt die erste FEES-Dokumentation.
          </p>
        </div>
      ) : (
        <section className="space-y-2.5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
            Letzte Untersuchungen
          </p>

          {exams.map((exam) => {
            const done = !!(exam.assessment_text && exam.assessment_text.length > 10);
            const diagDisplay = exam.medical_diagnosis
              ? exam.medical_diagnosis.length > 55
                ? exam.medical_diagnosis.slice(0, 52) + "…"
                : exam.medical_diagnosis
              : "Keine Diagnose eingetragen";
            const profile = profiles[exam.user_id];
            const creatorName = profile?.first_name
              ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
              : null;
            const nrLabel = exam.patient_nr != null
              ? `#${String(exam.patient_nr).padStart(3, "0")}`
              : null;

            return (
              <div
                key={exam.id}
                className="bg-surface-container-lowest rounded-card relative overflow-hidden"
              >
                {/* Linker Accent-Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    done ? "bg-[#006e1c]" : "bg-primary"
                  }`}
                />

                <div className="pl-5 pr-3 py-2.5">
                  {/* Zeile 1: Nr + Datum + Status + Aktionen */}
                  <div className="flex items-center gap-2 mb-1">
                    {nrLabel && (
                      <span className="text-[11px] font-extrabold text-primary font-label">
                        {nrLabel}
                      </span>
                    )}
                    <p className="text-[11px] font-bold uppercase tracking-widest text-outline font-label">
                      {formatDate(exam.examination_date)}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded-full">
                      {statusLabel(exam.status)}
                    </span>

                    {/* Aktionen — rechts bündig */}
                    <div className="ml-auto flex items-center gap-1">
                      <Link
                        href={nextStep(exam)}
                        className="flex items-center gap-0.5 text-primary font-bold text-xs px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        {done ? "Ansehen" : "Fortsetzen"}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownload(exam.id)}
                        disabled={downloadingId === exam.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors disabled:opacity-50"
                        title="DOCX herunterladen"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {downloadingId === exam.id ? "hourglass_empty" : "download"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exam.id)}
                        disabled={deletingId === exam.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-[#a10012] hover:bg-[#a10012]/5 transition-colors disabled:opacity-50"
                        title="Löschen"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {deletingId === exam.id ? "hourglass_empty" : "delete"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Zeile 2: Diagnose + Ersteller + Badge */}
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-on-surface-variant truncate flex-1">
                      {diagDisplay}
                    </p>
                    {creatorName && (
                      <span className="flex-none text-[10px] text-outline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {creatorName}
                      </span>
                    )}
                    <span
                      className={`flex-none text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        done
                          ? "bg-[#006e1c]/10 text-[#006e1c]"
                          : "bg-primary-fixed text-on-primary-fixed-variant"
                      }`}
                    >
                      {done ? "ABGESCHLOSSEN" : "IN BEARBEITUNG"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
