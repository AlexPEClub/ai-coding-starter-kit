# PROJ-45: Fahrer — Tour-Kartenansicht

## Status: In Progress
**Created:** 2026-08-05
**Last Updated:** 2026-08-06

**Frontend-Implementierung:** 2026-08-06

## Dependencies
- Requires: PROJ-21 (Fahrer — Tourenliste) — Einstiegspunkt für den neuen "Karte"-Button
- Requires: PROJ-42 (Routenberechnung für Touren, Geoapify) — liefert Reihenfolge, Ankunftszeiten, Etappen; Route-Geometrie (Polyline) fehlt aktuell noch und muss ergänzt werden (siehe Technical Requirements)
- Requires: PROJ-44 (Stopp-Detail-Modal) — wird beim Tap auf einen Kunden-Marker wiederverwendet

## User Stories
- Als Fahrer möchte ich auf einer Karte sehen, wie meine heutige Tour verläuft (alle Stopps mit Uhrzeit, Ort, Name, in der richtigen Reihenfolge verbunden), damit ich den Gesamtverlauf auf einen Blick verstehe statt nur eine Liste durchzuscrollen.
- Als Fahrer möchte ich von der Karte direkt einen Stopp antippen können und dessen Details (Navi, Erledigt) öffnen, damit ich nicht zwischen Karte und Liste wechseln muss.
- Als Admin möchte ich mir auf der Karte auch die Touren anderer Fahrer ansehen können (Tab "Tourenplanung"), damit ich den geplanten Verlauf einer Tour prüfen kann.
- Als Fahrer möchte ich eine klare Meldung sehen, wenn die Karte gerade nicht angezeigt werden kann (z. B. wegen Netzproblemen), damit ich weiß, dass es kein Bedienfehler ist und ich es erneut versuchen kann.

## Out of Scope
- Offline-Fähigkeit der Karte (Kartenkacheln-Caching, Nutzung ohne Internetverbindung) — bewusst nicht im MVP, da deutlich größerer Scope
- Manuelles Verschieben/Neuordnen von Stopps direkt auf der Karte (Drag & Drop) — Reihenfolge kommt ausschließlich aus der PROJ-42-Berechnung
- Live-Standort des Fahrers auf der Karte (GPS-Tracking) — kein Bestandteil dieses Features
- Mehrtages- oder Mehrfahrer-Ansicht auf einer Karte — immer genau eine Tour (ein Fahrer + ein Datum) pro Kartenansicht
- Eigene Navigations-Funktion innerhalb der Karte — der bestehende "Navi"-Button im Stopp-Detail-Modal (Google-Maps-Deeplink, PROJ-44) bleibt der einzige Navigationsweg
- Turn-by-turn-Wegbeschreibung oder Verkehrslage — nur die berechnete Route wird als Linie dargestellt

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen eine Tour mit bereits berechneter Route wird in der Tourenliste angezeigt, wenn der Fahrer auf den "Karte"-Button der Tour tippt, dann öffnet sich eine Kartenansicht mit dem Depot (eigenes Icon, ohne Nummer) und allen Stopps der Tour als nummerierte Marker (Reihenfolge = `route_order`), verbunden durch die tatsächliche Straßenroute
- [ ] Angenommen ein Stopp-Marker zeigt Name, Adresse (Ort) und berechnete Ankunftszeit an, wenn der Fahrer auf diesen Marker tippt, dann öffnet sich direkt das bestehende Stopp-Detail-Modal (PROJ-44) für diesen Stopp
- [ ] Angenommen eine Tour enthält bereits erledigte Stopps, wenn die Karte geöffnet wird, dann werden diese Stopps weiterhin angezeigt, aber optisch abgeschwächt (analog zur Listenansicht: ausgegraut, mit Häkchen-Icon)
- [ ] Angenommen für eine Tour liegt noch keine berechnete Route vor, wenn der Fahrer auf "Karte" tippt, dann wird die Routenberechnung ausgelöst, ein Ladezustand angezeigt, und die Karte erst geöffnet, sobald die Berechnung abgeschlossen ist
- [ ] Angenommen die Routenberechnung schlägt fehl (z. B. fehlende Adress-Koordinaten bei einem Stopp) oder die Karte kann wegen eines Netzproblems nicht geladen werden, wenn der Fahrer auf "Karte" tippt, dann erscheint eine klare Fehlermeldung mit einem "Erneut versuchen"-Button, keine Karte wird angezeigt
- [ ] Angenommen eine Tour hat kein Datum ("ohne Datum"), wenn die Tourenliste angezeigt wird, dann ist der "Karte"-Button für diese Tour deaktiviert (keine Route berechenbar ohne Datum)
- [ ] Angenommen der Nutzer befindet sich im Tab "Tourenplanung" und betrachtet die Tour eines anderen Fahrers, wenn er auf "Karte" tippt, dann funktioniert die Kartenansicht identisch zum Tab "Mir zugewiesen"
- [ ] Angenommen der Nutzer hat weder die Rolle "fahrer" noch "admin", wenn er versucht `/fahrer` aufzurufen, dann wird er (wie bereits heute) auf `/dashboard` umgeleitet und sieht den "Karte"-Button gar nicht
- [ ] Angenommen die Kartenansicht ist geöffnet, wenn der Fahrer sie schließt (z. B. über einen Schließen-Button), dann kehrt er zur Tourenliste zurück, ohne dass sich am Zustand der Tour etwas geändert hat

