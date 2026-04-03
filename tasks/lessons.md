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

## Stitch MCP: Screens generieren und anpassen
Der `mcp__stitch__` MCP kann direkt aus Claude Code aufgerufen werden um Screens zu generieren (`generate_screen_from_text`), zu bearbeiten (`edit_screens`) und Design-Systeme anzuwenden (`apply_design_system`). Änderungen im Stitch-Projekt werden als HTML-Export in `design/` gespeichert und dienen als Implementierungsvorlage.

## Stitch-Konsistenz: Design-System zuerst definieren
Bevor Screens generiert werden, Design-System in Stitch anlegen (`create_design_system`) mit den Farben aus `tailwind.config.ts`. Sonst weichen generierte Screens von der implementierten Palette ab und müssen manuell korrigiert werden.

## Claude Code als Design-Tool: konkrete Klassen vorgeben
Bei UI-Änderungen nicht "mach es schöner" schreiben, sondern konkrete Tailwind-Klassen oder Hex-Werte nennen. Beispiel: "Accent-Bar links: `bg-[#006e1c]` für normal, `bg-[#a10012]` für pathologisch". Das verhindert Interpretationsspielraum und unnötige Iterationen.

## Kleine Design-Änderungen: direkt Edit, kein Plan
Für einzelne Farb-, Spacing- oder Text-Korrekturen (< 5 Zeilen) direkt die Datei lesen und per Edit ändern. Kein Plan, kein Agent, kein Todo. Overhead lohnt sich erst ab mehreren zusammenhängenden Änderungen.

## Node.js für npx-basierte MCPs
MCP-Server die `npx` als Command nutzen (z.B. `@anthropic-ai/mcp-server-*`) benötigen Node.js im PATH. Bei macOS-Installationen via nvm: sicherstellen dass `~/.zshrc` den nvm-Pfad setzt und Claude Desktop nach Shell-Login startet, damit `npx` gefunden wird.

## claude_desktop_config.json: MCP-Server eintragen
MCP-Server für Claude Desktop werden in `~/Library/Application Support/Claude/claude_desktop_config.json` unter `mcpServers` eingetragen. Jeder Eintrag braucht `command`, `args` (Array) und ggf. `env`. Nach Änderungen Claude Desktop neu starten. Tabs im Claude Desktop zeigen aktive MCP-Verbindungen.

## Phase 5 Design-Refresh — Architekturentscheidungen
- **ExaminationNav auf Desktop verstecken**: `lg:hidden` in ExaminationNav — Desktop nutzt Tab-Nav im globalen Header via `usePathname()`
- **StickyFooter + ExaminationNav**: Beide fixed bottom-0. Auf Mobile koexistieren sie (ExaminationNav unter StickyFooter). Kein Konflikt, da ExaminationNav nur auf Mobile sichtbar.
- **PatientName über URL-Params**: Kein State-Management notwendig — `searchParams.get("patientName")` in jedem Schritt. Export-Seite hat editierbares Inline-Input statt PatientBanner.
- **rounded-card Token**: `0.75rem` (12px) als Custom Tailwind-Token für alle Cards und Section-Container — entspricht Stitch 12px Radius.
- **`font-label` Klasse**: Für Section-Header in Befund/Schlucktest verwendet. Sicherstellen dass diese Klasse in tailwind.config.ts definiert ist.
