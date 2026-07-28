# PROJ-2: Werkzeug-Stammdaten (CRUD + Suche)

**Status:** Superseded — aufgegangen in PROJ-34  
**Projekt:** TMS 2.0  
**Priorität:** Hoch (Blocker — benötigt für alle weiteren Features)  
**Autor:** Klausi (KI-Entwickler)  
**Datum:** 2026-07-01  
**Superseded am:** 2026-07-27 — diese Spec deckte nur flaches Stammdaten-CRUD ab
und hatte kein Auftrags-, Stations- oder QR-Konzept. Das Kernstück
(Werkzeug-Auftragsverwaltung & Stations-Workflow, inkl. Werkzeug-Stammdaten)
wird jetzt als ein zusammenhängendes Feature **PROJ-34** neu geplant. Diese
Datei bleibt als historische Referenz für das Stammdaten-Feldmodell erhalten.

---

## 1. Problem-Statement

**Was fehlt:** Eine zentrale Übersicht über alle Werkzeuge. Aktuell gibt es keine Möglichkeit, Werkzeuge anzulegen, zu bearbeiten oder zu suchen.

**Werkstatt-Vergleich:** Stell dir vor, du hast eine Werkstatt mit 500 Werkzeugen, aber kein Inventar-Verzeichnis. Niemand weiß, was vorhanden ist, wo es liegt, oder ob es geprüft wurde. Das ist der aktuelle Stand.

**Warum wichtig:** Ohne Werkzeug-Stammdaten können keine Stationen arbeiten (Wareneingang, AV, Maschine, QS, Warenausgang). Das ist wie ein Regalsystem ohne Artikel — die Regale stehen, aber sie sind leer.

---

## 2. Anforderungen (Was muss das Feature können?)

### 2.1 Werkzeug anlegen (Create)
- Name des Werkzeugs (z.B. "Drehmomentschlüssel 1/2\" 40-200 Nm")
- Werkzeug-Nummer / Artikelnummer (einmalig, wie ein Barcode)
- Beschreibung / Spezifikationen
- Standort / Lagerplatz (z.B. "Regal A3, Fach 2")
- Zustand (neu, gebraucht, defekt, in Reparatur)
- Letzte Prüfung (Datum)
- Nächste Prüfung fällig (Datum, optional)
- Foto (optional, Upload)

### 2.2 Werkzeug bearbeiten (Update)
- Alle Felder nachträglich ändern
- Historie: Wer hat wann was geändert?

### 2.3 Werkzeug suchen (Read/Suche)
- Schnellsuche nach Name oder Nummer
- Filter nach Zustand, Standort, Prüfstatus
- Sortierung nach Name, Nummer, letzte Änderung
- Liste mit allen Werkzeugen (paginiert, z.B. 50 pro Seite)

### 2.4 Werkzeug löschen (Delete)
- Soft-Delete (nicht physisch löschen, nur als "gelöscht" markieren)
- Nur für Admins erlaubt
- Warum soft-delete? Weil Werkzeuge in historischen Aufträgen referenziert werden könnten

---

## 3. Datenmodell (Datenbank-Tabellen)

### Tabelle: `werkzeuge`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Eindeutige ID (Primärschlüssel) |
| `artikelnummer` | TEXT | Eindeutige Werkzeug-Nummer (z.B. "WZ-001") |
| `name` | TEXT | Name des Werkzeugs |
| `beschreibung` | TEXT | Details, Spezifikationen |
| `standort` | TEXT | Aktueller Lagerplatz |
| `zustand` | ENUM | `neu`, `gebraucht`, `defekt`, `in_reparatur`, `verschrottet` |
| `letzte_pruefung` | DATE | Wann wurde es zuletzt geprüft? |
| `naechste_pruefung` | DATE | Wann ist die nächste Prüfung fällig? |
| `foto_url` | TEXT | URL zum Foto (optional) |
| `status` | ENUM | `aktiv`, `geloescht` |
| `created_at` | TIMESTAMP | Wann angelegt? |
| `updated_at` | TIMESTAMP | Wann zuletzt geändert? |
| `created_by` | UUID | Wer hat es angelegt? (Referenz zu profiles) |
| `updated_by` | UUID | Wer hat es zuletzt geändert? |

### Tabelle: `werkzeug_history`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Eindeutige ID |
| `werkzeug_id` | UUID | Referenz zu werkzeuge |
| `feld` | TEXT | Welches Feld wurde geändert? |
| `alter_wert` | TEXT | Was stand vorher drin? |
| `neuer_wert` | TEXT | Was steht jetzt drin? |
| `geaendert_von` | UUID | Wer hat geändert? |
| `geaendert_am` | TIMESTAMP | Wann wurde geändert? |

---

