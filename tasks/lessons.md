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
Alle custom Farbnamen (z.B. `surface-container-low`, `on-surface-variant`) müssen in `tailwind.config.ts` unter `theme.extend.colors` eingetragen sein. Sonst werden die Klassen nicht generiert.

## UPSERT-Strategie für Befunddaten
`native_findings` hat UNIQUE auf `examination_id` → UPSERT mit `onConflict: 'examination_id'` erlaubt wiederholtes Speichern (Korrekturen möglich).
`swallow_tests` hat UNIQUE auf `(examination_id, consistency)` → UPSERT alle 7 Zeilen auf einmal.

## Material Symbols in Next.js
Google Material Symbols über `globals.css` als `@import url(...)` einbinden, nicht als next/font (kein Variable Font-Support für Icon-Fonts). `font-variation-settings` für `FILL` direkt per inline style setzen.

## ESLint: eslint-disable für nicht konfigurierte Regeln
`// eslint-disable-next-line @typescript-eslint/no-explicit-any` bricht den Next.js-Build mit "Definition for rule ... was not found." ab, wenn `@typescript-eslint` nicht als Plugin in `.eslintrc.json` registriert ist.
Lösung: `/* eslint-disable */` (file-level, ohne Regelname) nutzen, oder den Kommentar ganz weglassen.

## Vorlage-Dateien für Claude-Prompt (Node.js Runtime)
`fs.readFileSync` in API Routes funktioniert nur in Node.js Runtime, NICHT in Edge Runtime.

## DB-Spalten vor erstem Produktionsaufruf migrieren
Neue DB-Spalten müssen VOR dem ersten Aufruf der neuen Seite in Supabase ausgeführt werden. Ohne sie schlagen PATCH-Aufrufe lautlos fehl oder werfen Fehler.

## DB-Daten beim Öffnen laden
Alle Examination-Seiten (befund, schlucktest, export) laden per useEffect alle relevanten DB-Felder beim Mount. Bei neuen Seiten immer prüfen ob ein Lade-useEffect benötigt wird.

## Supabase RLS: profiles-Tabelle für Team-Reads
`auth.uid() IS NOT NULL` statt `auth.uid() = id` — erlaubt allen eingeloggten Nutzern alle Profile zu lesen. Nur sinnvoll für kleine, geschlossene Teams.

## patient_nr: immer aus DB laden, nie als URL-Param
patient_nr wird in jeder Examination-Seite direkt aus `examinations` geladen. Neue Seiten müssen das ebenfalls tun. Nur `new/page.tsx` hat noch keinen patient_nr vor dem ersten Speichern → zeigt patientName als Fallback.

## BODS I + II: Skala ist 1–8 (Quelle: Bartolome & Schröter-Morasch, 2006)
BODS I (Speichelbewältigung) und BODS II (Ernährungsstatus) sind beide 1–8 Skalen, Gesamtscore 2–16. Stufen 1–3 von BODS I sind nur ohne TK relevant, Stufen 4–8 nur mit TK. Slider-Range in `befund/page.tsx` (BODS I) und `schlucktest/page.tsx` (BODS II) immer `min=1 max=8`.

## Langmore-Autovorschlag: beide Retentions-Blöcke auslesen
`suggestLangmore()` in `befund/page.tsx` liest `valleculae.selected` UND `sinus_piriformes.selected`. Wenn Valleculae und Sinus getrennte Blöcke sind, müssen Änderungen an der Retention-Logik immer beide Blöcke berücksichtigen.

## Bedingte Blöcke: has_tracheostomy aus examinations in befund laden
Die `befund`-Seite lädt `has_tracheostomy` aus der `examinations`-Tabelle, um den transstomatal-Block bedingt anzuzeigen. Neue Seiten, die patientenspezifische Felder brauchen, müssen ähnlich vorgehen.

## DOCX Tab-Stop-Zeilen mit docx-js
Tab-Stop-Zeilen (Label + Wert in zwei Spalten) in docx-js: `tabStops: [{ type: TabStopType.LEFT, position: 3500 }]` im Paragraph, dann `children: [TextRun(label), TextRun({ children: [new Tab()] }), TextRun(value)]`. Position 3500 DXA ≈ 6 cm.

## DOCX-Seitenkopf auf jeder Seite (docx-js)
`Header` aus `docx` importieren. Im `Document`-Konstruktor: `sections: [{ properties: {}, headers: { default: pageHeader }, children: [...] }]`. Der Header muss VOR dem Body-Content als Section-Property gesetzt werden, nicht danach.

## router.refresh() vor router.push() bei Navigation
Nach `handleSave` in Examination-Seiten: `router.refresh()` vor `router.push()` aufrufen, damit Next.js den App-Router-Cache invalidiert und die nächste Seite frische Daten lädt. Ohne `refresh()` kann es passieren, dass beim Zurücknavigieren veraltete (leere) Daten angezeigt werden.

## Fehlende Route als Ursache für Navigations-Bug
Wenn eine Route in `ExaminationNav` verlinkt wird (z.B. `/stammdaten`), aber keine `page.tsx` existiert, führt das zu einem 404 und kann den App-Router-Cache korrumpieren. Neue Nav-Links immer sofort mit einer Seite hinterlegen.

## MCP-Setup: Stitch + Claude Desktop
MCP-Server in `~/Library/Application Support/Claude/claude_desktop_config.json` unter `mcpServers` eintragen (`command`, `args`, ggf. `env`). npx-basierte MCPs brauchen Node.js im PATH — bei nvm: sicherstellen dass `~/.zshrc` den nvm-Pfad setzt und Claude Desktop nach Shell-Login startet. Stitch MCP: Design-System vor Screen-Generierung anlegen (`create_design_system`), damit Farben mit `tailwind.config.ts` übereinstimmen.
