# PROJ-29: Wissensbasis (KI-Content-Fundament)

## Status: Planned
**Created:** 2026-07-20
**Last Updated:** 2026-07-22

> Erstes Feature des **Content-Epics** (PROJ-29 → PROJ-30 → PROJ-31 → PROJ-32).
> Ziel des Epics: eine große, durchsuchbare Text-Basis zu Themen der
> Holzwerkstoff-Zerspanung aufbauen und daraus Content-Marketing (Blog, Social
> Media, Newsletter) für Schreiner/Tischler betreiben. **Diese Spec baut nur das
> Fundament: hochgeladene Hersteller-Dokumente als durchsuchbare Text-Basis, die
> PROJ-30 wöchentlich nach neuen Themen durchsucht.**
>
> **Spec-Verfeinerung (2026-07-22):** Kern-Mechanik grundlegend vereinfacht. Statt
> strukturierter Wissens-Einträge mit Technik-Feldern und einem Entwurf/Geprüft-
> Freigabeworkflow pro Eintrag entsteht pro Upload nur noch ein getaggtes, sofort
> aktives Text-Dokument (PDF → Text-Konvertierung, kein KI-Struktur-Extraktion mehr
> nötig). Die inhaltliche Auswertung (Themen finden) übernimmt vollständig der
> wöchentliche Scan in PROJ-30.

## Dependencies
- **PROJ-1 (Auth & Rollen)** — muss um eine neue Rolle **„Redaktion"** erweitert
  werden (getrennt von den 7 Werkstatt-Rollen). Diese Erweiterung ist Voraussetzung.
- **Supabase Storage** — zum Ablegen der hochgeladenen Quell-PDFs (bereits im Stack).
- Nachgelagerte Epic-Teile bauen hierauf auf: PROJ-30 (Themenvorschläge),
  PROJ-31 (Artikel-Werkstatt), PROJ-32 (Publishing).

## User Stories
- Als **Redakteur** möchte ich Hersteller-PDFs/Dokumente hochladen, damit sie
  automatisch in durchsuchbaren Text umgewandelt und für die weitere
  Content-Erstellung verfügbar werden, ohne dass ich etwas abtippen muss.
- Als **Redakteur** möchte ich ein Dokument beim Hochladen nach Werkzeugart und
  Material taggen, damit ich die Wissensbasis später gezielt filtern kann.
- Als **Redakteur** möchte ich die Wissensbasis nach Werkzeugart, Material und im
  Volltext durchsuchen/filtern, damit ich schnell das passende Dokument finde.
- Als **Redakteur** möchte ich zu jedem Dokument die Quelle (Hersteller, Dateiname,
  Upload-Datum) sehen, damit ich Fakten später belegen und nachprüfen kann.
- Als **Admin** möchte ich die Kategorien (Werkzeugart, Material) pflegen, damit die
  Taxonomie zum Sortiment und zu neuen Themen passt.

## Out of Scope
<!-- Bewusst NICHT Teil dieser Spec — gehört zu späteren Epic-Teilen. -->
- **Strukturierte Wissens-Einträge mit Technik-Feldern** (Kennwerte etc.) und ein
  Entwurf/Geprüft-Freigabeworkflow pro Eintrag — bewusst verworfen zugunsten eines
  einfachen, getaggten Text-Korpus. Strukturierte Fakten-Extraktion für einen
  konkreten Artikel passiert bedarfsweise erst in **PROJ-31**.
- **Wöchentliche Themenvorschläge** aus der Wissensbasis → **PROJ-30**
- **Artikel-Text- & Bildgenerierung** und der **Lern-Loop** (Korrekturen verbessern
  den Start-Prompt) → **PROJ-31**
- **Veröffentlichung** auf Blog / Social Media / Newsletter → **PROJ-32**
- **Automatisches Web-Scraping** von Hersteller-Websites (nur manueller Upload im MVP)
- **Verknüpfung Dokument ↔ konkretes Produkt/SKU** aus PROJ-28 (bewusst entkoppelt;
  ggf. später als optionale Verlinkung)
- **Kundenseitige / öffentliche Ansicht** der Wissensbasis (rein internes Werkzeug)
- **Themen außerhalb des Scopes:** ausschließlich Zerspanungswerkzeuge (Sägen,
  Fräser, Bohrer) für die Materialien Holz, Kunststoff, Aluminium — alles andere
  wird nicht erfasst.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugang & Rollen
- [ ] Angenommen ein Nutzer hat NICHT die Rolle Redaktion oder Admin, wenn er die
  Wissensbasis-Seite aufruft, dann wird ihm der Zugriff verwehrt (keine Anzeige/Aktion).
- [ ] Angenommen ein Nutzer hat die Rolle Redaktion, wenn er die Wissensbasis öffnet,
  dann kann er Dokumente sehen, hochladen, taggen und bearbeiten.

### Upload & Text-Konvertierung
- [ ] Angenommen die Wissensbasis wird erstmalig eingerichtet, wenn sie startet, dann
  ist zunächst nur das **Leitz-Lexikon** als Quelle hinterlegt, und weitere
  Hersteller-Dokumente können **jederzeit** ergänzt werden.
