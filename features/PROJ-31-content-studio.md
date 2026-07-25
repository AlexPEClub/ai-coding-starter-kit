# PROJ-31: Content-Studio (Generierung + Redaktion + Lern-Loop)

## Status: Planned
**Created:** 2026-07-20
**Last Updated:** 2026-07-24

> Dritter Baustein des **Content-Epics** (PROJ-29 → PROJ-30 → **PROJ-31** → PROJ-32) und dessen
> Herzstück. Hier wird zu einem **freigegebenen Thema** (aus PROJ-30) mit KI ein Artikel (Text +
> Bilder) erzeugt und im **Human-in-the-Loop** so lange verfeinert, bis er passt. Aus den
> Korrekturen **lernt** das System, damit Texte mit der Zeit „auf Anhieb" sitzen.
>
> **Prototyp-Validierung (2026-07-20):** Tonalität anhand eines echten Beispieltextes des Users
> (Sägeblatt-Schärf-Anleitung) + der Leitz-Anwenderlexikon-PDF erprobt. Muster-Artikel „Warum
> werden Ihre Werkzeuge stumpf?" wurde vom User als tonal passend bestätigt. Diese Erkenntnisse
> sind unten eingearbeitet.

## Dependencies
- **PROJ-1 (Auth & Rollen)** — Rolle **„Redaktion"** (+ Admin).
- **PROJ-29 (Wissensbasis)** — liefert die hochgeladenen **Wissensbasis-Dokumente** (Volltext,
  getaggt nach Werkzeugart/Material) als Rohdaten-Basis. Seit der PROJ-29-Verfeinerung
  (2026-07-22) gibt es dort keine vorab geprüften Einzel-Fakten mehr — PROJ-31 durchsucht die
  Dokumente selbst nach themenrelevanten Textstellen (siehe Kern-Mechanik).
- **PROJ-30 (Themenvorschläge)** — liefert die **freigegebenen Themen**; Content wird **nur** für
  freigegebene Themen erstellt.
- **Speist PROJ-32 (Publishing)** — freigegebene Artikel gehen dorthin zur Ausspielung.
- **Extern:** KI-Textgenerierung (konkrete Modelle/Anbieter → `/architecture`). Keine
  KI-Bildgenerierung nötig — Bilder werden manuell hochgeladen.

## User Stories
- Als **Redakteur** möchte ich zu einem freigegebenen Thema per Klick einen ersten Artikel-Entwurf
  generieren lassen, damit ich nicht bei null anfange.
- Als **Redakteur** möchte ich die **Tonalität über Regler** einstellen (**Länge** und
  **Fachtiefe**), damit der Text zu unserem Stil passt.
- Als **Redakteur** möchte ich **fachliche Fehler in einem Freitextfeld richtigstellen**, damit der
  Text technisch korrekt neu erzeugt wird.
- Als **Redakteur** möchte ich, dass **jede Iteration gespeichert** wird und das System aus meinen
  **fachlichen Korrekturen lernt**, damit künftige Texte denselben Fehler nicht wiederholen.
- Als **Redakteur** möchte ich **eigene oder im Internet besorgte Bilder hochladen**, damit der
  Artikel bebildert ist.
- Als **Redakteur** möchte ich einen Artikel **final freigeben**, damit er zur Veröffentlichung
  (PROJ-32) bereitsteht.
- Als **Admin** möchte ich einen **Beispiel-Text als Tonalitäts-Anker** hinterlegen, damit alle
  Generierungen von Anfang an unseren Stil treffen.

## Kern-Mechanik (validiert)
1. **Tonalitäts-Anker:** Ein einziger, global hinterlegter **Beispiel-Text** (vom Team selbst
   geschrieben) gibt den Grundstil für **alle** Generierungen vor (kein separater Anker je
   Content-Typ).
2. **Faktengrundlage aus der Wissensbasis (Retrieval):** Bei „Entwurf erzeugen" durchsucht das
   System die getaggten Wissensbasis-Dokumente (PROJ-29) nach themenrelevanten Textstellen und
   übergibt diese der KI als Faktenbasis. Die verwendeten Quellen (Dokument + Fundstelle) werden
   dem Entwurf sichtbar beigefügt, damit der Redakteur die Fakten nachprüfen kann.
