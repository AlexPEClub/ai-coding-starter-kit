# PROJ-29: Wissensbasis (KI-Content-Fundament)

## Status: Deployed
**Created:** 2026-07-20
**Last Updated:** 2026-07-29

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
| Rolle „Redaktion" als achte Rolle im bestehenden `USER_ROLES`-Array (nicht separates Berechtigungssystem) | Nutzt komplette vorhandene Auth-/RLS-Infrastruktur weiter, keine Duplikation | 2026-07-23 |
| Hersteller/Quelle als Freitext-Feld, keine Verknüpfung zur PROJ-28-Herstellertabelle | Hält Wissensbasis wie im Product-Decision-Log festgelegt entkoppelt von Produktstammdaten | 2026-07-23 |
| Neue Kategorien-Tabelle (Werkzeugart/Material) mit n:m-Zuordnung zu Dokumenten, admin-pflegbar | Gleiches bewährtes Muster wie Hersteller-Verwaltung (PROJ-28); erweiterbar ohne Code-Änderung | 2026-07-23 |
| Supabase Storage (privater Bucket) für Original-PDFs — erstes Storage-Feature im Projekt | Kein bestehendes Muster vorhanden, wird hier neu etabliert | 2026-07-23 |
| Text-Extraktion läuft asynchron im Hintergrund nach dem Upload, kein OCR | Vermeidet Timeouts bei großen PDFs; OCR bewusst außen vor gelassen (mit dir bestätigt) — gescannte PDFs gelten als Fehlerfall | 2026-07-23 |
| Postgres-Volltextsuche (statt einfaches Text-Pattern-Matching wie in anderen Modulen) | Bestehendes Pattern-Matching ist für lange PDF-Fließtexte zu langsam/unpräzise bei wachsender Dokumentenmenge | 2026-07-23 |
| Dokument-Verarbeitungsstatus (Wird verarbeitet / Aktiv / Fehler) als rein technisches Feld, getrennt von jeglichem inhaltlichen Freigabe-Konzept | Bildet die asynchrone Verarbeitung ab, ohne den bewusst abgeschafften Entwurf/Geprüft-Workflow wieder einzuführen | 2026-07-23 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponentenstruktur

```
Wissensbasis-Seite (nur Rollen Redaktion/Admin)
├─ Upload-Bereich
│   ├─ Datei-Auswahl (PDF)
│   ├─ Werkzeugart-Auswahl (Mehrfachauswahl, aus Taxonomie)
│   ├─ Material-Auswahl (Mehrfachauswahl, aus Taxonomie)
│   └─ Hersteller/Quelle-Eingabe (Freitext)
├─ Dokumenten-Liste (Tabelle)
│   ├─ Suchfeld (durchsucht Volltext, Dateiname, Quelle)
│   ├─ Filter (Werkzeugart, Material)
│   ├─ Zeile: Dateiname, Quelle, Tags, Upload-Datum, Verarbeitungsstatus
│   ├─ Tags nachträglich bearbeiten
│   └─ Dokument löschen
├─ Leerzustand ("Erstes Dokument hochladen")
└─ Kategorien-Verwaltung (nur Admin) — Werkzeugart/Material pflegen
    (gleiches Muster wie die bestehende Hersteller-Verwaltung aus PROJ-28)
```

### B) Datenmodell (fachlich beschrieben)

**Wissensbasis-Dokument** — pro Upload ein Eintrag:
- Dateiname, Hersteller/Quelle (Freitext — bewusst kein Verweis auf die PROJ-28-Herstellertabelle,
  um die Wissensbasis wie im Decision Log festgelegt von Produktstammdaten entkoppelt zu halten)
- Original-PDF (Verweis auf die abgelegte Datei)
- Extrahierter Volltext
- Werkzeugart-Tag(s) und Material-Tag(s) (mehrere pro Dokument möglich)
- Hochgeladen von, Upload-Datum
- **Verarbeitungsstatus** (technisch, kein inhaltlicher Freigabe-Status!): "Wird verarbeitet" →
  "Aktiv" oder "Fehler bei der Verarbeitung". Nötig, weil die Text-Umwandlung bei großen PDFs etwas
  dauern darf (siehe Edge Cases) und im Hintergrund läuft, statt den Upload-Vorgang zu blockieren.