## Edge Cases
- Tour mit nur einem Stopp: Karte zeigt Depot + 1 nummerierten Marker + Route dazwischen — kein Sonderfall.
- Tour, bei der alle Stopps bereits erledigt sind: laut bestehender Logik (`gruppiereZuTouren`) wird eine solche Tour komplett aus der Liste entfernt — der Fall "Karte für eine komplett erledigte Tour öffnen" kommt dadurch gar nicht vor.
- Sehr große Tour (z. B. 25 Stopps an einem Tag): Karte muss lesbar bleiben (Zoom passt sich automatisch an alle Marker an — "fit bounds").
- Zwei Stopps mit (zufällig) identischen oder sehr nahen Koordinaten: Marker dürfen sich nicht gegenseitig verdecken/unklickbar machen (z. B. durch leichtes Auseinanderrücken oder Clustering — technische Detailentscheidung in `/architecture`).
- Karte wird geöffnet, während im Hintergrund eine neue Routenberechnung für dieselbe Tour ausgelöst wird (z. B. weil parallel ein Stopp bearbeitet wurde): angezeigte Route darf sich nicht mitten in der Nutzung unangekündigt ändern — Karte zeigt den Stand zum Öffnungszeitpunkt, keine Live-Aktualisierung während sie offen ist.
- Nutzer tippt schnell mehrfach auf "Karte", während die Berechnung noch läuft: darf nicht mehrfach parallele Berechnungen/Kartenöffnungen auslösen.

## Technical Requirements (optional)
- Route-Geometrie (Polyline) wird von PROJ-42 aktuell nicht gespeichert — muss für die echte Straßenroute ergänzt werden (on-demand Abruf beim Kartenöffnen oder Persistierung bei der Berechnung; technische Entscheidung folgt in `/architecture`)
- Koordinaten der Kunden-Stopps liegen in `tms.partner_addresses` (`geoapify_lat`/`geoapify_lon`) und müssen für die Karte zugänglich gemacht werden (aktuell nicht im `Fahrt`-Objekt exponiert)
- Timeout für den Kartenlade-/Berechnungsvorgang: 10 Sekunden, danach Fehlermeldung mit Retry
- Mobile-First: Karte muss auf Terminal/Tablet-Bildschirmen (Touch ≥ 48px für Buttons/Marker) gut bedienbar sein

