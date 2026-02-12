# PROJ-2: Stützpunkt-Verwaltung (Backend)

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (Admin-Authentifizierung) - für geschützten Backend-Zugriff

## Beschreibung
CRUD-Verwaltung der Stützpunkte (Standorte/Filialen) im Backend mit automatischem Geocoding und Bild-Upload.

## User Stories
- Als Admin möchte ich einen neuen Stützpunkt mit allen Details anlegen können
- Als Admin möchte ich bestehende Stützpunkte bearbeiten können
- Als Admin möchte ich Stützpunkte als "temporär geschlossen" markieren können, ohne sie zu löschen
- Als Admin möchte ich Stützpunkte löschen können (mit Bestätigungsdialog)
- Als Admin möchte ich ein Bild pro Stützpunkt hochladen können
- Als Admin möchte ich die Koordinaten nicht manuell eingeben müssen (Auto-Geocoding)
- Als Admin möchte ich eine Übersichtsliste aller Stützpunkte mit Suchfunktion sehen

## Datenmodell Stützpunkt
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| id | UUID | Ja | Primärschlüssel |
| name | String | Ja | Name des Stützpunkts |
| strasse | String | Ja | Straßenname |
| hausnummer | String | Ja | Hausnummer |
| plz | String | Ja | Postleitzahl |
| ort | String | Ja | Stadt/Ort |
| land | String | Ja | Land (CH, DE, etc.) |
| telefon | String | Ja | Telefonnummer |
| email | String | Nein | Email-Adresse |
| website | String | Nein | URL zur Website |
| bild_url | String | Nein | URL zum hochgeladenen Bild |
| latitude | Float | Auto | Breitengrad (via Geocoding) |
| longitude | Float | Auto | Längengrad (via Geocoding) |
| status | Enum | Ja | "aktiv" / "temporaer_geschlossen" |
| oeffnungszeiten_typ | Enum | Ja | "tagsueber" / "24h" |
| oeffnungszeiten_von | Time | Bedingt | Öffnungszeit (nur bei "tagsueber") |
| oeffnungszeiten_bis | Time | Bedingt | Schließzeit (nur bei "tagsueber") |
| services | UUID[] | Nein | Zugeordnete Service-Typen (FK → PROJ-3) |
| created_at | Timestamp | Auto | Erstellungsdatum |
| updated_at | Timestamp | Auto | Letztes Update |

## Acceptance Criteria
- [ ] Formular zum Anlegen eines Stützpunkts mit allen Pflichtfeldern
- [ ] Formular zum Bearbeiten eines bestehenden Stützpunkts
- [ ] Bild-Upload (max. 5 MB, JPG/PNG/WebP)
- [ ] Bild-Vorschau im Formular nach Upload
- [ ] Auto-Geocoding: Bei Speichern wird Adresse → Lat/Lng automatisch ermittelt
- [ ] Geocoding-Fehler wird angezeigt (z.B. "Adresse nicht gefunden")
- [ ] Status-Toggle: "Aktiv" ↔ "Temporär geschlossen"
- [ ] Öffnungszeiten: Auswahl zwischen "Tagsüber geöffnet" (mit konfigurierbaren Zeiten) und "24h Service"
- [ ] Löschen mit Bestätigungsdialog ("Stützpunkt wirklich löschen?")
- [ ] Übersichtsliste mit Sortierung (Name, PLZ, Status)
- [ ] Suche in der Backend-Liste (nach Name, PLZ, Ort)
- [ ] Pagination in der Backend-Liste (bei >200 Einträgen)
- [ ] Services können per Multi-Select dem Stützpunkt zugeordnet werden

## Edge Cases
- Was passiert wenn Geocoding fehlschlägt? → Fehlermeldung, Admin kann Adresse korrigieren, Speichern trotzdem möglich (Koordinaten leer)
- Was passiert bei doppelter Adresse? → Warnung aber kein Blockieren (mehrere Stützpunkte an gleicher Adresse möglich)
- Was passiert wenn Bild zu groß ist? → Client-seitige Validierung + Server-Reject mit Meldung
- Was passiert bei Pflichtfeld leer? → Inline-Validierung, Speichern blockiert
- Temporär geschlossener Stützpunkt → Wird im Widget mit Badge "Temporär geschlossen" angezeigt

