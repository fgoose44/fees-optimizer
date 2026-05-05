# SCHEMA_DIAGNOSIS — FEES Optimizer

> Erstellt: 2026-05-05 | Datenquelle: Supabase MCP + Code-Analyse
> Kein Code wurde verändert. Nur Dokumentation.

---

## 1. Schema-Übersicht

### Tabelle: `examinations`

Zentrale Tabelle — eine Zeile pro FEES-Untersuchung.

**RLS:** aktiviert  
**Policy:** `Own rows only` — PERMISSIVE, ALL (`auth.uid() = user_id`)

| Spalte | Typ | Constraints | Default |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, FK → `auth.users.id` | — |
| `examination_date` | date | NOT NULL | — |
| `status` | text | CHECK: `'erstdiagnostik'` \| `'verlaufsdiagnostik'` | — |
| `rass_score` | integer | CHECK: `-5` bis `4` | — |
| `communication` | text | nullable | — |
| `has_tracheostomy` | boolean | NOT NULL | `false` |
| `cannula_type` | text | NOT NULL | `''` |
| `cuff_status` | text | NOT NULL | `''` |
| `speaking_valve` | text | NOT NULL | `''` |
| `procedure_description` | text | nullable | — |
| `medical_diagnosis` | text | nullable | — |
| `dysphagia_question` | text | nullable | — |
| `medical_history` | text | nullable | — |
| `patient_nr` | integer | NOT NULL | `nextval('examinations_patient_nr_seq')` |
| `overall_assessment` | text[] | nullable | `'{}'` |
| `overall_sensitivity` | text | nullable | `''` |
| `sensitivity_side` | text | nullable | `''` |
| `bods_nutrition` | integer | nullable | — |
| `iddsi_level` | integer | nullable | — |
| `assessment_text` | text | nullable | `''` |
| `pathophysiology_text` | text | nullable | `''` |
| `dys_level` | text | nullable | `''` |
| `beverage_iddsi` | integer | nullable | — |
| `therapy_recommendations` | text[] | nullable | `'{}'` |
| `therapy_notes` | text | nullable | `''` |
| `tracheostomy_recommendation` | text | nullable | `''` |
| `created_at` | timestamptz | NOT NULL | `now()` |
| `updated_at` | timestamptz | NOT NULL | `now()` |

**Indexes:**
- `examinations_pkey` — PRIMARY UNIQUE (`id`)

**Beobachtung:** Die Tabelle mischt Stammdaten (Datum, Status, RASS, TK-Felder) mit Befund-Zusammenfassungen (overall_assessment, bods_nutrition) und KI-Texten (assessment_text, pathophysiology_text, therapy_recommendations). Diese sind in 3 getrennten Tabs der App gepflegt, aber alle in einer Tabelle.

---

### Tabelle: `native_findings`

1:1-Tabelle zu `examinations` — Nativbefund-Daten.

**RLS:** aktiviert  
**Policy:** `users own their native_findings` — PERMISSIVE, ALL (`auth.uid() = user_id`)

