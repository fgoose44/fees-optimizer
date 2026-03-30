import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { RASS_OPTIONS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const body = await req.json();
  const { examinationId, patientName } = body;

  if (!examinationId) {
    return NextResponse.json(
      { error: "examinationId fehlt." },
      { status: 400 }
    );
  }

  // Nur eigene Einträge dank RLS
  const { data: exam, error: dbError } = await supabase
    .from("examinations")
    .select("*")
    .eq("id", examinationId)
    .single();

  if (dbError || !exam) {
    return NextResponse.json(
      { error: "Untersuchung nicht gefunden." },
      { status: 404 }
    );
  }

  const rassLabel =
    RASS_OPTIONS.find((o) => o.value === exam.rass_score)?.label ??
    String(exam.rass_score);

  const dateFormatted = new Date(exam.examination_date).toLocaleDateString(
    "de-DE",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  const statusLabel =
    exam.status === "erstdiagnostik" ? "Erstdiagnostik" : "Verlaufsdiagnostik";

  // patientName kommt vom Client — wird NUR ins DOCX gesetzt, nicht gespeichert
  // Wenn kein Name übergeben: Platzhalter verwenden
  const displayName =
    patientName && patientName.trim() !== ""
      ? patientName.trim()
      : "[Patient/in]";

  const doc = new Document({
    sections: [
      {
        children: [
          // Titel
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "Funktionelle endoskopische (Kontroll-) Untersuchung des Schluckaktes",
                bold: true,
              }),
            ],
          }),

          // Patient
          new Paragraph({
            children: [
              new TextRun({ text: "Patient/in: ", bold: true }),
              new TextRun({ text: displayName }),
            ],
          }),

          emptyLine(),

          // Kopfdaten als Stichpunkte
          sectionHeading("Untersuchungsdaten"),
          bullet(`Status: ${statusLabel}`),
          bullet(`Datum: ${dateFormatted}`),
          bullet(`RASS: ${rassLabel}`),
          ...(exam.communication
            ? [bullet(`Verständigung: ${exam.communication}`)]
            : []),
          bullet(
            `Trachealkanüle: ${exam.has_tracheostomy ? "Ja" : "Nein"}`
          ),
          ...(exam.procedure_description
            ? [bullet(`Verfahren: ${exam.procedure_description}`)]
            : []),
          ...(exam.medical_diagnosis
            ? [bullet(`Medizinische Diagnose: ${exam.medical_diagnosis}`)]
            : []),
          ...(exam.dysphagia_question
            ? [
                bullet(
                  `Dysphagiologische Fragestellung: ${exam.dysphagia_question}`
                ),
              ]
            : []),
          ...(exam.medical_history
            ? [bullet(`Vorerkrankungen / Ausgangslage: ${exam.medical_history}`)]
            : []),

          emptyLine(),

          // Platzhalter für weitere Abschnitte (Phase 2)
          sectionHeading("Nativbefund"),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          emptyLine(),
          sectionHeading("Schlucktests"),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          emptyLine(),
          sectionHeading("Beurteilung"),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          emptyLine(),
          sectionHeading("Therapieempfehlungen"),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          emptyLine(),
          emptyLine(),

          // Abschlussformel
          new Paragraph({
            children: [
              new TextRun({
                text: "Für Folgeuntersuchungen bzw. Rückfragen stehen wir Ihnen zur Verfügung.",
              }),
            ],
          }),

          emptyLine(),

          // Unterschrift-Block
          new Paragraph({
            children: [new TextRun({ text: "Mit freundlichen Grüßen" })],
          }),
          emptyLine(),
          new Paragraph({
            children: [
              new TextRun({
                text: "________________________________",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Logopädin",
                italics: true,
                color: "666666",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="FEES-Bericht.docx"`,
    },
  });
}

// ---- Helfer ----

function emptyLine() {
  return new Paragraph({ children: [new TextRun("")] });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text })],
  });
}
