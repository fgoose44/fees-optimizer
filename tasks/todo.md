# TODO

## Phase 1 — Setup + Patientenstammdaten + Basis-DOCX

### Schritt 1: Next.js Grundgerüst ✅
- [x] Next.js 15 mit TS + Tailwind + App Router (manuell eingerichtet, `create-next-app` scheitert an Großbuchstaben im Verzeichnisnamen)
- [x] Supabase-Pakete installiert (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] `.env.local` befüllt, `.env.local.example` als Vorlage
- [x] Supabase Client-Hilfsdateien (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [x] Auth-Flow: Login-Seite `/login` + Logout + Middleware-Schutz
- [x] Grundlayout: Header (Logo-Platzhalter + Logout), Smartphone-first

### Schritt 2: Patientenstammdaten-Formular ✅
- [x] Alle 10 Felder (`/examination/new`)
- [x] Patientenname: nur `useState`, kein Persistieren
- [x] RASS-Dropdown: -5 bis +4 mit Richmond-Labels
- [x] TK-Toggle: `has_tracheostomy`
- [x] Speichern → POST an Supabase

### Schritt 3: DB-Schema ✅
- [x] Tabelle `examinations` mit RLS im Supabase SQL Editor ausgeführt
- [x] Kein Patientenname in der DB

### Schritt 4: Basis-DOCX-Export ✅
- [x] `docx` (docx-js) installiert
- [x] API Route `POST /api/export/docx`
- [x] DOCX: Titel, [Patient/in]-Platzhalter, Kopfdaten als Stichpunkte, Abschlussformel
- [x] Login getestet ✅

## Phase 2 — Nächste Schritte (noch nicht gestartet)
- [ ] Nativbefund-Eingabe (Stichpunkte: Anatomie, Sensibilität, Sekretstau etc.)
- [ ] Phonationskontrolle
- [ ] Schlucktests (7 Konsistenzen, PAS, Langmore pro Konsistenz)
- [ ] BODS-Scoring (automatisch berechnet)
- [ ] IDDSI-Empfehlung (Dropdown)
- [ ] KI-Beurteilung via Claude API
- [ ] Vollständiger DOCX-Export (alle Abschnitte)
- [ ] Untersuchungs-Liste / Dashboard

---
_Zuletzt aktualisiert: 2026-03-30_