**Kategorie** — admin-gepflegte Taxonomie-Werte:
- Art (Werkzeugart oder Material) + Name (z.B. "Säge", "Holz")
- Frei erweiterbar durch Admin, analog zur bestehenden Hersteller-Verwaltung (PROJ-28)

Ein Dokument kann mehrere Kategorien beider Art zugeordnet bekommen (Mehrfachauswahl beim Upload).

### C) Tech-Entscheidungen (mit Begründung)

- **Neue Rolle „Redaktion":** wird als achte Rolle in das bestehende Rollen-Array aufgenommen
  (gleiches Muster wie die 7 Werkstatt-Rollen) statt eines separaten Berechtigungssystems — nutzt
  die komplette vorhandene Auth-/RLS-Infrastruktur wieder, statt sie zu duplizieren. Das ist eine
  kleine Erweiterung des bereits deployten PROJ-1-Rollenmodells, kein eigener Spec-Vorlauf nötig.
- **Datei-Ablage:** Supabase Storage, privater Bucket, Zugriff nur für Redaktion/Admin. Dies ist der
  erste Storage-Anwendungsfall im Projekt — es gibt noch kein bestehendes Muster dafür, wir
  etablieren hier den ersten.
- **Text-Extraktion:** einfache serverseitige PDF-zu-Text-Umwandlung (kein KI-Modell, siehe
  Open Questions in der Spec — bereits als hinfällig markiert). Läuft **im Hintergrund** nach dem
  Upload, damit große Dateien den Upload-Vorgang nicht blockieren oder zum Timeout führen.
- **Kein OCR:** Nur PDFs mit echtem Textlayer werden unterstützt (Entscheidung mit dir bestätigt).
  Gescannte Bild-PDFs ohne Textlayer werden wie ein Extraktions-Fehler behandelt. OCR kann bei
  Bedarf später nachgerüstet werden.
- **Volltextsuche:** Postgres-Volltextsuche (kein einfaches Text-Pattern-Matching) über den
  extrahierten Text. Bestehende Suchen im Projekt nutzen nur einfaches Text-Pattern-Matching, das
  reicht für kurze Felder wie Namen — für längere, durchsuchte Fließtexte aus PDFs ist das bei
  wachsender Dokumentenmenge zu langsam und unpräzise.
- **Taxonomie-Verwaltung:** eigene, admin-pflegbare Kategorien-Tabelle mit Mehrfachzuordnung pro
  Dokument (statt fester Auswahlliste im Code) — gleiches bewährtes Muster wie die
  Hersteller-Verwaltung aus PROJ-28, damit neue Werkzeugarten/Materialien ohne Code-Änderung
  ergänzt werden können.

### D) Abhängigkeiten (neue Pakete)

- Eine PDF-Text-Extraktions-Bibliothek für serverseitige Verarbeitung (konkrete Bibliothek wird in
  `/backend` ausgewählt und installiert).
- Keine KI-/Sprachmodell-Anbindung nötig für dieses Feature (durch die Scope-Vereinfachung entfällt
  dieser Bedarf komplett — spart Kosten und Komplexität gegenüber der ursprünglichen Planung).

## Frontend-Implementierung (2026-07-23)

Umgesetzt gemäß Tech Design:
- **Rolle „Redaktion"** in `src/lib/roles.ts` ergänzt (8. Rolle), `isRedaktion()`-Helper hinzugefügt,
  Test in `src/lib/roles.test.ts` aktualisiert.
- **Seite** `/verwaltung/wissensbasis` (`src/app/(app)/verwaltung/wissensbasis/page.tsx`),
  zugänglich für Redaktion + Admin.
- **Komponenten** unter `src/components/wissensbasis/`: `wissensbasis-admin-page.tsx`
  (Orchestrierung), `document-table.tsx` (Tabelle + Suche/Filter + Upload-/Tag-/Lösch-Dialoge),
  `category-manager-dialog.tsx` (Admin-only Taxonomie-Pflege).
- **Navigation:** neue Sektion „Redaktion" im Burger-Menü (`app-header.tsx`), sichtbar für
  Redaktion/Admin.
- **Abweichung vom Tech Design (bewusst, nur für diese Frontend-Phase):** Die Server Actions in
  `src/lib/actions/knowledge-documents.ts` nutzen einen **temporären In-Memory-Speicher** statt
  echtem Supabase Storage/Postgres-Volltextsuche, damit die UI schon jetzt testbar ist. Das
  Verarbeitungsstatus-Feld sowie die Fehlerbehandlung bei leerem/unlesbarem Text sind bereits nach
  Tech Design modelliert; `/backend` ersetzt nur die Datenhaltung, nicht die Schnittstellen/Typen.
