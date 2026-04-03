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

## Phase 6 — Lessons

### DB-Daten beim Öffnen laden (Bug-Fix-Muster)
Alle Examination-Seiten (befund, schlucktest, export) haben jetzt einen useEffect der beim Mount alle relevanten DB-Felder lädt. Bei neuen Seiten immer prüfen ob ein Lade-useEffect benötigt wird.

### profiles-Tabelle: SELECT-Policy für kleines Team
`auth.uid() IS NOT NULL` statt `auth.uid() = id` — erlaubt allen eingeloggten Nutzern alle Profile zu lesen (nötig für Dashboard-Anzeige des Ersteller-Namens). Nur sinnvoll für kleine, geschlossene Teams.

### patient_nr: SERIAL + URL-freier Ansatz
patient_nr wird in jeder Examination-Seite direkt aus `examinations` geladen (kein URL-Param). Nur stammdaten (new/page.tsx) hat noch keinen patient_nr vor dem ersten Speichern → zeigt patientName als Fallback.

## Phase 5 Design-Refresh — Architekturentscheidungen
- **ExaminationNav auf Desktop verstecken**: `lg:hidden` in ExaminationNav — Desktop nutzt Tab-Nav im globalen Header via `usePathname()`
- **StickyFooter + ExaminationNav**: Beide fixed bottom-0. Auf Mobile koexistieren sie (ExaminationNav unter StickyFooter). Kein Konflikt, da ExaminationNav nur auf Mobile sichtbar.
- **PatientName über URL-Params**: Kein State-Management notwendig — `searchParams.get("patientName")` in jedem Schritt. Export-Seite hat editierbares Inline-Input statt PatientBanner.
- **rounded-card Token**: `0.75rem` (12px) als Custom Tailwind-Token für alle Cards und Section-Container — entspricht Stitch 12px Radius.
- **`font-label` Klasse**: Für Section-Header in Befund/Schlucktest verwendet. Sicherstellen dass diese Klasse in tailwind.config.ts definiert ist.
