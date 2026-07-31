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
| PROJ-11 | Kundendetailseite | ✅ Deployed — Refine „Umsatz-Tab Mobile-Fixes + Donut/Radar-Charts" live verifiziert: deploy.sh grün, 8/8 Feature-Szenarien auf Chromium + Mobile Safari gegen Production bestätigt. Nebenbei eslint.config.js-Ignore-Bug behoben (fremde Worktrees wurden mitgelintet). Umsatz-Tab-Neubau bleibt ✅ live verifiziert (2026-07-24). Bestellhistorie-Erweiterung bleibt ✅ Deployed (2026-07-18) | 2026-07-24 |
| PROJ-14 | Umsatz-Service-Icon Fix | ✅ Deployed | 2026-07-02 |
| PROJ-15 | Vorjahresvergleich + Ansichten | ✅ Deployed | 2026-07-02 |
| PROJ-16 | Gestapeltes AreaChart | ✅ Deployed | 2026-07-02 |
| PROJ-17 | Auftrags-Default im Kunden-Detail | ✅ Deployed | 2026-07-03 |
| PROJ-18 | Globaler Header mit Navigation | ✅ Deployed | 2026-07-03 |
| PROJ-19 | Auftragsverwaltung | ✅ Deployed | 2026-07-05 |
| PROJ-20 | Logistik & Abholung | ✅ Deployed | 2026-07-06 |
| PROJ-21 | Fahrer — Tourenliste (nur Anzeige) | 🟣 Architected — Technischer Entwurf steht: keine neue Migration/kein neues Datenmodell, "Tour" wird beim Anzeigen aus bestehenden Fahrten (gruppiert nach Fahrer+Datum) gebildet, Zugriffsschutz wird im Anwendungscode geprüft (DB erlaubt aktuell jedem eingeloggten Nutzer das Lesen aller Fahrten). Zwei Tabs „Ich" (eigene offene Touren) und „Tourenplanung" (offene Touren aller Fahrer, filterbar nach Fahrer+Datum) — beide für `fahrer`+`admin` gleichermaßen sichtbar (Team-Transparenz, im Architektur-Review von ursprünglich "nur Admin" geändert). Keine neuen Pakete (Tabs/Akkordeon/Badge bereits vorhanden). Live-DB-Check ergab ~107 offene Fahrten (Pagination nicht nötig) und 3 überfällige offene Fahrten ohne zugewiesenen Fahrer (werden in "Tourenplanung" mit Hinweis angezeigt, bewusst nicht rückwirkend bereinigt — Datenqualitäts-Regel/Cronjob als eigenes Folge-Thema vermerkt). Details in `features/PROJ-21-fahrer-tourenliste.md`. Nächster Schritt: `/frontend PROJ-21` | 2026-07-31 |
| PROJ-22 | Kalender für blockierte Tage | ✅ Deployed | 2026-07-07 |
| PROJ-28 | Hersteller-Verwaltung & Artikel-Zuordnung | ✅ Deployed | 2026-07-10 |
| PROJ-29 | Wissensbasis (KI-Content-Fundament) | ✅ Deployed — Backend live (Migration, Storage-Policies, FTS, RPCs, Server Actions auf echtes Supabase). Nach Deploy meldete der User Live-Probleme (Upload/Kategorien funktionierten nicht) — per Playwright direkt gegen Produktion reproduziert und behoben: (1) Body-Size-Limit-Fix (`bodySizeLimit: 25mb`) behebt hängenden Upload realer PDFs >1MB unter dem alten Stub, (2) Hotfix-Migration `20260728120000` ergänzt fehlende `service_role`-GRANTs auf `knowledge_document_categories` (Ursache für „Werkzeugart/Material nicht speicherbar" — Postgres 42501). Danach vollständiger Live-Durchlauf mit echtem PDF grün verifiziert (Upload→Aktiv→Tags→Suche→Löschen), Test-Daten aus Live-DB wieder entfernt. Refine 2026-07-29 (Hotfix): echter 35-seitiger Leitz-Lexikon-Upload blieb bei ~90% hängen — Ursache war NICHT die (bereits im Hintergrund laufende) Text-Extraktion, sondern dass **alle** server-seitigen Supabase-Aufrufe projektweit über die öffentliche Domain statt das interne Docker-Netz liefen (verifiziert per `EAI_AGAIN`-DNS-Fehler + abgebrochene 4-10s-Requests in Produktions-Logs). Fix: neue `SUPABASE_INTERNAL_URL` (`http://supabase-kong:8000`) in `docker-compose.yml`, genutzt von Admin-Client/Server-Client/Middleware; Browser-Client bewusst unverändert. Rebuild+Neustart live, lint/build grün, internes vs. öffentliches Routing identisch verifiziert. **Zweiter Hotfix selben Tages:** DNS-Fix löste das Symptom nicht — Live-Logs bei zwei erneuten Versuchen (Mobilfunk + WLAN) zeigten, dass die Upload-Anfrage nie server-seitig ankam. Ursache: `handleUpload`/`handleSaveTags`/`handleConfirmDelete` in `wissensbasis-admin-page.tsx` hatten kein try/catch um den Server-Action-Aufruf — ein clientseitiger Fehlschlag blieb als unbehandelte Promise-Rejection unsichtbar, `setLoading(false)` wurde nie erreicht (Dialog fror für immer bei ~90% ein, keine Fehlermeldung). Verstieß gegen die projekteigene Regel "Always reset loading state in all code paths". Fix: try/catch/finally in allen drei Handlern ergänzt, Fehler jetzt sichtbar. Rebuild+Neustart live, lint/build grün. Offen: erneuter Live-Upload durch den User zur finalen Bestätigung | 2026-07-29 |
| PROJ-30 | Themenvorschläge (wöchentlich, KI) | 🔵 Roadmap — Content-Epic: 1×/Woche ~20 Themenvorschläge aus der Wissensbasis unter Berücksichtigung bereits behandelter Themen; Themen müssen freigegeben werden, bevor Content entsteht | 2026-07-20 |
| PROJ-31 | Content-Studio (Generierung + Redaktion + Lern-Loop) | 🔵 Planned — Alle Open Questions geklärt (2026-07-24): Regler nur Länge+Fachtiefe, Lern-Mechanik via Few-Shot, Neutralität per Prompt-Vorgabe, nur Kern-Artikel (Kanal-Varianten in PROJ-32), ein globaler Tonalitäts-Anker, keine KI-Bildgenerierung (nur manueller Upload). Durchsucht Wissensbasis-Dokumente selbst (Retrieval statt geprüfter Fakten), zeigt Quellen im Entwurf an. Nur für freigegebene Themen (PROJ-30), speist PROJ-32; wartet auf „approved" für `/architecture` | 2026-07-24 |
| PROJ-32 | Publishing (Blog / Social Media / Newsletter) | 🔵 Roadmap — Content-Epic: freigegebene Inhalte auf allen Kanälen (Webseiten-Blog, Social Media, Newsletter) ausspielen | 2026-07-20 |
| PROJ-33 | Löschschutz für Partners | ✅ Deployed — Migration live verifiziert: Trigger `trg_partners_prevent_delete` aktiv auf `tms.partners` (BEFORE DELETE, blockiert jeden Löschversuch, Partner können nur auf inaktiv `is_active = false` gesetzt werden). Migration: `20260721120000_PROJ-33_partners_no_delete.sql` | 2026-07-25 |
| PROJ-34 | Werkzeug-/Auftrags-Fundament + Fahrer-Auftragserfassung + Wareneingang | ✅ Deployed — Herzstück von TMS 2.0, Teil 1/6. Zwei QA-Runden bestanden (26/28 AC, 4 Bugs gefunden inkl. High-Severity PostgREST-Filter-Injection, alle gefixt & re-verifiziert), am 2026-07-28 live nach https://tms.gudel-werkzeuge.de deployed (`./scripts/deploy.sh PROJ-34`, Post-Deploy-Smoke grün im ersten Anlauf, `/fahrer`+`/wareneingang` manuell auf 200 verifiziert, keine Fehler in Container-Logs). Kein Staging vorhanden — direkt gegen Produktion deployed. Details in `features/PROJ-34-werkzeug-auftrag-fundament.md`. Offen: interaktiver Browser-Test (QR-Scan/Kamera, echter PrintNode-Testdruck) sollte der User zeitnah in echter Nutzung nachholen. **Bekannte Einschränkung seit 2026-07-30:** Fahrer-Auftragserfassung ("Auftrag im Feld anlegen" + QR-Code-Druck) ist vorübergehend nicht erreichbar, da ihr einziger Einstiegspunkt `/fahrer` im Zuge der PROJ-21-Neuaufnahme komplett entfernt wurde (auf User-Wunsch, bewusst in Kauf genommen). Wareneingang-seitiger QR-Druck ist unberührt. Wird mit der neuen PROJ-21-Spec wieder eingeplant. Nächster Schritt: `/write-spec PROJ-35` (Arbeitsvorbereitung) | 2026-07-30 |
| PROJ-35 | Arbeitsvorbereitung — Werkzeugkategorien & Pfade (Stammdaten) | 🔵 Roadmap — Bisherige Implementierung (Ober-/Unterkategorien, Geometrie-Parameter-Register, Preisstaffel/Serviceartikel-Zuordnung, Pfade + Dienstleister-Verwaltung, Seite `/verwaltung/werkzeugkategorien`) auf User-Wunsch am 2026-07-30 komplett aus dem Code entfernt (Route, Components, Server Actions, Tests, Nav-Link, Spec-Datei). DB-Tabellen/Migrationen bleiben bewusst unangetastet in Produktion (keine Drop-Migration). Anforderung wird komplett neu aufgenommen — nächster Schritt: `grill-me` für PROJ-35, danach `/write-spec PROJ-35` | 2026-07-30 |
| PROJ-36 | Maschine — Bearbeitungsschritte abarbeiten | 🔵 Roadmap — Teil 4/7. Arbeitsliste je Station, Schritte aus der AV-Fahrt abarbeiten. Baut auf PROJ-34/35/40 auf | 2026-07-28 |
| PROJ-37 | QS-Station — Freigabe, Rückläufer, Ausschuss | 🔵 Roadmap — Teil 5/7. Drei Ausgänge: Freigabe→Warenausgang, Rückläufer/Nacharbeit (hängt Schritte an, zurück zur Maschine), Ausschuss (Auftrag endet für dieses Werkzeug). Baut auf PROJ-34–36 auf | 2026-07-27 |
| PROJ-38 | Warenausgang — Scan, Lieferschein | 🔵 Roadmap — Teil 6/7. Erzeugt Lieferschein in TMS; Rechnung bleibt bewusst in easybill. Baut auf PROJ-34–37 auf | 2026-07-27 |
| PROJ-39 | Externe Fremdbearbeitung — Tracking & Workflow | 🔵 Roadmap — Teil 7/7, nach den Kern-Stationen. Versand per Spedition/Post (nicht eigene Fahrer), Rückkehr über normalen Wareneingang-Scan, eigene "aktuell extern"-Tracking-Tabelle. Baut auf PROJ-35/40 auf | 2026-07-28 |
| PROJ-40 | Arbeitsvorbereitung — AV-Workflow (Fahrt festlegen) | 🔵 Roadmap — Teil 2b/7. Der eigentliche AV-Tagesablauf: Werkzeug scannen, 3-Stufen-Formular (Oberkategorie→Unterkategorie→Geometrie-Daten), automatische Serviceartikel-Zuordnung anhand der PROJ-35-Preisstaffel, Standard-Pfad aus PROJ-35 bestätigen/anpassen (Fahrt), konkreten externen Dienstleister pro Werkzeug zuweisen/überschreiben. Baut auf PROJ-35 auf | 2026-07-28 |

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

## Next Available ID: PROJ-41
