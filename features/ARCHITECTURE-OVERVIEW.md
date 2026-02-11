# Storefinder - Architektur-Übersicht

## System-Übersicht

Das Storefinder-Projekt besteht aus **zwei Hauptteilen**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Heizmann Storefinder                       │
│                                                               │
│  ┌─────────────────────┐       ┌──────────────────────────┐  │
│  │   Admin-Backend      │       │   Embeddable Widget       │  │
│  │   (Next.js App)      │       │   (Standalone JS Bundle)  │  │
│  │                      │       │                            │  │
│  │  • Login             │       │  • Karte mit Pins          │  │
│  │  • Stützpunkte CRUD  │       │  • Suche & Filter          │  │
│  │  • Services CRUD     │       │  • Stützpunkt-Cards        │  │
│  │  • Widget-Konfig     │       │  • Mehrsprachig DE/FR/IT   │  │
│  │  • Snippet-Generator │       │  • Geolocation             │  │
│  └──────────┬───────────┘       └─────────────┬──────────────┘  │
│             │                                  │                 │
│             │         ┌──────────────┐         │                 │
│             └────────►│   API Layer   │◄────────┘                │
│                       │  (Next.js)    │                          │
│                       └──────┬───────┘                          │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │    Supabase        │                        │
│                    │  • PostgreSQL DB   │                        │
│                    │  • Auth (Admins)   │                        │
│                    │  • Storage (Bilder)│                        │
│                    └───────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Zwei getrennte Bereiche

### 1. Admin-Backend (nur für Mitarbeiter)
- Geschützt hinter Login
- Läuft als Teil der Next.js App
- Erreichbar unter `/admin/...`

### 2. Embeddable Widget (für Website-Besucher)
- Standalone JavaScript-Datei
- Wird per `<script>`-Tag auf externen Websites eingebunden
- Kommuniziert mit öffentlichen API-Endpoints
- Braucht keinen Login

## Datenbank-Übersicht

```
┌──────────────────┐     ┌──────────────────────┐
│  service_typen    │     │  widget_config        │
│                   │     │  (Singleton, 1 Zeile) │
│  • id             │     │                       │
│  • name           │     │  • map_provider       │
│  • icon           │     │  • google_maps_key    │
│  • sort_order     │     │  • default_language   │
└────────┬──────────┘     │  • primary_color      │
         │                │  • default_radius_km  │
         │ N:M            │  • default_center     │
         │                │  • default_zoom       │
┌────────┴──────────┐     └──────────────────────┘
│ stuetzpunkt_      │
│ services          │
│ (Verknüpfung)     │
│                   │
│ • stuetzpunkt_id  │
│ • service_typ_id  │
└────────┬──────────┘
         │
┌────────┴──────────┐
│  stuetzpunkte     │
│                   │
│  • id, name       │
│  • strasse, nr    │
│  • plz, ort, land │
│  • telefon, email │
│  • website        │
│  • bild_url       │
│  • lat, lng       │
│  • status         │
│  • oeffnungszeiten│
└───────────────────┘
```

## Admin-Backend Seiten

```
/admin
├── /login                    ← Login-Seite
├── /dashboard                ← Übersicht (Anzahl Stützpunkte, etc.)
├── /stuetzpunkte             ← Stützpunkt-Liste (Tabelle)
│   ├── /neu                  ← Neuer Stützpunkt (Formular)
│   └── /[id]/bearbeiten      ← Stützpunkt bearbeiten
├── /services                 ← Service-Typen verwalten
├── /admins                   ← Admin-Benutzer verwalten
└── /einstellungen            ← Widget-Konfiguration + Snippet-Code
```

## API-Endpoints

```
Geschützt (nur für eingeloggte Admins):
├── /api/stuetzpunkte         ← CRUD Stützpunkte
├── /api/services             ← CRUD Service-Typen
├── /api/admins               ← Admin-Verwaltung
├── /api/widget-config        ← Widget-Einstellungen speichern
├── /api/upload               ← Bild-Upload
└── /api/geocode              ← Adresse → Koordinaten

Öffentlich (für das Widget):
├── /api/widget/config        ← Widget-Konfiguration laden
└── /api/widget/stuetzpunkte  ← Stützpunkte laden (mit Filter/Pagination)
```

