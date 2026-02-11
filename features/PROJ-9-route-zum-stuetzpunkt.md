# PROJ-9: Storefinder Widget - Route zum Stuetzpunkt

## Status: 🔵 Planned

## Abhaengigkeiten
- Benoetigt: PROJ-5 (Kartenansicht) - fuer Leaflet-Karte und Marker
- Benoetigt: PROJ-7 (Stuetzpunkt-Liste & Cards) - fuer LocationCard Integration und Stuetzpunkt-Auswahl
- Benoetigt: PROJ-8 (Mehrsprachigkeit) - fuer i18n der UI-Texte

## Beschreibung
Routenanzeige vom aktuellen Standort des Users zum ausgewaehlten Stuetzpunkt. Die Route richtet sich nach dem Stuetzpunkt, den der User in der Stuetzpunkt-Liste ausgewaehlt hat. Wenn der User einen anderen Stuetzpunkt in der Liste auswaehlt, wird die Route automatisch neu berechnet. Die Route wird direkt in der Leaflet-Karte gezeichnet (via OSRM) UND als externer Link zu Google Maps / Apple Maps angeboten. Nur Auto-Navigation wird unterstuetzt.

**Aenderung gegenueber urspruenglicher Planung:** Die Route wird NICHT mehr automatisch zum naechstgelegenen Stuetzpunkt berechnet, sondern zum vom User ausgewaehlten Stuetzpunkt. Der naechstgelegene Stuetzpunkt dient nur noch als Fallback, wenn kein Stuetzpunkt explizit ausgewaehlt ist.

## User Stories
- Als Website-Besucher moechte ich einen Stuetzpunkt in der Liste auswaehlen und die Route dorthin auf der Karte sehen, um den Weg visuell nachvollziehen zu koennen
- Als Website-Besucher moechte ich den "Route"-Button klicken koennen, der die Route zum aktuell ausgewaehlten Stuetzpunkt berechnet (nicht automatisch den naechsten)
- Als Website-Besucher moechte ich einen anderen Stuetzpunkt in der Liste auswaehlen und die Route soll sich automatisch aktualisieren, ohne dass ich erneut den Route-Button klicken muss
- Als Website-Besucher moechte ich die Route auch in Google Maps / Apple Maps oeffnen koennen, um die Navigation auf meinem Handy zu nutzen
- Als Website-Besucher moechte ich die Entfernung und geschaetzte Fahrzeit zum ausgewaehlten Stuetzpunkt sehen
- Als Website-Besucher moechte ich die Route schliessen und zur normalen Kartenansicht zurueckkehren koennen
- Als Website-Besucher ohne explizite Stuetzpunkt-Auswahl moechte ich, dass als Fallback der naechstgelegene Stuetzpunkt fuer die Route verwendet wird

## Acceptance Criteria

### Stuetzpunkt-Auswahl und Route
- [ ] "Route"-Button im Widget (z.B. in der Toolbar oder auf der LocationCard)
- [ ] Klick auf "Route" berechnet die Route zum aktuell in der Liste ausgewaehlten Stuetzpunkt
- [ ] Klick auf "Route" fragt Browser-Standort ab (falls nicht bereits bekannt)
- [ ] Route wird als Linie auf der Leaflet-Karte gezeichnet (OSRM Routing API)
- [ ] Karte zoomt automatisch auf die Route (fitBounds Start -> Ziel)
- [ ] Ziel-Stuetzpunkt wird auf der Karte hervorgehoben (z.B. anderer Pin-Style)

### Automatische Neuberechnung bei Auswahl-Wechsel
- [ ] Wenn eine Route aktiv ist und der User einen anderen Stuetzpunkt in der Liste auswaehlt, wird die Route automatisch zum neuen Stuetzpunkt neu berechnet
- [ ] Waehrend der Neuberechnung wird ein Loading-Zustand angezeigt (z.B. Linie blinkt oder Spinner)
- [ ] Die alte Route wird entfernt, bevor die neue Route gezeichnet wird
- [ ] RoutePanel aktualisiert sich mit neuer Entfernung, Fahrzeit und externen Links

### Routeninfo und externe Links
- [ ] Entfernung (km) und geschaetzte Fahrzeit werden angezeigt
- [ ] Name des Ziel-Stuetzpunkts wird im RoutePanel angezeigt
- [ ] Externer Link "In Google Maps oeffnen" unter der Routeninfo
- [ ] Auf iOS-Geraeten: "In Apple Maps oeffnen" statt/zusaetzlich zu Google Maps
- [ ] Externe Links verweisen immer auf den aktuell ausgewaehlten Stuetzpunkt

### Route schliessen und allgemeines Verhalten
- [ ] "Route schliessen"-Button entfernt die Route und zeigt wieder die Normalansicht
- [ ] Nur Auto-Routing (driving) wird verwendet
- [ ] Temporaer geschlossene Stuetzpunkte koennen nicht als Routenziel ausgewaehlt werden
- [ ] Route wird bei Fenster-Resize korrekt dargestellt
- [ ] Responsive: Routeninfo wird auf Mobile unter der Karte angezeigt

