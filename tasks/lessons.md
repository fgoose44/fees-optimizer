# Lessons Learned

## Next.js 15: params als Promise
In Next.js 15 müssen `params` und `searchParams` in Server Components als `Promise<{...}>` deklariert werden:
```ts
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
}
```
Client Components mit `useParams()` / `useSearchParams()` sind nicht betroffen.

## Tailwind mit Design-System-Tokens
Alle custom Farbnamen aus den Stitch-Designs (z.B. `surface-container-low`, `on-surface-variant`) müssen in `tailwind.config.ts` unter `theme.extend.colors` eingetragen sein. Sonst werden die Klassen nicht generiert.

## BODS-Scoring: Auto-Vorschlag immer überschreibbar
BODS I und II sind medizinische Scores. Der Auto-Vorschlag ist nur eine Heuristik — immer ein Range-Slider mit manuellem Override anbieten. Feinjustierung der Berechnungslogik erst nach klinischem Feedback (Clara).

## Kein Patientenname in DB
patientName fließt nur über URL-Query-Parameter durch alle Schritte. Nie in Supabase schreiben.

## UPSERT-Strategie für Befunddaten
`native_findings` hat UNIQUE auf `examination_id` → UPSERT mit `onConflict: 'examination_id'` erlaubt wiederholtes Speichern (Korrekturen möglich).
`swallow_tests` hat UNIQUE auf `(examination_id, consistency)` → UPSERT alle 7 Zeilen auf einmal.

## Material Symbols in Next.js
Google Material Symbols werden über `globals.css` als `@import url(...)` eingebunden, nicht als next/font (kein Variable Font-Support für Icon-Fonts). Die CSS-Variable `font-variation-settings` für `FILL` direkt per inline style setzen wenn nötig.

## ESLint: eslint-disable für nicht konfigurierte Regeln
Wenn man `// eslint-disable-next-line @typescript-eslint/no-explicit-any` schreibt, aber `@typescript-eslint` nicht als Plugin in `.eslintrc.json` registriert ist, bricht der Next.js-Build mit "Definition for rule ... was not found." ab.
Lösung: Entweder `/* eslint-disable */` (file-level, ohne Regelname) nutzen, oder den Kommentar ganz weglassen (wenn die Regel nicht aktiv ist, gibt es auch keinen Lint-Fehler).

## Vorlage-Dateien für Claude-Prompt
Die 5 Vorlage-FEES-Berichte in `prompts/` werden server-seitig zur Laufzeit via `fs.readFileSync` geladen und in den System-Prompt eingebaut. Das funktioniert zuverlässig in Next.js API Routes (Node.js Runtime), NICHT in Edge Runtime.

## Phase 3 DB-SQL-Spalten — Deployment-Reihenfolge
Neue DB-Spalten müssen VOR dem ersten Produktionsaufruf der neuen Export-Seite in Supabase ausgeführt werden. Ohne die neuen Spalten schlagen alle PATCH-Aufrufe lautlos fehl oder werfen Fehler.
