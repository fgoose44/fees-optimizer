import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildAssessmentPrompt } from "@/lib/fees-prompt";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { examinationId } = await req.json();
  if (!examinationId) {
    return NextResponse.json({ error: "examinationId fehlt." }, { status: 400 });
  }

  // ---- Daten laden (kein Patientenname) ----
  const [examResult, nativResult, swallowResult] = await Promise.all([
    supabase.from("examinations").select("*").eq("id", examinationId).single(),
    supabase.from("native_findings").select("*").eq("examination_id", examinationId).maybeSingle(),
    supabase.from("swallow_tests").select("*").eq("examination_id", examinationId),
  ]);

  if (examResult.error || !examResult.data) {
    return NextResponse.json({ error: "Untersuchung nicht gefunden." }, { status: 404 });
  }

  const prompt = buildAssessmentPrompt(
    examResult.data,
    nativResult.data ?? null,
    swallowResult.data ?? []
  );

  // ---- Claude API aufrufen ----
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  let raw: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    raw = (message.content[0] as { type: string; text: string }).text;
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "KI-Generierung fehlgeschlagen. Bitte erneut versuchen." },
      { status: 502 }
    );
  }

  // ---- JSON parsen ----
  let parsed: {
    beurteilung: string;
    pathophysiologie: string;
    kostformempfehlung: string;
    therapieempfehlungen: string[];
  };

  try {
    // JSON aus dem Antworttext extrahieren (robuster gegen Markdown-Wrapper)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kein JSON gefunden");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("JSON parse error, raw:", raw);
    return NextResponse.json(
      { error: "Antwort konnte nicht verarbeitet werden.", raw },
      { status: 500 }
    );
  }

  return NextResponse.json({
    beurteilung: parsed.beurteilung ?? "",
    pathophysiologie: parsed.pathophysiologie ?? "",
    kostformempfehlung: parsed.kostformempfehlung ?? "",
    therapieempfehlungen: Array.isArray(parsed.therapieempfehlungen)
      ? parsed.therapieempfehlungen
      : [],
  });
}