### Fallback-Verhalten
- [ ] Wenn KEIN Stuetzpunkt ausgewaehlt ist und der User "Route" klickt, wird als Fallback der naechstgelegene aktive Stuetzpunkt verwendet (Haversine)
- [ ] In diesem Fall wird der Fallback-Stuetzpunkt automatisch in der Liste selektiert/hervorgehoben

## Edge Cases
- Was passiert wenn User Geolocation ablehnt? -> Fehlermeldung "Standort wird fuer die Routenberechnung benoetigt" + Hinweis auf manuelle Standort-Eingabe via Suche
- Was passiert wenn kein aktiver Stuetzpunkt vorhanden ist? -> Meldung "Kein Stuetzpunkt verfuegbar", Route-Button deaktiviert
- Was passiert wenn OSRM-API nicht erreichbar ist? -> Fallback: Nur externer Google Maps-Link anzeigen, Route in Karte ueberspringen
- Was passiert wenn User sehr weit entfernt ist (z.B. anderes Land)? -> Route trotzdem anzeigen, ggf. Hinweis bei >500km Entfernung
- Was passiert auf Mobile ohne GPS? -> WiFi/IP-basierte Standortbestimmung des Browsers nutzen (weniger genau)
- Was passiert wenn der ausgewaehlte Stuetzpunkt waehrend der Routen-Anzeige temporaer geschlossen wird (z.B. durch Admin-Update)? -> Route bleibt sichtbar, aber Hinweis anzeigen dass der Stuetzpunkt aktuell nicht verfuegbar ist
- Was passiert wenn der User schnell hintereinander verschiedene Stuetzpunkte auswaehlt? -> Debounce/Cancel der vorherigen OSRM-Anfrage, nur die letzte Auswahl wird berechnet (Race Condition verhindern)
- Was passiert wenn kein Stuetzpunkt ausgewaehlt ist und kein Standort bekannt ist? -> Route-Button zeigt Tooltip "Waehle einen Stuetzpunkt aus der Liste" oder ist deaktiviert bis Auswahl getroffen

## Technische Anforderungen
- OSRM (Open Source Routing Machine) Demo-API fuer Routing: `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`
- Leaflet Polyline fuer Routen-Darstellung auf der Karte
- Haversine-Formel (bereits vorhanden in App.tsx) fuer Fallback "naechster Stuetzpunkt"
- Google Maps Deeplink: `https://www.google.com/maps/dir/?api=1&origin={lat},{lng}&destination={lat},{lng}&travelmode=driving`
- Apple Maps Deeplink: `https://maps.apple.com/?saddr={lat},{lng}&daddr={lat},{lng}&dirflg=d`
- iOS-Erkennung: User Agent oder `navigator.platform` Check
- AbortController fuer OSRM-Requests (Cancel bei schnellem Auswahl-Wechsel)

## Tech-Design (Solution Architect)

### Component-Struktur

```
Widget -> Route zum Stuetzpunkt
+-- RouteButton               <- "Route zum Stuetzpunkt" Button (Label aendert sich je nach Auswahl)
+-- RoutePanel                <- Info-Panel mit Zielname, Entfernung, Dauer, Links
|   +-- RouteTargetInfo       <- Name + Adresse des Ziel-Stuetzpunkts
|   +-- RouteInfo             <- Entfernung (km) + Fahrzeit (min)
|   +-- ExternalLinks         <- Google Maps / Apple Maps Deeplinks
|   |   +-- GoogleMapsLink    <- "In Google Maps oeffnen"
|   |   +-- AppleMapsLink     <- "In Apple Maps oeffnen" (nur iOS)
|   +-- CloseRouteButton      <- "Route schliessen"
+-- RouteLine (auf Karte)     <- Leaflet Polyline der berechneten Route
```

### Ablauf

```
1. User waehlt einen Stuetzpunkt in der Liste aus (Klick auf LocationCard)
2. User klickt "Route"-Button
3. Browser-Standort wird abgefragt (falls nicht bekannt)
4. Route wird via OSRM-API zum ausgewaehlten Stuetzpunkt berechnet
5. Route wird als GeoJSON Polyline auf der Karte gezeichnet
6. Karte zoomt auf Route (fitBounds)
7. RoutePanel zeigt Zielname + Entfernung + Fahrzeit + externe Links
8. User waehlt anderen Stuetzpunkt in der Liste aus
9. Route wird automatisch neu berechnet (Schritte 4-7 wiederholen)
10. User kann Route schliessen -> Normalansicht

Fallback-Ablauf (kein Stuetzpunkt ausgewaehlt):
1. User klickt "Route"-Button ohne vorherige Stuetzpunkt-Auswahl
2. Browser-Standort wird abgefragt
3. Naechster aktiver Stuetzpunkt wird per Haversine ermittelt
4. Dieser Stuetzpunkt wird automatisch in der Liste selektiert
5. Weiter mit normalem Ablauf ab Schritt 4
```

### OSRM API Response (relevante Felder)

