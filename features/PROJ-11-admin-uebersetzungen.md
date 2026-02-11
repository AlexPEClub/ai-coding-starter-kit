# PROJ-11: Admin Uebersetzungsverwaltung (UI)

## Status: Planned

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Admin-Authentifizierung) - fuer geschuetzten Backend-Zugriff
- Benoetigt: PROJ-3 (Service-Typen Verwaltung) - Service-Typen muessen existieren und verwaltbar sein
- Benoetigt: PROJ-10 (Uebersetzungssystem) - translations-Tabelle und API-Endpoints muessen existieren

## Beschreibung
Separate Admin-Seite unter `/admin/uebersetzungen` zum Pflegen von Uebersetzungen fuer datenbankbasierte Inhalte. Der Admin sieht eine tabellarische Uebersicht aller uebersetzbaren Eintraege mit ihrem deutschen Originaltext und den Uebersetzungen fuer FR und IT. Fehlende Uebersetzungen sind klar erkennbar.

**Erster Anwendungsfall:** Uebersetzung der Service-Typ-Namen.

## Abgrenzung
- Dieses Feature umfasst NUR die Admin-Oberflaeche zum Pflegen der Uebersetzungen.
- Das Datenmodell und die API-Logik sind in PROJ-10 definiert.
- Statische Widget-UI-Texte (PROJ-8) werden NICHT ueber diese Oberflaeche gepflegt (die bleiben in Code-Dateien).
- Diese Seite veraendert NICHT die Originaldaten (z.B. den deutschen Service-Namen). Dafuer bleibt die bestehende Service-Verwaltung (PROJ-3) zustaendig.

## User Stories
- Als Admin moechte ich eine uebersichtliche Seite haben, auf der ich alle uebersetzbaren Inhalte sehen kann, damit ich weiss, was bereits uebersetzt ist und was noch fehlt
- Als Admin moechte ich fuer jeden Service-Typ die franzoesische und italienische Uebersetzung eingeben koennen, damit das Widget die Service-Namen in der richtigen Sprache anzeigt
- Als Admin moechte ich auf einen Blick sehen, welche Uebersetzungen noch fehlen, damit ich den Uebersetzungsstatus schnell einschaetzen kann
- Als Admin moechte ich Uebersetzungen inline bearbeiten koennen (direkt in der Tabelle), damit ich nicht fuer jeden Eintrag ein separates Formular oeffnen muss
- Als Admin moechte ich eine bestehende Uebersetzung aendern koennen, falls sich der Text aendert oder ein Fehler korrigiert werden muss
- Als Admin moechte ich eine Uebersetzung loeschen koennen, damit bei Bedarf wieder der deutsche Fallback greift

## Seitenstruktur

### Seite: /admin/uebersetzungen

**Navigation:** Neuer Menuepunkt "Uebersetzungen" in der Admin-Sidebar (zwischen "Services" und "Einstellungen").

**Aufbau der Seite:**

1. **Seitentitel:** "Uebersetzungen"
2. **Beschreibungstext:** "Pflegen Sie hier die Uebersetzungen fuer mehrsprachige Inhalte. Der deutsche Text ist der Originalwert. Fehlende Uebersetzungen werden im Widget durch den deutschen Text ersetzt."
3. **Tab-Navigation** (fuer zukuenftige Erweiterbarkeit):
   - Tab "Service-Typen" (aktiv, einziger Tab im MVP)
   - Weitere Tabs koennen spaeter ergaenzt werden (z.B. "Stuetzpunkte")
4. **Uebersetzungstabelle** (Hauptbereich)
5. **Fortschrittsanzeige** (Header-Bereich)

### Uebersetzungstabelle

| Spalte | Inhalt | Editierbar |
|--------|--------|------------|
| Icon | Lucide-Icon des Service-Typs | Nein |
| Deutsch (Original) | Name aus service_typen.name | Nein (nur Anzeige, Verweis auf PROJ-3) |
| Franzoesisch | Uebersetzung FR | Ja (Inline-Editing) |
| Italienisch | Uebersetzung IT | Ja (Inline-Editing) |
| Status | Uebersetzungsstatus-Indikator | Nein (automatisch) |

### Fortschrittsanzeige
- Zeigt pro Sprache den Uebersetzungsfortschritt: z.B. "FR: 3/5 uebersetzt" und "IT: 2/5 uebersetzt"
- Visuelle Darstellung als Progress-Bar oder Badge-Zaehler
- Gesamtstatus auf einen Blick erkennbar

### Status-Indikatoren pro Zeile
- Vollstaendig uebersetzt (FR + IT vorhanden): Gruener Haken
- Teilweise uebersetzt (nur eine Sprache): Orangefarbener Punkt
- Keine Uebersetzung: Grauer Strich oder "Fehlt"-Label

## Inline-Editing Verhalten

### Bearbeitungsmodus
- Klick auf ein Uebersetzungsfeld oeffnet einen Inline-Input direkt in der Tabellenzelle
- Leere Zellen zeigen einen Platzhalter: "Uebersetzung eingeben..."
- Speichern: Enter-Taste oder Klick ausserhalb des Feldes (Blur)
- Abbrechen: Escape-Taste (stellt den vorherigen Wert wieder her)
- Waehrend des Speicherns: Kurzer Ladeindikator (Spinner) in der Zelle
- Nach erfolgreichem Speichern: Kurze visuelle Bestaetigung (z.B. gruener Haken fuer 2 Sekunden)
- Bei Fehler: Rote Fehlermeldung unterhalb der Zelle