## Open Questions
- [x] On-Demand-Abruf der Routen-Geometrie vs. Persistierung bei der PROJ-42-Berechnung — **entschieden in `/architecture`: Persistierung.** Begründung siehe „Tech Design" → Entscheidung 2.
- [x] Verhalten bei zwei Stopps mit sehr nahen/identischen Koordinaten (Clustering vs. Auseinanderrücken) — **entschieden in `/architecture`: leichtes visuelles Auseinanderrücken, kein Clustering.** Begründung siehe „Tech Design" → Entscheidung 6.
- [x] Kartenkacheln-Anbieter (Hintergrundkarte) — **entschieden im User-Review: OpenStreetMap-Standardkacheln** (gegen die Architektur-Empfehlung Geoapify Map Tiles — kostenlos, User akzeptiert die Fair-Use-Einschränkung für den aktuellen Nutzungsumfang). Begründung siehe „Tech Design" → Entscheidung 1.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Klick auf "Karte" löst bei Bedarf die Routenberechnung aus (statt Button einfach zu deaktivieren) | User-Wunsch: Fahrer soll nicht warten müssen, bis eine automatische Hintergrund-Berechnung "irgendwann" fertig ist, sondern aktiv anstoßen können | 2026-08-05 |
| Depot wird auf der Karte angezeigt, aber optisch klar von nummerierten Kunden-Stopps unterschieden (eigenes Icon, keine Nummer) | Ohne Depot wirkt die Route wie "aus dem Nichts" startend; klare Unterscheidung verhindert Verwechslung mit einem Kundenstopp | 2026-08-05 |
| Tap auf Kunden-Marker öffnet direkt das Stopp-Detail-Modal (kein Zwischenschritt über ein Popup) | Konsistenz mit dem bestehenden Verhalten in der Liste (PROJ-44); vermeidet doppelte Bedienwege für dieselbe Aktion | 2026-08-05 |
| Karte-Button in beiden Tabs ("Mir zugewiesen" und "Tourenplanung") verfügbar | Karte ist reine Anzeige+Navigation zum Detail-Modal; "Tourenplanung" erlaubt bereits das Bearbeiten fremder Touren, kein Grund für Einschränkung | 2026-08-05 |
| Erledigte Stopps bleiben auf der Karte sichtbar (abgeschwächt), statt ausgeblendet zu werden | Konsistenz mit der Listenansicht (PROJ-44); voller Überblick über die gesamte Tour inkl. bereits abgehakter Stopps | 2026-08-05 |
| Bei Netzproblemen/fehlgeschlagener Berechnung: einfacher Fehlerzustand mit Retry, kein Offline-Support | Offline-Fähigkeit wäre deutlich größerer Scope (Kartenkacheln-Caching etc.); für MVP bewusst ausgeklammert | 2026-08-05 |
| Tour ohne Datum: Karte-Button deaktiviert | PROJ-42 kann ohne Datum keinen Tagesstart und damit keine Route berechnen | 2026-08-05 |
| Rollen-Sichtbarkeit des Buttons = bestehende Fahrer/Admin-Beschränkung von `/fahrer` (keine neue Rollenlogik) | `/fahrer` ist bereits auf Rollen `fahrer` und `admin` beschränkt (`src/app/(app)/fahrer/page.tsx`); keine Notwendigkeit für ein neues Rollen-Gate | 2026-08-05 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Kartenkacheln (Hintergrundkarte) von OpenStreetMap-Standardkacheln statt Geoapify | User-Entscheidung im Architektur-Review (gegen die Empfehlung Geoapify): kostenlos, kein zusätzlicher API-Vertrag. Fair-Use-Einschränkung von OSM für Produktivbetrieb ist damit bewusst akzeptiert — sollte die Nutzung deutlich wachsen, ggf. später auf einen kommerziellen Anbieter wechseln | 2026-08-06 |
| Routen-Geometrie (Straßenverlauf) wird bei der PROJ-42-Berechnung persistiert statt beim Kartenöffnen live nachgeladen | Geoapify liefert die Geometrie im selben Antwortpaket, das für Reihenfolge/Distanz/Dauer sowieso schon abgerufen und bezahlt wird — Persistierung kostet also keinen einzigen zusätzlichen API-Aufruf. On-Demand-Abruf bräuchte dagegen einen zweiten, separaten Geoapify-Aufruf bei jedem Kartenöffnen und müsste den bestehenden 30-Sekunden-Cooldown-Mechanismus komplett neu für diesen Fall nachbauen, sonst kann ein Fahrer durch mehrfaches Öffnen/Schließen der Karte unkontrolliert Kosten verursachen. Persistierung ist außerdem schneller (kein Warten auf eine zweite API-Antwort beim Öffnen, wichtig für das 10-Sekunden-Zeitlimit) und robuster (kein zusätzlicher Fehlerfall "Karte lädt, aber Route ist längst berechnet") | 2026-08-05 |
| Geometrie wird nach demselben Muster wie Distanz/Dauer/Ankunftszeit gespeichert (auf den bestehenden Tour-Zeilen, je Zeile derselbe Wert für die ganze Tour) statt in einer neuen eigenen Tabelle | Konsistent mit dem bereits etablierten Muster aus PROJ-42 (Alles-oder-nichts-Schreiblogik, ein Zeitstempel pro Tourengruppe); keine neue Tabelle, keine neue Beziehung, die zusätzlich synchron gehalten werden müsste | 2026-08-05 |
| Neue serverseitige Funktion liefert für eine Tour gebündelt: Depot-Koordinaten, alle Stopp-Koordinaten+Namen+Status+Ankunftszeit, Routen-Geometrie — statt die Karte mehrere bestehende Abfragen einzeln zusammensetzen zu lassen | Ein Abruf statt mehrerer reduziert Latenz (wichtig für das 10-Sekunden-Limit) und ist die einzige Stelle, die prüfen muss, ob der aufrufende Nutzer diese Tour überhaupt sehen darf (Fahrer nur eigene, Admin alle) — verhindert eine Wiederholung von BUG-1 aus PROJ-42 (fehlende Rollenprüfung), da die Prüfung nur an einer Stelle beweisbar korrekt sein muss statt an mehreren Abrufstellen | 2026-08-05 |
| Kartenansicht wird nur clientseitig gerendert (dynamischer Import ohne Server-Rendering) | Leaflet greift auf den Browser (`window`/`document`) zu und kann serverseitig (Next.js App Router SSR) nicht ausgeführt werden — ohne diese Absicherung würde die Seite beim Serverdurchlauf abstürzen | 2026-08-05 |
| Karte bleibt im Hintergrund offen, wenn durch Tap auf einen Marker das Stopp-Detail-Modal (PROJ-44) darüber geöffnet wird; schließt der Fahrer das Detail-Modal, landet er wieder auf der Karte (nicht direkt in der Liste) | Erhält den Kartenkontext (Zoom, welchen Stopp man sich gerade angesehen hat) statt den Fahrer bei jedem Marker-Tap komplett aus der Karte "herauszureißen" — spart unnötige Klicks, um die Karte erneut zu öffnen | 2026-08-05 |
| Bei zwei Stopps mit sehr nahen/identischen Koordinaten: nur die angezeigte Marker-Position wird minimal (wenige Meter) auseinandergerückt, die gespeicherten Koordinaten/Route bleiben unverändert; kein Marker-Clustering | Clustering lohnt sich erst bei sehr vielen Punkten (Hunderte); bei einer Tages-Tour mit realistisch bis zu ~25 Stopps würde ein Cluster nur einen zusätzlichen Klick zum "Aufklappen" erzeugen und damit dem Produktentscheid widersprechen, dass ein Tap auf einen Marker direkt das Detail-Modal öffnet (kein Zwischenschritt) | 2026-08-05 |
| Zeitüberschreitung (10 Sekunden laut Spec) wird sowohl beim serverseitigen Berechnungsaufruf als auch beim Laden der Kartendaten im Browser aktiv überwacht, nicht nur "gehofft" | Ohne aktive Zeitüberwachung könnte eine langsame Geoapify-Antwort dazu führen, dass der Fahrer beliebig lange auf einen Ladezustand ohne Rückmeldung starrt — verstößt gegen die Vorgabe "klare Fehlermeldung mit Erneut-versuchen-Button" und gegen die projektweite Grundhaltung "Security & Robustheit vor Geschwindigkeit" | 2026-08-05 |
| Leaflet + react-leaflet (bereits installierte, aber bisher ungenutzte Pakete) werden wiederverwendet statt einer neuen Karten-Bibliothek | Vermeidet ein zusätzliches Abhängigkeits-/Kostenrisiko (z. B. Google Maps JS SDK mit eigenem Billing) für eine Funktion, für die im Projekt schon alles Nötige vorhanden ist; kein zweiter Kartenanbieter-Vertrag nötig | 2026-08-05 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure (visueller Baum)

