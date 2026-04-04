"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, title")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setTitle(profile.title ?? "");
      }
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Nicht angemeldet."); setSaving(false); return; }

    const { error: dbError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, first_name: firstName.trim() || null, last_name: lastName.trim() || null, title: title.trim() || null, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (dbError) {
      setError("Fehler beim Speichern: " + dbError.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="px-4 pt-6 pb-16 space-y-6 max-w-[600px] mx-auto">

      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-full hover:bg-surface-container transition-colors"
          title="Zurück zum Dashboard"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-[20px] font-headline font-extrabold text-primary tracking-tight">
            Profil
          </h1>
          <p className="text-on-surface-variant text-sm">{email}</p>
        </div>
      </header>

      {/* Formular */}
      <div className="bg-surface-container-low rounded-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
          Anzeigename
        </h2>
        <p className="text-xs text-on-surface-variant -mt-2">
          Wird im Dashboard neben Untersuchungen angezeigt.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface-variant">Vorname</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="z.B. Clara"
              className="w-full bg-surface-container-highest border border-[#e5e7eb] focus:border-primary focus:outline-none px-3 py-2.5 text-sm rounded-lg text-on-surface placeholder:text-outline/60 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface-variant">Nachname</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="z.B. Müller"
              className="w-full bg-surface-container-highest border border-[#e5e7eb] focus:border-primary focus:outline-none px-3 py-2.5 text-sm rounded-lg text-on-surface placeholder:text-outline/60 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface-variant">Titel / Funktion</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Logopädin B.Sc., fachliche Leitung"
              className="w-full bg-surface-container-highest border border-[#e5e7eb] focus:border-primary focus:outline-none px-3 py-2.5 text-sm rounded-lg text-on-surface placeholder:text-outline/60 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#a10012] bg-[#a10012]/5 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </p>
        )}

        {saved && (
          <p className="text-sm text-[#006e1c] bg-[#006e1c]/10 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Profil gespeichert.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </div>

    </div>
  );
}