### Loeschen einer Uebersetzung
- Wenn ein Uebersetzungsfeld geleert und gespeichert wird (leerer String), wird die Uebersetzung geloescht
- Das bedeutet: Im Widget wird wieder der deutsche Fallback angezeigt
- Kein separater Loeschen-Button noetig

## Acceptance Criteria
- [ ] Neue Seite `/admin/uebersetzungen` ist im Admin-Panel erreichbar
- [ ] Menuepunkt "Uebersetzungen" erscheint in der Admin-Sidebar
- [ ] Tab-Navigation mit "Service-Typen" Tab ist sichtbar (erweiterbar fuer zukuenftige Tabs)
- [ ] Tabelle zeigt alle Service-Typen mit Icon, deutschem Namen und Uebersetzungsfeldern
- [ ] Service-Typen werden in der gleichen Reihenfolge angezeigt wie in der Service-Verwaltung (sort_order)
- [ ] Inline-Editing: Klick auf ein Uebersetzungsfeld oeffnet einen editierbaren Input
- [ ] Speichern per Enter-Taste funktioniert
- [ ] Speichern per Blur (Klick ausserhalb) funktioniert
- [ ] Abbrechen per Escape-Taste funktioniert
- [ ] Ladeindikator waehrend des API-Calls (Speichern) ist sichtbar
- [ ] Erfolgsbestaetigung nach dem Speichern wird kurz angezeigt (2 Sekunden)
- [ ] Fehlermeldung wird angezeigt wenn das Speichern fehlschlaegt
- [ ] Loeschen: Leeres Feld speichern entfernt die Uebersetzung
- [ ] Fortschrittsanzeige zeigt korrekte Zaehler pro Sprache (z.B. "FR: 3/5 uebersetzt")
- [ ] Status-Indikator pro Zeile zeigt den Uebersetzungsstatus (vollstaendig/teilweise/fehlend)
- [ ] Seite ist nur fuer authentifizierte Admins zugaenglich
- [ ] Leerer Zustand: Wenn keine Service-Typen existieren, wird ein Hinweis angezeigt mit Verweis auf die Service-Verwaltung
- [ ] Alle UI-Komponenten verwenden shadcn/ui

## Edge Cases
- Was passiert wenn ein neuer Service-Typ angelegt wird (PROJ-3)? -> Er erscheint automatisch in der Uebersetzungstabelle mit leeren Uebersetzungsfeldern
- Was passiert wenn ein Service-Typ geloescht wird (PROJ-3)? -> Er verschwindet aus der Uebersetzungstabelle (Uebersetzungen werden via PROJ-10 automatisch mitgeloescht)
- Was passiert wenn ein Service-Typ umbenannt wird (DE-Name aendert sich)? -> Der neue deutsche Name wird in der Tabelle angezeigt, bestehende FR/IT-Uebersetzungen bleiben unveraendert. Der Admin muss pruefen, ob die Uebersetzungen noch passen.
- Was passiert wenn der Admin sehr schnell hintereinander mehrere Felder bearbeitet? -> Jeder Save ist ein unabhaengiger API-Call, kein Batching. Konflikte werden durch den UNIQUE Constraint in PROJ-10 verhindert.
- Was passiert wenn der Admin nur Leerzeichen eingibt? -> Trimmen des Inputs vor dem Speichern. Nur-Leerzeichen wird als leerer String behandelt (Uebersetzung wird geloescht).
- Was passiert wenn zwei Admins gleichzeitig dieselbe Uebersetzung bearbeiten? -> Last-Write-Wins (Upsert-Verhalten aus PROJ-10). Kein optimistisches Locking im MVP.
- Was passiert bei einem Netzwerkfehler waehrend des Speicherns? -> Fehlermeldung in der Zelle, der alte Wert bleibt im Input erhalten, der Admin kann es erneut versuchen

## Technische Anforderungen
- Next.js App Router Page unter `/admin/(dashboard)/uebersetzungen/page.tsx`
- Shadcn/ui Komponenten: Table, Tabs, Input, Badge, Card, Progress (oder Custom)
- Client-seitige Komponente (`'use client'`) fuer Inline-Editing und State-Management
- API-Calls an die in PROJ-10 definierten Admin-Endpoints (GET/PUT/DELETE /api/translations)
- Debounce ist NICHT noetig (Speichern nur bei explizitem Enter/Blur, nicht bei jedem Tastendruck)
- Seite muss responsive sein, aber primaere Nutzung ist Desktop

## Hinweis zur Erweiterbarkeit
Wenn spaeter weitere Tabellen uebersetzbar werden (z.B. Stuetzpunkt-Namen), muss in dieser Seite lediglich:
1. Ein neuer Tab hinzugefuegt werden (z.B. "Stuetzpunkte")
2. Die Tabelle fuer den neuen Tab die entsprechenden Eintraege aus der translations-Tabelle laden
3. Die gleiche Inline-Editing-Logik wird wiederverwendet