```json
{
  "routes": [{
    "geometry": { "type": "LineString", "coordinates": [[lng, lat], ...] },
    "distance": 12345.6,
    "duration": 890.5
  }]
}
```

### Externe Links Format

```
Google Maps:
https://www.google.com/maps/dir/?api=1&origin={userLat},{userLng}&destination={destLat},{destLng}&travelmode=driving

Apple Maps (iOS):
https://maps.apple.com/?saddr={userLat},{userLng}&daddr={destLat},{destLng}&dirflg=d
```

### Integration in bestehende Komponenten

```
App.tsx:
- Bestehender State: selectedLocation (aus PROJ-7) -> wird als Routenziel verwendet
- Neuer State: routeActive, routeData (geometry, distance, duration), routeTarget
- Neue Funktion: startRoute() -> Geolocation + selectedLocation als Ziel (oder Fallback findNearest) + OSRM-Fetch
- Neue Funktion: closeRoute() -> State zuruecksetzen
- Neuer Effect: Wenn routeActive && selectedLocation aendert sich -> recalculateRoute()
- AbortController-Ref fuer laufende OSRM-Requests

LeafletMap.tsx:
- Neues Prop: routeGeoJSON (optional) -> Polyline rendern
- Route-Layer wird ueber den Marker-Layer gelegt
- FitBounds auf Route wenn aktiv

LocationCard.tsx (aus PROJ-7):
- Ausgewaehlter Stuetzpunkt wird visuell hervorgehoben
- Klick auf Card setzt selectedLocation State
- Wenn Route aktiv: Wechsel der Auswahl triggert automatische Neuberechnung

Neue Komponenten:
- RouteButton.tsx -> Trigger-Button (Label: "Route zum [Stuetzpunkt-Name]" oder "Route planen")
- RoutePanel.tsx -> Info-Panel mit Zielname/Dauer/Distanz/Links
```

### i18n Keys (neue Uebersetzungen)

```
route_button_default: "Route planen"
route_button_selected: "Route zu {locationName}"
route_distance: "Entfernung: {distance} km"
route_duration: "Fahrzeit: ca. {duration} Min."
route_target: "Ziel: {locationName}"
route_open_google: "In Google Maps oeffnen"
route_open_apple: "In Apple Maps oeffnen"
route_close: "Route schliessen"
route_no_location: "Standort wird fuer die Routenberechnung benoetigt"
route_no_target: "Kein Stuetzpunkt verfuegbar"
route_calculating: "Route wird berechnet..."
route_error: "Route konnte nicht berechnet werden"
route_far_away: "Der Stuetzpunkt ist ueber {distance} km entfernt"
route_select_hint: "Waehle einen Stuetzpunkt aus der Liste"
route_target_closed: "Dieser Stuetzpunkt ist aktuell nicht verfuegbar"
```

### Tech-Entscheidungen

```
Warum OSRM statt Google Directions API?
-> OSRM ist kostenlos und Open Source. Die Demo-API reicht fuer
   moderate Nutzung. Kein API-Key erforderlich. Bei hohem Traffic
   kann ein eigener OSRM-Server deployed werden.

Warum ausgewaehlter Stuetzpunkt statt automatisch naechster?
-> Der User soll selbst entscheiden koennen, zu welchem Stuetzpunkt
   die Route berechnet wird. Der haeufigste Use Case ist, dass der
   User sich bereits einen Stuetzpunkt in der Liste angeschaut hat
   und dorthin navigieren moechte -- nicht zwingend zum naechsten.
   Der naechstgelegene Stuetzpunkt wird als Fallback verwendet,
   wenn kein Stuetzpunkt explizit ausgewaehlt ist.

Warum automatische Neuberechnung bei Auswahl-Wechsel?
-> Wenn der User die Route-Ansicht offen hat und einen anderen
   Stuetzpunkt anklickt, erwartet er intuitiv, dass sich die Route
   aktualisiert. Ohne automatische Neuberechnung muesste der User
   jedes Mal manuell den Route-Button erneut klicken, was unnoetige
   Friction erzeugt.

Warum Debounce/AbortController fuer OSRM-Requests?
-> Wenn der User schnell durch die Liste klickt, wuerden sonst
   mehrere parallele OSRM-Requests abgesetzt. AbortController
   stellt sicher, dass nur der letzte Request ausgefuehrt wird
   und Race Conditions verhindert werden.

Warum nur Auto?
-> Heizmann-Kunden fahren typischerweise mit dem Auto zum Stuetzpunkt
   (Heizungs-/Sanitaer-Service). Weitere Modi koennen bei Bedarf ergaenzt werden.

Warum externer Link zusaetzlich zur Karten-Route?
-> Mobile User moechten die Route oft in ihrer Navigations-App nutzen.
   Die In-Karte-Route gibt einen schnellen Ueberblick, der externe Link
   ermoeglicht die tatsaechliche Navigation.
```

### Dependencies
- Keine zusaetzlichen Packages (OSRM wird per fetch aufgerufen, Leaflet Polyline ist bereits in Leaflet enthalten, AbortController ist native Browser-API)