- **Verifiziert:** `npm run lint`, `npm run build` (inkl. TypeScript-Check) und `npm test`
  (34 Unit-Tests) laufen grün. **Nicht verifiziert:** interaktives Durchklicken im Browser — dieses
  Worktree hat keine `.env.local` mit Supabase-Zugangsdaten, `npm run dev` schlägt daher schon auf
  `/login` fehl ("Your project's URL and Key are required..."). Das ist eine Umgebungs-Einschränkung
  dieses Worktrees, keine Eigenschaft von PROJ-29 — sollte vor `/qa` mit echten Zugangsdaten
  nachgeholt werden.

## Backend-Implementierung (2026-07-26)

In-Memory-Speicher durch echtes Supabase Storage + Postgres ersetzt; alle Server-Action-
Signaturen/Rückgabeformen unverändert (Frontend unangetastet). Neu:

- **Migration** `supabase/migrations/20260726100000_PROJ-29_wissensbasis_backend.sql`
  (idempotent, versöhnt undokumentierte Live-DB-Drift): Enum-Rolle `redaktion` abgesichert;
  obsolete Tabellen `knowledge_entries`/`knowledge_chunks` entfernt; `is_content_manager()`
  mit `SET search_path = public` gehärtet; `knowledge_documents` umgebaut (neue Spalten
  `source`/`full_text`/`uploaded_by_name`, stale Spalten entfernt, Status-Check
  `verarbeitung/aktiv/fehler` + Default, generierte `full_text_search`-tsvector-Spalte
  (Deutsch) + GIN-Index, `created_at`-Index, `updated_at`-Trigger via `set_updated_at()`);
  `knowledge_categories` case-insensitive Unique-Index + Schreib-Policy auf **Admin-only**
  verschärft (Lesen bleibt Redaktion+Admin); Join-Tabelle `knowledge_document_categories`
  (n:m, ON DELETE CASCADE) + RLS; Storage-Bucket `wissensbasis` + 3 Policies auf
  `storage.objects` (SELECT/INSERT/DELETE, `is_content_manager()`); RPCs
  `search_knowledge_documents(text, uuid[])` (ILIKE Dateiname/Quelle + `websearch_to_tsquery`
  Volltext, Kategorie-Filter „muss ALLE tragen", neueste zuerst) und
  `set_document_categories(uuid, uuid[])` (atomarer Tag-Austausch + `updated_at`-Bump);
  6 Basis-Kategorien idempotent geseedet. **Live angewendet und Schema verifiziert.**
- **PDF-Textextraktion:** `unpdf` (reines JS, alpine-tauglich) + `src/lib/knowledge/extract-text.ts`.
- **`next.config.ts`:** `experimental.serverActions.bodySizeLimit = "25mb"` für PDF-Uploads.
- **`src/lib/actions/knowledge-documents.ts`:** echte DB-Calls via Admin-Client (Schema `tms`),
  Auth-Checks `requireRedaktion()`/`requireAdmin()` unverändert. Upload lädt PDF in den Bucket,
  legt Zeile mit Status `verarbeitung` an, gibt sofort `ok:true` zurück und extrahiert den Text
  im Hintergrund via `after()` (→ Status `aktiv` mit Volltext bzw. `fehler` mit Meldung).
  `KnowledgeDocument` additiv um optionale `errorMessage`/`updatedAt` erweitert.
- **`wissensbasis-admin-page.tsx`:** ~4s-Polling via `useEffect`, solange ein Dokument noch
  `verarbeitung` ist (keine Prop-/Typ-Änderungen an Kind-Komponenten).
- **Verifiziert:** `npm run lint` (0 Fehler), `npm run build` (inkl. TS-Check) grün,
  `npm test` 350/350 Unit-Tests grün (die als „failed" gemeldeten Test-*Dateien* sind
  Playwright-E2E-Specs, die Vitest fälschlich einsammelt — vorbestehendes Config-Quirk,
  unabhängig von PROJ-29). DB-Funktionen zusätzlich per SQL-Smoke-Test durchgespielt
  (FTS, ALL-Kategorien-Filter, ILIKE-Quelle, updated_at-Bump, Cascade-Delete).

## QA Test Results

**Tested:** 2026-07-27
**App URL:** kein Live-Browser-Test möglich (siehe Hinweis unten) — Code-/Schema-Review + gezielte Node-Verifikation
**Tester:** QA Engineer (AI)

**Hinweis zum Testumfang:** Ein interaktiver Browser-Test (Playwright gegen `npm run dev`)
war in dieser Session nicht möglich — der lokale Next.js-Prozess bekommt in der
Sandbox-Umgebung keinen Zugriff auf die echten `.env.local`-Werte (auch nach expliziter
Rücksprache mit dem User und Lockerung der Sandbox für den Dev-Server-Start blieb der
Fehler bestehen; strukturelle Umgebungs-Einschränkung, kein PROJ-29-Fehler). Auf
User-Wunsch daher wie bei PROJ-21: Code-/Schema-Review statt Live-Test. Ergänzend wurden
zwei Dinge **tatsächlich ausgeführt** statt nur gelesen, um die größte Unsicherheit
(funktioniert die echte PDF-Extraktion überhaupt?) zu schließen:
- `extractTextFromPdf` direkt (ohne Server/DB) gegen die echte
  Leitz-Anwenderlexikon-PDF ausgeführt → **163.409 Zeichen erfolgreich extrahiert**,
  Inhalt sichtbar korrekt (Inhaltsverzeichnis, Fachbegriffe). Einzige Nebenwirkung:
  harmlose `Math.sumPrecise is not a function`-Warnungen von pdf.js (Node-Version hat
  dieses TC39-Stage-3-API noch nicht) — bricht die Extraktion nicht ab, rein kosmetisch.
- Dieselbe Funktion gegen eine absichtlich kaputte Datei (kein echtes PDF) ausgeführt →
  wirft korrekt `Invalid PDF structure.`, was der `catch`-Zweig in `uploadDocument`
  auffängt und als Status `fehler` verbucht — Fehlerpfad damit real bestätigt, nicht nur
  gelesen.
- Alle RLS-Policies zusätzlich unabhängig per Direkt-Query gegen `pg_policies` bestätigt
  (nicht nur aus dem Migrations-Report übernommen): Kategorien-Schreibrecht ist tatsächlich
  admin-only, Storage hat tatsächlich 3 Policies für den `wissensbasis`-Bucket.
- Leerzustand-Kriterium per SQL bestätigt: `tms.knowledge_documents` hat aktuell 0 Zeilen.

E2E-Testdatei `tests/PROJ-29-wissensbasis.spec.ts` wurde geschrieben (deckt alle
Akzeptanzkriterien unten ab), konnte aber aus obigem Grund **nicht ausgeführt** werden —
sobald `npm run dev` mit echten Zugangsdaten läuft, sollte sie einmal durchlaufen, bevor
der Status auf „Approved" wechselt.

### Acceptance Criteria Status

#### Zugang & Rollen
- [x] Zugriffsverweigerung für Nutzer ohne Redaktion/Admin — code-geprüft (`page.tsx`
  redirectet, `requireRedaktion()`/`requireAdmin()` gaten jede Server Action), nicht
  live getestet
- [x] Redaktion/Admin sehen/bearbeiten Dokumente — code-geprüft

#### Upload & Text-Konvertierung
- [ ] **Offen:** Initial nur Leitz-Lexikon hinterlegt — Tabelle ist aktuell leer (0
  Zeilen); der User lädt das echte PDF laut eigener Entscheidung selbst hoch (siehe
  Backend-Sign-off). Kein Bug, aber Kriterium noch nicht erfüllt bis das passiert ist.
- [x] Upload+Tagging → Speicherung, automatische Text-Konvertierung, sofort aktiv ohne
  Freigabeschritt — code-geprüft, Extraktions-Pipeline real gegen echtes PDF verifiziert
  (s.o.)
- [x] Unlesbares/leeres PDF → verständliche Fehlermeldung — real verifiziert (s.o.).
  **Dokumentierte Abweichung vom wörtlichen Spec-Text:** die Zeile wird nicht
  weggelassen, sondern bleibt mit Status „Fehler" sichtbar (nötig für die
  Verarbeitungsstatus-Anzeige bei großen PDFs, mit dir beim Backend-Sign-off
  bereits abgestimmt)