```
Fahrer-Seite (/fahrer) — unverändert
+-- TourListe (bestehend, PROJ-21/44)
    +-- pro Tour (Accordion-Element)
    |   +-- Kopfzeile (bestehend: Datum, Fahrer, Anzahl Stopps, Gesamtstrecke/-zeit)
    |   +-- NEU: "Karte"-Button
    |       - deaktiviert, wenn die Tour kein Datum hat ("ohne Datum")
    |       - eigener Klickbereich, öffnet NICHT/schließt die Stopp-Liste darunter
    |   +-- Stopp-Liste (bestehend, unverändert)
    |
    +-- NEU: TourKartenModal (Vollbild-Dialog, mobil-first)
    |   +-- Ladezustand
    |   |     "Route wird berechnet …" + Ladeanimation
    |   |     (erscheint, solange noch keine aktuelle Berechnung vorliegt
    |   |      oder eine neue ausgelöst werden musste)
    |   +-- Fehlerzustand
    |   |     Klartext-Fehlermeldung (z. B. "Route konnte nicht berechnet
    |   |     werden" / "Karte konnte nicht geladen werden") + "Erneut
    |   |     versuchen"-Button
    |   +-- Kartenansicht (bei Erfolg)
    |   |   +-- Hintergrundkarte (Straßenkarte, siehe Tech-Entscheidung 1)
    |   |   +-- Depot-Marker — eigenes Icon, ohne Nummer
    |   |   +-- Kunden-Marker — nummeriert nach Reihenfolge (`route_order`)
    |   |   |     - normale Darstellung: aktive Stopps
    |   |   |     - abgeschwächte Darstellung (ausgegraut + Häkchen):
    |   |   |       bereits erledigte Stopps
    |   |   |     - Tap auf einen Marker → öffnet das bestehende
    |   |   |       StoppDetailModal (PROJ-44) für diesen Stopp
    |   |   +-- Routenlinie — verbindet Depot → Stopp 1 → Stopp 2 → … in der
    |   |   |     berechneten Reihenfolge, folgt dem echten Straßenverlauf
    |   |   +-- automatischer Zoom auf alle Marker ("alles sichtbar")
    |   +-- Schließen-Button — kehrt zur Tourenliste zurück, Tour-Zustand
    |         bleibt unverändert
    |
    +-- StoppDetailModal (bestehend, PROJ-44 — unverändert wiederverwendet,
    |     kann jetzt sowohl aus der Liste als auch von einem Karten-Marker
    |     aus geöffnet werden; die Karte bleibt dabei im Hintergrund offen)
    +-- FahrtBearbeitenDialog (bestehend, PROJ-41 — unverändert)
```

