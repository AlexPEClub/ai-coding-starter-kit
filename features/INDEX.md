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
| PROJ-21 | Fahrer-Seite | ✅ Deployed — DB-Erweiterung Driver-Tour-Lifecycle (Status `unterwegs`/`angekommen`/`problem` + Spalte `tms.tours.abgeschlossen_am`) am 2026-07-22 live angewendet & verifiziert | 2026-07-22 |
| PROJ-22 | Kalender für blockierte Tage | ✅ Deployed | 2026-07-07 |
| PROJ-28 | Hersteller-Verwaltung & Artikel-Zuordnung | ✅ Deployed | 2026-07-10 |
| PROJ-29 | Wissensbasis (KI-Content-Fundament) | 🟡 In Progress — Frontend gebaut: Rolle „Redaktion", Seite `/verwaltung/wissensbasis`, Upload/Suche/Filter/Tags/Kategorien-Verwaltung. Actions nutzen vorübergehend In-Memory-Speicher statt echtem Supabase Storage/FTS (kommt in `/backend`). Lint/Build/Tests grün; Browser-Test steht noch aus (Worktree ohne `.env.local`) | 2026-07-23 |
| PROJ-30 | Themenvorschläge (wöchentlich, KI) | 🔵 Roadmap — Content-Epic: 1×/Woche ~20 Themenvorschläge aus der Wissensbasis unter Berücksichtigung bereits behandelter Themen; Themen müssen freigegeben werden, bevor Content entsteht | 2026-07-20 |
| PROJ-31 | Content-Studio (Generierung + Redaktion + Lern-Loop) | 🔵 Planned — Alle Open Questions geklärt (2026-07-24): Regler nur Länge+Fachtiefe, Lern-Mechanik via Few-Shot, Neutralität per Prompt-Vorgabe, nur Kern-Artikel (Kanal-Varianten in PROJ-32), ein globaler Tonalitäts-Anker, keine KI-Bildgenerierung (nur manueller Upload). Durchsucht Wissensbasis-Dokumente selbst (Retrieval statt geprüfter Fakten), zeigt Quellen im Entwurf an. Nur für freigegebene Themen (PROJ-30), speist PROJ-32; wartet auf „approved" für `/architecture` | 2026-07-24 |
| PROJ-32 | Publishing (Blog / Social Media / Newsletter) | 🔵 Roadmap — Content-Epic: freigegebene Inhalte auf allen Kanälen (Webseiten-Blog, Social Media, Newsletter) ausspielen | 2026-07-20 |
| PROJ-33 | Löschschutz für Partners | ✅ Deployed — Migration live verifiziert: Trigger `trg_partners_prevent_delete` aktiv auf `tms.partners` (BEFORE DELETE, blockiert jeden Löschversuch, Partner können nur auf inaktiv `is_active = false` gesetzt werden). Migration: `20260721120000_PROJ-33_partners_no_delete.sql` | 2026-07-25 |

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

## Next Available ID: PROJ-34