#### Dokument & Metadaten
- [x] Pflichtfelder vorhanden (Dateiname, Quelle, Datum, Tags, Volltext) — Schema-geprüft
- [x] Tags bearbeiten mit Zeitstempel — code-geprüft (`set_document_categories`-RPC
  bumpt `updated_at` atomar mit dem Tag-Austausch)
- [x] Löschen entfernt aus Wissensbasis — code-geprüft (Storage + DB-Zeile + Join-Cascade)

#### Suche & Filter
- [x] Filter nach Werkzeugart/Material — code-/schema-geprüft, RPC-Logik smoke-getestet
- [x] Volltextsuche — code-/schema-geprüft, RPC-Logik smoke-getestet
- [x] Leerzustand mit Upload-Hinweis — **live per SQL bestätigt** (0 Zeilen aktuell) +
  code-geprüft

### Edge Cases Status
- [x] Unlesbares/leeres PDF → real verifiziert (s.o.)
- [x] Gescanntes Bild-PDF ohne Textlayer → folgt demselben Pfad wie „unlesbar" (kein Text
  extrahiert → Status Fehler), code-geprüft
- [x] Off-Topic-Dokument → keine Sonderbehandlung nötig, trivial erfüllt
- [x] Dublette → keine Auto-Merge-Logik, wie im Decision Log festgelegt
- [x] Sehr großes PDF → asynchrone Verarbeitung via `after()`, blockiert die Antwort
  nicht; echte 163k-Zeichen-Extraktion lief in der Verifikation performant durch
