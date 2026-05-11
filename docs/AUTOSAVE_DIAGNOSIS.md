# Autosave-Diagnose — Eingabe-Tabs

> Erstellt: 2026-05-07  
> Scope: `/examination/[id]/befund`, `/examination/[id]/schlucktest`, `/examination/[id]/export`  
> Zweck: Basis für Autosave-/UX-Improvement-Planung

---

## Tab 1 — `/befund` (`befund/page.tsx`)

### 1. Form-State-Management

**Wie:** Ein einziger `useState<NativbefundData>` namens `data`.  
`NativbefundData` ist ein flaches Objekt mit 8 verschachtelten `StructureFinding`-Objekten (je `{ selected[], side, notes }`) plus ~15 skalare Felder für Reflexe, Phonation, TK-Befund, Langmore, BODS I.

**Zusätzliche State-Variablen (außerhalb von `data`):**
- `bodsOverride: boolean` — verhindert Auto-Überschreiben des BODS-I-Sliders
- `expandedNotes: StructureKey[]` — UI-Zustand für aufgeklappte Notizfelder
- `hasTracheostomy: boolean` — aus DB geladen, steuert bedingte Blöcke
- `patientNr`, `saving`, `error`, `loadingData`

**Initialisierung:** Modul-level `const initialData: NativbefundData` mit leeren `emptyStructure()`-Objekten und Nullwerten.

**Felder beim Save:** ~41 DB-Spalten in einem UPSERT-Call auf `native_findings`:
- 8 Strukturen × (array + optional side + notes) = bis zu 24 Spalten
- 4 TK-spezifische Spalten + 5 Kanülenlage-Spalten
- 2 Reflex-Spalten, 5 Phonationsspalten
- `langmore_score`, `bods_saliva`, `updated_at`

---

### 2. Save-Mechanismus

