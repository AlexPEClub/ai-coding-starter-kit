# PROJ-8: Notion-Dokument-Ausarbeitung (Voll-Generierung)

## Status: Planned
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Dependencies
- Requires: PROJ-5 (Notion Document Auto-Creation) — die Notion-Seite, Datenbank und der `createPage`-Pfad existieren bereits; dieses Feature reichert den Seiteninhalt an.
- Requires: PROJ-4 (Monday.com Task Auto-Creation) — Bestätigung legt parallel den Monday-Task an (unverändert).
- Requires: PROJ-3 (Review & Approval Dashboard) — Bestätigung ist der Trigger.
- Nutzt: PROJ-2 Wissensbasis (`NORA_COMPANY_CONTEXT`) als Marken-/Fachkontext für die Ausarbeitung.

## Übersicht
Heute erstellt NORA bei Bestätigung eines Vorschlags eine Notion-Seite mit dem **kurzen** Vorschlagstext (`body`, `insight`, `source`). Dieses Feature lässt Claude daraus ein **fertiges, sofort nutzbares Dokument** schreiben — kategoriespezifisch — und füllt die Notion-Seite damit. Stefan soll in Notion ein ausgearbeitetes Ergebnis vorfinden, das er nur noch prüfen statt von Grund auf schreiben muss.

Die Ausarbeitung passiert **on-demand bei der Bestätigung** (kein Vorab-Lauf für ungenutzte Vorschläge). Sie ist **best-effort**: schlägt sie fehl, läuft die Bestätigung normal durch und die Seite erhält den bisherigen Kurztext + Warnhinweis.

## User Stories
- Als Stefan möchte ich bei Bestätigung eines Marketing-Vorschlags einen **fertigen LinkedIn-Post-/Blogpost-Entwurf** in Notion erhalten, damit ich nur noch prüfen und posten muss, statt selbst zu texten.
- Als Stefan möchte ich bei einem Produkt-Vorschlag ein **strukturiertes Feature-/Spec-Konzept** (Problem, Lösung, Umsetzungsschritte) in Notion bekommen, damit ich QualiPilot direkt weiterentwickeln kann.
- Als Stefan möchte ich bei einem Operations-Vorschlag eine **Schritt-für-Schritt-Prozessbeschreibung / Checkliste** erhalten, damit ich den Prozess sofort umsetzen kann.
- Als Stefan möchte ich, dass die Ausarbeitung in Nexora-Markenstimme und GMP-/Pharma-fachlich korrekt geschrieben ist, damit ich Inhalte ohne große Nacharbeit verwenden kann.
- Als Stefan möchte ich, dass eine fehlgeschlagene Ausarbeitung meine Bestätigung niemals blockiert, damit mein < 2-Minuten-Tagesworkflow zuverlässig bleibt.

## Out of Scope
- **Auto-Posting auf LinkedIn** — Marketing-Dokumente bleiben Entwürfe in Notion (PRD-Non-Goal). NORA postet nichts selbst.
- **E-Mail-Versand** von Outreach-Texten — bewusst ausgeschlossen (siehe frühere BizDev-Diskussion; ggf. eigenes späteres Feature).
- **Code-Implementierung / GitHub-PRs** — separates, größeres Feature (eigener Spec, noch nicht angelegt).
- **Vorab-Ausarbeitung aller Vorschläge** bei der täglichen Generierung — bewusst verworfen (Token-Kosten für nie bestätigte Vorschläge).
- **Separater „Ausarbeiten"-Button** als getrennter Schritt — verworfen zugunsten on-demand bei Bestätigung.
- **Nachträgliches Re-Generieren / Bearbeiten** der Notion-Seite aus dem Dashboard — Stefan bearbeitet direkt in Notion. Re-Generierung ggf. später.
- **Bildgenerierung / Grafiken** im Dokument — nur Text/strukturierte Blöcke.
- **Mehrsprachige Ausgabe** — Dokumente werden auf Deutsch erstellt (wie Vorschläge); Sprachwahl ist kein MVP-Ziel.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen ein Marketing-Vorschlag liegt vor, wenn Stefan ihn bestätigt, dann erstellt NORA eine Notion-Seite mit einem ausgearbeiteten LinkedIn-Post-/Blogpost-Entwurf (mehrere Absätze, klare Struktur), nicht nur dem Kurztext.
- [ ] Angenommen ein Produkt-Vorschlag liegt vor, wenn Stefan ihn bestätigt, dann enthält die Notion-Seite ein strukturiertes Feature-/Spec-Konzept mit erkennbaren Abschnitten (z. B. Problem, Lösung, Umsetzungsschritte).
- [ ] Angenommen ein Operations-Vorschlag liegt vor, wenn Stefan ihn bestätigt, dann enthält die Notion-Seite eine Schritt-für-Schritt-Prozessbeschreibung bzw. Checkliste.
- [ ] Angenommen ein Vorschlag wird ausgearbeitet, wenn das Dokument erzeugt wird, dann ist es in Nexora-Markenstimme (premium, fachlich, GMP-/Pharma-kompetent) und bezieht sich konkret auf Nexora AI / QualiPilot, nicht generisch.
- [ ] Angenommen die Voll-Ausarbeitung durch Claude schlägt fehl (Timeout/Fehler), wenn Stefan bestätigt, dann wird der Monday-Task erstellt, die Notion-Seite mit dem bisherigen Kurztext angelegt und ein Warnhinweis angezeigt — die Bestätigung schlägt nicht fehl.
- [ ] Angenommen die Ausarbeitung war erfolgreich, wenn die Notion-Seite erstellt wurde, dann zeigt das Dashboard die Erfolgsmeldung mit Link zur Notion-Seite (wie bisher).
- [ ] Angenommen ein Vorschlag wurde bereits bestätigt, wenn Stefan ihn erneut zu bestätigen versucht, dann wird keine zweite Ausarbeitung/Seite erzeugt (Idempotenz wie bei PROJ-4/PROJ-5).

