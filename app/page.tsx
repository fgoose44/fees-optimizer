import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ShaderBackground from "@/components/landing/ShaderBackground";
import WaitlistForm from "@/components/landing/WaitlistForm";

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

        {/* ShaderGradient — nur Desktop, lädt async; 200% Canvas schiebt Kanten weit hinter overflow:hidden */}
        <div className="absolute inset-[-50%] w-[200%] h-[200%] hidden md:block">
          <ShaderBackground />
        </div>

        {/* Hero-Content */}
        <div className="relative z-[1] pt-36 pb-28 px-6 max-w-4xl mx-auto">
          {/* Overline */}
          <p className="font-label text-xs font-semibold tracking-[0.2em] uppercase text-white/80 mb-5">
            FEES Optimizer: Die Zukunft der Schluckdiagnostik
          </p>

          {/* Headline */}
          <h1
            className="font-headline font-bold leading-[1.05] tracking-tight text-white mb-8"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", letterSpacing: "-0.025em" }}
          >
            FEES-Bericht in{" "}
            <span className="text-primary-fixed">
              10 Minuten
            </span>
            <br />
            statt 2 Stunden.
          </h1>

          {/* Subheadline */}
          <p className="font-body text-lg text-white/70 max-w-2xl leading-relaxed mb-10">
            Erstelle professionelle, klinisch fundierte Berichte direkt nach der Untersuchung.
            Nutze die strukturierte Befundung per Tablet und lass unsere spezialisierte KI
            den ersten Entwurf schreiben.
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
              Jetzt kostenlos testen (Beta)
            </Link>
            <a
              href="#waitlist"
              className="inline-flex items-center justify-center px-8 min-h-[48px] rounded-card font-headline font-semibold text-sm text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Auf die Warteliste setzen
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SCHMERZPUNKT ────────────────────────────────── */}
      <section className="bg-surface-container-low py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-headline font-bold text-on-surface mb-4"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            Wenn die Dokumentation<br className="hidden sm:block" /> wertvolle Therapiezeit frisst
          </h2>
          <p className="font-body text-base text-on-surface-variant leading-relaxed mb-10">
            In vielen Kliniken dauert die Nachbereitung einer FEES aktuell
            bis zu <strong className="text-on-surface font-semibold">120 Minuten pro Patient</strong>.
          </p>
          <ul className="space-y-5">
            {[
              {
                label: "Video-Analysen",
                desc: "Aufzeichnungen müssen oft mehrfach gesichtet werden, um Details für den Bericht zu finden.",
              },
              {
                label: "Kognitive Last",
                desc: "Nach mehreren Untersuchungen am Tag wird das präzise Formulieren komplexer Befunde zur Belastung.",
              },
              {
                label: "Manueller Aufwand",
                desc: "Scores wie BODS oder PAS müssen händisch berechnet und Texte mühsam in Word formatiert werden.",
              },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-4">
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2L2 10" stroke="#a10012" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-body text-on-surface-variant text-base leading-relaxed">
                  <strong className="font-semibold text-on-surface">{item.label}:</strong>{" "}
                  {item.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SECTION 3: SO FUNKTIONIERT'S ───────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-headline font-bold text-on-surface mb-3"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            Die Lösung: In 3 Schritten zum fertigen Arztbrief
          </h2>
          <p className="font-body text-base text-on-surface-variant leading-relaxed mb-14 max-w-2xl">
            Der FEES Optimizer wurde für den harten Klinikalltag entwickelt –
            optimiert für die Eingabe direkt am Patientenbett.
          </p>

          <div className="flex flex-col gap-6">

            {/* Schritt 1 */}
            <div className="bg-surface-container-lowest rounded-card p-7 relative shadow-[0_4px_24px_rgba(25,28,29,0.06)] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="pl-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-headline font-bold text-3xl text-on-surface-variant/60">01</span>
                  <h3 className="font-headline font-semibold text-on-surface text-lg">
                    Strukturierte Eingabe{" "}
                    <span className="font-normal text-on-surface-variant text-base">(Der &bdquo;Tap-Process&ldquo;)</span>
                  </h3>
                </div>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
                  Nutze unsere touch-optimierte Maske auf dem Tablet oder Smartphone.
                  Mit nur 1–2 Taps pro Beobachtung hältst du Befunde zu Nativbefund,
                  Phonationskontrolle und Schlucktests fest.
                </p>
                <ul className="space-y-2">
                  {[
                    { label: "Präzision", desc: "Erfasse Parameter wie Leaking, Residuen oder PAS-Scores direkt, während die Eindrücke frisch sind." },
                    { label: "Fokus", desc: "Du verlierst den Patienten nicht aus den Augen, da die Eingabemaske auf minimale Ablenkung ausgelegt ist." },
                  ].map((b) => (
                    <li key={b.label} className="flex items-start gap-2">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-body text-sm text-on-surface-variant leading-relaxed">
                        <strong className="font-semibold text-on-surface">{b.label}:</strong> {b.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Schritt 2 */}
            <div className="bg-surface-container-lowest rounded-card p-7 relative shadow-[0_4px_24px_rgba(25,28,29,0.06)] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
              <div className="pl-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-headline font-bold text-3xl text-on-surface-variant/60">02</span>
                  <h3 className="font-headline font-semibold text-on-surface text-lg">
                    Intelligente Textgenerierung{" "}
                    <span className="font-normal text-on-surface-variant text-base">(KI-Entwurf)</span>
                  </h3>
                </div>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
                  Sobald die Daten erfasst sind, berechnet das System automatisch den
                  BODS-Gesamtscore und fasst PAS-Werte zusammen. Unsere KI, trainiert
                  mit echten FEES-Berichten, erstellt daraus einen fachlich fundierten
                  Entwurf für Beurteilung und Pathophysiologie.
                </p>
                <ul className="space-y-2">
                  {[
                    { label: "Stil", desc: "Der generierte Text orientiert sich an professionellen klinischen Standards." },
                    { label: "Zeitersparnis", desc: "Du beginnst nie wieder bei einem leeren Blatt Papier." },
                  ].map((b) => (
                    <li key={b.label} className="flex items-start gap-2">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="font-body text-sm text-on-surface-variant leading-relaxed">
                        <strong className="font-semibold text-on-surface">{b.label}:</strong> {b.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Schritt 3 */}
            <div className="bg-surface-container-lowest rounded-card p-7 relative shadow-[0_4px_24px_rgba(25,28,29,0.06)] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="pl-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-headline font-bold text-3xl text-on-surface-variant/60">03</span>
                  <h3 className="font-headline font-semibold text-on-surface text-lg">
                    Kontrolle & Export
                  </h3>
                </div>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
                  Überprüfe den Entwurf an einem Desktop-Arbeitsplatz, ergänze bei Bedarf
                  Details und exportiere den Bericht als professionell formatiertes DOCX-Dokument.
                </p>
                <ul className="space-y-2">
                  {[
                    { label: "Flexibilität", desc: "Der Bericht ist sofort bereit für den Ausdruck oder das Kopieren in das KIS." },
                  ].map((b) => (
                    <li key={b.label} className="flex items-start gap-2">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-body text-sm text-on-surface-variant leading-relaxed">
                        <strong className="font-semibold text-on-surface">{b.label}:</strong> {b.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: KLINISCHER MEHRWERT ─────────────────────────── */}
      <section className="bg-surface-container-low py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-headline font-bold text-on-surface mb-14"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
          >
            Der klinische Mehrwert: Mehr als nur Zeitersparnis
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Standardisierung */}
            <div className="relative bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 shadow-[0_4px_24px_rgba(25,28,29,0.06)] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="w-11 h-11 rounded-card bg-primary/[0.07] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="3" y="4" width="5" height="5" rx="1" stroke="#005280" strokeWidth="1.75" />
                  <rect x="3" y="13" width="5" height="5" rx="1" stroke="#005280" strokeWidth="1.75" />
                  <rect x="14" y="4" width="5" height="5" rx="1" stroke="#005280" strokeWidth="1.75" />
                  <rect x="14" y="13" width="5" height="5" rx="1" stroke="#005280" strokeWidth="1.75" />
                  <path d="M8 6.5h6M8 15.5h6" stroke="#005280" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-on-surface mb-2">
                  Standardisierung im Team
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-3">
                  Sorge für eine einheitliche, vergleichbare Berichtsqualität in deinem
                  gesamten Team (2–5 Logopädinnen).
                </p>
                <ul className="space-y-2">
                  {[
                    { label: "Qualitätssicherung", desc: "Unabhängig von der individuellen Erfahrung führen die standardisierten Scoring-Systeme (BODS, PAS, IDDSI) zu konsistenten Ergebnissen." },
                    { label: "Vergleichbarkeit", desc: "Verlaufsdiagnostiken werden durch die einheitliche Struktur deutlich aussagekräftiger für Ärzte und Therapeuten." },
                  ].map((b) => (
                    <li key={b.label} className="flex items-start gap-2">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-body text-sm text-on-surface-variant leading-relaxed">
                        <strong className="font-semibold text-on-surface">{b.label}:</strong> {b.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Privacy by Design */}
            <div className="relative bg-surface-container-lowest rounded-card p-7 flex flex-col gap-4 shadow-[0_4px_24px_rgba(25,28,29,0.06)] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
              <div className="w-11 h-11 rounded-card bg-secondary/[0.07] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="5" y="10" width="12" height="9" rx="2" stroke="#006e1c" strokeWidth="1.75" />
                  <path d="M8 10V7a3 3 0 016 0v3" stroke="#006e1c" strokeWidth="1.75" strokeLinecap="round" />
                  <circle cx="11" cy="14.5" r="1.5" fill="#006e1c" />
                </svg>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-on-surface mb-2">
                  Privacy by Design: 100% Anonymisiert
                </h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-3">
                  Datenschutz ist in der Klinik keine Option, sondern Voraussetzung.
                  Unser System kommt ohne die Speicherung sensibler Patientendaten aus.
                </p>
                <ul className="space-y-2">
                  {[
                    { label: "Keine Patientennamen", desc: "In der Web-App arbeitest du ausschließlich mit anonymisierten Falldaten." },
                    { label: "Keine Video-Speicherung", desc: "Endoskopie-Videos verbleiben auf deinem klinischen System und werden nie zu uns hochgeladen." },
                    { label: "Lokale Zusammenführung", desc: "Die Ergänzung des Patientennamens erfolgt erst nach dem Download in deinem lokalen Word-Dokument." },
                  ].map((b) => (
                    <li key={b.label} className="flex items-start gap-2">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="font-body text-sm text-on-surface-variant leading-relaxed">
                        <strong className="font-semibold text-on-surface">{b.label}:</strong> {b.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: WARTELISTE ──────────────────────────────────── */}
      <section id="waitlist" className="bg-surface py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-headline font-bold text-on-surface mb-3"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.015em" }}
            >
              Bereit für eine effizientere Diagnostik?
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Der FEES Optimizer wird aktuell mit klinischem Feedback stetig weiterentwickelt.
            </p>
          </div>

          <div className="bg-surface-container-low rounded-card p-8 shadow-[0_4px_24px_rgba(25,28,29,0.06)]">
            <WaitlistForm />
          </div>

          <p className="font-body text-xs text-outline text-center mt-5">
            Aktuell in der Erprobung für Rehakliniken und logopädische Fachabteilungen.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-surface py-10 px-6 border-t border-outline-variant/20">
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