## Widget Component-Struktur

```
Storefinder Widget
├── Sprach-Umschalter (DE | FR | IT)
├── Such-Bereich
│   ├── Suchfeld (PLZ / Ort / Freitext)
│   ├── Service-Filter (Chip-Buttons mit Icons)
│   ├── Radius-Auswahl (10km / 25km / 50km / 100km)
│   ├── "Mein Standort" Button
│   └── Ergebnis-Counter ("X Stützpunkte gefunden")
├── Haupt-Bereich
│   ├── Karten-Ansicht
│   │   ├── Map (OpenStreetMap oder Google Maps)
│   │   ├── Pins (mit Clustering bei vielen)
│   │   ├── Umkreis-Kreis
│   │   └── Info-Popups bei Pin-Klick
│   └── Stützpunkt-Liste
│       ├── Stützpunkt-Cards
│       │   ├── Bild
│       │   ├── Name + Adresse
│       │   ├── Telefon / Email / Website
│       │   ├── Service-Icons
│       │   ├── Öffnungszeiten
│       │   └── Status-Badge (wenn geschlossen)
│       └── "Mehr anzeigen" Button
└── Empty State (wenn keine Ergebnisse)
```

### Responsive Layout

```
Desktop:                          Mobile:
┌──────────┬──────────────┐      ┌────────────────────┐
│  Suche   │              │      │  Suche & Filter     │
│  Filter  │    Karte     │      ├────────────────────┤
├──────────┤              │      │  Karte              │
│          │              │      ├────────────────────┤
│  Cards   ├──────────────┘      │  Card 1             │
│  Liste   │                     │  Card 2             │
│          │                     │  Card 3             │
└──────────┘                     │  Mehr anzeigen...   │
                                 └────────────────────┘
```

## Tech-Entscheidungen

### Warum ein separates Widget-Bundle (Vite)?
→ Das Widget läuft auf **fremden Websites** per `<script>`-Tag. Es darf nicht von der Next.js-App abhängig sein. Vite baut ein kleines, standalone JS-File.

### Warum Leaflet.js für OpenStreetMap?
→ Beliebteste Open-Source Map-Library. Kostenlos, kein API Key nötig. Perfekt als Standard wenn kein Google Maps Key vorhanden.

### Warum Nominatim für Geocoding?
→ Kostenloser OpenStreetMap Geocoding-Service. Kein Account oder API Key nötig. Reicht für die erwartete Nutzung.

### Warum Supabase Auth statt eigenem Login?
→ Bereits im Tech Stack. Bietet Email/Passwort Login, Session Management, Passwort-Reset out-of-the-box.

### Warum Supabase Storage für Bilder?
→ Integriert mit Supabase Auth und RLS. Automatische Optimierung, CDN-Delivery.

### Warum eigene Mini-i18n statt next-intl?
→ Das Widget ist standalone (nicht Next.js). Eine eigene kleine Lösung mit JSON-Dateien (< 5KB für alle 3 Sprachen) ist leichtgewichtiger als ein großes i18n-Framework.

## Dependencies (neue Packages)

### Für Admin-Backend:
- `@dnd-kit/core` + `@dnd-kit/sortable` → Drag & Drop Sortierung der Services

### Für Widget:
- `leaflet` → OpenStreetMap Kartenanzeige
- `@googlemaps/js-api-loader` → Google Maps (optional, nur bei API Key)
- `vite` → Build-Tool für standalone Widget-Bundle

## Implementierungs-Reihenfolge

```
Phase 1: Backend Grundlagen
  PROJ-1 (Admin Auth) → PROJ-3 (Services) → PROJ-2 (Stützpunkte)

Phase 2: Widget-Konfiguration
  PROJ-4 (Widget-Konfig & Snippet)

Phase 3: Widget Frontend
  PROJ-8 (i18n) → PROJ-5 (Karte) → PROJ-7 (Cards) → PROJ-6 (Suche/Filter)
```

## Design-Referenz
- Heizmann Webdesign Guidelines: https://zeroheight.com/7eb40b8a1/p/18def4-webdesign-guidelines
- Primärfarbe und Styling aus Widget-Konfiguration (PROJ-4) ladbar
