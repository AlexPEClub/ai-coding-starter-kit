# PROJ-5: Storefinder Widget - Kartenansicht

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-2 (Stützpunkt-Verwaltung) - für Stützpunkt-Daten mit Koordinaten
- Benötigt: PROJ-4 (Widget-Konfiguration) - für Map-Provider Einstellung
- Benötigt: PROJ-8 (Mehrsprachigkeit) - für i18n der UI-Texte

## Beschreibung
Interaktive Karte im Storefinder-Widget, die alle Stützpunkte als Pins anzeigt. Unterstützt OpenStreetMap (Leaflet) und Google Maps. Bietet Umkreissuche und Geolocation.

## User Stories
- Als Website-Besucher möchte ich eine Karte mit allen Stützpunkten als Pins sehen
- Als Website-Besucher möchte ich auf einen Pin klicken können, um eine Kurzinfo zum Stützpunkt zu sehen (Popup)
- Als Website-Besucher möchte ich meinen Standort automatisch erkennen lassen können, um nahegelegene Stützpunkte zu finden
- Als Website-Besucher möchte ich einen Umkreis-Radius wählen können (10km, 25km, 50km, 100km), um die Ergebnisse einzugrenzen
- Als Website-Besucher möchte ich dass die Karte automatisch auf relevante Stützpunkte zoomt
- Als Website-Besucher möchte ich temporär geschlossene Stützpunkte auf der Karte erkennen können

## Acceptance Criteria
- [ ] Karte zeigt alle aktiven Stützpunkte als Pins an
- [ ] Temporär geschlossene Stützpunkte werden mit anderem Pin-Style angezeigt (z.B. grau)
- [ ] Klick auf Pin öffnet Info-Popup mit: Name, Adresse, Telefon, Services (Icons)
- [ ] Popup enthält "Details"-Link der zur Card in der Liste scrollt
- [ ] OpenStreetMap (Leaflet.js): Funktioniert ohne API Key
- [ ] Google Maps: Funktioniert mit hinterlegtem API Key aus PROJ-4
- [ ] Map-Provider wird automatisch aus Widget-Konfiguration geladen
- [ ] Geolocation: Button "Mein Standort" fragt Browser-Standort ab
- [ ] Bei Geolocation-Erfolg: Karte zentriert auf User-Position
- [ ] Bei Geolocation-Fehler: Hinweis "Standort konnte nicht ermittelt werden"
- [ ] Radius-Auswahl: Dropdown mit 10km, 25km, 50km, 100km
- [ ] Bei Radius-Auswahl: Nur Stützpunkte im Umkreis werden angezeigt
- [ ] Umkreis wird als Kreis auf der Karte visualisiert
- [ ] Clustering bei vielen nahen Pins (z.B. bei Zoom-Out)
- [ ] Responsive: Karte passt sich an Container-Breite an
- [ ] Initial: Karte zeigt alle Stützpunkte mit Auto-Fit Zoom

## Edge Cases
- Was passiert wenn User Geolocation ablehnt? → Kein Fehler, manuelle Suche bleibt möglich
- Was passiert wenn keine Stützpunkte im Umkreis sind? → Meldung "Keine Stützpunkte im Umkreis von Xkm gefunden"
- Was passiert bei >200 Pins? → Marker Clustering verwenden
- Was passiert wenn Google Maps API Key ungültig ist? → Fallback auf OpenStreetMap mit Warnung im Console-Log
- Was passiert auf Mobile? → Touch-Gesten für Zoom/Pan, vollbreite Karte

## Technische Anforderungen
- Leaflet.js für OpenStreetMap
- Google Maps JavaScript API für Google Maps
- Marker Clustering Library (Leaflet.markercluster / Google Maps MarkerClusterer)
- Geolocation API (navigator.geolocation)
- Haversine-Formel für Umkreisberechnung (Client-seitig oder API)
- Karte muss im Shadow DOM / iFrame isoliert funktionieren

## Tech-Design (Solution Architect)

### Component-Struktur

```
Widget → Kartenansicht
├── MapContainer               ← Wrapper der den richtigen Map-Provider lädt
│   ├── LeafletMap             ← OpenStreetMap Variante (Standard)
│   │   ├── TileLayer          ← OSM Kacheln
│   │   ├── MarkerCluster      ← Gruppierung bei vielen Pins
│   │   │   └── LocationMarker ← Einzelner Pin (aktiv = farbig, geschlossen = grau)
│   │   ├── RadiusCircle       ← Umkreis-Visualisierung
│   │   └── MarkerPopup        ← Info-Popup bei Pin-Klick
│   └── GoogleMap              ← Google Maps Variante (bei API Key)
│       ├── MarkerClusterer    ← Gruppierung
│       │   └── LocationMarker ← Pin
│       ├── RadiusCircle       ← Umkreis
│       └── InfoWindow         ← Popup
├── GeolocationButton          ← "Mein Standort" Button
└── RadiusSelector             ← Dropdown: 10km / 25km / 50km / 100km
```

### Daten-Model

```
Die Karte zeigt Stützpunkte die sie vom gemeinsamen Widget-State erhält:
- Gefilterte Stützpunkt-Liste (aus PROJ-6 Suche/Filter)
- Jeder Stützpunkt hat: latitude, longitude, name, status, services

Karten-State:
- Aktueller Mittelpunkt (lat/lng)
- Aktuelle Zoomstufe
- Ausgewählter Stützpunkt (für Highlight)
- Radius-Auswahl (10/25/50/100 km)
- User-Standort (wenn Geolocation aktiv)
```

### Map-Provider Abstraction

```
Das Widget nutzt ein einheitliches Interface für beide Map-Provider:

MapProvider (gemeinsame Schnittstelle)
├── setCenter(lat, lng)        ← Karte zentrieren
├── setZoom(level)             ← Zoom setzen
├── fitBounds(markers)         ← Auto-Zoom auf alle Marker
├── addMarker(location)        ← Pin hinzufügen
├── removeMarkers()            ← Alle Pins entfernen
├── showRadius(lat, lng, km)   ← Umkreis-Kreis zeichnen
└── onMarkerClick(callback)    ← Klick-Handler

→ LeafletProvider implementiert das für OSM
→ GoogleMapsProvider implementiert das für Google Maps
→ Welcher geladen wird, entscheidet die Widget-Konfiguration (PROJ-4)
```

### Tech-Entscheidungen

```
Warum Leaflet.js für OpenStreetMap?
→ Beliebteste Open-Source Map-Library (40k+ GitHub Stars).
  Klein (~40KB), schnell, Touch-Support, riesiges Plugin-Ökosystem.

Warum Map-Provider Abstraction?
→ Ermöglicht nahtlosen Wechsel zwischen OSM und Google Maps
  ohne den Rest des Widgets ändern zu müssen.

Warum Client-seitige Umkreisberechnung?
→ Haversine-Formel ist schnell und genau genug.
  Spart Server-Roundtrips bei Radius-Änderung.

Warum Marker Clustering?
→ Bei >200 Pins wird die Karte unlesbar ohne Clustering.
  Leaflet.markercluster ist der Standard dafür.
```

### Dependencies
- `leaflet` + `leaflet.markercluster` (OpenStreetMap + Clustering)
- `@googlemaps/js-api-loader` (Google Maps, wird nur geladen wenn konfiguriert)
