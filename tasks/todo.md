# TODO

## Phase 1 — Setup + Patientenstammdaten + Basis-DOCX ✅

### Schritt 1: Next.js Grundgerüst ✅
- [x] Next.js 15 mit TS + Tailwind + App Router
- [x] Supabase-Pakete installiert
- [x] `.env.local` befüllt, `.env.local.example` als Vorlage
- [x] Supabase Client-Hilfsdateien
- [x] Auth-Flow: Login-Seite `/login` + Logout + Middleware-Schutz
- [x] Grundlayout: Header (Logo-Platzhalter + Logout), Smartphone-first

### Schritt 2: Patientenstammdaten-Formular ✅
- [x] Alle 10 Felder (`/examination/new`)
- [x] Patientenname: nur `useState`, kein Persistieren
- [x] RASS-Dropdown: -5 bis +4 mit Richmond-Labels
- [x] TK-Toggle: `has_tracheostomy`
- [x] Speichern → POST an Supabase

### Schritt 3: DB-Schema Phase 1 ✅
- [x] Tabelle `examinations` mit RLS
- [x] Kein Patientenname in der DB

### Schritt 4: Basis-DOCX-Export ✅
- [x] `docx` (docx-js) installiert
- [x] API Route `POST /api/export/docx`
- [x] DOCX: Titel, [Patient/in]-Platzhalter, Kopfdaten als Stichpunkte

---

## Phase 2 — Nativbefund + Schlucktests + Scoring ✅

### Implementierung abgeschlossen (2026-03-31)
- [x] Tailwind Design-System (Farben, Fonts, borderRadius aus DESIGN.md)
- [x] DB-Schema: `native_findings`, `swallow_tests`, 5 neue Spalten in `examinations`
- [x] Typen: `NativbefundData`, `ConsistencyData`, `ConsistencyMap`, `SchlucktestSummary`
- [x] Routing-Umbau: new → befund → schlucktest → export
- [x] `components/ExaminationNav.tsx` (Bottom NavBar, 4 Steps)
- [x] `lib/bods.ts` (BODS I + II Auto-Vorschlag)
- [x] `app/(protected)/examination/[id]/befund/page.tsx` — Nativbefund mit allen 7 Strukturen, Reflexen, Phonationskontrolle, Langmore, BODS I
- [x] `app/(protected)/examination/[id]/schlucktest/page.tsx` — 7 Konsistenz-Tabs, alle 6 Sektionen pro Konsistenz, Gesamtbeurteilung, Sensibilität, BODS II, IDDSI
- [x] `app/(protected)/examination/[id]/export/page.tsx` — ExaminationNav ergänzt
- [x] Build ✅ (keine TypeScript-Fehler)

---

## Phase 3 — Nächste Schritte
- [ ] KI-Beurteilung via Claude API (Beurteilungstext aus Befunddaten generieren)
- [ ] Vollständiger DOCX-Export (Nativbefund + Schlucktests + Scoring in DOCX)
- [ ] BODS-Logik Feinjustierung mit klinischem Feedback (als TODO markiert in lib/bods.ts)
- [ ] Untersuchungs-Liste / Dashboard
- [ ] Stammdaten-Seite für bereits gespeicherte Untersuchungen editierbar machen
- [ ] Export-Seite Design-Update (auf Design-System angleichen)

---
_Zuletzt aktualisiert: 2026-03-31_