### B) Data Model (Klartext)

Kein neues Datenmodell/keine neue Tabelle — bestehende Strukturen aus
PROJ-21/34/42/44 werden um wenige Felder erweitert:

**Bestehende Tabelle „Touren" (`tms.tours`, 1 Zeile = 1 Stopp):**
- Neu: **Route-Verlauf** — eine Liste von Koordinatenpunkten, die den
  tatsächlichen Straßenverlauf der ganzen Tour beschreibt. Wird zusammen mit
  den heute schon vorhandenen Feldern (Reihenfolge, Gesamtdistanz,
  Gesamtdauer, Ankunftszeit) bei jeder Routenberechnung neu geschrieben.
  Jede Stopp-Zeile derselben Tour trägt denselben Wert — genau wie das heute
  schon bei Gesamtdistanz/-dauer der Fall ist.

**App-seitiges "Fahrt"-Objekt** (in der Tourenliste/Karte verwendet):
- Neu: **Kunden-Standort** (Breiten-/Längengrad) — liegt heute schon in der
  Adress-Tabelle, wird jetzt zusätzlich am Fahrt-Objekt mitgeführt, damit die
  Karte ihn direkt nutzen kann, ohne eine eigene Abfrage zu bauen.

**App-seitiges "Tour"-Objekt** (eine ganze Tages-Tour eines Fahrers):
- Neu: **Route-Verlauf** der gesamten Tour — nur vorhanden, wenn eine
  vollständige, aktuelle Berechnung existiert (gleiche Bedingung wie heute
  schon für Gesamtdistanz/-dauer).
