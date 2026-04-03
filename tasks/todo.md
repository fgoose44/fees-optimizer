# TODO

## Phase 1 — Setup + Patientenstammdaten + Basis-DOCX ✅
## Phase 2 — Nativbefund + Schlucktests + Scoring ✅
## Phase 3 — KI-Beurteilung + vollständiger DOCX-Export + Design ✅
## Phase 4 — Pre-Clara-Test Bugfixes + UX ✅

---

## Phase 4 — Abgeschlossen (2026-04-01)

- [x] A. DOCX-Formatierung: Arial 11/12/14pt, Seitenränder 2,5cm/2cm, 6pt Absatzabstand, nur getestete Konsistenzen, Abschlussformel
- [x] B. Schlucktest-UX: Konsistenz-Auswahl-Panel vor Tabs, "Auswahl ändern" Link, Wiederladen bestehender Auswahl aus DB
- [x] C. Dashboard: Startseite nach Login, Liste aller Untersuchungen, Fortsetzen/DOCX/Löschen Aktionen, Status-Badge
- [x] D. Export-Seite: Download-Bestätigung + "Zurück zum Dashboard" nach erfolgreichem DOCX-Download
- [x] / → /dashboard Redirect (alter page.tsx ersetzt)

---

## Phase 5 — Design Refresh (2026-04-02)

Stitch-HTML-Screens als verbindliche visuelle Vorlage. Exakte Tailwind-Klassen, Farben, Abstände, Schriftgrößen übernehmen. Funktionalität NICHT ändern.

### A. Foundation ✅
- [x] `tailwind.config.ts` — `"card": "0.75rem"` zu borderRadius hinzufügen
- [x] `app/(protected)/layout.tsx` — max-w-[900px], pt-16 Spacing für fixed Header

### B. Shared Components ✅
- [x] `components/Header.tsx` — Fixed, Glassmorphism, Desktop Tab-Nav
- [x] `components/ExaminationNav.tsx` — Restyle, lg:hidden auf Desktop
- [x] `components/PatientBanner.tsx` — Neu erstellt
- [x] `components/StickyFooter.tsx` — Neu erstellt

### C. Screen-Updates

- [x] **Dashboard** `/dashboard` ✅
- [x] **Stammdaten** `/examination/new` ✅
- [x] **Befund** `/examination/[id]/befund` ✅
- [x] **Schlucktest** `/examination/[id]/schlucktest` ✅
- [x] **Export** `/examination/[id]/export` ✅

---

## Phase 5 — Backlog (nach Clara-Test)
- [ ] Stammdaten editierbar für gespeicherte Untersuchungen
- [ ] BODS-Logik Feinjustierung mit klinischem Feedback (Clara)
- [ ] Bestehende Schlucktest-Daten beim Zurückbearbeiten aus DB laden (ConsistencyData)
- [ ] Loading-States auf Befund-Seite
- [ ] Passwort-Änderung für User

---

## Phase 6 — Bug-Fixes & UX nach User-Testing (2026-04-03)

- [ ] 1. **Bug: Befund/Schlucktest-Daten laden** — `useEffect` in befund/page.tsx und schlucktest/page.tsx, der gespeicherte Daten beim Öffnen aus DB lädt
- [ ] 2. **Dashboard: Logopäden-Name** ⚠️ DB — `profiles`-Tabelle (first_name, last_name) + Account-Settings-Seite + Dashboard-Anzeige
- [ ] 3. **Navigation** — Logout-Button auf Examination-Seiten → Dashboard-Link; Logout bleibt auf Dashboard
- [ ] 4. **Therapieempfehlungen Textarea** — rows 2 → 4, resize-y
- [ ] 5. **Fortlaufende Patienten-ID** ⚠️ DB — `patient_nr SERIAL` in examinations + PatientBanner zeigt #001 statt Patientenname
- [ ] 6. **Export-Header vereinheitlichen** — PatientBanner mit editierbarem Input-Prop, Export-Seite nutzt PatientBanner
- [ ] 7. **Doppelter Progress-Indikator** — `border-b-2 border-primary` vom aktiven Tab-Link entfernen

---
_Zuletzt aktualisiert: 2026-04-03 — Phase 6 in Arbeit_
