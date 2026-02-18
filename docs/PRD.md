# Product Requirements Document: Apo-Schulungs-Manager

## Vision
Wir entwickeln eine zentralisierte Web-Plattform für ein Schulungsunternehmen, um den gesamten Prozess von der Kundenverwaltung über die Tourenplanung bis hin zur Erfolgsanalyse zu digitalisieren. Ziel ist es, die fehleranfällige und manuelle Planung über Excel-Listen (wie "Tour Apo-Schulungen.xlsx") durch eine intelligente, kollaborative Datenbank-Lösung zu ersetzen, die Terminüberschneidungen verhindert und automatische Auswertungen liefert.

## Target Users (Zielgruppen)

1. **Backoffice / Administration**:
* *Bedürfnisse:* Muss Kunden (Apotheken) zentral anlegen und Stammdaten pflegen. Benötigt Übersicht, welche Regionen (OÖ, Tirol, etc.) wann bereist werden.
* *Pain Points:* Datenredundanz in verschiedenen Excel-Sheets, schwierige Übersicht über Gesamtverfügbarkeit der Trainer.


2. **Schulungsleiter (Trainer/Außendienst)**:
* *Bedürfnisse:* Muss Termine in Kalender eintragen, Routen planen (Touren) und nach dem Termin Feedback-Daten (TN-Zahlen, Bewertungen) eingeben.
* *Pain Points:* Umständliche Abstimmung von Terminen (siehe "Fixiert von Sebastian.csv"), händisches Nachtragen von Statistiken.


3. **Management**:
* *Bedürfnisse:* Will auf Knopfdruck Analysen sehen (Durchschnittsbewertungen, erreichte Teilnehmerzahlen pro KW).
* *Pain Points:* Aufwendiges manuelles Zusammenkopieren der Jahresauswertungen.



## Core Features (Roadmap)
| Priorität | ID | Feature | Beschreibung | Status |
| --- | --- | --- | --- | --- |
| **P0 (MVP)** | PROJ-1 | **User Authentication & Rollenverwaltung** | Login/Signup, Rollen (Admin, Trainer, Management), rollenbasierte Zugriffskontrolle. | Geplant |
| **P0 (MVP)** | PROJ-2 | **Kunden-Datenbank (Apotheken)** | CRUD-Funktionalität für Apotheken. Felder: Name, Adresse, PLZ, Ort, Region (OÖ, Tirol, Salzburg, Vorarlberg), Priorität. | Geplant |
| **P0 (MVP)** | PROJ-3 | **Tourenplanung & Termin-Slotting** | Zuordnung von Terminen zu Apotheken und Trainern. Datum, Uhrzeit, Status (Geplant/Fixiert/Durchgeführt/Abgesagt), Notizen. | Geplant |
| **P0 (MVP)** | PROJ-4 | **Erfassungsmaske für Schulungsdaten** | Post-Termin Datenerfassung: Teilnehmerzahl (TN), Dauer, Bewertungen (Verständlichkeit, Nutzbarkeit, Kompetenz). | Geplant |
| **P0 (MVP)** | PROJ-5 | **Interaktiver Team-Kalender** | Kalenderansicht (Monat/Woche), filterbar nach Trainer/Region, visuelle Darstellung von Touren. | Geplant |
| **P0 (MVP)** | PROJ-6 | **Dashboard & Home Screen** | Übersicht bevorstehender Termine, offene Berichte, Key Metrics auf einen Blick. | Geplant |
| **P1** | PROJ-7 | **Reporting & Analytics** | Automatische KW/Monats-Berichte, Trainer-Auslastung, Durchschnittsbewertungen, Teilnehmersummen (Nachbau Analyse.csv). | Geplant |
| **P1** | PROJ-8 | **Touren-Visualisierung (Karte)** | Geografische Ansicht der Tages-Termine auf einer Karte zur Routenvalidierung. | Geplant |
| **P1** | PROJ-9 | **Excel / CSV Export** | Export von Touren, Terminen und Berichten als Excel/CSV für externe Weiterverarbeitung. | Geplant |
| **P1** | PROJ-10 | **E-Mail Benachrichtigungen** | Automatische E-Mail-Alerts und Erinnerungen für Trainer und Admins. | Geplant |
| **P2** | PROJ-11 | **Konflikt-Checker** | Warnung bei Doppelbuchungen oder unrealistischen Reisezeiten zwischen Terminen. | Geplant |
| **P2** | PROJ-12 | **Excel / CSV Import (Datenmigration)** | Import der bestehenden CSV-Dateien zur Datenmigration aus Excel. | Geplant |
| **P2** | PROJ-13 | **Google Calendar Sync** | Synchronisation von Terminen mit Google Calendar. | Geplant |

