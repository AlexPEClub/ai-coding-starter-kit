# PROJ-10: Backend Uebersetzungssystem (Datenmodell + API)

## Status: Planned

## Abhaengigkeiten
- Benoetigt: PROJ-3 (Service-Typen Verwaltung) - service_typen Tabelle muss existieren
- Benoetigt: PROJ-4 (Widget-Konfiguration) - Widget-API Endpoints muessen existieren
- Benoetigt: PROJ-8 (Mehrsprachigkeit) - Sprach-System im Widget (DE/FR/IT)

## Beschreibung
Generisches Uebersetzungssystem fuer datenbankbasierte Inhalte. Ermoeglicht die Uebersetzung beliebiger Felder aus beliebigen Tabellen in die unterstuetzten Sprachen (DE, FR, IT). Der deutsche Text bleibt immer in der Originaltabelle (z.B. `service_typen.name`), Uebersetzungen fuer FR und IT werden in einer separaten, generischen Uebersetzungstabelle verwaltet.

**Erster Anwendungsfall:** Uebersetzung der Service-Typ-Namen (z.B. "Hydraulikleitungen" -> FR: "Conduites hydrauliques", IT: "Condutture idrauliche").

**Erweiterbarkeit:** Das System ist so designt, dass spaeter weitere Felder (z.B. Stuetzpunkt-Namen, Beschreibungen) ohne Schema-Aenderungen uebersetzt werden koennen.

## Abgrenzung
- Dieses Feature umfasst NUR das Datenmodell und die API-Logik.
- Die Admin-Oberflaeche zum Pflegen der Uebersetzungen ist PROJ-11.
- Statische UI-Texte im Widget (Buttons, Labels etc.) bleiben im bestehenden i18n-System (PROJ-8).
- Das Admin-Panel selbst bleibt einsprachig (Deutsch).

## User Stories
- Als Widget-Besucher moechte ich Service-Typ-Namen in meiner Sprache sehen, damit ich die angebotenen Services verstehe, auch wenn ich kein Deutsch spreche
- Als System moechte ich eine generische Uebersetzungstabelle haben, damit zukuenftige uebersetzbare Felder ohne Datenbank-Migrationen hinzugefuegt werden koennen
- Als Widget moechte ich ueber einen Query-Parameter (`?lang=fr`) uebersetzte Inhalte von der API erhalten, damit ich keine eigene Uebersetzungslogik brauche
- Als Widget moechte ich bei fehlender Uebersetzung automatisch den deutschen Text erhalten, damit nie ein leerer oder fehlerhafter Wert angezeigt wird
- Als Entwickler moechte ich eine klare API haben, um Uebersetzungen fuer beliebige Tabellen/Felder abzufragen und zu speichern

## Datenmodell

### Neue Tabelle: `translations`
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| id | UUID | Ja | Primaerschluessel |
| table_name | String | Ja | Name der Quelltabelle (z.B. "service_typen") |
| row_id | UUID | Ja | ID der Zeile in der Quelltabelle |
| field_name | String | Ja | Name des Feldes (z.B. "name") |
| language | String(2) | Ja | Sprachcode: "fr" oder "it" |
| value | Text | Ja | Der uebersetzte Text |
| created_at | Timestamp | Auto | Erstellungsdatum |
| updated_at | Timestamp | Auto | Letztes Update |

### Constraints
- UNIQUE Constraint auf `(table_name, row_id, field_name, language)` - verhindert doppelte Uebersetzungen
- `language` ist auf "fr" und "it" beschraenkt (DE ist immer der Originaltext in der Quelltabelle)
- `table_name` wird initial auf "service_typen" beschraenkt, kann spaeter erweitert werden
- Fremdschluessel-Integritaet: Wenn eine Zeile in der Quelltabelle geloescht wird, muessen die zugehoerigen Uebersetzungen ebenfalls geloescht werden (CASCADE DELETE via Applikationslogik oder Trigger)

### Beispiel-Daten
| table_name | row_id | field_name | language | value |
|------------|--------|------------|----------|-------|
| service_typen | uuid-1 | name | fr | Conduites hydrauliques |
| service_typen | uuid-1 | name | it | Condutture idrauliche |
| service_typen | uuid-2 | name | fr | Technique d'entrainement |
| service_typen | uuid-2 | name | it | Tecnica di azionamento |

## API-Anpassungen

### Bestehende Widget-APIs erweitern

**GET /api/widget/config?lang=fr**
- Neuer optionaler Query-Parameter: `lang` (Werte: "de", "fr", "it")
- Default wenn nicht angegeben: "de"
- Bei `lang=de`: Verhalten wie bisher (name aus service_typen)
- Bei `lang=fr` oder `lang=it`: Service-Namen werden aus der translations-Tabelle geladen
- Fallback: Wenn keine Uebersetzung vorhanden, wird der deutsche Name zurueckgeliefert
- Response-Format bleibt identisch (services Array mit id, name, icon)

**GET /api/widget/stuetzpunkte?lang=fr**
- Gleicher `lang`-Parameter
- Service-Typ-Namen innerhalb der Stuetzpunkt-Daten werden uebersetzt
- Alle anderen Felder (Stuetzpunkt-Name, Adresse etc.) bleiben Deutsch

### Neue Admin-API-Endpoints

