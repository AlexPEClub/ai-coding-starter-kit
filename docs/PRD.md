# Product Requirements Document — TMS 2.0

> Werkzeug-Management-System für Gudel Werkzeuge.
> Begleitdokumente: `docs/design-system.md` (UI-Vorgaben), `features/INDEX.md` (Feature-Tracking).

## Vision

TMS 2.0 macht den **Lebensweg jedes Werkzeugs durch die Werkstatt lückenlos sichtbar** — vom Wareneingang über Arbeitsvorbereitung, Maschine und Qualitätssicherung bis zum Warenausgang, inklusive Fremdbearbeitung extern. Jede Station sieht in Echtzeit, was bei ihr ansteht, setzt mit wenigen Touch-Aktionen den Status, und die Verwaltung erkennt auf einen Blick Durchlaufzeiten, Engpässe und Rückläufer. Ziel: Schluss mit Zetteln und Nachfragen „wo ist Werkzeug X gerade?".

## Target Users

Interne Mitarbeiter von Gudel Werkzeuge, in 7 Rollen entlang des Werkzeug-Workflows:

| Rolle | Arbeitsplatz | Kernbedürfnis |
|-------|--------------|---------------|
| **Admin/Verwaltung** | Schreibtisch | Stammdaten & Nutzer pflegen, Gesamtüberblick, Auswertungen |
| **Arbeitsvorbereitung** | Schreibtisch/Tablet | Pfad & Auftrag festlegen — bestimmt den Weg des Werkzeugs |
| **Wareneingang** | Terminal | Eingehende Werkzeuge erfassen / annehmen |
| **Werker/Maschine** | Stations-Terminal (Tablet, ggf. Handschuhe) | Sehen was ansteht, Bearbeitung starten/abschließen |
| **QS** | Stations-Terminal | Prüfen, freigeben oder als Rückläufer zurückschicken |
| **Warenausgang** | Terminal | Fertige Werkzeuge ausbuchen / versandfertig melden |
| **Fahrer** | Mobil | Transporte zu/von externer Fremdbearbeitung abwickeln |

Schmerzpunkte heute: kein zentraler Status, Suchen nach Werkzeugen, manuelle Übergaben, keine Durchlaufzeit-Transparenz.

## Werkzeug-Lebenszyklus (Kern-Workflow)

```
Wareneingang → Arbeitsvorbereitung → Maschine → QS ──→ Warenausgang
                                       ▲          │
                                       └──────────┘  (Rückläufer / Achtung)
                          Extern (Fremdbearbeitung, via Fahrer) ⇄ jederzeit einklinkbar
```

Jeder Werkzeug-Status trägt durchgängig die **Stationsfarbe** (siehe Design-System). Rückläufer (QS → Maschine) ist als Koralle/Achtung markiert.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1 · Auth & Rollen (Invite-only, 7 Rollen, RLS) | ✅ Deployed |
| P0 (MVP) | PROJ-34 · Werkzeug-/Auftrags-Fundament + Fahrer-Auftragserfassung + Wareneingang — ersetzt PROJ-2–PROJ-6: Werkzeug-Stammdaten, QR-Code-Pool, Auftrag-Entität, Kommission-Konfiguration, Auftrag anlegen beim Kunden (Fahrer), Wareneingang-Scan inkl. Wagen-Anzeige | ✅ Deployed |
| P0 (MVP) | PROJ-35 · Arbeitsvorbereitung, Teil 1/2 — Stammdaten: Werkzeugkategorien, Geometrie-Parameter-Register, automatische Serviceartikel-Zuordnung über Preisstaffel, Pfade + Dienstleister; baut auf PROJ-34/28 auf | ✅ Deployed |
| P0 (MVP) | PROJ-40 · Arbeitsvorbereitung, Teil 2/2 — AV-Workflow: Scannen, Fahrt aus PROJ-35-Standardpfad bestätigen/anpassen, Extern-Zuweisung pro Werkzeug; baut auf PROJ-35 auf | Roadmap |
| P0 (MVP) | PROJ-36 · Maschine — Bearbeitungsschritte abarbeiten, Arbeitsliste; baut auf PROJ-34/35/40 auf | Roadmap |
| P0 (MVP) | PROJ-37 · QS-Station — Freigabe, Rückläufer/Nacharbeit, Ausschuss; baut auf PROJ-34–36 auf | Roadmap |
| P0 (MVP) | PROJ-38 · Warenausgang — Scan, Lieferschein-Erstellung; baut auf PROJ-34–37 auf | Roadmap |
| P1 | PROJ-39 · Externe Fremdbearbeitung — Tracking & Workflow (Versand, "aktuell extern"-Tabelle, Rückkehr); baut auf PROJ-35/40 auf | Roadmap |
| P1 | PROJ-7 · Dashboard & Kennzahlen (Bento, Charts) — baut auf PROJ-34–38 auf | Roadmap |
| P2 | PROJ-8 · Externe Bearbeitung & Fahrer-Transporte — Fahrer-Seite größtenteils bereits PROJ-21; baut auf PROJ-34/39 auf | Roadmap |
| P2 | PROJ-9 · Benachrichtigungen (Rückläufer/Engpässe) — baut auf PROJ-34–38 auf | Roadmap |
| P2 | PROJ-10 · Dark Mode | Roadmap |
| P2 | PROJ-28 · Hersteller-Verwaltung & Artikel-Zuordnung | ✅ Deployed |
| P2 | *(unbenannt, kommt nach PROJ-38)* · Lagerverwaltung — dynamisches Kommissions-Fach (Zuweisen/Freigeben); bewusst aus PROJ-34 ausgeklammert, ID wird bei Bedarf vergeben | Roadmap |
| P2 | *(unbenannt, kommt nach PROJ-37)* · Automatisches Ersatzwerkzeug-Angebot bei "defekt" (Ersatz suchen, Kunde automatisiert Angebot unterbreiten, Human-in-the-Loop) — baut auf dem "defekt"-Status aus PROJ-37 auf, ausdrücklich vertagt, ID wird bei Bedarf vergeben | Roadmap |