- Neu (nicht gespeichert, kommt aus der Konfiguration): **Depot-Standort** —
  wird beim Kartenaufruf mitgeliefert, damit das Depot als eigener Marker
  gezeigt werden kann.

**Neuer, gebündelter Kartendaten-Abruf** (kein neuer Datenbestand, sondern
eine neue Zusammenstellung bereits vorhandener Daten für genau eine Tour):
liefert bei Bedarf Depot-Standort, alle Stopps mit Name/Adresse/Status/
Ankunftszeit/Standort/Reihenfolge sowie den Route-Verlauf — inklusive der
Rollenprüfung, ob der anfragende Nutzer diese Tour überhaupt sehen darf.

### C) Tech Decisions (begründet)

1. **Kartenkacheln von OpenStreetMap-Standardkacheln statt Geoapify.**
   Architektur-Empfehlung war Geoapify (gleicher Anbieter/Vertrag wie die
   bestehende Routenberechnung, kein zweiter API-Key), der User hat sich im
   Review aber bewusst für die kostenlosen OSM-Standardkacheln entschieden.
   OSM unterliegt einer Fair-Use-Richtlinie für Produktivbetrieb (kein SLA,
   Risiko von Rate-Limits bei sehr intensiver Nutzung) — für den aktuellen,
   überschaubaren Nutzungsumfang (wenige Fahrer, gelegentliches Öffnen der
   Kartenansicht) bewusst in Kauf genommen. Bei deutlichem Wachstum kann
   später auf einen kommerziellen Anbieter (z. B. Geoapify) umgestellt
   werden, ohne den restlichen Aufbau der Kartenansicht zu ändern.
2. **Route-Geometrie wird bei der Berechnung gespeichert (persistiert), nicht
   erst beim Öffnen der Karte live abgerufen.** Das ist die zentrale
   Kosten-/Latenz-Entscheidung dieses Features:
   - **Kosten:** Geoapify liefert die Geometrie im selben Antwortpaket, das für
     Reihenfolge/Distanz/Dauer ohnehin schon abgerufen (und bezahlt) wird —
     Persistierung verursacht also **keinen zusätzlichen kostenpflichtigen
     Aufruf**. On-Demand-Abruf würde dagegen bei **jedem** Kartenöffnen einen
     zweiten, separaten Geoapify-Aufruf bedeuten.
   - **Kosten-Schutzmechanismus:** Für die Berechnung existiert bereits ein
     30-Sekunden-Cooldown gegen zu häufige, teure Wiederholungen. Persistierung
     erbt diesen Schutz automatisch mit. On-Demand-Abruf bräuchte einen
     komplett neuen, eigenen Schutzmechanismus nur für das Kartenöffnen, sonst
     könnte ein Fahrer durch mehrfaches Öffnen/Schließen unkontrolliert Kosten
     verursachen.
   - **Latenz:** Beim Öffnen der Karte muss nur noch aus der Datenbank gelesen
     werden (schnell, keine externe Abhängigkeit) — wichtig für die
     10-Sekunden-Zeitvorgabe aus der Spec. On-Demand-Abruf hätte eine zweite
     Wartezeit auf eine externe API zusätzlich zur eigentlichen
     Berechnung eingeführt.
   - **Konsistenz mit den Edge Cases:** Die Spec fordert, dass sich die
     angezeigte Route während einer offenen Karte nicht "unangekündigt"
     ändert. Ein fest zum Berechnungszeitpunkt gespeicherter Verlauf erfüllt
     das automatisch, ohne eine eigene "Snapshot"-Logik bauen zu müssen.
   - **Nachteil (bewusst in Kauf genommen):** Etwas mehr Speicherplatz pro
     Zeile (Geometrie ein paar KB, auf jeder Stopp-Zeile redundant abgelegt,
     analog zum heutigen Muster). Bei realistisch wenigen Stopps pro Fahrer
     und Tag ist das vernachlässigbar gegenüber wiederholten API-Kosten.