**GET /api/translations?table=service_typen&field=name**
- Gibt alle Uebersetzungen fuer eine bestimmte Tabelle/Feld-Kombination zurueck
- Gruppiert nach row_id mit allen Sprachen
- Geschuetzt (Admin-Auth erforderlich)

**PUT /api/translations**
- Erstellt oder aktualisiert eine Uebersetzung (Upsert)
- Request Body: `{ table_name, row_id, field_name, language, value }`
- Geschuetzt (Admin-Auth erforderlich)
- Validierung: table_name muss erlaubt sein, language muss "fr" oder "it" sein

**DELETE /api/translations/:id**
- Loescht eine einzelne Uebersetzung
- Geschuetzt (Admin-Auth erforderlich)

## Acceptance Criteria
- [ ] Tabelle `translations` existiert in Supabase mit allen definierten Feldern und Constraints
- [ ] UNIQUE Constraint auf (table_name, row_id, field_name, language) verhindert Duplikate
- [ ] GET /api/widget/config?lang=fr liefert Service-Namen auf Franzoesisch
- [ ] GET /api/widget/config?lang=it liefert Service-Namen auf Italienisch
- [ ] GET /api/widget/config ohne lang-Parameter liefert deutsche Namen (Rueckwaertskompatibilitaet)
- [ ] GET /api/widget/config?lang=de liefert deutsche Namen (explizit)
- [ ] Fallback funktioniert: Wenn FR-Uebersetzung fehlt, wird DE-Name zurueckgeliefert
- [ ] GET /api/widget/stuetzpunkte?lang=fr liefert uebersetzte Service-Typ-Namen in den Stuetzpunkt-Daten
- [ ] Admin-API GET /api/translations liefert Uebersetzungen gruppiert nach Quell-Entitaet
- [ ] Admin-API PUT /api/translations erstellt neue Uebersetzung (Upsert-Verhalten)
- [ ] Admin-API DELETE /api/translations/:id loescht eine Uebersetzung
- [ ] Admin-APIs sind geschuetzt (nur mit gueltigem Admin-Session aufrufbar)
- [ ] Wenn ein Service-Typ geloescht wird (PROJ-3), werden zugehoerige Uebersetzungen automatisch mitgeloescht
- [ ] Response-Zeiten der Widget-APIs bleiben unter 500ms auch mit Uebersetzungs-Lookup
- [ ] Ungueltige lang-Werte (z.B. ?lang=en) werden ignoriert und Fallback auf DE verwendet

## Edge Cases
- Was passiert wenn lang=en oder ein nicht unterstuetzter Sprachcode uebergeben wird? -> Fallback auf DE, kein Fehler
- Was passiert wenn nur FR aber nicht IT uebersetzt ist? -> FR liefert Uebersetzung, IT liefert deutschen Fallback, pro Sprache unabhaengig
- Was passiert wenn ein Service-Typ umbenannt wird (DE-Name aendert sich)? -> Uebersetzungen bleiben bestehen, Admin muss diese manuell aktualisieren (Hinweis in PROJ-11)
- Was passiert wenn die translations-Tabelle leer ist? -> Alle APIs liefern deutsche Namen, keine Fehler
- Was passiert bei gleichzeitigem Schreiben derselben Uebersetzung? -> UNIQUE Constraint + Upsert-Logik verhindert Inkonsistenzen
- Was passiert wenn row_id auf eine nicht existierende Zeile verweist? -> Validierung beim Schreiben, verwaiste Uebersetzungen werden beim Loeschen der Quell-Entitaet aufgeraeumt
- Was passiert bei sehr vielen Uebersetzungen (Skalierung)? -> Index auf (table_name, row_id, field_name, language) sorgt fuer performante Abfragen
- Was passiert wenn der lang-Parameter in der URL fehlt aber das Widget eine Sprache gesetzt hat? -> Widget muss lang-Parameter immer mitsenden (Verantwortung liegt beim Widget-Code)

## Technische Anforderungen
- Supabase PostgreSQL fuer die translations-Tabelle
- Index auf (table_name, row_id, field_name, language) fuer performante Lookups
- RLS (Row Level Security) auf translations-Tabelle: Lesen oeffentlich (fuer Widget), Schreiben nur fuer authentifizierte Admins
- API Response-Zeiten < 500ms inklusive Uebersetzungs-Lookup
- Rueckwaertskompatibilitaet: Bestehende API-Aufrufe ohne lang-Parameter funktionieren identisch wie vorher

## Hinweis zur Erweiterbarkeit
Das System ist so designt, dass spaeter weitere Felder uebersetzt werden koennen, ohne das Datenmodell zu aendern. Beispiele fuer zukuenftige Erweiterungen:
- Stuetzpunkt-Namen: table_name="stuetzpunkte", field_name="name"
- Stuetzpunkt-Beschreibungen: table_name="stuetzpunkte", field_name="beschreibung"
- Weitere Tabellen/Felder nach Bedarf

Fuer jede neue uebersetzbare Entitaet muss lediglich:
1. Die erlaubte table_name-Liste in der API-Validierung erweitert werden
2. Die entsprechende Widget-API um den lang-Parameter und Uebersetzungs-Lookup ergaenzt werden
3. Die Admin-UI (PROJ-11) um die neue Entitaet erweitert werden