## 4. UI/UX (Wie soll es aussehen?)

### 4.1 Hauptseite: Werkzeug-Übersicht (`/werkzeuge`)
- **Oben:** Suchleiste + "Neues Werkzeug anlegen"-Button
- **Mitte:** Tabelle mit allen Werkzeugen
  - Spalten: Artikelnummer | Name | Standort | Zustand | Letzte Prüfung | Aktionen (Bearbeiten, Details)
- **Filter:** Dropdown für Zustand, Standort
- **Pagination:** Seitennummern unten

### 4.2 Detail-Ansicht: Werkzeug bearbeiten (`/werkzeuge/[id]`)
- **Formular:** Alle Felder bearbeitbar
- **Foto:** Vorschau + Upload-Feld
- **Historie:** Liste der letzten Änderungen (wer hat was wann geändert)
- **Buttons:** "Speichern", "Abbrechen", "Löschen" (nur Admin)

### 4.3 Neues Werkzeug anlegen (`/werkzeuge/neu`)
- **Leeres Formular** mit allen Feldern
- **Validierung:** Artikelnummer muss eindeutig sein
- **Button:** "Anlegen"

---

## 5. Akzeptanzkriterien (Definition-of-Done)

- [ ] Admin kann neues Werkzeug anlegen mit allen Feldern
- [ ] Admin kann Werkzeug bearbeiten (alle Felder ändern)
- [ ] Jeder Nutzer (mit Rolle) kann Werkzeuge suchen und filtern
- [ ] Suchergebnisse erscheinen in unter 1 Sekunde
- [ ] Filter nach Zustand und Standort funktionieren
- [ ] Historie zeigt alle Änderungen mit Wer/Wann
- [ ] Werkzeug kann als "gelöscht" markiert werden (nicht physisches Löschen)
- [ ] Gelöschte Werkzeuge sind in der Suche standardmäßig ausgeblendet (Admin kann sie sehen)
- [ ] Foto-Upload funktioniert (max. 5MB, Formate: JPG, PNG)
- [ ] Responsive Design: Funktioniert auf Desktop und Tablet
- [ ] Keine Console-Fehler im Browser
- [ ] Unit-Tests für CRUD-Operationen

---

## 6. Technische Details

### Architektur:
- **Frontend:** Next.js 16 + React + Tailwind + shadcn/ui
- **Backend:** Next.js Server Actions (keine separate API)
- **Datenbank:** Supabase (PostgreSQL) mit RLS
- **Storage:** Supabase Storage für Fotos

### Neue Dateien (geschätzt):
- `src/app/werkzeuge/page.tsx` — Übersicht
- `src/app/werkzeuge/neu/page.tsx` — Anlegen
- `src/app/werkzeuge/[id]/page.tsx` — Bearbeiten
- `src/components/werkzeuge/werkzeug-table.tsx` — Tabelle
- `src/components/werkzeuge/werkzeug-form.tsx` — Formular
- `src/lib/actions/werkzeuge.ts` — CRUD Actions
- `src/lib/validations/werkzeug.ts` — Zod-Schema
- `supabase/migrations/0003_werkzeuge.sql` — Datenbank-Tabelle

### RLS (Row Level Security):
- Jeder angemeldete Nutzer kann Werkzeuge **lesen**
- Nur Admins und AV (Arbeitsvorbereitung) können Werkzeuge **anlegen/bearbeiten**
- Nur Admins können Werkzeuge **löschen**

---

## 7. Abhängigkeiten

- ✅ PROJ-1 (Auth & Rollen) — Muss fertig sein (ist erledigt)
- ❌ PROJ-3 (Stations-Workflow) — Braucht Werkzeuge, kommt danach
- ❌ PROJ-7 (Dashboard) — Braucht Werkzeuge für Statistiken, kommt danach

---

## 8. Zeitschätzung

- **Spec schreiben:** 30 Min (gemacht)
- **Datenbank-Migration:** 30 Min
- **Backend (Actions):** 2-3 Stunden
- **Frontend (Tabelle + Formular):** 3-4 Stunden
- **Tests:** 1-2 Stunden
- **Gesamt:** ~1-2 Tage

---

## 9. Nächste Schritte

1. **Diese Spec reviewen** — Jan Bernd prüft und gibt "approved"
2. **/architecture** — Technische Details festlegen (Datenbank-Schema, API-Design)
3. **/frontend** — UI bauen (Tabelle, Formular)
4. **/backend** — Server Actions + Datenbank bauen
5. **/qa** — Tests schreiben und durchführen
6. **/deploy** — Auf Server deployen

---

*Diese Spec folgt dem Workflow aus MEMORY.md: /init → /write-spec → User-Review → /architecture → /frontend → /backend → /qa → /deploy*