- [x] Gleichzeitige Tag-Bearbeitung → „letzter Schreibvorgang gewinnt" wie im Decision
  Log akzeptiert; kein optimistisches Locking (bewusst zurückgestellt)

### Security Audit Results
- [x] Authentication: nicht angemeldeter Zugriff wird von der Middleware abgewiesen
  (code-geprüft, gleiches Muster wie der Rest der App)
- [x] Authorization: RLS-Policies **unabhängig per Direkt-Query bestätigt** — Lesen für
  Redaktion+Admin, Kategorien-Schreiben tatsächlich admin-only, Storage-Policies
  tatsächlich auf `wissensbasis`-Bucket + `is_content_manager()` gescoped
- [x] Input validation: Pflichtfelder serverseitig geprüft, ausschließlich parametrisierte
  Supabase-Query-Builder-Aufrufe (kein rohes SQL-String-Concat im gesamten
  Actions-File gefunden)
- [ ] Rate limiting: nicht implementiert — entspricht aber dem Rest der App (nirgends
  projektweit vorhanden), kein PROJ-29-spezifisches Defizit

### Bugs Found

#### BUG-2: `updateDocumentCategories` lädt alle Dokumente statt nur eins — ✅ Fixed (2026-07-27)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Tags eines Dokuments bearbeiten und speichern
  2. Erwartet: nur das betroffene Dokument wird nachgeladen
  3. Tatsächlich: die Funktion ruft `search_knowledge_documents(null, null)` auf und
     filtert das Ergebnis clientseitig nach der ID — bei „Hunderten bis niedrigen
     Tausenden" Dokumenten (siehe Tech Requirements) unnötig viel Datenvolumen pro
     Tag-Edit
- **Priority:** Nice to have
- **Fix:** Ersetzt durch gezielten Select des einen Dokuments (`eq("id", id)`) plus
  gezielten Select der Tag-Zuordnungen aus der Join-Tabelle, statt der kompletten
  RPC-Liste. `npm run lint`/`npm run build`/`npm test` weiter grün.

#### BUG-3: `deleteDocument` — „Dokument nicht gefunden"-Zweig war unerreichbar — ✅ Fixed (2026-07-27)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Ein Dokument löschen, dessen ID nicht (mehr) existiert
  2. Erwartet: Meldung „Dokument nicht gefunden."
  3. Tatsächlich: `.single()` auf 0 Treffern liefert bereits einen Postgres/PostgREST-
     Fehler, der vorher `throw`t — die eigentliche Not-Found-Prüfung danach wird nie
     erreicht, Nutzer sieht stattdessen eine generische Fehlermeldung
- **Priority:** Nice to have
- **Fix:** `.single()` durch `.maybeSingle()` ersetzt (dieselbe Korrektur zusätzlich in
  `updateDocumentCategories` angewendet) — bei 0 Treffern kommt jetzt `null` statt eines
  Fehlers zurück, die Not-Found-Prüfung greift wie vorgesehen. `npm run lint`/
  `npm run build`/`npm test` weiter grün.

