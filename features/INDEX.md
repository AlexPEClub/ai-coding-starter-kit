# Feature Index

Übersicht aller Features und deren Status.

## Legende

- **🔵 Planned** — Geplant, noch nicht gestartet
- **🟣 Architected** — Technischer Entwurf steht, bereit für /frontend bzw. /backend
- **🟡 In Progress** — In Bearbeitung
- **🟠 In Review** — Wartet auf Review/Freigabe
- **🟢 Approved** — QA bestanden (keine Critical/High Bugs), bereit für /deploy
- **✅ Deployed** — Live

---

## Features

| ID | Name | Status | Letzte Änderung |
|----|------|--------|-----------------|
| PROJ-1 | Auth & Rollen | ✅ Deployed | 2026-06-18 |
| PROJ-11 | Kundendetailseite | ✅ Deployed — inkl. Umsatz-Tab (Charts) + Bestellhistorie, live verifiziert. Details: `features/PROJ-11-kundendetailseite.md` | 2026-07-24 |
| PROJ-14 | Umsatz-Service-Icon Fix | ✅ Deployed | 2026-07-02 |
| PROJ-15 | Vorjahresvergleich + Ansichten | ✅ Deployed | 2026-07-02 |
| PROJ-16 | Gestapeltes AreaChart | ✅ Deployed | 2026-07-02 |
| PROJ-17 | Auftrags-Default im Kunden-Detail | ✅ Deployed | 2026-07-03 |
| PROJ-18 | Globaler Header mit Navigation | ✅ Deployed | 2026-07-03 |
| PROJ-19 | Auftragsverwaltung | ✅ Deployed | 2026-07-05 |
| PROJ-20 | Logistik & Abholung | ✅ Deployed | 2026-07-06 |
| PROJ-21 | Fahrer — Tourenliste (nur Anzeige) | ✅ Deployed — live seit 2026-08-01. Offen: BUG-2 (Low, A11y). Details: `features/PROJ-21-fahrer-tourenliste.md` | 2026-08-01 |
| PROJ-22 | Kalender für blockierte Tage | ✅ Deployed | 2026-07-07 |
| PROJ-28 | Hersteller-Verwaltung & Artikel-Zuordnung | ✅ Deployed | 2026-07-10 |
| PROJ-29 | Wissensbasis (KI-Content-Fundament) | ✅ Deployed — 3 Live-Hotfixes seit Rollout behoben (Upload-Limit, internes Docker-Networking, fehlendes try/catch). Details: `features/PROJ-29-wissensbasis.md` | 2026-08-03 |
| PROJ-30 | Themenvorschläge (wöchentlich, KI) | ✅ Deployed — Live seit 2026-08-10 unter https://tms.gudel-werkzeuge.de/verwaltung/cms/themenvorschlaege. Docker-Deploy erfolgreich, Chromium-Smoke-Tests 5/5 grün (Webkit-Limitation wie PROJ-11/21/29/41/42/44). Route + Redirect funktionieren, Container läuft sauber. Details: `features/PROJ-30-themenvorschlaege.md` | 2026-08-10 |
| PROJ-31 | Content-Studio (Generierung + Redaktion + Lern-Loop) | 🟣 Architected — pausiert bis PROJ-30 fertig ist (Frontend-Abhängigkeit). Details: `features/PROJ-31-content-studio.md` | 2026-08-03 |
| PROJ-32 | Publishing (Blog / Social Media / Newsletter) | 🔵 Roadmap — Content-Epic: freigegebene Inhalte auf allen Kanälen (Webseiten-Blog, Social Media, Newsletter) ausspielen | 2026-07-20 |
| PROJ-33 | Löschschutz für Partners | ✅ Deployed — DB-Trigger, Details: `features/PROJ-33-partner-loeschschutz.md` | 2026-07-25 |
| PROJ-34 | Werkzeug-/Auftrags-Fundament + Fahrer-Auftragserfassung + Wareneingang | ✅ Deployed — Herzstück von TMS 2.0, Teil 1/6. Bekannte Einschränkung: Fahrer-QR-Druck seit PROJ-21-Neuaufnahme nicht erreichbar. Details: `features/PROJ-34-werkzeug-auftrag-fundament.md` | 2026-07-30 |
| PROJ-35 | Arbeitsvorbereitung — Werkzeugkategorien & Pfade (Stammdaten) | 🔵 Roadmap — alte Implementierung am 2026-07-30 auf User-Wunsch komplett entfernt (DB bleibt unangetastet), Anforderung wird neu aufgenommen. Nächster Schritt: `grill-me` → `/write-spec PROJ-35`. Keine Spec-Datei | 2026-07-30 |
| PROJ-36 | Maschine — Bearbeitungsschritte abarbeiten | 🔵 Roadmap — Teil 4/7. Arbeitsliste je Station, Schritte aus der AV-Fahrt abarbeiten. Baut auf PROJ-34/35/40 auf | 2026-07-28 |
| PROJ-37 | QS-Station — Freigabe, Rückläufer, Ausschuss | 🔵 Roadmap — Teil 5/7. Drei Ausgänge: Freigabe→Warenausgang, Rückläufer/Nacharbeit (hängt Schritte an, zurück zur Maschine), Ausschuss (Auftrag endet für dieses Werkzeug). Baut auf PROJ-34–36 auf | 2026-07-27 |
| PROJ-38 | Warenausgang — Scan, Lieferschein | 🔵 Roadmap — Teil 6/7. Erzeugt Lieferschein in TMS; Rechnung bleibt bewusst in easybill. Baut auf PROJ-34–37 auf | 2026-07-27 |
| PROJ-39 | Externe Fremdbearbeitung — Tracking & Workflow | 🔵 Roadmap — Teil 7/7, nach den Kern-Stationen. Versand per Spedition/Post (nicht eigene Fahrer), Rückkehr über normalen Wareneingang-Scan, eigene "aktuell extern"-Tracking-Tabelle. Baut auf PROJ-35/40 auf | 2026-07-28 |
| PROJ-40 | Arbeitsvorbereitung — AV-Workflow (Fahrt festlegen) | 🔵 Roadmap — Teil 2b/7. Der eigentliche AV-Tagesablauf: Werkzeug scannen, 3-Stufen-Formular (Oberkategorie→Unterkategorie→Geometrie-Daten), automatische Serviceartikel-Zuordnung anhand der PROJ-35-Preisstaffel, Standard-Pfad aus PROJ-35 bestätigen/anpassen (Fahrt), konkreten externen Dienstleister pro Werkzeug zuweisen/überschreiben. Baut auf PROJ-35 auf | 2026-07-28 |
| PROJ-41 | Fahrer — Fahrt bearbeiten (Fahrer/Datum/Notiz + Änderungsverlauf) | ✅ Deployed — Live seit 2026-08-02. Details: `features/PROJ-41-fahrt-bearbeiten.md` | 2026-08-02 |
| PROJ-42 | Routenberechnung für Touren (Geoapify) | ✅ Deployed — Refine 2026-08-11: Engine bekommt optionalen Standort/-zeit-Startpunkt für PROJ-46/PROJ-44, Spec aktualisiert, Code-Umsetzung steht noch aus. Details: `features/PROJ-42-routenberechnung.md` | 2026-08-11 |
| PROJ-43 | Globale Kundensuche + Umsatz-Caching | 🟢 Approved — 2 Bugs gefixt (High: Filter-Injection; Low: a11y). Mobile-Safari-Check steht noch aus. Details: `features/PROJ-43-globale-kundensuche-umsatz-caching.md` | 2026-08-03 |
| PROJ-44 | Fahrer — Stopp-Detail-Modal (Ändern / Navi / Erledigt) | ✅ Deployed — Live seit 2026-08-04, 4 Refine-Fixes. Details: `features/PROJ-44-stopp-detail-modal.md` | 2026-08-04 |
| PROJ-45 | Fahrer — Tour-Kartenansicht | ✅ Deployed — Live seit 2026-08-08, Bugfix-Redeploy (Marker/Route) live verifiziert. Details: `features/PROJ-45-fahrer-tour-kartenansicht.md` | 2026-08-08 |
| PROJ-46 | Fahrer — Tour starten (Status-Wechsel) | ✅ Deployed — Live seit 2026-08-11. Migration erfolgreich, Docker-Deploy grün, Production-URL erreichbar. Details: `features/PROJ-46-tour-starten.md` | 2026-08-11 |

## Architektur-Dokumente

| Feature | Architektur |
|---------|-------------|
| PROJ-11 | PROJ-11-architektur.md |
| PROJ-14 | PROJ-14-architektur.md |
| PROJ-15 | PROJ-15-architektur.md |
| PROJ-16 | PROJ-16-architektur.md |
| PROJ-18 | PROJ-18-architektur.md |
| PROJ-19 | PROJ-19-architektur.md |

---

## Workflow-Regeln (gültig ab 2026-06-30)

```
Feature-Wunsch → grill-me → write-spec → APPROVAL STOP →
architecture → APPROVAL STOP → frontend → backend → qa → deploy → Git-Tag
```

- Nach `write-spec` und nach `architecture` **IMMER** auf explizites "Approved" vom User warten.
- Ausnahme nur bei einer eindeutigen, nicht negierten Benutzeranweisung mit dem exakten Wort **`Hotfix`**; die technischen Hotfix-Gates bleiben verbindlich.
- Vor jeder Code-Änderung: unter Hermes `.hermes.md`, unter Claude Code `CLAUDE.md`, außerdem `docs/PRD.md` und die relevante Feature-Datei lesen.
- Status in INDEX.md und Feature-Header immer synchron halten.

## Next Available ID: PROJ-47
