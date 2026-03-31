import { redirect } from "next/navigation";

// Direkt zu Schritt 2 weiterleiten — patientName bleibt im Query
export default async function ExaminationIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ patientName?: string }>;
}) {
  const { id } = await params;
  const { patientName } = await searchParams;
  const qs = patientName ? `?patientName=${encodeURIComponent(patientName)}` : "";
  redirect(`/examination/${id}/befund${qs}`);
}