### Summary
- **Acceptance Criteria:** 9/10 erfüllt (code-/schema-geprüft bzw. real verifiziert),
  1 offen (Leitz-Lexikon-Initial-Upload steht noch aus — geplanter, manueller Schritt
  des Users, kein Bug)
- **Bugs Found:** 2 total (0 critical, 0 high, 0 medium, 2 low) — **beide gefixt (2026-07-27)**
- **Security:** Pass (Auth/Authorization unabhängig gegen die echte DB verifiziert;
  Rate-Limiting-Lücke ist projektweit, nicht PROJ-29-spezifisch)
- **Production Ready:** Bedingt — keine Critical/High-Bugs, aber **kein Live-Browser-Test
  durchgeführt** (Umgebungs-Einschränkung, siehe oben) und Leitz-Lexikon-Upload steht
  noch aus
- **Recommendation:** Status bleibt **In Review** (analog PROJ-21-Präzedenzfall) bis
  entweder ein Live-Browser-Durchlauf mit echten Zugangsdaten nachgeholt wurde oder der
  User bewusst ohne diesen Schritt freigibt. Die zwei Low-Bugs blockieren keinen Deploy.

## Deployment (2026-07-28)

Deployed via `./scripts/deploy.sh PROJ-29` — Pre-Checks (Lint/Build), Docker-Build +
Neustart, Post-Deploy-Smoke gegen `https://tms.gudel-werkzeuge.de` bestanden.

**Kritischer Live-Fund direkt nach dem Deploy:** Der User meldete "App nicht erreichbar"
und "Upload/Werkzeugart+Material funktionieren nicht". Reproduktion per Playwright direkt
gegen die Produktions-URL (echter Login, echtes Formular, echte 2 MB Leitz-Lexikon-PDF)
bestätigte zwei reale Probleme:

1. **Vor dem Deploy** lief noch der alte In-Memory-Stub live — reale PDFs > 1 MB blieben
   beim Upload wegen des Next.js-Default-Body-Limits hängen ("Lädt hoch..." ohne Ende).
   Durch das Deployment dieses Backends (inkl. `bodySizeLimit: "25mb"`) behoben.
2. **Nach dem Deploy** (neuer Bug, nicht vorher aufgefallen): Die Migration
   `20260726100000` hatte für die neue Join-Tabelle `tms.knowledge_document_categories`
   keine `GRANT`-Rechte an `service_role` vergeben (anders als bei `knowledge_documents`/
   `knowledge_categories`, die diese über ältere `ALTER DEFAULT PRIVILEGES` automatisch
   bekamen). Live-Fehler: `permission denied for table knowledge_document_categories`
   (Postgres 42501) bei jedem Dokumente-Laden und jedem Upload mit Tags — erklärt exakt
   das gemeldete Symptom "Werkzeugart/Material kann man nicht mit hochladen".
   **Hotfix-Migration** `20260728120000_PROJ-29_grant_knowledge_document_categories.sql`
   vergibt die fehlenden Rechte nach; direkt auf die Live-DB angewendet und per
   `information_schema.table_privileges` verifiziert.

**Verifikation nach dem Hotfix:** Vollständiger Playwright-Lauf direkt gegen die Live-URL
(echter Login, echtes PDF) — alle 5 Tests grün: Zugriffsschutz, Kategorien-Verwaltung,
Upload eines kaputten PDFs → Status Fehler, **kompletter Zyklus mit echtem PDF** (Upload →
Verarbeitet → Aktiv → Tags tatsächlich gespeichert → Volltextsuche → Tags bearbeiten →
Löschen), keine Konsolenfehler. Test-Dokumente danach wieder aus Live-DB entfernt
(0 Zeilen in `tms.knowledge_documents` nach Abschluss).

**Lektion für künftige Migrationen:** Migrationen, die per `docker compose exec ... psql -U
postgres` direkt angewendet werden (statt über einen Rollen-Kontext mit vorbestehenden
`ALTER DEFAULT PRIVILEGES`), müssen für **jede neue Tabelle** ihre `service_role`-GRANTs
explizit selbst mitliefern — sich auf implizite Default-Privileges zu verlassen ist hier
nicht sicher.

