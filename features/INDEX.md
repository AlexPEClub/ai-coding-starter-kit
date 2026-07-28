# Feature Index

Übersicht aller Features und deren Status.

## Legende

- **🔵 Planned** — Geplant, noch nicht gestartet
- **🟡 In Progress** — In Bearbeitung
- **🟠 In Review** — Wartet auf Review/Freigabe
- **🟢 Approved** — QA bestanden (keine Critical/High Bugs), bereit für /deploy
- **✅ Deployed** — Live

---

## Features

| ID | Name | Status | Letzte Änderung |
|----|------|--------|-----------------|
| PROJ-1 | Auth & Rollen | ✅ Deployed | 2026-06-18 |
| PROJ-11 | Kundendetailseite | ✅ Deployed — Refine „Umsatz-Tab Mobile-Fixes + Donut/Radar-Charts" live verifiziert: deploy.sh grün, 8/8 Feature-Szenarien auf Chromium + Mobile Safari gegen Production bestätigt. Nebenbei eslint.config.js-Ignore-Bug behoben (fremde Worktrees wurden mitgelintet). Umsatz-Tab-Neubau bleibt ✅ live verifiziert (2026-07-24). Bestellhistorie-Erweiterung bleibt ✅ Deployed (2026-07-18) | 2026-07-24 |
| PROJ-14 | Umsatz-Service-Icon Fix | ✅ Deployed | 2026-07-02 |
| PROJ-15 | Vorjahresvergleich + Ansichten | ✅ Deployed | 2026-07-02 |
| PROJ-16 | Gestapeltes AreaChart | ✅ Deployed | 2026-07-02 |
| PROJ-17 | Auftrags-Default im Kunden-Detail | ✅ Deployed | 2026-07-03 |
| PROJ-18 | Globaler Header mit Navigation | ✅ Deployed | 2026-07-03 |
| PROJ-19 | Auftragsverwaltung | ✅ Deployed | 2026-07-05 |
| PROJ-20 | Logistik & Abholung | ✅ Deployed | 2026-07-06 |
| PROJ-21 | Fahrer-Seite | 🟠 In Review — Basis-Fahrer-Seite weiter ✅ live. Erweiterung „Navi-Start + Erledigt-Bestätigung" QA-geprüft (Code-/Schema-Review, kein Live-Browser-Test möglich): 4/4 Akzeptanzkriterien bestanden, DB-Spalten live verifiziert. Critical-Sicherheitsfund BUG-1 (unauthentifizierte Debug-Endpunkte `/api/debug/*`, `/api/test-drivers` leaken Touren-/Partnerdaten) als Hotfix behoben — Routen komplett entfernt (waren unbenutzte Debug-Leftover), lint/build grün. Bugfix-Runde 2026-07-26: `"geplan"`-Tippfehler behoben (verursachte harten DB-Fehler bei jeder Tour-Anlage), Kartenpins jetzt über vorhandene `geoapify_lat/lon` live, Status-Inkonsistenz geprüft und als bereits gelöst bestätigt. Deploy (Erweiterung + Hotfix + Bugfixes zusammen) steht noch aus | 2026-07-26 |
| PROJ-22 | Kalender für blockierte Tage | ✅ Deployed | 2026-07-07 |
| PROJ-28 | Hersteller-Verwaltung & Artikel-Zuordnung | ✅ Deployed | 2026-07-10 |
| PROJ-29 | Wissensbasis (KI-Content-Fundament) | ✅ Deployed — Backend live (Migration, Storage-Policies, FTS, RPCs, Server Actions auf echtes Supabase). Nach Deploy meldete der User Live-Probleme (Upload/Kategorien funktionierten nicht) — per Playwright direkt gegen Produktion reproduziert und behoben: (1) Body-Size-Limit-Fix (`bodySizeLimit: 25mb`) behebt hängenden Upload realer PDFs >1MB unter dem alten Stub, (2) Hotfix-Migration `20260728120000` ergänzt fehlende `service_role`-GRANTs auf `knowledge_document_categories` (Ursache für „Werkzeugart/Material nicht speicherbar" — Postgres 42501). Danach vollständiger Live-Durchlauf mit echtem PDF grün verifiziert (Upload→Aktiv→Tags→Suche→Löschen), Test-Daten aus Live-DB wieder entfernt. Offen: Leitz-Lexikon-Dauerhaft-Upload macht der User selbst | 2026-07-28 |
| PROJ-30 | Themenvorschläge (wöchentlich, KI) | 🔵 Roadmap — Content-Epic: 1×/Woche ~20 Themenvorschläge aus der Wissensbasis unter Berücksichtigung bereits behandelter Themen; Themen müssen freigegeben werden, bevor Content entsteht | 2026-07-20 |
| PROJ-31 | Content-Studio (Generierung + Redaktion + Lern-Loop) | 🔵 Planned — Alle Open Questions geklärt (2026-07-24): Regler nur Länge+Fachtiefe, Lern-Mechanik via Few-Shot, Neutralität per Prompt-Vorgabe, nur Kern-Artikel (Kanal-Varianten in PROJ-32), ein globaler Tonalitäts-Anker, keine KI-Bildgenerierung (nur manueller Upload). Durchsucht Wissensbasis-Dokumente selbst (Retrieval statt geprüfter Fakten), zeigt Quellen im Entwurf an. Nur für freigegebene Themen (PROJ-30), speist PROJ-32; wartet auf „approved" für `/architecture` | 2026-07-24 |
| PROJ-32 | Publishing (Blog / Social Media / Newsletter) | 🔵 Roadmap — Content-Epic: freigegebene Inhalte auf allen Kanälen (Webseiten-Blog, Social Media, Newsletter) ausspielen | 2026-07-20 |
| PROJ-33 | Löschschutz für Partners | ✅ Deployed — Migration live verifiziert: Trigger `trg_partners_prevent_delete` aktiv auf `tms.partners` (BEFORE DELETE, blockiert jeden Löschversuch, Partner können nur auf inaktiv `is_active = false` gesetzt werden). Migration: `20260721120000_PROJ-33_partners_no_delete.sql` | 2026-07-25 |
| PROJ-34 | Werkzeug-/Auftrags-Fundament + Fahrer-Auftragserfassung + Wareneingang | ✅ Deployed — Herzstück von TMS 2.0, Teil 1/6. Zwei QA-Runden bestanden (26/28 AC, 4 Bugs gefunden inkl. High-Severity PostgREST-Filter-Injection, alle gefixt & re-verifiziert), am 2026-07-28 live nach https://tms.gudel-werkzeuge.de deployed (`./scripts/deploy.sh PROJ-34`, Post-Deploy-Smoke grün im ersten Anlauf, `/fahrer`+`/wareneingang` manuell auf 200 verifiziert, keine Fehler in Container-Logs). Kein Staging vorhanden — direkt gegen Produktion deployed. Details in `features/PROJ-34-werkzeug-auftrag-fundament.md`. Offen: interaktiver Browser-Test (QR-Scan/Kamera, echter PrintNode-Testdruck) sollte der User zeitnah in echter Nutzung nachholen. Nächster Schritt: `/write-spec PROJ-35` (Arbeitsvorbereitung) | 2026-07-28 |
| PROJ-35 | Arbeitsvorbereitung — Fahrt/Pfad festlegen | 🔵 Roadmap — Teil 2/6. Werkzeug-Typ hat vordefinierten Standardpfad (Bearbeitungsschritte), AV bestätigt oder passt an (Schritte hinzufügen/ändern), inkl. Zuweisung an externe Dienstleister (neuer `partner_type='supplier'` in `tms.partners`). Baut auf PROJ-34 auf | 2026-07-27 |
| PROJ-36 | Maschine — Bearbeitungsschritte abarbeiten | 🔵 Roadmap — Teil 3/6. Arbeitsliste je Station, Schritte aus der AV-Fahrt abarbeiten. Baut auf PROJ-34/35 auf | 2026-07-27 |
| PROJ-37 | QS-Station — Freigabe, Rückläufer, Ausschuss | 🔵 Roadmap — Teil 4/6. Drei Ausgänge: Freigabe→Warenausgang, Rückläufer/Nacharbeit (hängt Schritte an, zurück zur Maschine), Ausschuss (Auftrag endet für dieses Werkzeug). Baut auf PROJ-34–36 auf | 2026-07-27 |
| PROJ-38 | Warenausgang — Scan, Lieferschein | 🔵 Roadmap — Teil 5/6. Erzeugt Lieferschein in TMS; Rechnung bleibt bewusst in easybill. Baut auf PROJ-34–37 auf | 2026-07-27 |
| PROJ-39 | Externe Fremdbearbeitung — Tracking & Workflow | 🔵 Roadmap — Teil 6/6, nach den 5 Kern-Stationen. Versand per Spedition/Post (nicht eigene Fahrer), Rückkehr über normalen Wareneingang-Scan, eigene "aktuell extern"-Tracking-Tabelle. Baut auf PROJ-35 auf | 2026-07-27 |

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
/init → /write-spec → User-Review ("approved") →
/architecture → User-Review ("approved") →
/frontend → /backend → /qa → /deploy
```

- Nach `/write-spec` und nach `/architecture` **IMMER** auf explizites "approved" vom User warten.
- Ausnahme: **Trivialer Hotfix** — NUR wenn das Wort "Hotfix" explizit verwendet wird.
- Vor jeder Code-Änderung: CLAUDE.md, docs/PRD.md und relevante Feature-Datei lesen.
- Status in INDEX.md und Feature-Header immer synchron halten.

## Next Available ID: PROJ-40
