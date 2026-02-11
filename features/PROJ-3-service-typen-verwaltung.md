# PROJ-3: Service-Typen Verwaltung (Backend)

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (Admin-Authentifizierung) - für geschützten Backend-Zugriff

## Beschreibung
Verwaltung der Service-Kategorien, die Stützpunkten zugeordnet werden können. Jeder Service hat einen Namen und ein Icon.

## Vordefinierte Services (Initial-Daten)
| Service | Icon-Vorschlag |
|---------|---------------|
| Hydraulikleitungen | Wrench/Pipe Icon |
| Antriebstechnik | Gear/Cog Icon |
| Technische Schläuche | Tube/Hose Icon |
| Fluidtechnik | Droplet Icon |
| Mobile Werkstatt | Truck/Van Icon |

## User Stories
- Als Admin möchte ich neue Service-Typen anlegen können (Name + Icon)
- Als Admin möchte ich bestehende Service-Typen bearbeiten können
- Als Admin möchte ich Service-Typen löschen können, sofern sie keinem Stützpunkt zugeordnet sind
- Als Admin möchte ich ein Icon pro Service-Typ auswählen oder hochladen können
- Als Admin möchte ich die Reihenfolge der Services per Drag & Drop anpassen können

## Datenmodell Service-Typ
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| id | UUID | Ja | Primärschlüssel |
| name | String | Ja | Name des Services (DE) |
| icon | String | Ja | Icon-Identifier oder SVG |
| sort_order | Integer | Ja | Sortierreihenfolge |
| created_at | Timestamp | Auto | Erstellungsdatum |

## Acceptance Criteria
- [ ] CRUD für Service-Typen (Erstellen, Lesen, Bearbeiten, Löschen)
- [ ] Icon-Auswahl aus einer vordefinierten Icon-Bibliothek (z.B. Lucide Icons)
- [ ] Alternativ: SVG-Upload für eigene Icons
- [ ] Drag & Drop Sortierung der Service-Reihenfolge
- [ ] Löschen nur möglich wenn Service keinem Stützpunkt zugeordnet ist
- [ ] Bei Lösch-Versuch eines zugeordneten Services: Fehlermeldung mit Anzahl betroffener Stützpunkte
- [ ] Initial-Daten: 5 vordefinierte Services werden bei Setup angelegt
- [ ] Service-Name ist unique (keine Duplikate)

## Edge Cases
- Was passiert wenn ein Service gelöscht werden soll, der Stützpunkten zugeordnet ist? → Blockieren mit Meldung "Service ist X Stützpunkten zugeordnet. Bitte zuerst Zuordnung entfernen."
- Was passiert bei doppeltem Namen? → Fehlermeldung "Service-Name bereits vorhanden"
- Was passiert bei leerem Icon? → Fallback auf generisches Icon

## Technische Anforderungen
- Supabase Postgres für Datenbank
- Many-to-Many Relation: Stützpunkt ↔ Service (Junction Table)
- SVG-Icons bevorzugt (skalierbar, klein)

## Tech-Design (Solution Architect)

### Component-Struktur

```
/admin/services               ← Service-Typen Verwaltung

Komponenten:
├── ServiceList               ← Drag & Drop sortierbare Liste
│   └── ServiceItem           ← Einzelne Zeile: Icon + Name + Actions
│       ├── IconPreview        ← Vorschau des gewählten Icons
│       ├── EditButton         ← Inline-Bearbeitung oder Dialog
│       ├── DeleteButton       ← Löschen (mit Prüfung)
│       └── DragHandle         ← Anfasser zum Sortieren
├── CreateServiceDialog       ← Modal: Name eingeben + Icon wählen
├── EditServiceDialog         ← Modal: Name ändern + Icon ändern
├── IconPicker                ← Icon-Auswahl aus Lucide Icons
│   ├── IconGrid              ← Raster aller verfügbaren Icons
│   └── IconSearch            ← Suche innerhalb der Icons
└── DeleteConfirmDialog       ← "Service ist X Stützpunkten zugeordnet"
```

### Daten-Model

```
Tabelle: service_typen
- id: Eindeutige ID
- name: Service-Name (z.B. "Hydraulikleitungen")
- icon: Icon-Name aus Lucide (z.B. "wrench") oder Custom SVG String
- sort_order: Reihenfolge (1, 2, 3, ...)
- created_at: Erstellungsdatum

Initial-Daten (werden bei Setup automatisch angelegt):
1. Hydraulikleitungen → "wrench" Icon
2. Antriebstechnik → "cog" Icon
3. Technische Schläuche → "cable" Icon
4. Fluidtechnik → "droplet" Icon
5. Mobile Werkstatt → "truck" Icon
```

### Tech-Entscheidungen

```
Warum Lucide Icons als Icon-Bibliothek?
→ Bereits im Projekt (lucide-react). 1500+ Icons verfügbar. Konsistent mit shadcn/ui.

Warum @dnd-kit für Drag & Drop Sortierung?
→ Modern, zugänglich (Tastatur-Support), performant. Beste React D&D Library.

Warum Icon-Name statt SVG-Upload als Standard?
→ Einfacher zu verwalten. Lucide Icons sind bereits vektorbasiert.
  SVG-Upload als Alternative für Custom-Icons.
```

### Dependencies
- `@dnd-kit/core` + `@dnd-kit/sortable` (Drag & Drop Sortierung)
