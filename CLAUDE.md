# FEES Analytics & Workflow Optimizer

## Was ist das?
Digitales Dokumentationstool für Logopädinnen. Strukturierte Eingabemaske für FEES-Befunde → automatische DOCX-Berichterstellung. Ziel: Dokumentationszeit von ~120 Min auf <5 Min pro Patient.

## Wer nutzt es?
Clara und Kolleginnen (2–5 Logopädinnen, stationäre Rehaklinik). Bei ~90% der FEES sind zwei Logopädinnen anwesend.

## Tech Stack
| Komponente | Technologie |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Datenbank | Supabase PostgreSQL |
| Auth | Supabase Auth (E-Mail + Passwort, 2–5 User) |
| KI-Textgenerierung | Claude API (Sonnet) — Beurteilung, Pathophysiologie |
| Hosting | Vercel — Auto-Deploy bei Push auf main |
| DOCX-Generierung | docx-js (serverseitig in API Route) |

## Sicherheitsregeln — IMMER einhalten
1. **Keine personenbezogenen Patientendaten in DB oder API.** Patientenname existiert NUR im Browser-Formular und wird nachträglich im DOCX ergänzt.
2. **DOCX-Platzhalter [Patient/in] wird NIEMALS vorausgefüllt.**
3. **DB-Schema:** VOR Ausführung von Schema-Änderungen immer erst zeigen und Bestätigung abwarten.
4. **.env.local und Supabase-Konfiguration:** VOR Änderungen immer erst fragen.
5. **KI-generierte Beurteilungen:** Medizinisch plausibel — keine erfundenen Befunde, keine übertriebenen Schlussfolgerungen.
6. **Einfachheit vor Eleganz.** Minimaler Code-Impact, keine Refactors nebenbei.

## Berichtsformat — KEINE Tabellen
Das KIS der Klinik kann keine Tabellen in Arztbriefe einfügen. Daher:
- Nativbefund: Stichpunkte
- Phonationskontrolle: Stichpunkte
- Scoring-Systeme (BODS, Langmore): Stichpunkte
- Schlucktests: Fließtext (pro Konsistenz ein Absatz)
- Beurteilung: Fließtext (WICHTIGSTER ABSCHNITT — Ärzte lesen primär diesen Teil)
- Therapieempfehlungen: Stichpunkte

## Scoring-Systeme im MVP
- **BODS:** BODS I (Speichel) + BODS II (Ernährung) = Gesamt. Auch für TK-Patienten. Automatisch berechnet.
- **PAS:** Penetrations-/Aspirationsskala 1–8 (Rosenbek). Bei allen Konsistenzen. Manuelle Eingabe.
- **Langmore:** Hypopharyngeale Speichelansammlung Grad 0–3. Manuelle Eingabe.
- **IDDSI:** Level 0–7 (Kostformempfehlung). Dropdown.
- ~~Yale Residue~~ — NICHT im MVP.

## Konsistenzen-Katalog (7 Stück)
1. Speichel
2. Brei / Aqua (DYS I)
3. Nektar angedickt (ThickandEasy)
4. Wasser (Glas)
5. Wasser (Strohhalm)
6. Wasser (Dysphagie-Becher / Kapi-Cup)
7. Brot (NICHT Zwieback)

## Datenschutz
Keine personenbezogenen Daten im System. Cloud-Hosting (Vercel + Supabase) ist unproblematisch. Claude API erhält nur anonymisierte klinische Befunddaten.

## Workflow
- **Modus A (MVP/Standard):** Logopädin dokumentiert selbst direkt nach der FEES
- **Modus B (optional/Test):** Zweite Logopädin dokumentiert parallel während der FEES
- Beide Modi nutzen dieselbe Eingabemaske

## Projektstruktur
- `tasks/todo.md` — Aktuelle Aufgaben und Status
- `tasks/lessons.md` — Gelernte Lektionen und Regeln
- PRD v0.3 und DEV_GUIDE v1.0 sind die maßgeblichen Spezifikationsdokumente

## Session-Routine
1. Bei Sessionstart: CLAUDE.md, tasks/todo.md und tasks/lessons.md lesen
2. Kurze Zusammenfassung des Stands geben
3. Bei DB-Änderungen: SQL erst zeigen, dann ausführen
4. Bei .env-Änderungen: erst fragen
5. Bei Session-Ende: tasks/todo.md und tasks/lessons.md updaten, Commit + Push
