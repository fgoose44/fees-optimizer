# FEES Analytics & Workflow Optimizer

**PRD:** siehe [docs/PRD_v04.md](docs/PRD_v04.md)

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

## Projektstruktur
- `docs/PRD_v04.md` — Produktanforderungen, Features, Roadmap
- `tasks/todo.md` — Aktuelle Aufgaben und Status
- `tasks/lessons.md` — Gelernte Lektionen und Regeln

## Design-Referenz (Stitch)
- DESIGN.md im Projekt-Root enthält das Design-System (Farben, Typografie, Spacing)
- design/ Ordner enthält HTML-Exports der UI-Screens aus Google Stitch
- Frontend-Implementierung orientiert sich an diesen Vorgaben
- Farbpalette, Komponentenstil und Layout aus DESIGN.md übernehmen

## Session-Routine
1. Bei Sessionstart: CLAUDE.md, tasks/todo.md und tasks/lessons.md lesen
2. Kurze Zusammenfassung des Stands geben
3. Bei DB-Änderungen: SQL erst zeigen, dann ausführen
4. Bei .env-Änderungen: erst fragen
5. Bei Session-Ende: tasks/todo.md und tasks/lessons.md updaten, Commit + Push