| Spalte | Typ | Constraints | Default |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `examination_id` | uuid | NOT NULL, UNIQUE, FK → `examinations.id` | — |
| `user_id` | uuid | NOT NULL, FK → `auth.users.id` | — |
| `mucosa` | text[] | nullable | `'{}'` |
| `mucosa_notes` | text | nullable | `''` |
| `velum` | text[] | nullable | `'{}'` |
| `velum_side` | text | nullable | `''` |
| `velum_notes` | text | nullable | `''` |
| `tongue_base` | text[] | nullable | `'{}'` |
| `tongue_base_notes` | text | nullable | `''` |
| `epiglottis` | text[] | nullable | `'{}'` |
| `epiglottis_notes` | text | nullable | `''` |
| `pharynx` | text[] | nullable | `'{}'` |
| `pharynx_side` | text | nullable | `''` |
| `pharynx_notes` | text | nullable | `''` |
| `larynx` | text[] | nullable | `'{}'` |
| `larynx_side` | text | nullable | `''` |
| `larynx_notes` | text | nullable | `''` |
| `valleculae` | text[] | nullable | `'{}'` |
| `valleculae_side` | text | nullable | `''` |
| `valleculae_notes` | text | nullable | `''` |
| `sinus_piriformes` | text[] | NOT NULL | `'{}'` |
| `sinus_piriformes_side` | text | NOT NULL | `''` |
| `sinus_piriformes_notes` | text | NOT NULL | `''` |
| `trachea_mucosa` | text[] | NOT NULL | `'{}'` |
| `trachea_structures` | text[] | NOT NULL | `'{}'` |
| `trachea_structures_notes` | text | NOT NULL | `''` |
| `tk_position` | text | NOT NULL | `''` |
| `cough_reflex` | text | nullable | `''` |
| `swallow_reflex` | text | nullable | `''` |
| `vp_closure` | text | nullable | `''` |
| `vocal_fold_mobility` | text | nullable | `''` |
| `vocal_fold_weakness_side` | text | NOT NULL | `''` |
| `glissando` | text | nullable | `''` |
| `glissando_weakness_side` | text | NOT NULL | `''` |
| `glottis_closure` | text | nullable | `''` |
| `voluntary_cough` | text | nullable | `''` |
| `langmore_score` | integer | nullable | — |
| `bods_saliva` | integer | nullable | — |
| `created_at` | timestamptz | nullable | `now()` |
| `updated_at` | timestamptz | nullable | `now()` |

**Indexes:**
- `native_findings_pkey` — PRIMARY UNIQUE (`id`)
- `native_findings_examination_id_key` — UNIQUE (`examination_id`)

**Beobachtung:** Spalten, die in Phase 7 nachträglich hinzugefügt wurden (`sinus_piriformes`, `trachea_*`, `vocal_fold_weakness_side`, `glissando_weakness_side`, `tk_position`), haben `NOT NULL DEFAULT ''` statt `nullable` — erkennbar am fehlenden `nullable`-Flag. Ältere Spalten (mucosa, velum, …) sind `nullable`.

---

### Tabelle: `swallow_tests`

1:N-Tabelle zu `examinations` — eine Zeile pro Konsistenz (max. 7).

**RLS:** aktiviert  
**Policy:** `users own their swallow_tests` — PERMISSIVE, ALL (`auth.uid() = user_id`)

| Spalte | Typ | Constraints | Default |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `examination_id` | uuid | NOT NULL, FK → `examinations.id` | — |
| `user_id` | uuid | NOT NULL, FK → `auth.users.id` | — |
| `consistency` | text | NOT NULL | — |
| `not_tested` | boolean | nullable | `false` |
| `praedeglutitiv` | text[] | nullable | `'{}'` |
| `schluckakt` | text[] | nullable | `'{}'` |
| `retention_valleculae_l` | text | nullable | `''` |
| `retention_valleculae_r` | text | nullable | `''` |
| `retention_sinus_l` | text | nullable | `''` |
| `retention_sinus_r` | text | nullable | `''` |
| `retention_pharynx` | text | nullable | `''` |
| `pen_asp` | text | nullable | `''` |
| `pas_score` | integer | nullable | — |
| `clearing` | text[] | nullable | `'{}'` |
| `kompensation` | text[] | nullable | `'{}'` |
| `kompensation_notes` | text | nullable | `''` |
| `created_at` | timestamptz | nullable | `now()` |
| `updated_at` | timestamptz | nullable | `now()` |

**Indexes:**
- `swallow_tests_pkey` — PRIMARY UNIQUE (`id`)
- `swallow_tests_examination_id_consistency_key` — UNIQUE (`examination_id`, `consistency`)

---

### Tabelle: `profiles`

1:1-Tabelle zu `auth.users` — Nutzerprofil (Name, Titel).

**RLS:** aktiviert  
**Policies:**
- `Authenticated users can view all profiles` — SELECT, `auth.uid() IS NOT NULL`
- `Users can insert own profile` — INSERT, `auth.uid() = id`
- `Users can update own profile` — UPDATE, `auth.uid() = id`

