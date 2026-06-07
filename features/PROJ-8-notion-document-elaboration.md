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
- [x] Maximale Länge/Tiefe je Dokumenttyp → **Entschieden (Architektur):** weiche Ziellängen als Prompt-Empfehlung je Kategorie (Marketing ~200–250 W, Produkt ~400–500 W, Operations ~300–400 W, Default ~300 W), keine technische Erzwingung.
- [x] Monday-Task Rücklink auf Notion → **Entschieden (Architektur):** nicht in PROJ-8. Notion-Seite trägt bereits den Monday-Link; Rückrichtung bringt zusätzlichen API-Aufruf + Fehlerquelle ohne klaren Nutzen. Kann später ergänzt werden.

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
| Erweiterung der bestehenden Bestätigungs-Server-Action statt neues Endpoint/UI | Trigger (Bestätigung) und Notion-Pfad existieren schon (PROJ-4/5); minimaler Eingriff, kein Frontend-Change | 2026-06-07 |
| Neue Funktion `elaborateDocument` in `src/lib/anthropic.ts` (neben `generateSuggestions`) | LLM-Logik gehört in die Anthropic-Lib; gleiche Retry-/Client-Muster wiederverwendbar | 2026-06-07 |
| Kategorie-spezifische Prompts mit weichen Ziellängen (keine harte Erzwingung) | Jede Kategorie braucht anderes Format; Claude soll kontextuell entscheiden, nicht starr abschneiden | 2026-06-07 |
| Reichhaltige Notion-Blöcke via `append_children` in 100er-Batches | Notion erlaubt max. 100 Kinder-Blöcke pro Aufruf; Aufteilung verhindert API-Fehler bei langen Dokumenten | 2026-06-07 |
| `insight`/`source` bleiben als Referenz am Seitenende erhalten | Kontext geht nicht verloren; ausgearbeitetes Dokument ergänzt statt ersetzt | 2026-06-07 |
| Kein neues Supabase-Feld | Ausgearbeitete Inhalte leben in Notion; Supabase speichert weiterhin nur den Kurz-Vorschlag | 2026-06-07 |
| Best-effort-Kette: Monday hart, Ausarbeitung + Notion weich | Stefans < 2-Min-Workflow darf nie an einer LLM-/Notion-Störung scheitern (Muster aus PROJ-5) | 2026-06-07 |
| Monday-Task ohne Notion-Rücklink | Vermeidet zusätzlichen Monday-API-Aufruf + Fehlerquelle; Nutzen gering | 2026-06-07 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Kernaussage
Kein neues UI, kein neues Datenbankschema, kein neues API-Endpoint. PROJ-8 erweitert die bestehende Server-seitige Bestätigungs-Logik (PROJ-4/5). Stefan sieht denselben Button und dieselben Toasts — NORA arbeitet im Hintergrund mehr.

### A) Datenfluss (Änderung)
```
Stefan klickt "Bestätigen"
  → Monday-Task erstellen (unverändert, hart: Fehler bricht ab)
  → elaborateDocument(Claude) — NEU, kategorie-spezifischer Prompt
      ✓ Erfolg → Notion-Seite mit vollem, gegliedertem Dokument
      ✗ Fehler → Notion-Seite mit bisherigem Kurztext (Fallback) + Warnung
  → Toast: ✓ Task + ✓ Notion  (oder ⚠ Warnung)
```

### B) Betroffene Bausteine
```
src/lib/anthropic.ts        ERWEITERT: neue Funktion elaborateDocument()
src/lib/notion.ts           ERWEITERT: createPage akzeptiert reichhaltige Block-Struktur
                                        + Aufteilung in 100er-Batches (append_children)
src/app/actions/suggestions.ts  ERWEITERT: ruft elaborateDocument vor createPage auf
```
Kein neues UI-Component. Der Bestätigungs-Button hat bereits einen Ladezustand — er lädt nun etwas länger.

### C) Funktion `elaborateDocument`
- **Input:** title, body, insight, source, category, `NORA_COMPANY_CONTEXT`
- **Output:** strukturiertes Dokument als Liste von Abschnitten (Überschrift + Absätze), passend zu Notion-Blöcken
- **Modell:** `claude-opus-4-8`, adaptive thinking, mit Retry-Logik analog `generateSuggestions`

**Kategorie-spezifische Formate (weiche Ziellängen):**

| Kategorie | Format | Ziellänge |
|-----------|--------|-----------|
| marketing | LinkedIn-/Blogpost-Entwurf — Hook, Hauptaussage, Call-to-Action | ~200–250 W |
| product | Feature-/Spec-Konzept — Problem, Lösung, Umsetzungsschritte, Erfolgskriterium | ~400–500 W |
| operations | Schritt-für-Schritt-Prozess / Checkliste — Kontext, nummerierte Schritte, Hinweise | ~300–400 W |
| *(unbekannt)* | Generisches Strategie-Dokument — Kontext, Ziel, Maßnahmen, nächste Aktion | ~300 W |

### D) Notion-Seitenstruktur (Beispiel Marketing)
```
[Seitentitel — unverändert]

## LinkedIn-Post-Entwurf
[fertig formulierter Post]
## Hintergrund & Strategie
[warum jetzt, für wen]
## Nächste Aktion
[konkrete erste Schritte]
────────────────────────
💡 Insight   [bisheriger Kurztext — bleibt als Referenz]
📎 Quelle    [bisheriger Quell-Hinweis — bleibt als Referenz]
```
Notion-Limit: max. 100 Kinder-Blöcke/Aufruf → längere Dokumente werden automatisch in mehreren `append_children`-Aufrufen angehängt.

### E) Fehlerbehandlung (Best-Effort-Kette)
```
Monday-Task        Fehler → gesamte Bestätigung schlägt fehl (wie heute)
elaborateDocument  Fehler/kein Key → Fallback auf Kurztext + Warnung
createPage(Notion) Fehler → notion_warning (wie PROJ-5)
```
Kein neuer Fehlerfall aus Stefans Sicht.

### F) Unverändert
Dashboard-UI, Supabase-Schema, Monday-Task-Inhalt, Toast-Muster, Auth/RLS.

### G) Dependencies
Keine neuen Pakete — `@anthropic-ai/sdk` (Claude) und Raw-Fetch (Notion) sind bereits vorhanden.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
