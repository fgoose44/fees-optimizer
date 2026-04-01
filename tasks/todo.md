# TODO

## Phase 1 — Setup + Patientenstammdaten + Basis-DOCX ✅
## Phase 2 — Nativbefund + Schlucktests + Scoring ✅
## Phase 3 — KI-Beurteilung + vollständiger DOCX-Export + Design ✅

---

## Phase 3 — Abgeschlossen (2026-04-01)

### Erledigte Tasks
- [x] ANTHROPIC_API_KEY in .env.local eingetragen
- [x] @anthropic-ai/sdk installiert
- [x] DB-Schema: neue Spalten in `examinations` — **SQL noch nicht ausgeführt! Muss in Supabase SQL Editor laufen**
  ```sql
  ALTER TABLE examinations
    ADD COLUMN assessment_text    text DEFAULT '',
    ADD COLUMN pathophysiology_text text DEFAULT '',
    ADD COLUMN dys_level          text DEFAULT '',
    ADD COLUMN beverage_iddsi     integer,
    ADD COLUMN therapy_recommendations text[] DEFAULT '{}',
    ADD COLUMN therapy_notes      text DEFAULT '',
    ADD COLUMN tracheostomy_recommendation text DEFAULT '';
  ```
- [x] 5 Vorlage-Dateien in prompts/ angelegt (fees style reference)
- [x] lib/fees-prompt.ts: Prompt-Builder mit Stil-Referenz
- [x] API Route /api/generate-assessment (Claude Sonnet, JSON-Rückgabe)
- [x] Export-Seite komplett neu (screen-4 Design, BODS, KI-Button, Therapieempfehlungen)
- [x] Vollständiger DOCX-Export (14 Abschnitte, keine Tabellen)
- [x] Design-System auf Stammdaten-Seite angewendet
- [x] Header-Komponente auf Design-System aktualisiert
- [x] Build-Check: ✅ sauber

### ⚠️ Noch zu erledigen (manuell)
1. **Supabase SQL ausführen** (oben, Phase 3 DB-Schema)
2. **Vercel: ANTHROPIC_API_KEY als Environment Variable** hinzufügen (Production + Preview)

---

## Phase 4 — Backlog
- [ ] Untersuchungs-Liste / Dashboard (alle gespeicherten Untersuchungen eines Users)
- [ ] Stammdaten editierbar für gespeicherte Untersuchungen
- [ ] BODS-Logik Feinjustierung mit klinischem Feedback (Clara)
- [ ] Fehlerbehandlung verbessern (z.B. wenn DB-Spalten fehlen weil SQL noch nicht ausgeführt)
- [ ] Loading-State auf Befund + Schlucktest-Seiten

---
_Zuletzt aktualisiert: 2026-04-01_
