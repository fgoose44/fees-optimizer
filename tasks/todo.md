# TODO

## Erledigt

### Phase 1 — Setup + Patientenstammdaten + Basis-DOCX ✅
### Phase 2 — Nativbefund + Schlucktests + Scoring ✅
### Phase 3 — KI-Beurteilung + vollständiger DOCX-Export + Design ✅
### Phase 4 — Pre-Clara-Test Bugfixes + UX ✅ (2026-04-01)
### Phase 5 — Design Refresh ✅ (2026-04-02)
### Phase 6 — Bug-Fixes & UX nach User-Testing ✅ (2026-04-03)
### Phase 7 — Clara-Feedback: UI & DB-Anpassungen ✅ (2026-04-04)

Phase 7 umfasste (10 Schritte):
- [1] Stammdaten TK-Felder: Kanülentyp, Cuff-Status, Sprechventil — DB + UI
- [2] Nativbefund Pharynx: Chip „Schwäche" ergänzt
- [3] Schlucktest Prädeglutitiv: „Leaking" entfernt, „Übertritt von Bolusanteilen (Leaking)"
- [4] Schlucktest Kompensation: „Chin-down" ergänzt
- [5] Navigation: „Export" → „Analyse"
- [6] Nativbefund transstomatal: neuer Block (Schleimhäute, Strukturveränderungen, TK-Position) — DB + UI
- [7] Valleculae / Sinus piriformes getrennt: eigene Blöcke mit erweiterter Chip-Liste — DB + UI
- [8] Phonationskontrolle: Stimmlippenbeweglichkeit + Glissando mit „asymmetrisch"-Subfeldern; Glissando → „Konstriktorenkontraktion (Glissando)"
- [9] Langmore: Beschreibungen + Autovorschlag aus Valleculae + Sinus
- [10] BODS I + II: Skala 1–8 (Bartolome & Schröter-Morasch 2006), Stufenbeschreibungen als Legende

### Phase 8 — DOCX-Überarbeitung + Profil-Titel + Navigation-Fix ✅ (2026-04-04)

Phase 8 umfasste (4 Punkte):
- [A] DOCX-Dateiname: `YYMMDD_FEES-Bericht_XXXX.docx` (4-stellige Patient-ID)
- [B] DOCX-Formatierung: Arial durchgehend, Tab-Stop-Zeilen (3500 DXA), 11pt Überschriften, Word-Bullets, Seitenkopf (Patient-ID + Datum, kein Name)
- [C] profiles-Tabelle: `title`-Feld ergänzt — `/account`-Seite mit Eingabe; DOCX-Signatur nutzt Titel italic
- [D] Navigation-Bug behoben: `/stammdaten`-Route war 404 → Seite erstellt; `router.refresh()` vor `router.push()` in handleSave

---

### Phase 9 — Landing Page Überarbeitung (conversion-optimiert) ✅ (2026-04-06)

**Ziel:** `app/page.tsx` durch 7-Section conversion-optimierte Landing Page ersetzen. Branding "FEES Optimizer" überall konsistent.

