import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-[12px]">
        <Link href="/" className="font-headline font-bold text-lg tracking-tight text-primary">
          FEES Optimizer
        </Link>
        <Link href="/login" className="font-body text-sm font-medium text-primary hover:text-primary-container transition-colors">
          Anmelden →
        </Link>
      </nav>

      <main className="pt-36 pb-24 px-6 max-w-2xl mx-auto">
        <Link href="/" className="font-body inline-flex items-center gap-2 text-sm text-primary hover:text-primary-container transition-colors mb-10">
          ← Zurück
        </Link>
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-8">
          Impressum
        </h1>
        <div className="bg-surface-container-lowest rounded-card p-8 shadow-[0_4px_24px_rgba(25,28,29,0.06)]">
          <p className="font-body text-on-surface-variant text-sm leading-relaxed">
            Diese Seite ist im Aufbau. Das vollständige Impressum wird nach
            Abschluss des Testbetriebs ergänzt.
          </p>
        </div>
      </main>
    </div>
  );
}