3. **Karte lädt/rendert ausschließlich im Browser (kein Server-Rendering).**
   Leaflet braucht Zugriff auf den Browser (Fenster/Dokument) und würde beim
   serverseitigen Rendering von Next.js abstürzen.
4. **Ein einziger, gebündelter Kartendaten-Abruf pro Tour** statt mehrerer
   Einzelabrufe. Reduziert die Wartezeit (ein Roundtrip statt mehrerer) und
   ist die einzige Stelle, an der die Berechtigungsprüfung sitzen muss
   (Fahrer sieht nur eigene Touren, Admin alle) — verhindert, dass diese
   Prüfung wie in einem früheren Fund (PROJ-42, BUG-1) versehentlich an einer
   Abrufstelle vergessen wird.
5. **Klick auf einen Kunden-Marker öffnet das bestehende Stopp-Detail-Modal
   (PROJ-44) über der Karte; die Karte bleibt dahinter offen.** Schließt der
   Fahrer das Detail-Modal, landet er wieder auf der Karte (nicht in der
   Liste) — erhält den Kartenkontext (Zoom, Übersicht), ohne dass die Karte
   bei jedem Marker-Tap komplett neu geöffnet werden müsste.
6. **Nahe/identische Koordinaten:** nur die angezeigte Marker-**Position**
   wird bei Bedarf um wenige Meter sichtbar auseinandergerückt (rein
   optisch), gespeicherte Koordinaten und Route bleiben unverändert. Kein
   Marker-Clustering: Clustering lohnt sich erst bei sehr vielen Punkten
   (Hunderte) und würde hier einen zusätzlichen "Aufklapp"-Klick erzwingen —
   das widerspricht dem bereits getroffenen Produktentscheid, dass ein Tap
   auf einen Marker direkt und ohne Zwischenschritt das Detail-Modal öffnet.
7. **10-Sekunden-Zeitüberschreitung wird aktiv überwacht** (sowohl beim
   serverseitigen Berechnungsaufruf als auch beim Laden der Kartendaten im
   Browser), statt sich auf ein "es wird schon rechtzeitig antworten" zu
   verlassen — damit im Fehlerfall garantiert die geforderte Fehlermeldung
   mit "Erneut versuchen" erscheint, statt dass der Fahrer unbegrenzt auf
   einen Ladezustand starrt. Entspricht der projektweiten Grundhaltung
   „Security & Robustheit vor Geschwindigkeit".
8. **Wiederverwendung von Leaflet + react-leaflet** (bereits installiert,
   bisher ungenutzt) statt einer neuen Karten-Bibliothek — kein zusätzlicher
   Vertrag/Kostenpunkt (z. B. Google Maps JS SDK mit eigenem Billing), keine
   zweite Karten-Technologie im Projekt.
9. **Keine neue Rollenlogik** — der bestehende Rollen-Gate für `/fahrer`
   (Rollen `fahrer`/`admin`) deckt auch den "Karte"-Button ab; zusätzlich
   prüft der neue Kartendaten-Abruf pro Anfrage, ob der Nutzer genau diese
   Tour sehen darf (Fahrer nur eigene, Admin alle) — analog zu allen
   bestehenden Fahrten-Abrufen.
