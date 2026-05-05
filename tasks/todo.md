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

---

## Phase 13 — Clara-Feedback Runde 2 (klinische Korrekturen + KI-Output) 🔜

> **Warte auf OK vor Implementierung.**

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

### TASK 3 — Kostformempfehlung neu strukturieren

**DB-Änderung nötig** — SQL wird vor Ausführung gezeigt.

Aktuelle Struktur: `iddsi_level` (integer, nullable) in `examinations`.
Neue Struktur: `nutrition_mode` + `nutrition_route` + `dys_stufe` + `iddsi_food_level` + `iddsi_drink_level` + `tablets`.

**SQL (zur Bestätigung):**
```sql
ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS nutrition_mode text CHECK (nutrition_mode IN ('npo','adaption','vollkost')),
  ADD COLUMN IF NOT EXISTS nutrition_route text,
  ADD COLUMN IF NOT EXISTS nutrition_notes text,
  ADD COLUMN IF NOT EXISTS dys_stufe text CHECK (dys_stufe IN ('DYS I','DYS IIa','DYS IIb','DYS III')),
  ADD COLUMN IF NOT EXISTS iddsi_food_level integer,
  ADD COLUMN IF NOT EXISTS iddsi_drink_level integer,
  ADD COLUMN IF NOT EXISTS tablets text CHECK (tablets IN ('crushed','normal'));
```
_`iddsi_level` bleibt bestehen (kein breaking change für alte Daten)._

- [ ] T3-A: **SQL zeigen + auf OK warten** ← bereits oben
- [ ] T3-B: DB-Migration ausführen
- [ ] T3-C: `schlucktest/page.tsx` — IDDSI-Sektion ersetzen durch Drei-Wege-Radio (npo / adaption / vollkost) mit bedingten Sub-Feldern
- [ ] T3-D: `lib/fees-prompt.ts` — ExamData-Interface + formatKostform() erweitern
- [ ] T3-E: `app/api/export/docx/route.ts` — Kostform-Block im DOCX anpassen
- [ ] T3-F: `app/api/generate-assessment/route.ts` — Prompt-Payload um nutrition_mode erweitern

---

### TASK 4 — Speichel: Prädeglutitiv ausblenden ✅

**Dateien:** `schlucktest/page.tsx`, `lib/fees-prompt.ts`, `app/api/export/docx/route.ts`

- [x] T4-A: UI: `{activeTab !== "speichel" && ...}` in `schlucktest/page.tsx`
- [x] T4-B: DOCX: `swallowTestToProse()` — Speichel überspringt Prädeglutitiv-Satz
- [x] T4-C: Prompt: `formatConsistency()` — Speichel kein Prädeglutitiv-Block

---

### TASK 5 — Retentionen um 2 Lokalisationen erweitern

**DB-Änderung nötig** — SQL zur Bestätigung:
```sql
ALTER TABLE swallow_tests
  ADD COLUMN IF NOT EXISTS retention_hintere_kommissur text DEFAULT '',
  ADD COLUMN IF NOT EXISTS retention_oesophagussphinkter text DEFAULT '';
```

- [ ] T5-A: **SQL zeigen + auf OK warten** ← bereits oben
- [ ] T5-B: DB-Migration ausführen
- [ ] T5-C: `schlucktest/page.tsx` — 2 neue `<RetentionRow>`-Einträge + State + UPSERT-Felder
- [ ] T5-D: `lib/fees-prompt.ts` — `formatRetentions()` um beide Felder erweitern
- [ ] T5-E: `app/api/export/docx/route.ts` — Retentions-Rendering erweitern

---

### TASK 6 — TK Kanülenlage-Felder

**DB-Änderung nötig** — SQL zur Bestätigung:
```sql
ALTER TABLE native_findings
  ADD COLUMN IF NOT EXISTS cannula_changed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cannula_position_before text CHECK (cannula_position_before IN ('mittig','nicht_mittig')),
  ADD COLUMN IF NOT EXISTS cannula_note_before text,
  ADD COLUMN IF NOT EXISTS cannula_position_after text CHECK (cannula_position_after IN ('mittig','nicht_mittig')),
  ADD COLUMN IF NOT EXISTS cannula_note_after text;
```

- [ ] T6-A: **SQL zeigen + auf OK warten** ← bereits oben
- [ ] T6-B: DB-Migration ausführen
- [ ] T6-C: `befund/page.tsx` — Kanülenlage-Block im TK-Bereich (nur wenn `has_tracheostomy`)
- [ ] T6-D: `lib/fees-prompt.ts` — NativData-Interface + formatNativbefund() erweitern
- [ ] T6-E: `app/api/export/docx/route.ts` — Kanülenlage-Block im transstomatalen Befund

---

### TASK 7 — DOCX Kopfzeile entfernen ✅

**Datei:** `app/api/export/docx/route.ts`

Aktuelle Kopfzeile: `"FEES-Bericht  |  Patient-ID: ${patNr}  |  ${dateFormatted}"`

- [x] T7-A+B: `pageHeader`-Definition + `headers`-Property + `Header`-Import entfernt

---

### TASK 8 — Telefonnummer im User-Profil + DOCX-Footer

**DB-Änderung nötig** — SQL zur Bestätigung:
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text;
```

- [ ] T8-A: **SQL zeigen + auf OK warten** ← bereits oben
- [ ] T8-B: DB-Migration ausführen
- [ ] T8-C: `account/page.tsx` — phone-Feld hinzufügen (load + save + UI)
- [ ] T8-D: `app/api/export/docx/route.ts` — DOCX-Footer-Block am Ende des Dokuments
  - Satz: `"Für Rückfragen stehen wir gerne zur Verfügung."`
  - Name + Rolle + Tel. (Tel.-Zeile nur wenn phone vorhanden)

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

_Zuletzt aktualisiert: 2026-05-05 — Phase 13 geplant (Clara-Feedback Runde 2)_