**Trigger:** Ausschließlich expliziter Nutzer-Klick auf den `StickyFooter`-Button („Speichern & Weiter"). Kein onBlur, kein Auto-Save.

**Methode:** Direkt Supabase-Client (kein API-Route, kein Server Action):
```
supabase.from("native_findings").upsert(row, { onConflict: "examination_id" })
```

**Atomarität:** Alle ~41 Felder in einem einzigen UPSERT — entweder vollständig gespeichert oder gar nicht.

**Tabellen:** nur `native_findings`

**Nach Save:** `router.refresh()` + `router.push(…/schlucktest)` — die Seite verlässt sich selbst.

---

### 3. Load-Mechanismus

**Trigger:** `useEffect([id])` beim Mount — zwei parallele Queries:
1. `examinations` → `patient_nr`, `has_tracheostomy`
2. `native_findings` → expliziter SELECT von ~41 Spalten (kein `select("*")`)

**Kein bestehender Befund:** `nativ === null` → `setData()` wird nicht aufgerufen, `data` bleibt auf `initialData` (leere Felder). Seite ist sofort beschreibbar.

**Nebenwirkung beim Load:** Wenn `bods_saliva !== null` gespeichert ist, wird `bodsOverride = true` gesetzt. Wenn notes-Felder befüllt sind, werden die entsprechenden Notizblöcke aufgeklappt.

---

### 4. Race Conditions / aktuelle Pattern

**Doppelklick-Schutz:** `saving`-Bool + `disabled={loading}` auf dem StickyFooter-Button. Während ein Save läuft, ist der Button disabled — kein zweiter paralleler Call möglich.

**Tab-Wechsel via ExaminationNav:** Die Navigationsleiste (`ExaminationNav`) enthält direkte `href`-Links (kein onClick-Guard). Wenn der Nutzer über die Nav zu einem anderen Tab wechselt, ohne gespeichert zu haben, **gehen alle ungespeicherten Änderungen verloren.** Kein Browser-Beforeunload-Warning, keine „Ungespeicherte Änderungen"-Sperre.

**Dirty-Tracking:** Nicht vorhanden. Die Seite weiß nicht, ob der State seit dem letzten Load verändert wurde.

**Zwei `useEffect`-Autovorschläge** (Langmore + BODS I) schreiben reaktiv in `data`. Wenn ein Nutzer Chips antippen und dann ohne Save navigiert, verliert er auch diese Autovorschläge.

---

### 5. UX-Indikator

**Vorhanden:** StickyFooter-Button zeigt `"Speichern …"` während `loading=true` (Text-Swap). Fehler werden als rote Fehlerbox unter dem Formular angezeigt.

**Nicht vorhanden:** Kein Erfolgs-Feedback (die Seite navigiert sofort weg). Kein „Nicht gespeichert"-Hinweis wenn State dirty ist. Kein Spinner/Animation am Button selbst (nur Textänderung).

**Guter Platz für „Speichert…"-Anzeige:** Direkt unterhalb des `<header>`-Blocks (Zeile ~399–406), zwischen Titel und erstem TK-Block. Alternativ: dezenter Status-Chip rechts im Header neben „X/Y dokumentiert".

---

---

## Tab 2 — `/schlucktest` (`schlucktest/page.tsx`)

### 1. Form-State-Management

**Wie:** Zwei getrennte State-Objekte:
- `consistencies: ConsistencyMap` — `Record<Consistency, ConsistencyData>`, d.h. 7 Konsistenz-Einträge mit je ~16 Feldern (Arrays, Strings, Nullable)
- `summary: SchlucktestSummary` — flaches Objekt: `overall_assessment`, `overall_sensitivity`, `sensitivity_side`, `bods_nutrition` + 7 Ernährungs-/Kostform-Felder

**Zusätzlich:** `selected: Consistency[]` (ausgewählte Konsistenzen), `view: "selection" | "testing"` (Ansicht), `activeTab: Consistency` (aktuell sichtbare Konsistenz), `bodsOverride: boolean`, `saving`, `error`, `loadingSelection`, `patientNr`

**Initialisierung:** `buildInitialConsistencies()` (Funktion, nicht Const-Referenz — verhindert shared-state-Bug) + `initialSummary` const.

**Felder beim Save:**
- `swallow_tests`: 7 Rows × ~16 Spalten = bis zu 112 Werte
- `examinations`: 11 Summary-Felder (assessment, sensitivity, bods, Kostform)

---

### 2. Save-Mechanismus

**Trigger:** Ausschließlich expliziter Nutzer-Klick auf StickyFooter. Kein onBlur, kein Auto-Save.

**Methode:** Direkt Supabase-Client, **zwei sequenzielle DB-Calls**:
1. `supabase.from("swallow_tests").upsert(rows, { onConflict: "examination_id,consistency" })` — alle 7 Konsistenz-Rows
2. `supabase.from("examinations").update({...})` — 11 Summary-Felder

Wenn der erste Call fehlschlägt, wird der zweite nicht ausgeführt (early return mit Fehler). Umgekehrt gilt: Wenn der zweite Call fehlschlägt, sind swallow_tests bereits geschrieben — **kein Rollback**.

**Tabellen:** `swallow_tests` + `examinations`

**Nach Save:** `router.refresh()` + `router.push(…/export)`

---

### 3. Load-Mechanismus

**Trigger:** `useEffect([id])` beim Mount — zwei Queries:
1. `swallow_tests` → alle Rows für `examination_id`, expliziter SELECT von ~16 Spalten
2. `examinations` → Summary-Felder + Kostform-Felder + `patient_nr`

**Kein bestehender Befund:** `swallowRows.length === 0` → Seite bleibt in View `"selection"` mit leerer Konsistenz-Auswahl. Konsistenz-State bleibt `initialConsistencies`.

**Bestehender Befund:** `tested.length > 0` → View wechselt zu `"testing"`, `activeTab` wird auf erste getestete Konsistenz gesetzt, alle geladenen Konsistenz-Daten werden in den State gemapped. Nicht getestete Konsistenzen (`not_tested=true`) werden ignoriert.

**Besonderheit:** Die Tab-Tabs-Reihenfolge beim Laden entspricht der CONSISTENCIES-Reihenfolge (nicht der Reihenfolge in der DB).

---

### 4. Race Conditions / aktuelle Pattern

**Doppelklick-Schutz:** Identisch zu Befund — `saving`-Bool + `disabled={loading}` auf StickyFooter.

**Tab-Wechsel zwischen Konsistenz-Tabs:** Kein Problem — alle 7 Konsistenz-States sind gleichzeitig im Speicher. `setActiveTab(key)` wechselt nur die Ansicht, Daten bleiben erhalten. Erst beim Save werden alle 7 geschrieben.

**Tab-Wechsel via ExaminationNav:** Gleiche Problematik wie bei Befund — direkte href-Links, kein Guard. Ungespeicherte Konsistenz-Daten gehen verloren.

**View-Wechsel „Auswahl ändern":** Wenn Nutzer auf „Auswahl ändern" klickt, wechselt view → `"selection"`, aber `consistencies`-State bleibt erhalten. Ändert er die Auswahl und startet neu, werden bestehende Konsistenz-Daten im State weiter mitgeführt — auch wenn Konsistenzen abgewählt werden (diese werden beim Save als `not_tested=true` geschrieben, ihr State bleibt aber im Speicher bis Save).

**Zweigeteilter Save (swallow_tests + examinations):** Partial-Success möglich, kein Rollback-Mechanismus.

---

### 5. UX-Indikator

**Vorhanden:** StickyFooter zeigt `"Speichern …"` während `loading`. Fehlerbox bei DB-Fehler.

**Nicht vorhanden:** Kein Erfolgs-Feedback. Kein Dirty-Indicator. Kein Hinweis dass Tab-Wechsel Daten verlieren würde.

**Guter Platz für Status-Anzeige:** Im `<header>`-Block rechts neben dem „Auswahl ändern"-Link, oder als Sub-Zeile unter dem aktiven Konsistenz-Tab-Label (z.B. „● Nicht gespeichert" / „✓ Gespeichert").

---

---

## Tab 3 — `/export` (`export/page.tsx`)

### 1. Form-State-Management

**Wie:** Ein einziger `useState<ExportState>` namens `state`. `ExportState` ist vollständig flach:
- `bodsI`, `bodsII` — Lese-only aus DB (werden im Export angezeigt, aber nicht zurückgeschrieben)
- `beurteilung`, `pathophysiologie` — Freitext aus KI oder manuell
- `tracheostomyRec` — Freitext TK-Empfehlung (nur bei TK)
- `therapySelected: string[]` — Checkbox-Array
- `therapyNotes: string` — Freitext
- `hasTracheostomy: boolean` — aus DB, steuert bedingten TK-Block

**Zusätzlich:** `patientName: string` (nie gespeichert, nur für DOCX-Dateinamen), `generating`, `downloading`, `downloaded`, `saving`, `genError`, `saveError`, `loaded`, `patientNr`

**Initialisierung:** `initialState` const mit Nullwerten.

**Felder beim Save:** 5 Felder in `examinations`:
`assessment_text`, `pathophysiology_text`, `therapy_recommendations`, `therapy_notes`, `tracheostomy_recommendation`

---

### 2. Save-Mechanismus

**Trigger — drei unterschiedliche Trigger:**
1. **Expliziter Klick** auf „Zwischenspeichern"-Button → `handleSave()`
2. **`onBlur`** auf vier Textareas: Beurteilung, Pathophysiologie, TK-Empfehlung, Therapie-Freitext → je `handleSave()`
3. **Implizit vor DOCX-Download** → `handleDownload()` ruft `await handleSave()` zuerst auf

**Methode:** Direkt Supabase-Client:
```
supabase.from("examinations").update({...}).eq("id", id)
```
Kein UPSERT — nur UPDATE. Setzt voraus dass die examination-Row bereits existiert (tut sie immer).

**Tabellen:** nur `examinations` (5 Felder)

**Kein Navigation nach Save** — Seite bleibt offen. Erfolg ist nur durch Fehlerlosigkeit erkennbar.

---

### 3. Load-Mechanismus

**Trigger:** `useEffect([id])` beim Mount — zwei Queries:
1. `examinations` → 7 Felder: `has_tracheostomy`, `bods_nutrition`, `assessment_text`, `pathophysiology_text`, `therapy_recommendations`, `therapy_notes`, `tracheostomy_recommendation`, `patient_nr`
2. `native_findings` → nur `bods_saliva`

**Kein bestehender Befund:** `exam === null` → State bleibt `initialState`. Seite ist beschreibbar (leere Textareas).

**KI-Generierung:** `handleGenerate()` ruft `POST /api/generate-assessment` auf → überschreibt `beurteilung`, `pathophysiologie` im State. Therapieempfehlungen aus dem KI-Response werden gegen `THERAPY_OPTIONS` gematcht — gematchte aktivieren Checkboxen, nicht-gematchte landen in `therapyNotes`.

---

### 4. Race Conditions / aktuelle Pattern

**Doppelklick-Schutz (Button):** `saving`-Bool + `disabled={saving}` auf dem Zwischenspeichern-Button. Greift aber **nicht** für onBlur-triggered Saves.

**onBlur-Race-Condition:** Wenn ein Nutzer zwischen zwei Textareas wechselt (Fokus-Verlust → Fokus-Gewinn), feuern onBlur-Events nacheinander. Jedes feuert einen eigenen `handleSave()`-Call. Weil `saving` bei onBlur nicht gecheckt wird, können **mehrere parallele UPDATE-Requests** aktiv sein. In der Praxis sind die Schreibmengen identisch (5 Felder), aber es gibt keine Garantie über die Reihenfolge der Responses.

**DOCX-Download ruft handleSave() auf:** Wenn der Nutzer während eines laufenden onBlur-Saves auf DOCX klickt, gibt es einen `handleSave()`-Call vom onBlur und einen weiteren von `handleDownload()`. Beide laufen parallel.

**Tab-Wechsel via ExaminationNav:** Anders als bei Befund/Schlucktest ist das Risiko hier geringer, weil `onBlur` beim Verlassen von Textareas feuert. Die Checkboxen (`therapySelected`) und der BODS-Edit jedoch **haben kein onBlur-Save** — Änderungen an Therapie-Checkboxen gehen bei Navigation verloren, wenn nicht manuell gespeichert.

**`patientName`-State:** Wird nie gespeichert (by design, Datenschutz). Geht beim Reload verloren.

---

### 5. UX-Indikator

**Vorhanden:**
- „Zwischenspeichern"-Button zeigt `"Speichern…"` während `saving=true`
- Nach Download: Erfolgs-Banner (grüne Box mit „Bericht wurde heruntergeladen") + Link zurück zum Dashboard
- Fehlerboxen für `genError` und `saveError`

**Nicht vorhanden:** Kein Erfolgs-Toast nach manuellem Zwischenspeichern. Kein visueller Hinweis wenn onBlur-Save läuft. Keine Unterscheidung ob der aktuelle State bereits gespeichert ist.

**Guter Platz für Status-Anzeige:** Direkt neben/unter dem „Zwischenspeichern"-Button — ein kleines `"✓ Gespeichert vor X Sekunden"` nach erfolgreichem Save.

---

---

## Übergreifende Muster — Zusammenfassung

| Merkmal | befund | schlucktest | export |
|---|---|---|---|
| State-Typ | 1 `useState<NativbefundData>` | 2 States: `ConsistencyMap` + `SchlucktestSummary` | 1 `useState<ExportState>` |
| Save-Trigger | Klick | Klick | Klick + onBlur (4 Textareas) + implizit vor Download |
| DB-Calls pro Save | 1 UPSERT | 2 sequenziell (kein Rollback) | 1 UPDATE |
| Tabellen | `native_findings` | `swallow_tests` + `examinations` | `examinations` |
| Felder pro Save | ~41 | ~112 + 11 | 5 |
| Navigate nach Save | Ja (→ schlucktest) | Ja (→ export) | Nein |
| Doppelklick-Schutz | `saving`-Bool | `saving`-Bool | `saving`-Bool (Button); **keiner** für onBlur |
| Tab-Wechsel ohne Save | **Datenverlust** | **Datenverlust** | Teilweise durch onBlur gesichert (Textareas), Checkboxen nicht |
| Dirty-Tracking | Nein | Nein | Nein |
| Erfolgs-Feedback | Nein (navigiert weg) | Nein (navigiert weg) | Nur nach Download |
| Autosave | Nein | Nein | Nein |

---

## Kritische Schwachstellen (nach Priorität)

### P1 — Datenverlust bei Tab-Wechsel (alle drei Tabs)
Die `ExaminationNav`-Komponente enthält reine `href`-Links. Navigiert ein Nutzer über die Nav (z.B. von Schlucktest zurück zu Befund), gehen alle ungespeicherten Änderungen **sofort und lautlos** verloren. Kein Warning, kein Guard, kein autosave.

### P2 — onBlur-Race-Condition im Export-Tab
Mehrere `handleSave()`-Aufrufe können parallel aktiv sein (Fokus-Wechsel zwischen Textareas). Bei identischem Schreibinhalt meist harmlos, aber kein Mutex vorhanden.

### P3 — Partial-Commit im Schlucktest-Tab
Zwei sequenzielle DB-Calls ohne Transaction. Wenn `examinations`-Update fehlschlägt nach erfolgreichem `swallow_tests`-Upsert, sind die Daten inkonsistent (Schlucktests gespeichert, Summary nicht).

### P4 — Kein visuelles Feedback über Speicherstand
Kein Dirty-Indicator, kein „Zuletzt gespeichert"-Timestamp, kein dezenter Auto-Save-Spinner. Nutzer weiß nicht ob der aktuelle State bereits gesichert ist.

### P5 — Therapie-Checkboxen im Export ohne onBlur-Schutz
Die `therapySelected`-Checkboxen haben kein onBlur. Änderungen gehen bei Navigation verloren, wenn nicht manuell gespeichert.

---

*Ende der Diagnose*