- [ ] Angenommen ein Redakteur ist eingeloggt, wenn er ein PDF/Dokument hochlädt und
  Werkzeugart/Material taggt, dann wird die Datei gespeichert, automatisch in eine
  durchsuchbare Textdatei umgewandelt und ist **sofort ohne weiteren Freigabeschritt**
  Teil der Wissensbasis.
- [ ] Angenommen ein hochgeladenes PDF ist unlesbar/beschädigt oder enthält keinen
  extrahierbaren Text, wenn die Text-Konvertierung fehlschlägt, dann wird eine
  verständliche Fehlermeldung angezeigt und kein fehlerhaftes/leeres Dokument abgelegt.

### Dokument & Metadaten
- [ ] Angenommen ein Dokument wird hochgeladen, wenn es gespeichert wird, dann enthält
  es mindestens: Dateiname, Hersteller/Quelle, Upload-Datum, Werkzeugart-Tag(s),
  Material-Tag(s), extrahierter Volltext.
- [ ] Angenommen ein Redakteur möchte die Tags eines Dokuments korrigieren, wenn er sie
  ändert und speichert, dann werden die Änderungen übernommen und der
  Änderungszeitpunkt festgehalten.
- [ ] Angenommen ein Dokument wurde versehentlich oder fälschlich hochgeladen, wenn ein
  Redakteur es löscht, dann wird es aus der Wissensbasis entfernt und fließt nicht mehr
  in den wöchentlichen Themen-Scan (PROJ-30) ein.

### Suche & Filter
- [ ] Angenommen es existieren Dokumente, wenn ein Redakteur nach Werkzeugart oder
  Material filtert, dann werden nur passende Dokumente angezeigt.
- [ ] Angenommen es existieren Dokumente, wenn ein Redakteur einen Suchbegriff eingibt,
  dann werden Dokumente mit Treffern in Dateiname/Volltext/Quelle angezeigt.
- [ ] Angenommen die Wissensbasis ist leer, wenn ein Redakteur sie öffnet, dann sieht
  er einen Leerzustand mit Hinweis „Erstes Dokument hochladen".

## Edge Cases
- **Unlesbares/leeres PDF:** Text-Konvertierung schlägt fehl → Fehlermeldung, kein
  Dokument angelegt.
- **Gescanntes/Bild-PDF ohne echten Textlayer:** Standard-Textextraktion liefert
  keinen/kaum Text → wird wie „unlesbar" behandelt (siehe Open Questions zu OCR).
- **Off-Topic-Dokument** (nicht Zerspanung/Holz-Kunststoff-Alu): wird ganz normal
  hochgeladen und getaggt; Redakteur kann es bei Bedarf einfach wieder löschen.
- **Dublette:** Derselbe Begriff taucht in mehreren Hersteller-PDFs auf → Dokumente
  bleiben getrennt (mit eigener Hersteller-Quelle), kein automatisches Zusammenführen.
- **Sehr großes PDF** mit vielen Themen → Text-Konvertierung darf dauern;
  Fortschritt/Status sichtbar, kein Timeout-Abbruch ohne Rückmeldung.
- **Gleichzeitige Bearbeitung** der Tags eines Dokuments durch zwei Redakteure →
  letzter Speichervorgang gewinnt, aber es darf kein stiller Datenverlust ohne Hinweis
  passieren.

## Technical Requirements (optional)
- **Security:** Nur Rollen Redaktion + Admin (RLS). Rein internes Tool.
- **Datei-Ablage:** Original-PDF und extrahierter Volltext in Supabase Storage/DB.
- **Datenmenge:** erwartet Hunderte bis niedrige Tausende Dokumente — Suche/Filter
  müssen dabei flott bleiben.
- **Text-Extraktion:** einfache PDF-zu-Text-Konvertierung (Standard-Bibliothek),
  kein komplexes KI-Modell nötig — konkrete Bibliothek wird in `/architecture`
  festgelegt.

## Open Questions
<!-- Ungelöste Punkte aus dem Interview. In /refine schließen, wenn geklärt. -->
- [x] **Urheberrecht:** Speicherung wörtlicher Originaltext-Auszüge → intern, rein für
  Faktencheck (Redaktion/PROJ-31), nie öffentlich sichtbar oder in generierte Artikel
  kopiert; Auszug bewusst kurz halten (Zitatcharakter). Vor einem größeren
  Massenimport an Hersteller-Dokumenten wird eine kurze anwaltliche Prüfung
  empfohlen, blockiert aber nicht die Entwicklung. (2026-07-22)
- [x] **Duplikat-Strategie:** Dokumente bleiben strikt getrennt je Quelle, kein
  automatisches Zusammenführen. Optional kann die Redaktion Dokumente manuell
  verknüpfen. (2026-07-22)
- [x] **Feldkatalog „technische Kennwerte":** hinfällig — durch die Scope-Vereinfachung
  (siehe unten) gibt es keine strukturierten Kennwerte-Felder mehr in PROJ-29.
  (2026-07-22)
