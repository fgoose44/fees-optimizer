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