3. **Zwei strikt getrennte Feedback-Wege:**
   - **🎚️ Regler = Stil/Tonalität**, beschränkt auf zwei Dimensionen: **Länge/Ausführlichkeit**
     und **Fachtiefe** (wie der Text *klingt* bzw. wie detailliert er wird).
   - **✍️ Freitext = ausschließlich fachliche Richtigstellung** (kein „gefällt mir nicht"; nur:
     „das ist technisch falsch, richtig ist …").
4. **Iterativ:** Feedback → Text wird **neu erzeugt** → wiederholen, bis „ok".
5. **Iterations-Historie:** jede Version wird gespeichert (nichts geht verloren).
6. **Lern-Speicher:** fachliche Korrekturen (und Tonalitäts-Einstellungen) werden als
   **Few-Shot-Beispiele** gespeichert und in künftige Generierungs-Prompts eingespeist (kein
   Fine-Tuning) → Fehler werden nicht wiederholt, der Start-Text wird über die Zeit besser
   („auf Anhieb passend").
7. **Harte Regeln:** **„Sie"-Form** als Standard; **kein Hersteller/keine Marke** wird je genannt
   (immer neutral) — durchgesetzt über die Prompt-Vorgabe an die KI, ohne zusätzliche automatische
   Nachkontrolle.

## Out of Scope
- **Themenfindung & -freigabe** → PROJ-30 (Content entsteht nur für bereits freigegebene Themen).
- **Veröffentlichung & kanalspezifische Ausspielung** (Blog/Social/Newsletter) → PROJ-32.
- **Pflege der Wissensbasis** (PDF-Upload, Text-Konvertierung, Taggen) → PROJ-29.
- **Kanalspezifische Format-Varianten** (kurzer Social-Post vs. langer Blog-Artikel) — entsteht
  ausschließlich in PROJ-32; PROJ-31 liefert nur den **Kern-Artikel**.
- **KI-Bildgenerierung** — bewusst nicht Teil dieser Spec; Bilder werden ausschließlich manuell
  hochgeladen (eigene Fotos oder im Internet besorgte Bilder).

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugang & Voraussetzung
- [ ] Angenommen ein Nutzer hat nicht die Rolle Redaktion/Admin, wenn er das Content-Studio öffnet,
  dann wird ihm der Zugriff verwehrt.
- [ ] Angenommen ein Thema ist NICHT freigegeben (PROJ-30), wenn ein Redakteur dazu Content erstellen
  will, dann ist das nicht möglich (nur freigegebene Themen erscheinen im Studio).

### Generierung
- [ ] Angenommen ein freigegebenes Thema liegt vor, wenn der Redakteur „Entwurf erzeugen" klickt,
  dann durchsucht das System die getaggten Wissensbasis-Dokumente (PROJ-29) nach themenrelevanten
  Textstellen und die KI erstellt daraus einen ersten Artikel-Text im hinterlegten Tonalitäts-Stil.
- [ ] Angenommen ein Entwurf wurde erzeugt, wenn er erscheint, dann werden die dafür verwendeten
  Wissensbasis-Quellen (Dokument + Fundstelle) sichtbar aufgelistet, damit der Redakteur die Fakten
  nachprüfen kann.
- [ ] Angenommen zu einem Thema gibt es keine oder kaum passenden Wissensbasis-Dokumente, wenn der
  Redakteur „Entwurf erzeugen" klickt, dann wird ein Hinweis angezeigt statt eines erfundenen Textes.
- [ ] Angenommen ein Text wird erzeugt, wenn er erscheint, dann ist er in **Sie-Form** verfasst und
  enthält **keinen Hersteller-/Markennamen**.
- [ ] Angenommen die Generierung schlägt fehl (z.B. KI nicht erreichbar), wenn der Redakteur sie
  auslöst, dann wird eine verständliche Fehlermeldung angezeigt und kein leerer/halber Artikel
  gespeichert.

### Tonalität (Regler)
- [ ] Angenommen ein Entwurf liegt vor, wenn der Redakteur einen Tonalitäts-Regler ändert und neu
  erzeugen lässt, dann ändert sich der Stil entsprechend, während die fachlichen Inhalte erhalten
  bleiben.

### Fachliche Korrektur (Freitext)
- [ ] Angenommen ein Entwurf enthält einen fachlichen Fehler, wenn der Redakteur im Freitextfeld die
  Richtigstellung einträgt und neu erzeugen lässt, dann wird der Text mit der korrekten Angabe neu
  erstellt.
- [ ] Angenommen eine fachliche Korrektur wurde vorgenommen, wenn später ein **neuer** Artikel zu
  einem verwandten Thema erzeugt wird, dann berücksichtigt die KI die frühere Korrektur und
  wiederholt den Fehler nicht.

### Iteration & Lernen
- [ ] Angenommen ein Redakteur erzeugt mehrere Versionen, wenn er iteriert, dann wird **jede
  Version gespeichert** und ist in einer Historie einsehbar.
- [ ] Angenommen fachliche Korrekturen und Tonalitäts-Einstellungen wurden gemacht, wenn sie
  gespeichert werden, dann landen sie im **Lern-Speicher** und verbessern künftige Generierungen.

### Bilder
- [ ] Angenommen ein Artikel wird bearbeitet, wenn der Redakteur ein eigenes oder im Internet
  besorgtes Bild hochlädt, dann wird es dem Artikel zugeordnet (keine KI-Bildgenerierung).

### Freigabe
- [ ] Angenommen ein Artikel passt, wenn der Redakteur ihn freigibt, dann erhält er den Status
  „Freigegeben" und steht für die Veröffentlichung (PROJ-32) bereit.
- [ ] Angenommen ein Artikel ist „Freigegeben", wenn danach eine Änderung nötig wird, dann kann er
  zurück in Bearbeitung genommen werden (nachvollziehbar in der Historie).

## Edge Cases
- **KI erfindet Fakten (Halluzination):** Generierung soll sich an die gefundenen
  Wissensbasis-Textstellen halten; die angezeigten Quellen ermöglichen dem Redakteur den
  Faktencheck. Erfundene/unbelegte Aussagen werden über die Fakten-Korrektur richtiggestellt und
  fließen in den Lern-Speicher ein.
- **KI nennt versehentlich eine Marke:** wird über eine harte Prompt-Vorgabe verhindert; keine
  zusätzliche automatische Nachkontrolle (bewusste Entscheidung, siehe Decision Log 2026-07-24).
- **Widersprüchliche Korrekturen über die Zeit:** wenn eine neue Korrektur einer früheren
  widerspricht, gilt die neuere; Historie bleibt nachvollziehbar.
- **Endlose Iteration:** kein festes Limit, aber die Historie muss übersichtlich bleiben
  (z.B. Versionen nummeriert).
- **Thema wird nach Start zurückgezogen** (in PROJ-30 entzogen): begonnener Content bleibt als
  Entwurf erhalten, kann aber nicht freigegeben werden, solange das Thema nicht freigegeben ist.
- **Gleichzeitige Bearbeitung** durch zwei Redakteure: kein stiller Datenverlust; letzte Änderung
  gewinnt, aber nachvollziehbar.
- **Kein/zu wenig Wissensbasis-Material zum Thema:** Hinweis an den Redakteur statt „erfundener"
  Text.

## Technical Requirements (optional)
- **Security:** nur Rollen Redaktion + Admin (RLS). Internes Tool.
- **KI-Textgenerierung:** Modell/Anbieter, Kosten, Datenschutz → `/architecture`. Keine
  KI-Bildgenerierung nötig (Bilder werden manuell hochgeladen).
- **Speicherung:** Artikel, alle Iterationen, Bilder (Supabase Storage) und Lern-Speicher (Few-Shot-
  Beispiele) persistent.
- **Nachvollziehbarkeit:** wer hat wann welche Version erzeugt/korrigiert/freigegeben.

## Open Questions
- [x] **Regler-Dimensionen & Wertebereiche:** nur zwei Regler — **Länge/Ausführlichkeit** und
  **Fachtiefe** (werblich↔sachlich und Lockerheit/Formalität bewusst weggelassen, um die Bedienung
  für Redakteure schlank zu halten; Sie-Form bleibt fix). (2026-07-24)
- [x] **Lern-Mechanik technisch:** **Few-Shot-Beispiele** im Generierungs-Prompt (kein
  Fine-Tuning). (2026-07-24)
- [x] **Ein globaler Beispiel-Text als Tonalitäts-Anker oder mehrere:** **ein globaler** Anker für
  alle Content-Typen (nicht je Typ getrennt). (2026-07-24)
- [x] **Quellen-/Halluzinations-Absicherung:** Ja — generierte Entwürfe durchsuchen die
  Wissensbasis-Dokumente gezielt nach themenrelevanten Textstellen und zeigen die verwendeten
  Quellen (Dokument + Fundstelle) dem Redakteur an, statt frei zu erfinden. (2026-07-23)
- [x] **Neutralitäts-Durchsetzung:** **Prompt-Vorgabe genügt** — keine zusätzliche automatische
  Nachkontrolle/Blacklist. (2026-07-24)
- [x] **Kanal-Varianten:** **nur der Kern-Artikel** entsteht in PROJ-31; kanalspezifische Kurz-/
  Langfassungen entstehen ausschließlich in PROJ-32. (2026-07-24)
- [x] **Bildgenerierung:** **keine KI-Bildgenerierung** — Bilder werden ausschließlich manuell
  hochgeladen (eigene Fotos oder im Internet besorgte Bilder); Bildmodell-/Bildrechte-Frage entfällt
  damit. (2026-07-24)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Content wird **nur für freigegebene Themen** (aus PROJ-30) erstellt | Klarer Freigabe-Gate vor Aufwand; keine Arbeit an unerwünschten Themen | 2026-07-20 |
| **Strikte Trennung:** Regler = Tonalität, Freitext = **nur fachliche Korrektur** | Vom User klar so gewünscht; hält Stil- und Fakten-Feedback sauber getrennt | 2026-07-20 |
| **Tonalitäts-Anker** = hinterlegter Beispiel-Text des Teams | Im Prototyp validiert — traf den Zielstil auf Anhieb sehr gut | 2026-07-20 |
| **Jede Iteration wird gespeichert**; fachliche Korrekturen fließen in einen **Lern-Speicher** | Kern des „Mitlernens": Fehler werden nicht wiederholt, Texte passen mit der Zeit sofort | 2026-07-20 |
| **Sie-Form** als Standard, **keine Hersteller-/Markennennung** (immer neutral) | Ausdrückliche Vorgabe des Users | 2026-07-20 |
| ~~**Bilder**: KI-generiert ODER selbst hochgeladen~~ *(überholt, siehe 2026-07-24)* | Flexibilität; eigene Fotos oft besser/authentischer | 2026-07-20 |
| Umbenannt von „Artikel-Werkstatt" → **„Content-Studio"** | Klarerer, passenderer Name | 2026-07-20 |
| Content-Studio durchsucht die Wissensbasis-Dokumente selbst nach themenrelevanten Textstellen (Retrieval), statt auf vorab geprüfte Einzel-Fakten zuzugreifen | Notwendige Anpassung an die vereinfachte PROJ-29-Wissensbasis (keine geprüften Einträge mehr, siehe PROJ-29-Verfeinerung 2026-07-22) | 2026-07-23 |
| Generierte Entwürfe zeigen die verwendeten Wissensbasis-Quellen (Dokument + Fundstelle) sichtbar an | Kompensiert den Wegfall der PROJ-29-Vorprüfung; ermöglicht dem Redakteur gezielten Faktencheck | 2026-07-23 |
| **Regler auf zwei Dimensionen reduziert:** Länge/Ausführlichkeit + Fachtiefe (werblich↔sachlich, Lockerheit/Formalität entfallen) | Schlankere Bedienung für Redakteure; die zwei verbleibenden Regler decken den Kernbedarf ab | 2026-07-24 |
| **Lern-Mechanik:** Few-Shot-Beispiele im Prompt statt Fine-Tuning | Einfach umsetzbar, sofort wirksam, kein Modell-Training nötig, gut nachvollziehbar | 2026-07-24 |
| **Neutralitäts-Durchsetzung:** Prompt-Vorgabe genügt, keine automatische Nachkontrolle | Ausreichend für internes Redaktions-Tool mit menschlichem Review vor Freigabe | 2026-07-24 |
| **Kanal-Varianten** entstehen ausschließlich in PROJ-32; PROJ-31 liefert nur den Kern-Artikel | Klare Trennung der Verantwortlichkeiten zwischen Content-Studio und Publishing | 2026-07-24 |
| **Ein globaler Tonalitäts-Anker** für alle Content-Typen (kein Anker je Typ) | Einfacher zu pflegen, passt zum aktuellen MVP-Scope | 2026-07-24 |
| **Keine KI-Bildgenerierung** — Bilder werden ausschließlich manuell hochgeladen (eigene oder im Internet besorgte Bilder) | Vermeidet Bildmodell-/Bildrechte-Fragen komplett; ausreichend für den aktuellen Bedarf | 2026-07-24 |

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