## Success Metrics (Erfolgsmessung)

* **Planungseffizienz:** Reduzierung der Zeit für die Tourenplanung um 50%.
* **Datenintegrität:** 100% der durchgeführten Schulungen haben vollständig ausgefüllte Feedback-Daten (keine `NaN` Werte mehr in der Analyse).
* **Konfliktfreiheit:** 0 Doppelbuchungen oder logistische Fehler bei Terminen.

## Constraints (Rahmenbedingungen)

* **Plattform:** Web-basiert (Desktop-optimiert für Planung, Tablet-tauglich für Unterwegs).
* **Datenstruktur:** Muss die Logik der bestehenden Excel-Dateien abbilden können (Trennung nach Bundesländern, aber gemeinsame Auswertung).
* **Budget:** MVP Fokus (Kernfunktionen zuerst).

## Non-Goals (Was wir NICHT bauen)

* Kein Endkunden-Portal (Apotheken loggen sich nicht selbst ein).
* Keine vollautomatische KI-Routenoptimierung (der Trainer entscheidet die Route, das System visualisiert nur).
* Keine Gehaltsabrechnung oder Spesenabrechnung.

---

### Detaillierte Daten-Analyse für die Entwicklung (Tech-Spec Input)

Basierend auf deinen hochgeladenen Dateien muss das Backend folgende Datenmodelle unterstützen, um die Excel-Funktionalität abzulösen:

**1. Entität: `Apotheke` (Kunde)**

* Datenquelle: *Tour Apo-Schulungen.xlsx - OÖ.csv, Tirol.csv etc.*
* Felder:
* `ID`: Eindeutige Kennung.
* `Name`: z.B. "Marien Apotheke".
* `PLZ`: z.B. "6020".
* `Ort`: z.B. "Innsbruck".
* `Region`: (Enum: OÖ, Salzburg, Tirol, Vorarlberg).
* `Ranking/Priorität`: (Aus den Excel-Dateien ersichtlich, z.B. "Top Kunde").



**2. Entität: `Termin` (Schulung)**

* Datenquelle: *Tour Apo-Schulungen.xlsx - Fixiert von Sebastian.csv* & *Gesamt.csv*
* Felder:
* `Datum`: YYYY-MM-DD.
* `Zeit_Start`: HH:MM.
* `Zeit_Ende`: HH:MM.
* `Notiz`: String (z.B. "evtl noch bisschen nach hinten verschieben").
* `Status`: (Geplant, Fixiert, Durchgeführt, Abgesagt).
* `Trainer_ID`: Verknüpfung zum User.



**3. Entität: `Bericht` (Auswertung)**

* Datenquelle: *Tour Apo-Schulungen.xlsx - Auswertung 2025.csv*
* Logik: Ein Termin, der den Status "Durchgeführt" hat, *muss* einen Bericht erhalten.
* Felder:
* `Teilnehmerzahl (TN)`: Integer.
* `Dauer`: Float (in Stunden).
* `Rating_Verständlichkeit`: Integer (Skala prüfen, wirkt wie 1-10 oder Schulnoten).
* `Rating_Nutzbarkeit`: Integer.
* `Rating_Kompetenz`: Integer.
* `Themen`: (Optional, welche Inhalte geschult wurden).



**4. Aggregierte Views (Dashboards)**

* Datenquelle: *Analyse.csv*
* Das System muss Views generieren können für:
* "Summe TN pro Woche/Monat".
* "Durchschnittsbewertung pro Trainer/Region".
* Vergleich Vorjahr (2025 vs 2026).