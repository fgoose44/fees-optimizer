"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ExaminationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  // Patientenname kommt aus URL-Param (nur Browser, nie DB)
  const [patientName, setPatientName] = useState(
    searchParams.get("patientName") ?? ""
  );
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);

    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examinationId: id, patientName }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Fehler beim Erstellen des Berichts.");
      setDownloading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FEES-Bericht.docx`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          Untersuchung gespeichert
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Klinische Daten wurden gespeichert. Bericht herunterladen:
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient/in (für DOCX — wird nicht gespeichert)
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Name der Patient/in"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-amber-600 mt-1">
            Wird nur in das DOCX eingesetzt, nicht gespeichert.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {downloading ? "Erstelle DOCX …" : "DOCX herunterladen"}
        </button>
      </div>
    </div>
  );
}