- [x] **Welche KI/Extraktions-Pipeline:** hinfällig/vereinfacht — es braucht keine
  KI-Struktur-Extraktion mehr, nur eine einfache PDF-zu-Text-Konvertierung
  (Standard-Bibliothek); konkrete Bibliothek → `/architecture`. (2026-07-22)
- [x] Taxonomie fix oder admin-erweiterbar → bestätigt: **admin-erweiterbar**, gilt
  jetzt für Dokument-Tags (Werkzeugart/Material) statt für Eintrags-Felder.
  (2026-07-22)
- [ ] **Gescannte/Bild-PDFs ohne Textlayer:** reicht Standard-Textextraktion, oder
  wird OCR benötigt, damit auch gescannte Hersteller-Kataloge durchsuchbar werden?
  → in `/architecture` klären.
- [ ] **Downstream-Auswirkung auf PROJ-31:** Die Content-Studio-Spec (PROJ-31)
  verweist in ihren Dependencies noch auf „geprüfte Fakten/Quelldaten" aus PROJ-29.
  Durch den Wegfall des Entwurf/Geprüft-Workflows liefert PROJ-29 künftig
  ungeprüfte, getaggte Rohtext-Dokumente statt geprüfter Einträge — PROJ-31 sollte
  in einem eigenen `/refine PROJ-31` entsprechend angepasst werden.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Eigene Rolle „Redaktion" (statt nur Admin) | Dediziertes Content-/Wissens-Team, getrennt von der Werkstatt; erweitert PROJ-1 | 2026-07-20 |
| ~~Ingestion: PDF-Upload → KI-Extraktion → Admin-Review~~ *(überholt, siehe 2026-07-22)* | Wenig Tipparbeit bei vielen Themen, Kontrolle bleibt beim Menschen | 2026-07-20 |
| ~~Eintrag = Lexikon-Begriff mit strukturierten Technik-Feldern~~ *(überholt, siehe 2026-07-22)* | Ideale, gut abfragbare Grundlage für spätere Themen-/Artikelgenerierung | 2026-07-20 |
| ~~Status Entwurf → Geprüft, nur „Geprüft" zählt als verlässlich~~ *(überholt, siehe 2026-07-22)* | Qualitätskontrolle für KI-Extrakte, verhindert ungeprüfte Fakten | 2026-07-20 |
| Speicherung: destillierte Fakten UND wörtliche Originaltext-Auszüge *(Auszug-Teil weiterhin gültig, siehe Urheberrechts-Entscheidung 2026-07-22; "destillierte Fakten" entfällt mit dem Eintrags-Konzept)* | Bequeme Referenz für KI & Faktencheck; Urheberrecht bleibt offener Punkt | 2026-07-20 |
| Wissensbasis unabhängig von PROJ-28-Produkten (keine Zwangs-Verknüpfung) | Allgemeines Fachwissen, nicht an einzelne SKUs gebunden | 2026-07-20 |
| Taxonomie: Werkzeugart (Säge/Fräser/Bohrer) × Material (Holz/Kunststoff/Alu), admin-erweiterbar | Klarer Scope laut PM, aber ausbaubar | 2026-07-20 |
| Rein internes Tool, keine öffentliche Ansicht in dieser Spec | Öffentliche Ausspielung ist PROJ-32 | 2026-07-20 |
| Startzustand: initial nur Leitz-Lexikon, jederzeit um weitere Hersteller erweiterbar | Fundament wächst über die Zeit, kein Big-Bang-Import nötig | 2026-07-20 |
| **Kern-Mechanik vereinfacht:** kein strukturierter „Wissens-Eintrag" mit Technik-Feldern/Entwurf-Geprüft-Workflow mehr — stattdessen PDF → automatische Text-Konvertierung → sofort aktives, getaggtes Dokument | Inhaltliche Auswertung (Themen finden) passiert ohnehin wöchentlich gebündelt in PROJ-30; ein zusätzlicher Struktur-/Freigabeschritt pro PDF wäre nur Mehraufwand ohne Nutzen | 2026-07-22 |
| Kein Freigabe-Workflow beim Dokumenten-Upload — Hochladen = sofort aktiv | Qualitätskontrolle passiert sinnvoller später bei Themen-Freigabe (PROJ-30) und Artikel-Freigabe (PROJ-31) | 2026-07-22 |
| Dokumente werden beim Upload mit Werkzeugart/Material getaggt (admin-erweiterbare Taxonomie) | Ermöglicht gezielte Filterung trotz Wegfall strukturierter Einträge | 2026-07-22 |
| Originaltext bleibt rein intern gespeichert, nie öffentlich zitiert; anwaltliche Prüfung vor Massenimport empfohlen | Urheberrechtliches Risiko minimieren, ohne die Entwicklung zu blockieren | 2026-07-22 |
| Duplikate (gleicher Begriff, mehrere Hersteller) bleiben getrennte Dokumente, kein Auto-Merge | Verhindert unbemerktes Vermischen/Verfälschen von Fakten aus unterschiedlichen Quellen | 2026-07-22 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _wird in /architecture ergänzt_ | | |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