**Nachfrage vom User nach dem Hotfix (2026-07-28, mobil):** Upload des echten
Leitz-Lexikons über sein Handy — "ändert sich nichts", verbunden mit dem Wunsch nach
einem Ladebalken. Container-Logs zeigten in einem 45-Minuten-Fenster **keinerlei**
Server-Aktivität zur Anfrage — die Datei kam serverseitig nie (sichtbar) an. Naheliegendste
Erklärung: ein 2-MB-Upload über eine langsame/instabile mobile Verbindung dauert spürbar,
und die Oberfläche gab bis dahin nur einen Button-Text ("Lädt hoch...") als Rückmeldung,
der bei einem störenden Chrome/Gemini-Overlay leicht übersehen wird — wirkt dann wie
eingefroren statt wie in Arbeit. **Fix:** `UploadDialog` (`document-table.tsx`) zeigt
jetzt einen sichtbaren Fortschrittsbalken (`Progress`-Komponente, asymptotisch auf 90 %
laufend, da echter Byte-Fortschritt über Server Actions nicht ohne Weiteres messbar ist —
kein direkter XHR-Zugriff) plus erklärenden Hinweistext während des Uploads. Lint/Build/
Tests grün (375/375 Unit-Tests). Kein serverseitiger Bug zusätzlich zu den beiden oben
gefundenen identifiziert; sollte der User nach diesem UX-Fix erneut "nichts passiert"
melden, deutet das auf ein tieferliegendes Problem hin, das einen Live-Repro-Versuch mit
Log-Mitschnitt in Echtzeit braucht.

## Refine (2026-07-29) — Hotfix: Upload eines großen PDFs blieb hängen

**Auslöser:** User meldete, dass der Upload des echten Leitz-Lexikons
(Edition 7-11, 35 Seiten) auf dem Handy kurz vor Ende hängen blieb
(Ladebalken stoppte bei ~90 %) und danach kein Dokument in der Wissensbasis
ankam — auch nicht nach Reload. Ursprünglicher Wunsch: Text-Extraktion nicht
mehr synchron beim Upload laufen zu lassen, sondern erst danach im
Hintergrund.

**Befund:** Die Hintergrund-Extraktion (`after()`) war bereits seit dem
Backend-Sign-off vom 2026-07-26 so gebaut — der Upload selbst blockiert die
Antwort nicht. Das eigentliche Problem lag woanders: direkt aus den
Produktions-Logs verifiziert wurde ein `fetch failed — getaddrinfo EAI_AGAIN
supabase.gudel-werkzeuge.de` im `tms`-Container, zeitlich unmittelbar vor dem
gemeldeten Upload-Versuch. Parallel zeigten die Traefik-Zugriffslogs für
genau dieses Zeitfenster (17:45–17:47 Uhr) ungewöhnlich lange Ladezeiten
(4–10 s statt ~150 ms) und vom Client abgebrochene Anfragen (Status 499) für
dieselbe Seite — die eigentliche Upload-POST-Anfrage erschien in den Logs
**nie**, sie hing also schon vor der Server-Antwort fest.

**Root Cause:** Alle server-seitigen Supabase-Aufrufe (Admin-Client,
Server-Actions, Middleware — nicht nur bei PROJ-29, sondern **projektweit**)
liefen über die öffentliche Domain `https://supabase.gudel-werkzeuge.de`,
obwohl der `tms`-Container und `supabase-kong` im selben internen
Docker-Netz (`web`) laufen und sich direkt erreichen könnten. Jeder
Server-Aufruf machte also einen unnötigen Umweg über externe DNS-Auflösung
und öffentliches Internet — anfällig für genau die beobachtete Instabilität,
und bei einem langen mobilen Upload ist das Zeitfenster für so eine Störung
länger offen als bei kurzen Anfragen.

**Fix (mit dem User als Hotfix abgestimmt, explizit "Hotfix"-Freigabe
erhalten):**
- Neue Umgebungsvariable `SUPABASE_INTERNAL_URL=http://supabase-kong:8000`
  in `docker-compose.yml` (kein Secret, daher direkt im Compose-File statt
  in `.env.production`).
- `src/lib/supabase/admin.ts`, `src/lib/supabase/server.ts`,
  `src/lib/supabase/middleware.ts` nutzen jetzt
  `process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL`
  — server-seitige Aufrufe gehen über das interne Docker-Netz, lokale
  Entwicklung ohne diese Variable fällt unverändert auf die öffentliche URL
  zurück. `src/lib/supabase/client.ts` (Browser-Client) bewusst unverändert
  — der Browser braucht weiterhin die öffentliche HTTPS-Adresse.