| Spalte | Typ | Constraints | Default |
|---|---|---|---|
| `id` | uuid | PK, FK → `auth.users.id` | — |
| `first_name` | text | nullable | — |
| `last_name` | text | nullable | — |
| `title` | text | NOT NULL | `''` |
| `updated_at` | timestamptz | nullable | `now()` |

**Indexes:**
- `profiles_pkey` — PRIMARY UNIQUE (`id`)

---

### Tabelle: `waitlist`

Unabhängige Tabelle — Wartelisten-Registrierungen von der Landing Page.

**RLS:** aktiviert  
**Policy:** `anon can insert waitlist` — INSERT only, anonymer Zugriff erlaubt (`WITH CHECK: true`)

| Spalte | Typ | Constraints | Default |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `name` | text | NOT NULL | — |
| `title` | text | NOT NULL | — |
| `email` | text | NOT NULL, UNIQUE | — |
| `created_at` | timestamptz | NOT NULL | `now()` |

**Indexes:**
- `waitlist_pkey` — PRIMARY UNIQUE (`id`)
- `waitlist_email_key` — UNIQUE (`email`)

---

## 2. Entity-Beziehungsdiagramm

```
auth.users
    │
    ├── profiles (1:1, id = auth.users.id)
    │
    └── examinations (1:N, user_id → auth.users.id)
            │
            ├── native_findings (1:1, UNIQUE examination_id)
            │
            └── swallow_tests (1:N, UNIQUE examination_id+consistency, max. 7 Zeilen)

waitlist (unabhängig, kein FK)
```

---

## 3. Speicher-Logik

### `examination/new/page.tsx` → `examinations` (INSERT)

**Trigger:** Expliziter Submit-Button "Speichern & Weiter"  
**Schreibt in:** `examinations`  
**Felder:** examination_date, status, rass_score, communication, has_tracheostomy, cannula_type, cuff_status, speaking_valve, procedure_description, medical_diagnosis, dysphagia_question, medical_history  
**Wichtig:** `patientName` wird NICHT gespeichert — nur als URL-Query-Parameter weitergegeben (`?patientName=...`)  
**Nach dem Speichern:** Redirect → `/examination/{id}/befund?patientName=...`

---

### `examination/[id]/stammdaten/page.tsx` → KEIN Schreiben

**Read-only** — lädt Daten aus `examinations`, zeigt sie an. Kein Editierformular. Backlog-Eintrag vorhanden (todo.md): "Stammdaten editierbar für gespeicherte Untersuchungen".

---

### `examination/[id]/befund/page.tsx` → `native_findings` (UPSERT)

**Trigger:** Expliziter Submit-Button "Weiter"  
**Schreibt in:** `native_findings`  
**Strategie:** UPSERT mit `onConflict: 'examination_id'` — ermöglicht Korrekturen  
**Felder:** Alle Struktur-Arrays + Side/Notes-Felder + Phonation + Langmore-Score + BODS I (bods_saliva)  
**Nach dem Speichern:** `router.refresh()` + Redirect → `/examination/{id}/schlucktest`

**Kein Auto-Save** — Daten gehen verloren, wenn der Tab gewechselt wird ohne Speichern.

---

### `examination/[id]/schlucktest/page.tsx` → `swallow_tests` + `examinations` (UPSERT/UPDATE)

**Trigger:** Expliziter Submit-Button  
**Schreibt in zwei Tabellen:**
1. `swallow_tests` — UPSERT alle 7 Konsistenz-Zeilen auf einmal (`onConflict: 'examination_id,consistency'`), `not_tested=true` für nicht ausgewählte
2. `examinations` — UPDATE: overall_assessment, overall_sensitivity, sensitivity_side, bods_nutrition, iddsi_level

**Kein Auto-Save** — Tab-Wechsel ohne Speichern verliert alle Änderungen.

---

### `examination/[id]/export/page.tsx` → `examinations` (UPDATE)

**Trigger:** Mehrfach:
- `onBlur` auf Text-Feldern (Beurteilung, Pathophysiologie, Therapiehinweise)
- Expliziter "Speichern"-Button
- Automatisch vor DOCX-Download (`handleDownload()` ruft `handleSave()` auf)