## Technische Anforderungen
- Supabase Storage für Bild-Upload
- Geocoding via OpenStreetMap Nominatim API (kostenlos, kein API Key nötig)
- Supabase Postgres für Datenbank
- API Response < 500ms für Liste

## Tech-Design (Solution Architect)

### Component-Struktur

```
/admin/stuetzpunkte           ← Übersichtsliste (Tabelle)
/admin/stuetzpunkte/neu       ← Neuer Stützpunkt (Formular)
/admin/stuetzpunkte/[id]      ← Stützpunkt bearbeiten (Formular)

Komponenten:
├── StuetzpunktTable          ← Tabelle mit Sortierung, Suche, Pagination
│   ├── StatusBadge            ← "Aktiv" (grün) / "Temporär geschlossen" (orange)
│   └── ActionButtons          ← Bearbeiten / Löschen
├── StuetzpunktForm           ← Formular für Neu + Bearbeiten
│   ├── AdresseSection         ← Straße, Nr, PLZ, Ort, Land
│   ├── KontaktSection         ← Telefon, Email, Website
│   ├── ServiceMultiSelect     ← Services zuordnen (Checkboxes)
│   ├── OeffnungszeitenPicker  ← Toggle "Tagsüber/24h" + Zeiten
│   ├── StatusToggle           ← Aktiv / Temporär geschlossen
│   └── BildUpload             ← Drag & Drop Bild-Upload mit Vorschau
└── DeleteConfirmDialog        ← "Wirklich löschen?" Modal
```

### Daten-Model

```
Tabelle: stuetzpunkte
- Alle Felder wie im Datenmodell oben beschrieben
- latitude + longitude werden automatisch befüllt (Geocoding)
- bild_url verweist auf Supabase Storage

Tabelle: stuetzpunkt_services (Verknüpfung)
- stuetzpunkt_id → Verweis auf Stützpunkt
- service_typ_id → Verweis auf Service-Typ
- Diese Tabelle verknüpft Stützpunkte mit ihren Services (N:M)

Bilder-Speicher: Supabase Storage Bucket "stuetzpunkt-bilder"
- Max 5 MB pro Bild
- Erlaubte Formate: JPG, PNG, WebP
- Automatische URL-Generierung nach Upload
```

### API-Endpoints

```
Geschützt (Admin):
POST   /api/stuetzpunkte          ← Neuen Stützpunkt anlegen
GET    /api/stuetzpunkte          ← Liste aller Stützpunkte (mit Suche/Pagination)
GET    /api/stuetzpunkte/[id]     ← Einzelnen Stützpunkt laden
PUT    /api/stuetzpunkte/[id]     ← Stützpunkt aktualisieren
DELETE /api/stuetzpunkte/[id]     ← Stützpunkt löschen
POST   /api/upload                ← Bild hochladen
GET    /api/geocode?address=...   ← Adresse → Koordinaten

Öffentlich (Widget):
GET    /api/widget/stuetzpunkte   ← Alle aktiven Stützpunkte (mit Services)
       ?lat=X&lng=Y&radius=Z     ← Optional: Umkreissuche
       ?service=ID1,ID2           ← Optional: Service-Filter
       ?search=text               ← Optional: Textsuche
       ?page=1&limit=20           ← Pagination
```

### Tech-Entscheidungen

```
Warum Nominatim für Geocoding?
→ Kostenloser OpenStreetMap-Service. Kein Account nötig. Genau genug für Schweiz/Deutschland.

Warum Supabase Storage für Bilder?
→ Integriert mit Auth. Automatische CDN-Auslieferung. RLS für Zugriffsschutz.

Warum Server-seitige Umkreissuche (PostGIS-ähnlich)?
→ Bei >200 Stützpunkten effizienter als alle laden und client-seitig filtern.
  Supabase PostgreSQL unterstützt mathematische Distanzberechnung.
```

### Dependencies
- Keine zusätzlichen Packages (Supabase Client + Zod Validierung bereits vorhanden)
