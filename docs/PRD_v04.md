# PRD v0.4 — FEES Analytics & Workflow Optimizer

## 1. Projektziel

Digitales Dokumentationstool für Logopädinnen. Strukturierte Eingabemaske für FEES-Befunde → automatische DOCX-Berichterstellung.

**Ziel:** Dokumentationszeit von ~120 Min auf <5 Min pro Patient.

## 2. Zielgruppe

Clara und Kolleginnen (2–5 Logopädinnen, stationäre Rehaklinik). Bei ~90% der FEES sind zwei Logopädinnen anwesend.

## 3. Nutzungsszenarien (Workflow)

- **Modus A (MVP/Standard):** Logopädin dokumentiert selbst direkt nach der FEES
- **Modus B (optional/Test):** Zweite Logopädin dokumentiert parallel während der FEES
- Beide Modi nutzen dieselbe Eingabemaske

## 4. Konsistenzen-Katalog (7 Stück)

1. Speichel
2. Brei / Aqua (DYS I)
3. Nektar angedickt (ThickandEasy)
4. Wasser (Glas)
5. Wasser (Strohhalm)
6. Wasser (Dysphagie-Becher / Kapi-Cup)
7. Brot (NICHT Zwieback)

## 5. Eingabefelder

### 5a. Nativbefund — Strukturen & Chip-Optionen

| Struktur | Chip-Optionen | Seitenauswahl |
|---|---|---|
| Schleimhäute | feucht · gerötet · geschwollen · normal durchblutet · keine Läsionen | — |
| Velum | symmetrisch · asymmetrisch · Insuffizienz | L / R / beidseitig |
| Zungenbasis | unauffällig · hypertroph · atrophiert · Coating (glasig/blasig) · anatomisch korrekt | — |
| Epiglottis | symmetrisch · Omegaepiglottis · geschwollen | — |
| Pharynx | unauffällig · verengt · Parese | L / R / beidseitig |
| Larynx | symmetrisch · Ödem · Aryknorpel auffällig · hypertroph · unauffällige Anatomie | L / R / beidseitig |
| Valleculae / Sinus pirif. | keine Retentionen · dezent · deutlich · massiv | L / R / beidseitig |

**Reflexe:**

| Feld | Optionen |
|---|---|
| Hustenstoß spontan | auslösbar · insuffizient · nicht auslösbar |
| Schluckversuch spontan | möglich · verzögert · nicht möglich |

**Phonationskontrolle (optional):**

| Feld | Optionen |
|---|---|
| Velopharyngealer Verschluss | vollständig · eingeschränkt · nicht durchführbar |
| Stimmlippenbeweglichkeit | seitengleich · asymmetrisch · eingeschränkt · nicht durchführbar |
| Glissando | symmetrisch · eingeschränkt · nicht durchführbar |
| Glottisschluss / Taschenfaltenschluss | vollständig · inkomplett · nicht durchführbar |
| Willkürliches Husten / Räuspern | kräftig · kraftgemindert · nicht möglich |

### 5b. Schlucktest — Beobachtungsfelder pro Konsistenz

| Phase | Chip-Optionen |
|---|---|
| Prädeglutitiv | Kein Leaking · Leaking · Fehlende Boluskontrolle · Übertritt von Bolusanteilen |
| Schluckakt | Effizient · Verlangsamt · Insuffizient · Kraftgemindert |
| Retention (Schweregrad) | dezent · deutlich · massiv — je Lokalisation: Valleculae L/R, Sinus L/R, Pharynx |
| Penetration / Aspiration | keine · Penetration · Aspiration |
| PAS | 1–8 (Rosenbek, manuelle Eingabe) |
| Clearing | Vollständig · Insuffizient · Nachschlucken · Liquid Wash · Capsaicin · Nicht möglich |
| Kompensationsstrategien | Chin-Tuck · Kopfrotation · Kopfneigung · Supraglottisches Schlucken · Effortful Swallow · Sonstige |

### 5c. Therapieempfehlungen — Standardset

| Kategorie | Optionen |
|---|---|
| Kostform (DYS-Level) | DYS I (IDDSI 4) · DYS IIa (IDDSI 5) · DYS IIb (IDDSI 6) · DYS III (IDDSI 7) |
| Getränke | IDDSI 0 · IDDSI 1 · IDDSI 2 (ThickandEasy) · IDDSI 3 |
| Therapie-Chips | Masako · Mendelsohn · Shaker · PNF · Spannungsaufbau n. Logemann · F.O.T.T. · Intraorale Stimulation · Essensbegleitung · Zungenkraftübungen · Pharynxkontraktion · Suprahyoidale Muskulatur · Mundschluss · Kopfrotation · Zungenbasisretraktion · Supraglottisches Schlucken · Effortful Swallow |
| TK-Empfehlungen | Sprechventil · Entblockungstraining · Blockungsschema · Geblockt nachts / entblockt tagsüber |
| Freitext | Therapienotizen, TK-Empfehlung (nur bei Tracheostoma) |

## 6. Scoring-Systeme im MVP

- **BODS:** BODS I (Speichel) + BODS II (Ernährung) = Gesamt. Auch für TK-Patienten. Automatisch berechnet.
- **PAS:** Penetrations-/Aspirationsskala 1–8 (Rosenbek). Bei allen Konsistenzen. Manuelle Eingabe.
- **Langmore:** Hypopharyngeale Speichelansammlung Grad 0–3. Manuelle Eingabe.
- **IDDSI:** Level 0–7 (Kostformempfehlung). Dropdown.
- ~~Yale Residue~~ — NICHT im MVP.

## 7. Berichtsformat — KEINE Tabellen

Das KIS der Klinik kann keine Tabellen in Arztbriefe einfügen. Daher:

- **Nativbefund:** Stichpunkte
- **Phonationskontrolle:** Stichpunkte
- **Scoring-Systeme (BODS, Langmore):** Stichpunkte
- **Schlucktests:** Fließtext (pro Konsistenz ein Absatz)
- **Beurteilung:** Fließtext (WICHTIGSTER ABSCHNITT — Ärzte lesen primär diesen Teil)
- **Therapieempfehlungen:** Stichpunkte

## 8. Datenschutz

Keine personenbezogenen Daten im System. Cloud-Hosting (Vercel + Supabase) ist unproblematisch. Claude API erhält nur anonymisierte klinische Befunddaten.

Patientenname existiert NUR im Browser-Formular und wird nachträglich im DOCX ergänzt. DOCX-Platzhalter `[Patient/in]` wird NIEMALS vorausgefüllt oder in DB/API gespeichert.

## 9. Roadmap

### Abgeschlossen
- **Phase 1** — Setup, Patientenstammdaten, Basis-DOCX
- **Phase 2** — Nativbefund, Schlucktests, Scoring
- **Phase 3** — KI-Beurteilung, vollständiger DOCX-Export, Design
- **Phase 4** — Pre-Clara-Test Bugfixes & UX (2026-04-01)
- **Phase 5** — Design Refresh (2026-04-02)
- **Phase 6** — Bug-Fixes & UX nach User-Testing (2026-04-03)

### Backlog (nach Clara-Feedback)
- [ ] Stammdaten editierbar für gespeicherte Untersuchungen
- [ ] BODS-Logik Feinjustierung mit klinischem Feedback (Clara)
- [ ] Passwort-Änderung für User (/account Seite erweitern)
