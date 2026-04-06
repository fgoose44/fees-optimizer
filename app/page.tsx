import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ShaderBackground from "@/components/landing/ShaderBackground";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface">

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-[12px]">
        <span className="font-headline font-bold text-lg tracking-tight text-primary">
          FEES Optimizer
        </span>
        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:text-primary-container transition-colors"
        >
          Anmelden →
        </Link>
      </nav>

      {/* ── SECTION 1: HERO ────────────────────────────────────────── */}
      <section className="relative min-h-[600px] overflow-hidden">

        {/* CSS-Fallback (sofort sichtbar, immer auf Mobile) */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed via-primary-fixed-dim to-primary-container/30" />

        {/* ShaderGradient — nur Desktop, lädt async; scale-125 schiebt Kanten hinter overflow:hidden */}
        <div className="absolute inset-0 hidden md:block scale-150">
          <ShaderBackground />
        </div>

        {/* Overlay: Gradient von unten — Text lesbar, Gradient oben sichtbar */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />

        {/* Hero-Content */}
        <div className="relative z-10 pt-36 pb-28 px-6 max-w-4xl mx-auto">
          {/* Overline */}
          <p className="font-label text-xs font-semibold tracking-[0.2em] uppercase text-secondary mb-5">
            Für Logopädinnen in der Schluckdiagnostik
          </p>

          {/* Headline */}
          <h1
            className="font-headline font-bold leading-[1.05] tracking-tight text-on-surface mb-8"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", letterSpacing: "-0.025em" }}
          >
            FEES-Bericht in{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #005280 0%, #106ba3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              10 Minuten
            </span>
            <br />
            statt 2 Stunden.
          </h1>

          {/* Subheadline */}
          <p className="font-body text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-10">
            Strukturierte Eingabe, KI-Beurteilung, fertiger DOCX-Bericht —
            direkt nach der Untersuchung.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 min-h-[48px] rounded-card font-headline font-bold text-sm text-on-primary transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #005280 0%, #106ba3 100%)",
                boxShadow: "0 4px 24px rgba(0, 82, 128, 0.28)",
              }}
            >
              Jetzt kostenlos testen
            </Link>
            <a
              href="#how-it-works"
              className="font-body text-sm font-medium text-primary hover:text-primary-container transition-colors"
            >
              So funktioniert&apos;s ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SCHMERZPUNKT ────────────────────────────────── */}
      <section className="bg-surface-container-low py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-headline font-bold text-on-surface mb-10"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            Kennen Sie das?
          </h2>
          <ul className="space-y-5">
            {[
              "FEES fertig — aber der Bericht dauert noch 2 Stunden.",
              "Video nochmal durchschauen, Stichpunkte abtippen.",
              "Bericht in Word, an Arzt senden, Arzt kopiert in KIS.",
              "90–120 Minuten pro Patient. Jeden Tag.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2L2 10" stroke="#a10012" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-body text-on-surface-variant text-base leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SECTION 3: SO FUNKTIONIERT'S ───────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-headline font-bold text-on-surface mb-16"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            In 3 Schritten zum fertigen Bericht
          </h2>

          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              {
                step: "01",
                title: "Eingeben",
                desc: "Befunde per Tap erfassen",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="16" height="16" rx="3" stroke="#005280" strokeWidth="1.75" />
                    <path d="M7 8h8M7 12h5" stroke="#005280" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M14 14.5l1.5 1.5 3-3" stroke="#006e1c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Prüfen",
                desc: "KI-generierte Beurteilung reviewen",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" stroke="#005280" strokeWidth="1.75" />
                    <path d="M7 11l3 3 5-6" stroke="#006e1c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Exportieren",
                desc: "Fertigen DOCX-Bericht herunterladen",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M6 3h7l5 5v11H6V3z" stroke="#005280" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M13 3v5h5" stroke="#005280" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M11 10v6M8.5 14l2.5 2.5 2.5-2.5" stroke="#005280" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 relative shadow-[0_4px_24px_rgba(25,28,29,0.06)]"
              >
                {/* Ghost step number */}
                <span className="font-headline font-bold text-3xl absolute top-5 right-6 text-outline-variant/40">
                  {item.step}
                </span>
                {/* Icon */}
                <div className="w-11 h-11 rounded-card bg-primary/[0.07] flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-headline font-semibold text-on-surface text-lg mb-1">
                    {item.title}
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-body text-on-surface-variant text-sm text-center italic">
            Von der Untersuchung zum fertigen Arztbrief — ohne das Video nochmal anzuschauen.
          </p>
        </div>
      </section>

      {/* ── SECTION 4: BENEFITS ────────────────────────────────────── */}
      <section className="bg-surface-container-low py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-headline font-bold text-on-surface mb-14"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            Was sich für Sie ändert
          </h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                iconBg: "bg-primary/[0.07]",
                accentBg: "bg-primary",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M3 5h16M3 10h16M3 15h10" stroke="#005280" strokeWidth="1.75" strokeLinecap="round" />
                    <circle cx="17" cy="15" r="3.5" fill="white" stroke="#a10012" strokeWidth="1.5" />
                    <path d="M15.5 15l1 1 2-2" stroke="#a10012" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Kein Video mehr analysieren",
                desc: "Alles wird direkt nach der FEES erfasst, solange die Befunde frisch im Kopf sind.",
              },
              {
                iconBg: "bg-secondary/[0.07]",
                accentBg: "bg-secondary",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M11 3c.5 0 1.5 1 3.5 1.5S18 5 18 7c0 3-3 6-7 9C7 13 4 10 4 7c0-2 1.5-2.5 3.5-3S10.5 3 11 3z" stroke="#006e1c" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M8.5 10.5l2 2 3.5-4" stroke="#006e1c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Beurteilung auf Arztbrief-Niveau",
                desc: "KI generiert den Text — Sie prüfen und korrigieren nur noch.",
              },
              {
                iconBg: "bg-primary/[0.07]",
                accentBg: "bg-primary",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M5 3h9l5 5v11H5V3z" stroke="#005280" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M14 3v5h5" stroke="#005280" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M8 12h6M8 15h4" stroke="#005280" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                title: "Direkt ins KIS kopierbar",
                desc: "DOCX optimal formatiert, fertig zum Einfügen.",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="relative bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 shadow-[0_4px_24px_rgba(25,28,29,0.06)] overflow-hidden"
              >
                {/* 4px vertical accent bar — DESIGN.md: Anatomical Data Cards */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.accentBg}`} />
                <div className={`w-11 h-11 rounded-card flex-shrink-0 flex items-center justify-center ${card.iconBg}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-headline font-semibold text-on-surface mb-2">
                    {card.title}
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: VERTRAUEN ───────────────────────────────────── */}
      <section className="bg-surface py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-5">

            {/* Trust 1: Klinische Expertise */}
            <div className="bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 shadow-[0_4px_24px_rgba(25,28,29,0.06)]">
              <div className="w-11 h-11 rounded-card bg-primary/[0.07] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <circle cx="11" cy="9" r="4" stroke="#005280" strokeWidth="1.75" />
                  <path d="M4 19c0-3 3.134-5 7-5s7 2 7 5" stroke="#005280" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M14 8h2M15 7v2" stroke="#005280" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-on-surface mb-2">
                  Klinische Expertise
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Entwickelt mit klinischer Expertise aus der Schluckdiagnostik.
                  Scoring nach BODS, PAS (Rosenbek), Langmore und IDDSI.
                </p>
              </div>
            </div>

            {/* Trust 2: Datenschutz */}
            <div className="bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 shadow-[0_4px_24px_rgba(25,28,29,0.06)]">
              <div className="w-11 h-11 rounded-card bg-secondary/[0.07] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="5" y="10" width="12" height="9" rx="2" stroke="#006e1c" strokeWidth="1.75" />
                  <path d="M8 10V7a3 3 0 016 0v3" stroke="#006e1c" strokeWidth="1.75" strokeLinecap="round" />
                  <circle cx="11" cy="14.5" r="1.5" fill="#006e1c" />
                </svg>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-on-surface mb-2">
                  Datenschutz by Design
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Keine Patientendaten im System. Name wird erst im fertigen
                  DOCX ergänzt — nie gespeichert.
                </p>
              </div>
            </div>

            {/* Trust 3: Testimonial-Platzhalter */}
            <div className="bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 shadow-[0_4px_24px_rgba(25,28,29,0.06)]">
              <div className="w-11 h-11 rounded-card bg-primary/[0.07] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M4 13c0-3 1.5-5.5 4-7l1 1.5C7.5 8.5 7 10 7 11h3v5H4v-3zM13 13c0-3 1.5-5.5 4-7l1 1.5C16.5 8.5 16 10 16 11h3v5h-6v-3z" fill="#005280" fillOpacity="0.12" stroke="#005280" strokeWidth="1" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                {/* Testimonial — nach Testbetrieb befüllen:
                <blockquote className="font-body text-sm text-on-surface-variant leading-relaxed italic mb-3">
                  "Seit ich das Tool nutze, schaffe ich 3 Berichte in der Zeit,
                  die vorher einer gebraucht hat."
                </blockquote>
                <p className="font-label text-xs font-semibold text-primary">— Clara, Logopädin</p>
                */}
                <h3 className="font-headline font-semibold text-on-surface mb-2">
                  Im Testbetrieb
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Aktuell in der klinischen Erprobung. Erfahrungsberichte
                  erscheinen hier nach dem Testbetrieb.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 6: ABSCHLUSS-CTA ───────────────────────────────── */}
      <section className="bg-surface-container-low py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="font-headline font-bold text-on-surface mb-4"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            Bereit, Ihre FEES-Dokumentation zu beschleunigen?
          </h2>
          <p className="font-body text-sm text-outline mb-10">
            Aktuell im Testbetrieb — kostenlos nutzbar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-10 min-h-[48px] rounded-card font-headline font-bold text-sm text-on-primary transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #005280 0%, #106ba3 100%)",
                boxShadow: "0 4px 32px rgba(0, 82, 128, 0.30)",
              }}
            >
              Jetzt kostenlos testen
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-10 min-h-[48px] rounded-card font-headline font-semibold text-sm text-primary border border-outline-variant hover:bg-primary/5 transition-colors"
            >
              Demo ansehen
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FOOTER ──────────────────────────────────────── */}
      <footer className="bg-surface py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-label text-xs text-outline">
            FEES Optimizer · Klinik-intern
          </p>
          <nav className="flex items-center gap-6">
            <Link href="/impressum" className="font-label text-xs text-outline hover:text-on-surface-variant transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="font-label text-xs text-outline hover:text-on-surface-variant transition-colors">
              Datenschutz
            </Link>
            <a href="mailto:info@example.com" className="font-label text-xs text-outline hover:text-on-surface-variant transition-colors">
              Kontakt
            </a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
