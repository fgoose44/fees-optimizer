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

## Offen — Backlog

- [ ] Stammdaten editierbar für gespeicherte Untersuchungen (aktuell nur read-only)
- [ ] Passwort-Änderung für User (/account Seite erweitern)

---
_Zuletzt aktualisiert: 2026-04-06 — ShaderGradient Kantenfix v2 (type=sphere + scale(1.4)) deployed_