**Schreibt in:** `examinations`  
**Felder:** assessment_text, pathophysiology_text, dys_level, beverage_iddsi, therapy_recommendations, therapy_notes, tracheostomy_recommendation

**Einzige Seite mit Auto-Save (onBlur).**

---

## 4. FEES-relevante Tabellen — Zusammenfassung

Alle 3 Kerntabellen gehören direkt zu einer FEES-Untersuchung:

| Tabelle | Bezug | Kardinalität |
|---|---|---|
| `examinations` | Stammdaten + Summary-Felder + KI-Texte | 1 pro Untersuchung |
| `native_findings` | Nativbefund (Strukturbefunde, Phonation, Scores) | 1:1 zu examinations |
| `swallow_tests` | Schlucktests pro Konsistenz | 1:N (max. 7) zu examinations |

`profiles` ist nutzerbezogen, kein direkter FEES-Befundbezug.  
`waitlist` ist komplett unabhängig.

---

## 5. Bewertung: Normalisierung & Design-Muster

### Was gut ist

- **Klare Entitätstrennung:** Jede Befundkategorie hat eine eigene Tabelle — kein "alles in einer großen JSONB-Spalte"
- **UPSERT-Strategie:** Robustes Muster — wiederholtes Speichern überschreibt statt zu duplizieren
- **UNIQUE-Constraints** auf `native_findings.examination_id` und `swallow_tests.(examination_id, consistency)` erzwingen die Kardinalität auf DB-Ebene
- **RLS durchgängig aktiviert** — jeder Nutzer sieht nur seine eigenen Daten
- **Kein JSONB** — alle Felder sind typisierte Spalten (text[], integer, text) → besser querybar, besser indexierbar

### Was zu beachten ist

**1. `examinations`-Tabelle ist zu breit (750 Grad Denormalisierung)**  
Die Tabelle enthält 3 konzeptuell verschiedene Datenbereiche:
- Stammdaten (examination_date, status, RASS, TK-Felder) — geschrieben beim Anlegen
- Schlucktest-Zusammenfassung (overall_assessment, bods_nutrition, iddsi_level) — geschrieben beim Schlucktest-Submit
- KI-/Analyse-Texte (assessment_text, pathophysiology_text, therapy_recommendations) — geschrieben im Export-Tab  

Für den aktuellen Umfang (2–5 User, eine App) ist das pragmatisch und in Ordnung. Bei einer Erweiterung (z.B. mehrere Befundversionen, Vergleichsansicht) könnte eine Aufteilung in `examination_summary` sinnvoll werden.

**2. Nullable-Inkonsistenz in `native_findings`**  
Ältere Spalten sind `nullable`, nachträglich hinzugefügte Spalten (Phase 7) sind `NOT NULL DEFAULT ''`. Dies ist eine Migrationsartefakt-Spur und kein funktionales Problem, erschwert aber konsistente NULL-Checks im Code.

**3. Kein Draft/Status-Konzept**  
`examinations.status` unterscheidet nur `erstdiagnostik` vs. `verlaufsdiagnostik` (klinischer Typ). Es gibt keinen Workflow-Status wie `draft | in_progress | complete`. Eine angefangene aber nicht abgeschlossene Untersuchung ist von einer abgeschlossenen auf DB-Ebene nicht unterscheidbar. Der Vollständigkeitsstatus ergibt sich implizit daraus, ob `native_findings` und `swallow_tests` Einträge existieren.

**4. Kein Auto-Save auf Befund und Schlucktest**  
Nur der Export-Tab hat `onBlur`-Auto-Save. Die beiden datenintensivsten Tabs (Nativbefund, Schlucktest) speichern nur bei explizitem Submit. Datenverlust bei Tab-Wechsel ohne Speichern ist möglich.

**5. `user_id` redundant in `native_findings` und `swallow_tests`**  
Da `examination_id` ein FK auf `examinations` ist (das selbst `user_id` hat), wäre `user_id` in den Child-Tabellen theoretisch redundant. Es wird aber für die RLS-Policy benötigt (`auth.uid() = user_id`), da Supabase-RLS keinen JOIN auf Parent-Tabellen ausführt. Das ist ein bekanntes Supabase-Muster und intentional.