10. **Schutz gegen Mehrfach-Klicks:** Solange eine Berechnung/ein Kartendaten-
    Abruf für eine Tour läuft, ist der "Karte"-Button für diese Tour
    inaktiv/zeigt den Ladezustand — verhindert parallele, überflüssige
    Berechnungen bei hektischem Mehrfach-Tippen (Edge Case aus der Spec).

### D) Dependencies

Keine neuen Pakete nötig — bereits in `package.json` vorhanden, aber bisher
ungenutzt:
- **leaflet** — Karten-Rendering (Marker, Linien, Zoom/„fit bounds")
- **react-leaflet** — React-Anbindung für Leaflet
- **@types/leaflet** — TypeScript-Typen dafür

Kein neuer Kartenanbieter-Vertrag nötig — OpenStreetMap-Standardkacheln
(siehe Entscheidung 1) sind kostenlos nutzbar, kein zusätzlicher API-Key
erforderlich.

## Frontend-Implementierung (2026-08-06)

### Komponenten
- **`src/lib/actions/tour-karte-helpers.ts`** — TypeScript-Interfaces für Kartendaten (KartenStopp, Depot, RoutenGeometrie, TourKarteDaten)
- **`src/lib/actions/tour-karte.ts`** — Server Action Schnittstelle `getTourKarteDaten()` (TODO: Backend-Implementierung in /backend)
- **`src/components/fahrer/tour-karte-modal.tsx`** — Dialog-Modal mit Lad-/Fehlerzustände, 10-Sekunden-Timeout, Retry
- **`src/components/fahrer/tour-karte-inhalt.tsx`** — Leaflet-Kartenkomponente (dynamisch geladen, SSR: false)
- **`src/components/fahrer/tour-liste.tsx`** — erweitert um "Karte"-Button in AccordionTrigger

### Umsetzung der Acceptance Criteria
- [x] AC1: Depot-Marker (eigenständiges Icon, keine Nummer) + nummerierte Stopp-Marker verbunden durch Routenlinie
- [x] AC2: Tap auf Marker öffnet StoppDetailModal
- [x] AC3: Erledigte Stopps optisch abgeschwächt (Icon-Farbe ausgeblichen)
- [x] AC4: Routenberechnung wird bei Bedarf ausgelöst, Ladezustand wird angezeigt
- [x] AC5: Klare Fehlermeldung mit "Erneut versuchen"-Button
- [x] AC6: Button deaktiviert wenn Tour kein Datum hat
- [x] AC7: Button funktioniert in beiden Tabs ("Mir zugewiesen" + "Tourenplanung")
- [x] AC8: Rollen-Gate bleibt bestehend (fahrer/admin nur via /fahrer)
- [x] AC9: Modal schließt-Button, Karte bleibt nicht persistent

### Tech-Entscheidungen gelebt
- [x] Leaflet + react-leaflet (bereits installiert, wiederverwendet)
- [x] OpenStreetMap-Standardkacheln (kostenlos, kein zusätzlicher API-Key)
- [x] Karte nur clientseitig (dynamischer Import, `ssr: false`)
- [x] Ein gebündelter Server-Action-Abruf (definiert als Schnittstelle, Backend folgt)
- [x] 10-Sekunden-Timeout aktiv überwacht
- [x] Mehrfach-Klick-Schutz (Button deaktiviert während Ladevorgang)
- [x] Stopp-Detail-Modal wird über der Karte geöffnet, Karte bleibt im Hintergrund offen

### Build & Lint
- ESLint: grün (nur bestehende Warnung in revenue-chart.tsx, nicht neu)
- TypeScript Build: grün
- Alle Acceptance Criteria adressiert

### Offen für /backend
Backend-Implementierung der Server Action `getTourKarteDaten()` erforderlich mit:
1. Rollen-Check (fahrer nur eigene, admin alle)
2. Koordinaten-Abruf aus `partner_addresses`
3. Routen-Geometrie aus persistiertem Feld in `tms.tours`
4. 10-Sekunden-Timeout bei Datenbankabfrage
5. Alles-oder-nichts Fehlerbehandlung

Siehe `tour-karte-helpers.ts` für Typ-Definitionen und `tour-karte.ts` für Funktionssignatur.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
