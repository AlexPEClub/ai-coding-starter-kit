# PROJ-8: Storefinder Widget - Mehrsprachigkeit (i18n)

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-4 (Widget-Konfiguration) - für Standard-Sprache

## Beschreibung
Mehrsprachiges Frontend für das Storefinder-Widget. Unterstützt Deutsch (DE), Französisch (FR) und Italienisch (IT). Nur UI-Texte werden übersetzt, Stützpunkt-Daten bleiben einsprachig (DE).

## User Stories
- Als Website-Besucher möchte ich den Storefinder in meiner Sprache nutzen können (DE/FR/IT)
- Als Website-Besucher möchte ich die Sprache im Widget wechseln können
- Als Website-Besucher möchte ich, dass die Sprache automatisch erkannt wird (Browser-Sprache)

## Übersetzte Bereiche (nur UI-Texte)
| Schlüssel | DE | FR | IT |
|-----------|----|----|-----|
| search.placeholder | "PLZ oder Ort eingeben" | "Entrez NPA ou lieu" | "Inserire CAP o luogo" |
| search.button | "Suchen" | "Rechercher" | "Cerca" |
| filter.services | "Services filtern" | "Filtrer les services" | "Filtra servizi" |
| filter.reset | "Filter zurücksetzen" | "Réinitialiser les filtres" | "Reimposta filtri" |
| results.count | "{count} Stützpunkte gefunden" | "{count} points de service trouvés" | "{count} punti di servizio trovati" |
| results.empty | "Keine Stützpunkte gefunden" | "Aucun point de service trouvé" | "Nessun punto di servizio trovato" |
| map.myLocation | "Mein Standort" | "Ma position" | "La mia posizione" |
| map.radius | "Umkreis" | "Rayon" | "Raggio" |
| card.phone | "Telefon" | "Téléphone" | "Telefono" |
| card.email | "E-Mail" | "E-mail" | "E-mail" |
| card.website | "Website" | "Site web" | "Sito web" |
| card.closed | "Temporär geschlossen" | "Temporairement fermé" | "Temporaneamente chiuso" |
| card.hours.daytime | "Geöffnet: {from} - {to}" | "Ouvert: {from} - {to}" | "Aperto: {from} - {to}" |
| card.hours.24h | "24h Service" | "Service 24h" | "Servizio 24h" |
| geolocation.error | "Standort konnte nicht ermittelt werden" | "Impossible de déterminer la position" | "Impossibile determinare la posizione" |
| pagination.loadMore | "Mehr anzeigen" | "Afficher plus" | "Mostra di più" |

## Nicht übersetzte Bereiche
- Stützpunkt-Name (bleibt DE)
- Stützpunkt-Adresse (bleibt DE)
- Service-Typ Namen (bleiben DE)
- Backend komplett (bleibt DE)

## Acceptance Criteria
- [ ] Sprachumschalter im Widget-Header: DE | FR | IT
- [ ] Standardsprache wird aus Widget-Konfiguration geladen (PROJ-4)
- [ ] Automatische Spracherkennung: Browser-Sprache wird erkannt (de, fr, it)
- [ ] Fallback auf Standardsprache wenn Browser-Sprache nicht unterstützt wird
- [ ] Alle UI-Texte (Buttons, Labels, Platzhalter, Meldungen) sind übersetzt
- [ ] Sprachwechsel erfolgt ohne Page-Reload (Client-seitig)
- [ ] Pluralisierung korrekt: "1 Stützpunkt gefunden" vs "5 Stützpunkte gefunden"
- [ ] Datum/Zeitformat passt sich an Sprache an (24h Format für alle)
- [ ] Gewählte Sprache wird in LocalStorage gespeichert (Persistenz)

## Edge Cases
- Was passiert wenn Browser-Sprache "fr-CH" ist? → Erkennung von Hauptsprache "fr"
- Was passiert wenn Browser-Sprache "en" ist? → Fallback auf konfigurierte Standardsprache
- Was passiert wenn ein Übersetzungsschlüssel fehlt? → Fallback auf DE
- Was passiert wenn LocalStorage nicht verfügbar ist? → Sprache bei jedem Laden neu ermitteln

## Technische Anforderungen
- Übersetzungen als JSON-Dateien (de.json, fr.json, it.json)
- Lightweight i18n Library (z.B. eigene Mini-Implementierung, kein großes Framework nötig)
- Interpolation für dynamische Werte: "{count} Stützpunkte gefunden"
- Bundle-Größe beachten: Alle 3 Sprachen < 5KB

## Tech-Design (Solution Architect)

### Component-Struktur

```
Widget → Sprach-System
├── LanguageSwitcher           ← DE | FR | IT Buttons im Widget-Header
├── i18n Provider              ← Stellt Übersetzungen bereit (React Context)
│   └── useTranslation Hook    ← Jede Komponente nutzt: t("search.placeholder")
└── Übersetzungs-Dateien
    ├── de.json                ← Deutsche Texte (~20 Schlüssel)
    ├── fr.json                ← Französische Texte
    └── it.json                ← Italienische Texte
```

### Daten-Model

```
Sprach-State:
- Aktuelle Sprache: "de" / "fr" / "it"
- Gespeichert in: localStorage (Key: "heizmann-storefinder-lang")

Sprach-Erkennung (Reihenfolge):
1. localStorage (User hat früher gewechselt)
2. Browser-Sprache (navigator.language → "de-CH" → "de")
3. Widget-Konfiguration (Standard aus PROJ-4)
4. Fallback: "de"

Alle 3 Sprachen werden im Widget-Bundle mitgeliefert (~3KB).
Kein separater API-Call für Übersetzungen nötig.
```

### Übersetzungs-Funktion

```
So nutzt jede Widget-Komponente die Übersetzungen:

t("search.placeholder")       → "PLZ oder Ort eingeben"
t("results.count", { count: 5 }) → "5 Stützpunkte gefunden"
t("card.hours.daytime", { from: "07:00", to: "17:00" })
                                → "Geöffnet: 07:00 - 17:00"
```

### Tech-Entscheidungen

```
Warum eigene Mini-i18n statt next-intl oder react-i18next?
→ Das Widget ist standalone (nicht Next.js). Eine eigene kleine Lösung
  mit ~50 Zeilen Code ist viel leichter als ein i18n-Framework (30-50KB).
  Nur 3 Sprachen mit ~20 Schlüsseln → kein großes Framework nötig.

Warum alle Sprachen im Bundle statt per API laden?
→ Nur ~3KB für alle 3 Sprachen. Schneller als ein zusätzlicher API-Call.
  Kein Flackern beim Sprachwechsel.

Warum localStorage für Sprach-Persistenz?
→ Einfachste Lösung. Überlebt Browser-Reload.
  Fallback auf Browser-Sprache wenn localStorage nicht verfügbar.
```

### Dependencies
- Keine zusätzlichen Packages (eigene Mini-i18n Implementierung)