- **Verifiziert:** `npm run lint`/`npm run build` grün. Direkter Vergleich
  `supabase-kong:8000` vs. öffentliche Domain per `wget` aus dem laufenden
  `tms`-Container liefert identische PostgREST-Antwort. Nach Rebuild +
  Neustart des `tms`-Containers: Login-Seite (200) und Middleware-Redirect
  auf `/dashboard` (307, 59 ms, keine Fehler in den Logs) gegen die Live-URL
  bestätigt.
- **Nicht verifiziert:** ein erneuter Live-Upload derselben 35-seitigen
  Leitz-Lexikon-PDF durch den User selbst, um den ursprünglich gemeldeten
  Fehler als behoben zu bestätigen (Datei liegt nur lokal beim User, kein
  Testexemplar im Repo).

**Einordnung:** Dieser Fund betrifft nicht nur PROJ-29, sondern die
Zuverlässigkeit sämtlicher Server↔Supabase-Aufrufe der App. Als Hotfix im
Rahmen dieser Refine-Session behoben statt eines eigenen Spec-Durchlaufs,
da klar umrissen (interne statt öffentliche Adresse) und vom User explizit
als Hotfix freigegeben.

## Refine (2026-07-29, Fortsetzung) — Hotfix Nr. 2: fehlende Fehlerbehandlung beim Upload

**Auslöser:** Nach dem ersten Hotfix (s.o.) meldete der User zweimal in
Folge "hängt wieder" — einmal über Mobilfunk, einmal über WLAN, identisches
Symptom. Live-Mitschnitt der Produktions-Logs während beider Versuche zeigte:
die Upload-Anfrage kommt in **keinem** Fall server-seitig an (kein Eintrag
bei Traefik, tms, Supabase Storage oder Kong; keine aktive TCP-Verbindung).
Das Problem liegt also vor dem Server, zwischen Klick auf "Hochladen" und
dem tatsächlichen Verlassen des Geräts — unabhängig vom Netzwerktyp.

**Root Cause:** Beim Lesen von `wissensbasis-admin-page.tsx` fehlte in
`handleUpload`, `handleSaveTags` und `handleConfirmDelete` jeweils ein
try/catch um den awaited Server-Action-Aufruf. Schlägt der Aufruf clientseitig
fehl (z.B. durch einen Netzwerkfehler beim Senden), wird das als unbehandelte
Promise-Rejection nie gefangen — `setLoading(false)` wird nie erreicht, der
Dialog bleibt für immer auf "Lädt hoch..." stehen (Ladebalken pendelt sich
assymptotisch bei 90% ein), ohne sichtbare Fehlermeldung. Verstößt gegen die
im Projekt bereits dokumentierte Regel (`.claude/rules/frontend.md`): "Always
reset loading state in all code paths (success, error, finally)".

**Fix (Hotfix, mit dem User abgestimmt):** Alle drei Handler in
`src/components/wissensbasis/wissensbasis-admin-page.tsx` um try/catch/finally
ergänzt — Fehler werden jetzt sichtbar gemacht (Fehlermeldung bzw. Toast),
`setLoading(false)` läuft garantiert in jedem Codepfad.

**Verifiziert:** `npm run lint`/`npm run build` grün, Docker-Image neu
gebaut, Container neu gestartet, Login-Seite (200, 324ms) gegen die Live-URL
bestätigt.

**Wichtig — noch nicht abschließend verifiziert:** Dieser Fix behebt
garantiert das stille Einfrieren, zeigt aber noch nicht zwingend, *warum*
die Anfrage clientseitig überhaupt fehlschlägt — das bleibt ggf. ein
tieferliegendes Netzwerk-/Infra-Thema. Nächster Schritt: der User versucht
den Upload erneut; entweder gelingt er jetzt, oder es erscheint erstmals
eine konkrete Fehlermeldung, die den nächsten Diagnose-Schritt liefert.

**Nicht geprüft (Hinweis für später):** ob dasselbe fehlende
try/catch-Muster auch in anderen Server-Action-Aufrufen im Projekt vorkommt
— eigener, separater Rundgang bei Bedarf.

## Deployment
_To be added by /deploy_