## Edge Cases
- **Claude-Timeout bei Ausarbeitung:** Fallback auf Kurztext + Warnung; Bestätigung & Monday-Task bleiben erfolgreich.
- **Claude liefert leeres/unbrauchbares Dokument:** Wie Fehlerfall behandeln → Fallback auf Kurztext + Warnung.
- **Sehr langes generiertes Dokument:** Inhalt muss innerhalb der Notion-API-Grenzen bleiben (Block-/Längen-Limits) — überlange Inhalte werden sauber gekürzt/aufgeteilt statt einen API-Fehler auszulösen.
- **Notion-API nicht erreichbar, aber Ausarbeitung erfolgreich:** Bestehendes PROJ-5-Verhalten — `notion_warning`, Monday & Bestätigung bleiben erfolgreich.
- **Unbekannte/fehlende Kategorie:** Fällt auf ein generisches Standard-Dokumentformat zurück statt zu scheitern.
- **ANTHROPIC_API_KEY fehlt zur Laufzeit:** Wie Fehlerfall → Kurztext-Fallback + Warnung (Bestätigung nie blockiert).
- **Doppelklick / paralleler Bestätigungsversuch:** Keine doppelte Ausarbeitung; idempotent zur bestehenden Status-Logik.

## Technical Requirements (optional)
- Performance: On-demand-Ausarbeitung darf den Bestätigungs-Request spürbar verlängern (Sekunden) — Nutzer braucht klares Lade-Feedback. Server-Action/Route-Timeout entsprechend großzügig (vgl. `maxDuration` bei Generierung = 60s).
- Security: `ANTHROPIC_API_KEY` bleibt server-seitig (nie `NEXT_PUBLIC_`). Keine Schlüssel im Browser oder in Logs.
- Best-effort: Ausarbeitungs-Fehler dürfen Bestätigung/Monday niemals blockieren (analog Notion best-effort aus PROJ-5).
- Markenkontext: `NORA_COMPANY_CONTEXT` (PROJ-2) muss in den Ausarbeitungs-Prompt einfließen, damit Ton & Fachlichkeit stimmen.

## Open Questions
- [ ] Maximale Länge/Tiefe je Dokumenttyp — soll es weiche Ziellängen geben (z. B. LinkedIn-Post ~150–250 Wörter, Strategie-Dok länger), oder überlassen wir das ganz Claude? (Architektur/Implementierung kann hier einen sinnvollen Default setzen.)
- [ ] Soll der Monday-Task einen Hinweis/Link erhalten, dass das ausgearbeitete Dokument in Notion liegt? (Heute trägt die Notion-Seite den Monday-Link — Rückrichtung optional.)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Ausarbeitung on-demand bei Bestätigung (nicht vorab) | Keine Token-Kosten für nie bestätigte Vorschläge; passt zum best-effort-Muster | 2026-06-07 |
| Kategoriespezifische Dokumenttypen (Marketing→Post, Produkt→Konzept, Operations→Prozess) | Jede Kategorie braucht ein anderes nützliches Endformat; maximaler Sofort-Nutzen | 2026-06-07 |
| Best-effort mit Fallback auf Kurztext + Warnung bei Fehler | Stefans < 2-Min-Workflow darf nie durch eine fehlgeschlagene LLM-Ausarbeitung blockiert werden | 2026-06-07 |
| Auto-Posting/E-Mail-Versand ausgeschlossen | PRD-Non-Goal; Dokumente bleiben prüfbare Entwürfe | 2026-06-07 |
| Ausgabe auf Deutsch | Konsistent mit Vorschlägen und Notion-Sprache | 2026-06-07 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _To be added by /architecture_ | | |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
