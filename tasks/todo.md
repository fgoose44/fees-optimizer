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

## Offen — Backlog

- [ ] Stammdaten editierbar für gespeicherte Untersuchungen (aktuell nur read-only)
- [ ] Passwort-Änderung für User (/account Seite erweitern)

---
_Zuletzt aktualisiert: 2026-04-04 — Phase 8 abgeschlossen_