- [x] [A] `app/page.tsx` komplett neu — 7 Sections (Hero, Schmerzpunkt, So funktioniert's, Benefits, Vertrauen, Abschluss-CTA, Footer)
- [x] [B] Branding "FEES Doku/Dokumentation" → "FEES Optimizer" in layout.tsx, login/page.tsx, page.tsx
- [x] [C] Placeholder-Seiten `/impressum` und `/datenschutz` angelegt
- [x] [D] Middleware: `/impressum` und `/datenschutz` als public pages freigegeben
- [x] [E] Inline SVG-Icons (kein neues Package)

---

### Phase 10 — ShaderGradient Hero-Hintergrund ✅ (2026-04-06)

- [x] [A] Dependencies: `@shadergradient/react three @react-three/fiber` installiert
- [x] [B] `components/landing/ShaderBackgroundInner.tsx` (Client, @ts-nocheck + eslint-disable) + `ShaderBackground.tsx` (dynamic wrapper, ssr:false)
- [x] [C] Hero-Section umgebaut: relative Container, CSS-Fallback, Shader-Layer, Gradient-Overlay, Content z-10
- [x] [D] Mobile: `hidden md:block` — ShaderGradient nur ≥768px, CSS-Fallback immer aktiv
- [x] [E] Kantenfix v1: `scale-150` + inset-[-50%]/200%-Canvas; CSS-Fallback auf primary-fixed-Töne
- [x] [F] Design-System-Audit: 6 Abweichungen korrigiert
- [x] [G] Kantenfix v2 (radikaler): `type="sphere"`, `cDistance=5`, `cameraZoom=10`, `positionX=0`, CSS `scale(1.4)`-Wrapper + `overflow:hidden` → keine Kanten mehr sichtbar
- [x] [H] Build lokal geprüft ✓, deployed

---

### Phase 11 — Landing Page Update + Wartelisten-Formular ✅ (2026-04-06)

- [x] [A] Supabase `waitlist`-Tabelle erstellt (id, name, title, email, created_at); RLS mit INSERT-only für anon
- [x] [B] `components/landing/WaitlistForm.tsx` — Client Component, Supabase INSERT, Success/Duplicate/Error-States inline
- [x] [C] `app/page.tsx` — neuer Content 1:1 aus Copy-Vorgabe, ShaderGradient-Hero unverändert
- [x] [D] Hero-CTAs: "Jetzt kostenlos testen (Beta)" → /login, "Auf die Warteliste setzen" → #waitlist scroll
- [x] [E] Build lokal geprüft ✓

### Phase 12 — Landing Page Feinschliff ✅ (2026-04-06)

- [x] [A] ShaderGradient: Vignette + Gradient-Overlay entfernt — volle Farbintensität bis Kante
- [x] [B] Heading Schmerzpunkt: "Der Schmerz:" entfernt
- [x] [C] Schritt-Nummern: Kontrast erhöht (`text-on-surface-variant/60`)
- [x] [D] "UI" → "Eingabemaske" im Tap-Process-Abschnitt

---

## Offen — Backlog

- [ ] Stammdaten editierbar für gespeicherte Untersuchungen (aktuell nur read-only)
- [ ] Passwort-Änderung für User (/account Seite erweitern)
- [ ] IDDSI-CHECK-Constraint nachholen (Reminder ~3 Tage nach 2026-05-07):
      `SELECT id FROM examinations WHERE iddsi_food_level IS NOT NULL AND iddsi_food_level NOT IN (4, 5, 6);`
      Wenn leer:
      `ALTER TABLE examinations ADD CONSTRAINT iddsi_food_level_check CHECK (iddsi_food_level IS NULL OR iddsi_food_level IN (4, 5, 6));`

---

## Phase 13 — Clara-Feedback Runde 2 (klinische Korrekturen + KI-Output) ✅

### TASK 1 — Langmore Graduierung Wortlaut ✅
**Dateien:** `befund/page.tsx` (LANGMORE_LABELS), `lib/fees-prompt.ts` (formatNativbefund), `app/api/export/docx/route.ts` (LANGMORE_LABELS)

Aktuell:
- Grad 0: `"Keine sichtbaren Sekrete oder nur transiente Bläschen in Valleculae/Sinus"`
- Grad 1: `"Beidseits oder tief gepoolt in Valleculae/Sinus, kein Larynxeingang betroffen"`

Neu:
- Grad 0: `"Normal (feucht)"` — in allen drei Dateien
- Grad 1: `"Ansammlung in Valleculae/Sinus piriformes"` — in allen drei Dateien

Grad 2 + 3: unverändert.

- [x] T1-A: `LANGMORE_LABELS` in `befund/page.tsx` anpassen
- [x] T1-B: `formatNativbefund` in `lib/fees-prompt.ts` anpassen (Inline-Array Grad 0 + 1)
- [x] T1-C: `LANGMORE_LABELS` in `app/api/export/docx/route.ts` anpassen

---

### TASK 2 — BODS II Prüfung + BODS I Fix ✅
**Datei:** `schlucktest/page.tsx` (Legende Zeilen 806–814)

Zu prüfen: Stufenbeschreibungen gegen Bartolome & Schröter-Morasch 2006 Standard.

Gefundene Abweichungen (BEVOR Fix):
- Stufe 3: Aktuell `"mehrere Konsistenzen mit Kompensation"` — korrekt laut Standard: _"Voll oral mit mäßigen Einschränkungen: ggf. Kompensation erforderlich, Nahrungsumstellung"_
- Stufe 4: Aktuell `"nur eine Konsistenz mit oder ohne Kompensation"` — korrekt: _"Voll oral mit gravierenden Einschränkungen: auf eine Konsistenz reduziert"_
- Stufe 5: Aktuell `"Überwiegend oral, ergänzend Sonde/parenteral"` — korrekt: _"Kombinierte Ernährung: vorwiegend oral, jedoch ergänzend enteral/parenteral"_
- Stufe 6: Aktuell `"Partiell oral (>10 TL täglich)"` — korrekt: _"Kombinierte Ernährung: vorwiegend enteral/parenteral, geringe orale Anteile (>10 TL)"_
- Stufe 7: Aktuell `"Geringfügig oral (≤10 TL täglich)"` — korrekt: _"Nahezu ausschließlich enteral/parenteral, minimale orale Anteile (≤10 TL)"_
- Stufe 8: Aktuell `"Ausschließlich Sonde/parenteral"` — korrekt: _"Ausschließlich enteral oder parenteral"_

- [x] T2-A: BODS II bereits korrekt — keine Änderung nötig
- [x] T2-B: BODS I: Stufen 1/2/3/5/6 korrigiert in `befund/page.tsx`

---

### TASK 3 — Kostformempfehlung neu strukturieren ✅

- [x] T3-A+B: DB-Migration: 7 neue Spalten (nutrition_mode, nutrition_route, nutrition_notes, dys_stufe, iddsi_food_level, iddsi_drink_level, tablets) + Altdaten-Migration
- [x] T3-C: `schlucktest/page.tsx` — Drei-Wege-Radio (npo / adaption / vollkost) mit bedingten Sub-Feldern
- [x] T3-D: `lib/fees-prompt.ts` — ExamData-Interface + Kostform-Block im Prompt
- [x] T3-E: `app/api/export/docx/route.ts` — Kostform-Block im DOCX
- [x] T3-F: `app/api/generate-assessment/route.ts` — nutzt select("*"), kein Änderungsbedarf

---

### TASK 4 — Speichel: Prädeglutitiv ausblenden ✅

**Dateien:** `schlucktest/page.tsx`, `lib/fees-prompt.ts`, `app/api/export/docx/route.ts`

- [x] T4-A: UI: `{activeTab !== "speichel" && ...}` in `schlucktest/page.tsx`
- [x] T4-B: DOCX: `swallowTestToProse()` — Speichel überspringt Prädeglutitiv-Satz
- [x] T4-C: Prompt: `formatConsistency()` — Speichel kein Prädeglutitiv-Block

---

### TASK 5 — Retentionen um 2 Lokalisationen erweitern ✅

- [x] T5-A+B: DB-Migration: retention_hintere_kommissur + retention_oesophagussphinkter
- [x] T5-C: `schlucktest/page.tsx` — 2 neue Felder + State + UPSERT
- [x] T5-D: `lib/fees-prompt.ts` — formatRetentions() erweitert
- [x] T5-E: `app/api/export/docx/route.ts` — swallowTestToProse() erweitert

---

### TASK 6 — TK Kanülenlage-Felder ✅

- [x] T6-A+B: DB-Migration: 5 neue Spalten (cannula_changed, cannula_position_before/after, cannula_note_before/after)
- [x] T6-C: `befund/page.tsx` — Toggle "Kanüle gewechselt" + Lage vor/nach mit Freitext (nur bei TK)
- [x] T6-D: `lib/fees-prompt.ts` — NativData + formatNativbefund() mit Kanülenwechsel-Block
- [x] T6-E: `app/api/export/docx/route.ts` — transstomatalRows() mit Kanülenlage-Zeilen

---

### TASK 7 — DOCX Kopfzeile entfernen ✅

**Datei:** `app/api/export/docx/route.ts`

Aktuelle Kopfzeile: `"FEES-Bericht  |  Patient-ID: ${patNr}  |  ${dateFormatted}"`

- [x] T7-A+B: `pageHeader`-Definition + `headers`-Property + `Header`-Import entfernt

---

### TASK 8 — Telefonnummer im User-Profil + DOCX-Footer ✅

- [x] T8-A+B: DB-Migration: profiles.phone (text, nullable)
- [x] T8-C: `account/page.tsx` — Telefon-Feld mit Hinweis "Erscheint im DOCX-Footer"
- [x] T8-D: `app/api/export/docx/route.ts` — Footer: Satz + Name + Titel + Tel. (Tel. nur wenn vorhanden)

---

### TASK 9 — KI-Output: Freitexte verpflichtend einbauen ✅

**Datei:** `lib/fees-prompt.ts`

Aktuell: `kompensation_notes` wird eingebaut (Zeile 182), aber andere Freitextfelder (velum_notes, pharynx_notes, etc.) fehlen im Prompt.

- [x] T9-A: NativData-Interface erweitert (alle notes-Felder + sinus_piriformes)
- [x] T9-B: `formatNativbefund()` — `withNote()` Helfer, Freitexte als [Freitext: ...] Marker eingebettet
- [x] T9-C: Prompt-Anweisung "FREITEXTE — PFLICHT" eingefügt
- [x] T9-D: Route nutzt bereits `select("*")` — kein DB-Change nötig

---

### TASK 10 — KI-Output: Repetitive Formulierungen reduzieren ✅

**Datei:** `lib/fees-prompt.ts`

- [x] T10-A: Stilanweisung "SPRACHLICHE REGELN" mit Satzvariations-Pflicht eingefügt
- [x] T10-B: Strukturreihenfolge im Prompt explizit genannt
- [x] T10-C: `prompts/vorlage_fees_*.txt` existieren (5 Dateien) — Few-Shot-Block bleibt, Anweisung davor geschärft

---

### TASK 11 — KI-Output: Umlaut-Problem diagnostizieren + fixen ✅ (Prompt-Fix)

**Dateien:** `app/api/generate-assessment/route.ts`, `lib/fees-prompt.ts`, `app/api/export/docx/route.ts`

- [x] T11-A: Diagnose: swallow_tests/native_findings haben keine Encoding-Probleme (UTF-8 DB, UTF-8 JSON)
  Wahrscheinlichste Ursache: Claude API schreibt gelegentlich ae/oe/ue statt ä/ö/ü
- [x] T11-B: Fix: Explizite Umlaut-Pflicht-Anweisung im Prompt ("niemals ae/oe/ue/ss schreiben")
- [ ] T11-C: Verifizieren nach nächstem Test-Export (kein Logging nötig, da Ursache auf KI-Seite)

---

_Zuletzt aktualisiert: 2026-05-07 — Phase 13 vollständig implementiert ✅_

---

## Phase 14 — Auto-Save Foundation (Session A) ✅ (2026-05-07)

---

### Datenfluss (Gesamt-Architektur Session A)

```
[User interagiert mit Formular (Chip-Klick, Texteingabe)]
    ↓ setState → neue Objekt-Referenz
[useAutoSave erkennt Änderung via JSON.stringify-Vergleich]
    ↓ debounce 800ms (Reset bei weiterer Änderung)
[saveFn(data, signal) aufgerufen]
    ↓ Supabase-Write (ohne Navigation)
    ↓ Erfolg: status='saved', lastSavedAt=now, isDirty=false
    ↓ Fehler: Retry 1s → 3s → 8s, dann status='error'

[User klickt ExaminationNav-Tab]
    ↓ onBeforeNavigate() = saveNow()
    ↓ saveNow(): laufenden Debounce abbrechen, sofort speichern
    ↓ Erfolg → navigieren
    ↓ Fehler → confirm("Trotzdem navigieren?") → Ja/Nein

[Browser-Tab wird geschlossen / Seite verlassen]
    ↓ beforeunload-Event (nur wenn isDirty=true)
    ↓ Browser zeigt Standard-Warnung
    ↓ saveNow() mit fetch keepalive (best-effort, kein Retry)

[User klickt "DOCX exportieren"]
    ↓ handleSave() (bestehend)
    ↓ DOCX-Download
    ↓ UPDATE examinations SET completion_status='completed' (failure-tolerant)
    ↓ Dashboard: Eintrag wechselt von "In Bearbeitung" zu "Abgeschlossen"
```

---

### TASK A1 — DB: completion_status-Spalte

**SQL (VORSCHAU — noch nicht ausführen):**
```sql
ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS completion_status text DEFAULT 'draft'
  CHECK (completion_status IN ('draft', 'completed'));
```

**Alle bestehenden Rows bekommen automatisch 'draft'** (durch DEFAULT).

**Zur Entscheidung:** Sollen Rows mit vorhandenem `assessment_text` auf
'completed' gesetzt werden? Wird beim OK-Schritt geprüft:
```sql
-- Zählung der potenziell "abgeschlossenen" Einträge:
SELECT COUNT(*) FROM examinations
  WHERE assessment_text IS NOT NULL
    AND LENGTH(assessment_text) > 10;
```
Ergebnis + Rückfrage vor Backfill-Ausführung.

- [x] A1-A: SQL gezeigt + Entscheidung: kein Backfill (alle Rows bleiben 'draft')
- [x] A1-B: OK erhalten
- [x] A1-C: Migration ausgeführt — `status` → `examination_type` RENAME + neue `status`-Spalte (draft/completed)

---

### TASK A2 — Custom Hook `useAutoSave`

**Neue Datei:** `hooks/useAutoSave.ts`

**Interface (exakt wie spezifiziert):**
```typescript
interface UseAutoSaveOptions<T> {
  data: T;
  saveFn: (data: T, signal: AbortSignal) => Promise<void>;
  enabled?: boolean;       // default: true
  debounceMs?: number;     // default: 800
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
interface UseAutoSaveResult {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  saveNow: () => Promise<void>;
  errorMessage: string | null;
}
```

**Interne Mechanik:**
- `useRef<string>` für letzten gespeicherten JSON-String (Vergleichsbasis)
- `useRef<ReturnType<typeof setTimeout>>` für Debounce-Timer
- `useRef<AbortController>` für laufenden Save-Request
- `useRef<boolean>` für `isDirty` (für beforeunload-Listener)
- `useEffect([JSON.stringify(data)])` — Change-Detection
  - Beim ersten Mount (kein vorheriger Ref-Wert): kein Save, nur Ref setzen
  - Danach: Debounce starten / Reset laufenden Debounce
- **Retry-Logik**: 3 Versuche mit [1000, 3000, 8000]ms Backoff
  - `status` bleibt 'saving' während Retries
  - Nach 3. Fehlschlag: `status = 'error'`
- **AbortController**: Neuer Save abbrechet immer den vorherigen
- **beforeunload-Listener**: Hinzufügen wenn `isDirty=true`, entfernen wenn `isDirty=false`
  - `saveNow()` beim beforeunload: einmaliger fetch mit `keepalive: true`-Hint im Payload
    (da fetch selbst kein keepalive-Flag über SDK, wird `saveFn` direkt aufgerufen;
    keepalive-Semantik ist Verantwortung der konsumierenden `saveFn`)
- **`saveNow()`**: Debounce-Timer löschen → AbortController neu → saveFn aufrufen
  - Idempotent: mehrfache Aufrufe sicher
  - Gibt Promise zurück (wichtig für `await saveNow()` im Nav-Guard)
- `enabled=false`: kein Debounce starten, `saveNow()` ist no-op

**Tests:** Kein Test-Framework vorhanden (kein jest/vitest in package.json,
kein `__tests__/`-Ordner). Tests werden übersprungen. Dokumentiert in lessons.md.

- [x] A2-A: `hooks/`-Ordner erstellt
- [x] A2-B: `hooks/useAutoSave.ts` implementiert (debounce 1500ms, retry 1s/3s/8s, AbortController, beforeunload)
- [x] A2-C: Build-Check ✓

---

### TASK A3 — `components/SaveIndicator.tsx`

**Neue Datei:** `components/SaveIndicator.tsx`

**Interface:**
```typescript
interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  errorMessage: string | null;
  onRetry?: () => void;
}
```

**Visuell:**
- `idle`: nichts rendern (return null)
- `saving`: Spinning Icon + "Speichert…" — Farbe: `text-on-surface-variant`
- `saved`: ✓ + "Gespeichert HH:MM" — Farbe: `text-[#006e1c]` (secondary/WNL)
- `error`: ⚠ + Fehlermeldung + "Erneut versuchen"-Button — Farbe: `text-[#a10012]`

**Position/Styling:**
- `sticky top-2` am Seitenanfang, rechtsbündig (`flex justify-end`)
- Hintergrund: `bg-white/90 backdrop-blur-sm` (Glassmorphism-Rule aus DESIGN.md)
- Padding: `px-3 py-1.5`, `rounded-full`, `text-xs`
- `z-40` (unter Nav-Bar, die z-50 hat)
- Kein Fade-Out bei 'saved' — bleibt sichtbar bis nächste Änderung

**Icon:** Material Symbols (`check_circle` / `progress_activity` animate-spin / `warning`)

- [x] A3-A: `components/SaveIndicator.tsx` implementiert (idle/saving/saved/error)
- [x] A3-B: Build-Check ✓

---

### TASK A4 — `ExaminationNav`: Save-Guard

**Geänderte Datei:** `components/ExaminationNav.tsx`

**Neue Props:**
```typescript
interface ExaminationNavProps {
  examinationId: string;
  patientName: string;
  activeStep: Step;
  onBeforeNavigate?: () => Promise<void>;  // NEU
}
```

**Änderung:**
- `<Link href={...}>` → `<button type="button" onClick={handleNavClick(step)}>` für jeden Step
- `handleNavClick(step)`:
  1. Falls `step.key === activeStep`: Klick ignorieren (kein Re-Navigate auf aktueller Seite)
  2. Falls `onBeforeNavigate` gesetzt: `await onBeforeNavigate()`
     - Erfolg → `router.push(step.href(...))`
     - Fehler → `if (confirm("Speichern fehlgeschlagen. Trotzdem navigieren und Änderungen verlieren?"))` → `router.push(step.href(...))`
  3. Falls kein `onBeforeNavigate`: direkt `router.push(step.href(...))`
- Aktiver Step-Tab: `cursor-default` statt `cursor-pointer`, kein onClick-Handler nötig

**Hinweis:** `router.push` für nav (kein `<Link>` mehr) — verliert den nativen Prefetch.
Tradeoff akzeptiert (interne Seiten, Prefetch-Vorteil minimal).

- [x] A4-A: `ExaminationNav.tsx` umgebaut — `<Link>` → `<button>` + `onBeforeNavigate?: () => Promise<boolean>`
- [x] A4-B: Build-Check ✓

---

### TASK A5 — beforeunload-Schutz

**Implementierungsort:** Im `useAutoSave`-Hook selbst (kein separater Task-Code).

Der Hook verwaltet den beforeunload-Listener intern:
- Listener hinzufügen wenn `isDirty = true`
- Listener entfernen wenn `isDirty = false` (nach erfolgreichem Save)
- `cleanup` im `useEffect` entfernt Listener immer beim Unmount

**Event-Handler:**
```typescript
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = ''; // Modern browsers ignore custom messages
  }
};
```

**best-effort-Save beim beforeunload:**
`saveNow()` wird aufgerufen, aber ohne await (kann nicht garantiert abschließen).
`saveFn` des konsumierenden Codes darf kein komplexes Error-Handling haben — wird dokumentiert.

- [x] A5-A: Teil von A2 — beforeunload-Listener im Hook implementiert
- [ ] A5-B: Manuelle Verifizierung in Session B (nach Hook-Integration in Tabs)

---

### TASK A6 — `completion_status` = 'completed' bei DOCX-Download

**Geänderte Datei:** `app/(protected)/examination/[id]/export/page.tsx`

In `handleDownload()`, nach erfolgreichem DOCX-Download:
```typescript
// failure-tolerant: kein await, kein Error-Throw
supabase.from("examinations")
  .update({ completion_status: "completed" })
  .eq("id", id)
  .then(() => {}) // swallow
  .catch(() => {}); // swallow
```

Kein UI-Feedback für diesen Status-Update nötig (Hintergrundaktion).

Dashboard-Download (`dashboard/page.tsx`) ebenfalls updaten:
```typescript
// In handleDownload() nach erfolgreichem blob.click():
supabase.from("examinations")
  .update({ completion_status: "completed" })
  .eq("id", id)
  .then(() => {
    // State lokal updaten damit Badge wechselt ohne Reload
    setExams(prev => prev.map(e => e.id === id ? { ...e, completion_status: "completed" } : e));
  }).catch(() => {});
```

- [x] A6-A: `export/page.tsx` handleDownload erweitert — status='completed' nach Download
- [x] A6-B: `dashboard/page.tsx` handleDownload erweitert — status='completed' + lokaler State-Update
- [x] A6-C: Build-Check ✓

---

### TASK A7 — Dashboard: Draft-vs-Completed-Anzeige

**Geänderte Datei:** `app/(protected)/dashboard/page.tsx`

**DB-Select erweitern:** `completion_status` zu SELECT hinzufügen.

**`ExamRow`-Interface:**
```typescript
completion_status: string | null; // 'draft' | 'completed' | null (Altdaten)
```

**Änderungen:**
1. **Accent-Bar** (aktuell: `done` = hack über `assessment_text`):
   - Neu: `completed = exam.completion_status === 'completed'`
   - `completed` → `bg-[#006e1c]` (grün, unverändert)
   - `draft` / null → `bg-primary` (blau, unverändert)
2. **Badge neben Datum:** Neues Badge nur für Drafts:
   - `draft` / null → `"In Bearbeitung"` Badge: `bg-primary/10 text-primary`
   - `completed` → kein eigenes Badge (Accent-Bar reicht als Signal)
3. **Sortierung:** Drafts ganz oben, innerhalb Drafts nach Datum desc;
   dann Completed nach Datum desc.
   Implementierung: `.sort()` auf geladenen `exams`-Array nach Load.
4. **"Fortsetzen" vs "Ansehen":**
   - Bisher: `done` (assessment_text-Hack)
   - Neu: `completion_status === 'completed'`
5. **Filter-Toggle:** Optional, nur wenn einfach umsetzbar. Wenn Zeitaufwand > 15 Min → weglassen.

**Backlog-Eintrag: Altdaten** — Rows ohne `assessment_text` und ohne `completion_status` bleiben als 'draft'. Korrektes Verhalten.

- [x] A7-A: `ExamRow`-Interface + SELECT erweitert (status: string | null)
- [x] A7-B: Sortierung: Drafts oben, dann Completed
- [x] A7-C: `done`-Flag auf `status === 'completed'` umgestellt (ersetzt assessment_text-Hack)
- [x] A7-D: Build-Check ✓

---

### TASK A8 — IDDSI-CHECK-Constraint Reminder

Bereits eingetragen im Backlog (oben) ✅

---

### Session A — NICHT enthalten (→ Session B)

- Hook in `befund/page.tsx` einbauen (saveFn ohne Navigation)
- Hook in `schlucktest/page.tsx` einbauen (dual-state, zwei Hooks)
- Hook in `export/page.tsx` einbauen (onBlur-Race-Conditions beheben)
- `onBeforeNavigate` in den drei Tabs als `saveNow` verdrahten
- `<SaveIndicator>` in den drei Tab-Layouts einbauen
- StickyFooter-Button-Navigation prüfen (aktuell navigiert er nach Save —
  muss er dann noch speichern oder reicht der Auto-Save?)

---

### Session A — erledigt ✅

### Phase 14 Session B — Hook-Integration in Tabs 🔜

- [ ] B1: `hooks/useAutoSave.ts` in `befund/page.tsx` integrieren — saveFn ohne Navigation, `onBeforeNavigate` verdrahten
- [ ] B2: `hooks/useAutoSave.ts` in `schlucktest/page.tsx` integrieren — dual-state (data + summary), zwei Hooks oder ein kombinierter saveFn
- [ ] B3: `hooks/useAutoSave.ts` in `export/page.tsx` integrieren — onBlur-Race-Conditions beheben
- [ ] B4: `<SaveIndicator>` in Header der drei Tab-Layouts einbauen
- [ ] B5: StickyFooter-Button prüfen — Navigation nach Save noch nötig oder reicht Auto-Save?
- [ ] B6: A5-B Smoke-Test — Tab schließen mit dirty State → beforeunload-Dialog
8. A8 — bereits erledigt ✅

---

_Zuletzt aktualisiert: 2026-05-07 — Phase 14 Session A geplant_
