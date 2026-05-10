# Product Requirements Document — 3D-Druck Angebots-Tool

## Vision
Ein internes Web-Tool zum schnellen und konsistenten Kalkulieren von Angebotspreisen fuer 3D-gedruckte Bauteile. Mitarbeiter laden eine STL-Datei hoch, das System analysiert Volumen und Bounding Box automatisch, prueft die Bauraum-Limits der vorhandenen Drucker und berechnet den Preis nach einer pro Druckverfahren konfigurierbaren Formel inkl. Mengenstaffel. Inspiration fuer den UX-Flow ist Phasio (Upload -> Konfiguration -> Sofortpreis -> Angebot), das Tool ist jedoch auf den internen Vertriebs-Workflow zugeschnitten.

## Target Users
- **Vertrieb / Innendienst:** Erstellt taeglich Angebote, braucht ein schnelles, fehlerarmes Tool — STL rein, Preis raus, PDF an den Kunden.
- **Produktion / Technik:** Pflegt Materialien, Maschinenparameter und Bauraum-Limits.
- **Geschaeftsfuehrung / Admin:** Konfiguriert Preisformeln, Margen, Mengenrabatte; sieht Angebotshistorie.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1 Datenmodell, Defaults und Speicher-Layer | Planned |
| P0 (MVP) | PROJ-2 STL-Upload mit Auto-Analyse (Volumen, Bounding Box) | Planned |
| P0 (MVP) | PROJ-3 Preisberechnung mit konfigurierbarer Formel pro Verfahren | Planned |
| P0 (MVP) | PROJ-4 Bauraum-Check gegen Druckerlimits | Planned |
| P0 (MVP) | PROJ-5 Admin-UI fuer Materialien, Drucker, Formeln und Mengenstaffeln | Planned |
| P1 | PROJ-6 Vergleichsansicht FDM vs. SLS vs. DLP | Planned |
| P1 | PROJ-7 Angebotshistorie und PDF-Export | Planned |
| P2 | PROJ-8 Authentifizierung mit Rollen (Supabase) | Planned |

## Success Metrics
- Zeit pro Angebot < 2 Minuten (Upload bis PDF)
- 100% reproduzierbare Preise bei gleichen Eingabeparametern
- Bauraum-Verletzungen werden vor Angebotserstellung erkannt
- Vertrieb erstellt > 80% der Angebote selbst (ohne Rueckfragen an Technik)

## Constraints
- Single-Tenant, intern eingesetzt
- Drei Druckverfahren initial: **FDM**, **SLS**, **DLP**
- Waehrung: EUR
- Materialien muessen ohne Code-Aenderung erweiterbar sein (Admin-UI)
- Laeuft als Web-App, mobile Ansicht optional
- MVP ohne Backend-DB; Persistenz via localStorage, Supabase-Migration ist vorbereitet

## Non-Goals
- Kein automatisches Slicing oder Druckzeitschaetzung aus G-Code (Schaetzung ueber Formel-Parameter)
- Kein Online-Bezahlsystem fuer Endkunden
- Keine ERP-Integration / Rechnungsstellung
- Keine Mehrmandantenfaehigkeit
- Kein 3D-Viewer im MVP (nur Volumen-/Bounding-Box-Anzeige)

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
