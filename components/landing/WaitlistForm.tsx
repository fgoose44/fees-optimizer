"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase
      .from("waitlist")
      .insert({ name: name.trim(), title: title.trim(), email: email.trim().toLowerCase() });

    if (!error) {
      setStatus("success");
      return;
    }

    // Supabase gibt bei UNIQUE-Verletzung error.code "23505"
    if (error.code === "23505") {
      setStatus("duplicate");
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-secondary/[0.08] border border-secondary/20 rounded-card px-8 py-7 text-center">
        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="8" stroke="#006e1c" strokeWidth="1.75" />
            <path d="M7 11l3 3 5-6" stroke="#006e1c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-headline font-semibold text-on-surface text-lg mb-1">
          Du bist auf der Warteliste!
        </p>
        <p className="font-body text-sm text-on-surface-variant">
          Wir melden uns, sobald ein Platz frei ist.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-name" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Name
          </label>
          <input
            id="wl-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vorname Nachname"
            className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder-outline border-b-2 border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-title" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Titel / Funktion
          </label>
          <input
            id="wl-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Logopädin, Sprachtherapeut"
            className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder-outline border-b-2 border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="wl-email" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          E-Mail
        </label>
        <input
          id="wl-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@klinik.de"
          className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder-outline border-b-2 border-transparent focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {status === "duplicate" && (
        <p className="font-body text-xs text-tertiary bg-tertiary/[0.06] rounded-lg px-4 py-2.5">
          Diese E-Mail ist bereits registriert.
        </p>
      )}
      {status === "error" && (
        <p className="font-body text-xs text-tertiary bg-tertiary/[0.06] rounded-lg px-4 py-2.5">
          Etwas ist schiefgelaufen. Bitte versuche es nochmal.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center px-8 min-h-[48px] rounded-card font-headline font-bold text-sm text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #005280 0%, #106ba3 100%)",
          boxShadow: "0 4px 24px rgba(0, 82, 128, 0.28)",
        }}
      >
        {status === "loading" ? "Wird gespeichert…" : "Platz sichern"}
      </button>
    </form>
  );
}