**Build-Reihenfolge & Abhängigkeiten:**
PROJ-1 (Auth/Rollen) ist Fundament für alles — bereits deployed. Das
Kernstück "Werkzeug-Auftragsverwaltung & Stations-Workflow" wurde als EIN
zusammenhängendes Anforderungspaket durchgeplant (gemeinsames Datenmodell,
eine State Machine), aber bewusst in mehrere kleinere, einzeln lieferbare
Projekte pro Werkstatt-Stufe aufgeteilt, weil sonst der Rahmen für ein
einzelnes Feature gesprengt würde:

→ **PROJ-34** legt das Fundament (Werkzeug-/Auftrags-Datenmodell, QR-Pool,
Kommission) UND liefert gleich die ersten beiden Stationen mit, weil dort
Aufträge/Werkzeuge überhaupt erst entstehen und beide Stellen direkt
ineinandergreifen (Fahrer-Auftragserfassung + Wareneingang).
→ **Arbeitsvorbereitung** wurde selbst noch mal in zwei Teile gesplittet, weil
während der Anforderungsaufnahme klar wurde, dass sie zu groß für ein Feature
ist: **PROJ-35** liefert nur die Admin-Stammdaten (Werkzeugkategorien,
Geometrie-Parameter-Register, automatische Serviceartikel-Zuordnung über eine
Preisstaffel, Pfade + Dienstleister); **PROJ-40** liefert den eigentlichen
AV-Tagesworkflow (Scannen, Fahrt bestätigen/anpassen, Extern-Zuweisung), der
auf PROJ-35 aufbaut. Danach folgen **PROJ-36** (Maschine) → **PROJ-37** (QS) →
**PROJ-38** (Warenausgang) sequenziell dem Werkzeug-Lebenszyklus.
→ **PROJ-39** (Externe Fremdbearbeitung) ist eigenständig komplex genug
(eigene Tracking-Tabelle + Workflow) für ein eigenes Folge-Projekt nach den
Kern-Stationen.
→ **PROJ-7** (Dashboard) aggregiert die Daten aus PROJ-34–38. **PROJ-8**
(Fahrer-Transporte, Basis bereits PROJ-21) und **PROJ-9** (Benachrichtigungen)
sind spätere Erweiterungen. Die Lagerverwaltung (Kommissions-Fach) ist bewusst
aus PROJ-34 ausgeklammert und bekommt erst eine ID, wenn sie angegangen wird.

*(Hinweis: Einige weitere Features aus dem ursprünglichen Fahrplan — u.a.
Kundendetailseite, Auftrags-/Tourenverwaltung, Logistik & Abholung, globale
Navigation, Hersteller-Verwaltung — wurden bereits als eigene Features
PROJ-11–PROJ-33 gebaut und sind in `features/INDEX.md` getrackt.)*

## Success Metrics

- **Auffindbarkeit:** Status jedes Werkzeugs in < 5 Sek. ermittelbar (statt Suchen/Nachfragen).
- **Adoption:** Alle 7 Rollen nutzen das System im Tagesgeschäft (keine Papier-Parallelprozesse).
- **Transparenz:** Durchlaufzeit & Rückläuferquote je Station messbar im Dashboard.
- **Terminal-Tauglichkeit:** Statuswechsel an der Maschine in ≤ 2 Touch-Aktionen.

## Constraints

- **Tech:** Next.js 16 (App Router) + TypeScript, Tailwind + shadcn/ui, **self-hosted Supabase** (PostgreSQL + Auth + Storage), Deployment Docker + Traefik auf Hetzner.
- **Design:** verbindlich `docs/design-system.md` (Brand `#FF6B6D`, Bento-Layout, Mobile-First, Touch ≥ 48px).
- **Auth:** Supabase Auth, E-Mail/Passwort für alle (auch Terminals), **Invite-only** (kein Self-Signup), rollenbasierte RLS.
- **Sprache:** UI durchgehend Deutsch.

## Non-Goals (MVP)

- Keine offene Selbstregistrierung.
- Kein PIN-/Badge-Login an Terminals (bewusst vorerst voller E-Mail/Passwort-Login).
- Keine ERP-/Maschinen-Schnittstellen (manuelle Statuspflege im MVP).
- Kein Dark Mode im MVP (als P2 eingeplant).
- Keine native Mobile-App (responsive Web genügt).

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above. Empfohlener Start: `/write-spec PROJ-1`.
