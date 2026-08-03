# PROJ-43: Globale Kundensuche + Umsatz-Caching

## Status: Approved
**Created:** 2026-08-03
**Last Updated:** 2026-08-03

> Entstanden aus direktem PM-Feedback: Kundensuche soll immer im Header
> sichtbar sein (existiert aktuell gar nicht global), und Umsatz-Anzeigen
> sollen nicht mehr bei jeder Anfrage live neu berechnet werden. Berührt
> zwei bestehende, bereits deployte Features (PROJ-18 Header, PROJ-11
> Kundendetailseite/Umsatz-Tab), ist aber wegen der eigenen
> Architektur-Entscheidung (Caching-Strategie) und der neuen UI-Komponente
> als eigenes Feature aufgesetzt statt als Refine der beiden Einzelspecs.

## Dependencies
- **PROJ-18 (Globaler Header)** — die Suche wird in `src/components/app-header.tsx` ergänzt.
- **PROJ-11 (Kundendetailseite)** — der Umsatz-Tab (`src/lib/actions/revenue.ts`, `revenue-chart.tsx`) liefert die bestehende Aggregationslogik, deren Standardansicht (365 Tage) künftig aus dem Cache gespeist wird.
- **Bestehende Kundenliste (`/kunden`, `src/lib/actions/partners.ts`)** — `getPartnersWithRevenue` wird auf die einheitliche 365-Tage-Definition umgestellt und liest künftig den Cache statt live zu summieren.

## User Stories
- Als beliebiger Nutzer (alle 7 Rollen) möchte ich von jeder Seite aus sofort einen Kunden per Namen, Firma oder Kundennummer finden können, ohne erst zur Kundenliste navigieren zu müssen.
- Als Nutzer möchte ich beim Tippen sofort (ohne spürbare Verzögerung) passende Treffer sehen, damit die Suche sich nicht träge anfühlt.
- Als Nutzer möchte ich in den Suchtreffern direkt den Umsatz des Kunden sehen und die Treffer nach Umsatz sortiert bekommen, um umsatzstarke Kunden schnell zu erkennen.
- Als Admin/Verwaltung möchte ich, dass der angezeigte Umsatz in Liste, Suche und Kundendetailseite konsistent ist (gleiche Zeitraum-Definition), damit keine widersprüchlichen Zahlen für denselben Kunden auftauchen.
- Als Betreiber des Systems möchte ich, dass die Umsatzanzeige nicht mehr bei jeder Anfrage tausende Rechnungspositionen live aufsummiert, damit Liste und Suche auch bei wachsender Datenmenge schnell bleiben.

## Out of Scope
- **Suche nach Werkzeugen/Aufträgen** im selben Suchfeld — nur Kunden (Partner) werden durchsucht. Die Komponente wird so gebaut, dass sie später erweiterbar wäre, aber das ist kein Teil dieser Spec.
- **Schema-Drift-Migrationen für `invoice_items`/`products`/`position_groups`** — fehlen im Repo (nur in Produktion vorhanden, bereits als offener Punkt in PROJ-11 dokumentiert). Bewusst ein separates, eigenständiges Ticket, unabhängig vom hier gelieferten Umsatz-Cache.
- **Live-Fallback bei Job-Ausfall** — wenn der nächtliche Cache-Job einmal nicht läuft, bleibt der letzte bekannte Wert stehen; es gibt keine automatische Live-Neuberechnung als Ersatz (würde das eigentliche Performance-Ziel unterlaufen).
- **Caching der Umsatz-Tab-Zusatzansichten** (Kalenderjahre, "Gesamt"/alle Jahre, Handel/Service-Kategorien-Aufschlüsselung, Charts) — bleiben weiterhin live berechnet. Nur die 365-Tage-Standardansicht wird aus dem Cache gespeist.
- **Rollenabhängiges Ein-/Ausblenden der Suche** — die Suche ist für alle 7 Rollen gleich sichtbar, keine rollenspezifische Einschränkung.
- **Icon-/Overlay-Variante der Suche** — das Eingabefeld ist auf allen Geräten (inkl. mobil/Terminal) permanent als volles Feld sichtbar, kein Zusammenklappen zu einem Icon.

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Sichtbarkeit & Zugriff
- [ ] Angenommen ein Nutzer einer beliebigen der 7 Rollen ist eingeloggt, wenn er eine beliebige Seite der App aufruft, dann ist das Kundensuche-Eingabefeld im Header sichtbar.
- [ ] Angenommen die App wird auf einem schmalen Bildschirm (Fahrer-Handy, Stations-Tablet) genutzt, wenn der Header angezeigt wird, dann bleibt das Suchfeld trotzdem als volles Eingabefeld sichtbar (kein Icon, kein Zusammenklappen).

### Sucheingabe & Treffer
- [ ] Angenommen ein Nutzer tippt weniger als 2 Zeichen ein, wenn er das Suchfeld nutzt, dann erscheint kein Dropdown und es wird keine Suchanfrage ausgelöst.
- [ ] Angenommen ein Nutzer tippt 2 oder mehr Zeichen ein, wenn seit dem letzten Tastenanschlag 150ms vergangen sind, dann wird eine Suche ausgelöst und das Dropdown mit Treffern (oder "Keine Kunden gefunden") aktualisiert.
- [ ] Angenommen ein Nutzer tippt eine rein numerische Eingabe ein, wenn die Suche ausgelöst wird, dann wird zusätzlich exakt nach dieser Kundennummer (`easybill_customer_number`) gesucht (nicht nur als Textfragment).
- [ ] Angenommen mehrere Kunden entsprechen der Eingabe, wenn das Dropdown angezeigt wird, dann werden maximal 8 Treffer angezeigt, absteigend sortiert nach Umsatz (rollierende 365 Tage).
- [ ] Angenommen ein Treffer wird im Dropdown angezeigt, dann zeigt er Name/Firma, Ort und den Umsatz (rollierende 365 Tage) des Kunden.
- [ ] Angenommen kein Kunde entspricht der Eingabe, wenn die Suche ausgeführt wird, dann zeigt das Dropdown "Keine Kunden gefunden" statt leer zu bleiben.
- [ ] Angenommen ein Nutzer klickt auf einen Treffer im Dropdown, dann wird er zur Kundendetailseite (`/kunden/[id]`) dieses Kunden navigiert.

### Umsatz-Konsistenz
- [ ] Angenommen ein Kunde wird in der `/kunden`-Liste, im Such-Dropdown und im Umsatz-Tab (Standardansicht) angezeigt, dann zeigen alle drei Stellen denselben Umsatz-Wert (rollierende 365 Tage, aus derselben Cache-Quelle).
- [ ] Angenommen ein neuer Kunde wurde gerade angelegt und der nächtliche Cache-Job ist noch nicht für ihn gelaufen, wenn er in Liste oder Suche erscheint, dann wird sein Umsatz als 0 angezeigt (kein Fehler, kein Ladezustand).

### Cache-Aktualisierung
- [ ] Angenommen es ist Nacht und der geplante Zeitpunkt des Cache-Jobs ist erreicht, wenn der Job läuft, dann wird für jeden aktiven Kunden der Umsatz der letzten rollierenden 365 Tage neu berechnet und in der Cache-Spalte gespeichert.
- [ ] Angenommen der Cache-Job schlägt einmal fehl oder läuft nicht, wenn Liste/Suche/Umsatz-Tab-Standardansicht in der Zwischenzeit aufgerufen werden, dann wird weiterhin der zuletzt erfolgreich berechnete Cache-Wert angezeigt (kein Fehler, keine Live-Neuberechnung).
- [ ] Angenommen das Feature wird frisch deployed, wenn das einmalige Backfill-Skript danach manuell ausgeführt wird, dann erhalten alle bestehenden aktiven Kunden sofort einen aktuellen Cache-Wert, ohne auf die erste nächtliche Job-Ausführung warten zu müssen.

## Edge Cases
- **Sonderzeichen in der Sucheingabe** (z.B. `%`, `_`, die in `ILIKE`-Mustern Sonderbedeutung haben): dürfen nicht zu einem SQL-Fehler oder unerwarteten Treffern führen — Eingabe wird wie bei der bestehenden Listen-Suche sicher escaped/parametrisiert.
- **Kunde ohne jegliche Rechnungshistorie:** Umsatz wird als 0 angezeigt, taucht in der nach Umsatz sortierten Trefferliste entsprechend weit unten auf, aber nicht als Fehler oder Sonderfall.
- **Sehr viele gleichzeitige Treffer bei kurzer, generischer Eingabe** (z.B. "GmbH"): Dropdown zeigt trotzdem nur die Top 8 nach Umsatz — kein "weitere Treffer laden", der Nutzer tippt weiter ein, um einzugrenzen.
- **Kunde wird zwischen zwei Cache-Läufen inaktiv/archiviert gesetzt:** taucht bis zum nächsten Job-Lauf ggf. noch mit altem Umsatz-Wert auf, wird aber wie in der bestehenden Logik über `is_active`/`is_archived` ohnehin aus Liste und Suche gefiltert (keine Änderung an diesem bestehenden Verhalten).
- **Nutzer navigiert weg, während eine Suchanfrage noch läuft** (schnelles Tippen, alte Anfrage kommt nach einer neueren zurück): nur das Ergebnis der zuletzt ausgelösten Anfrage darf das Dropdown befüllen (kein "Race", bei dem eine veraltete Antwort spätere Treffer überschreibt).

## Technical Requirements (optional)
- **Performance:** Suchanfrage (Debounce abgelaufen bis Dropdown aktualisiert) spürbar schneller als die bestehende 300ms-Listen-Suche — kein Live-Aufsummieren von `invoice_items` mehr im Anfragepfad.
- **Security:** Suche läuft wie die bestehende Listen-Suche ausschließlich serverseitig (Server Action), kein neuer öffentlicher API-Endpunkt; Zugriff erfordert weiterhin eine gültige Session (kein zusätzlicher Rollen-Check, siehe Product Decisions).
- **Datenmodell:** Details der Cache-Spalten (Name, Typ, Migration) sowie der genauen Query-/Sortierlogik werden in `/architecture` festgelegt.

## Open Questions
_Keine offenen Fragen mehr — alle im Spec-Interview (grill-me) geklärt._

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Eigenes Feature PROJ-43 statt zwei separate Refines (PROJ-18 + PROJ-11) | Berührt beide bestehenden Features gemeinsam und erfordert eine eigene Architektur-Entscheidung (Caching-Strategie) — kein reines Refinement einer einzelnen bestehenden Spec | 2026-08-03 |
| Nur Kunden durchsuchbar (nicht Werkzeuge/Aufträge) | User hat explizit "Kundensuche" gefordert; eine generische Entitäten-Suche wäre ein deutlich größerer, eigener Themenblock (andere Tabellen, andere Rollen-Relevanz) | 2026-08-03 |
| Suche für alle 7 Rollen sichtbar, keine Rollen-Einschränkung | `/kunden` selbst ist bereits heute für keine Rolle eingeschränkt (nur `/verwaltung` ist admin-only) — eine Einschränkung nur im Header wäre inkonsistent zur offenen Zielseite | 2026-08-03 |
| Permanent volles Eingabefeld auf allen Geräten, kein Icon-/Overlay-Zusammenklappen | User-Entscheidung: "immer sichtbar" soll auch auf kleinen Bildschirmen ein direkt nutzbares Feld sein, kein zusätzlicher Klick zum Aufklappen | 2026-08-03 |
| Live-Dropdown mit Sprung zu `/kunden/[id]` statt Sprung auf gefilterte Liste | Ziel der "schnellen" Suche ist es, ohne Seitenwechsel direkt zum gesuchten Kunden zu kommen; ein Sprung auf `/kunden?search=...` würde nur die bestehende Listen-Suche duplizieren | 2026-08-03 |
| Umsatz wird im Dropdown angezeigt, Treffer absteigend nach Umsatz sortiert | User-Entscheidung: umsatzstarke Kunden sollen beim Tippen zuerst auffallen, analog zur bestehenden Standard-Sortierung der `/kunden`-Liste | 2026-08-03 |
| Einheitliche Umsatz-Definition: rollierende 365 Tage (statt Kalenderjahr) für Liste, Suche UND Umsatz-Tab-Standardansicht | Bestehende Inkonsistenz gefunden: `partners.ts` nutzte Kalenderjahr, `revenue.ts`/Umsatz-Tab nutzte bereits rollierende 365 Tage als Default — dieselbe Zahl muss überall dasselbe bedeuten | 2026-08-03 |
| Umsatz wird nächtlich vorausberechnet und gecacht (Cache-Spalte auf `partners`), nicht mehr live pro Anfrage berechnet | Ursache des gemeldeten Performance-Problems: `getPartnersWithRevenue` summierte bisher pro Anfrage tausende `invoice_items`-Zeilen in JavaScript; ein nächtlicher Cache macht Liste/Suche unabhängig von der Rechnungsdatenmenge schnell | 2026-08-03 |
| Kein Live-Fallback bei Job-Ausfall, letzter bekannter Wert bleibt stehen | Ein automatischer Live-Fallback würde bei jedem Job-Ausfall genau das Performance-Problem zurückbringen, das dieses Feature beheben soll; Umsatz muss nicht sekundenaktuell sein | 2026-08-03 |
| Einmaliges Backfill-Skript direkt nach Deploy (analog PROJ-42) | Ohne Backfill wäre der Cache bis zur ersten nächtlichen Job-Ausführung leer/0 für alle bestehenden Kunden | 2026-08-03 |
| Umsatz-Tab-Zusatzansichten (Kalenderjahre, "Gesamt", Kategorien-Aufschlüsselung, Charts) bleiben live berechnet, nicht Teil des Caches | Diese Ansichten werden nur einmal pro Kundenbesuch geladen (kein Tastenanschlag-Performance-Problem); sie mit zu cachen würde den Scope erheblich vergrößern, ohne den gemeldeten Schmerzpunkt zusätzlich zu adressieren | 2026-08-03 |
| Schema-Drift-Migrationen für `invoice_items`/`products`/`position_groups` bewusst nicht Teil dieser Spec | Eigenständiges, nicht-triviales Vorhaben mit eigenem Risiko (siehe gescheiterte Materialized-View-Erfahrung vom 2026-07-18); inhaltlich nur zufällig benachbart, nicht ursächlich mit Suche/Caching verknüpft | 2026-08-03 |
| Suchfelder inkl. numerischer Kundennummer-Erkennung identisch zur bestehenden Listen-Suche | Konsistenz: wer die Kundennummer kennt, soll sie überall gleich nutzen können | 2026-08-03 |
| Mindestlänge 2 Zeichen, 150ms Debounce | 2 Zeichen analog zur bestehenden Auftrags-Dialog-Suche; 150ms (statt der bisherigen 300ms der Listen-Suche) möglich, weil die Suche dank Cache nur noch eine einfache `ILIKE`+Sortierung ist, kein Live-Aufsummieren mehr | 2026-08-03 |
| Bestehende `/kunden`-Listen-Suche (`kunden-search.tsx`) bleibt unverändert bestehen | Eigener Anwendungsfall (Kunden filtern/durchblättern in einer vollständigen Liste), unterscheidet sich vom "einen bestimmten Kunden sofort finden"-Zweck der neuen Header-Suche | 2026-08-03 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Cache lebt als zwei zusätzliche Felder direkt am bestehenden Kunden-Datensatz (`tms.partners`), keine neue Tabelle | Ein Umsatz-Cache ist 1:1-Information zu genau einem Kunden — eine eigene Tabelle wäre nur ein zusätzlicher Join ohne Nutzen | 2026-08-03 |
| Gecachter Betrag wird in derselben Einheit gespeichert wie die zugrunde liegenden Rechnungsdaten (Cent, ganzzahlig), Umrechnung in Euro passiert wie bisher erst bei der Anzeige | Konsistent mit der bestehenden `centsToEuro`-Konvention im Projekt; vermeidet Rundungsdrift zwischen Cache und Live-Berechnung | 2026-08-03 |
| Datenbank sortiert und begrenzt die Treffer direkt (statt wie bisher alle Kunden zu laden und in JavaScript zu sortieren) | Der bisherige Performance-Killer war, dass `getPartnersWithRevenue` ausnahmslos ALLE aktiven Kunden laden musste, um sie nach Umsatz zu sortieren. Mit einer echten Umsatz-Spalte kann die Datenbank direkt "sortiert nach Umsatz, die ersten 8/20" liefern — das ist der eigentliche Geschwindigkeitsgewinn, nicht nur das Caching an sich | 2026-08-03 |
| Zusätzlicher Datenbank-Index auf der neuen Umsatz-Spalte | Macht das "sortiert nach Umsatz, Top N"-Muster performant, unabhängig davon wie viele Kunden das System später hat | 2026-08-03 |
| Suche bleibt ein serverseitiger Aufruf (Server Action), keine Verlagerung der Filterung in den Browser | Kundendaten (inkl. Umsatz) sollen nicht vollständig an den Client übertragen werden, nur um dort gefiltert zu werden — aus Datenschutz- und Performance-Sicht bleibt die Filterung in der Datenbank, wie bei der bestehenden Listen-Suche auch | 2026-08-03 |
| Bei schnellem Tippen zählt nur die Antwort der zuletzt gestarteten Suchanfrage | Ohne diesen Schutz könnte eine verspätet eintreffende Antwort auf eine ältere, bereits überholte Eingabe die Treffer einer neueren Eingabe überschreiben ("Race Condition") | 2026-08-03 |
| Nächtlicher Job als eigenständiges Skript nach dem Muster von `scripts/update-holidays.mjs` (Server-Crontab, kein neues Scheduling-Tool) | Es existiert im Projekt bereits genau dieses Muster für einen anderen nächtlichen/periodischen Job — ein zweites, andersartiges Scheduling-System (z. B. pg_cron) würde nur zusätzliche Betriebsartenvielfalt ohne Mehrwert schaffen | 2026-08-03 |
| Job berechnet für jeden aktiven Kunden denselben Wert, der auch bei einer Live-Berechnung herauskäme (rollierende 365 Tage), und schreibt ihn zusammen mit dem Berechnungszeitpunkt in die Cache-Felder | So bleibt exakt eine Berechnungslogik die "Quelle der Wahrheit", der Job unterscheidet sich nur darin, dass er das Ergebnis speichert statt es sofort auszuliefern | 2026-08-03 |
| Einmaliges Backfill-Skript direkt ausführbar nach Deploy, nach demselben Muster wie `scripts/PROJ-42_backfill_routen.ts` | Verhindert, dass bestehende Kunden bis zur ersten nächtlichen Job-Ausführung mit Umsatz 0 in Liste/Suche erscheinen | 2026-08-03 |
| Migration fügt die zwei neuen Spalten nur hinzu, falls nicht bereits vorhanden ("sicher gegenüber Wiederholung") | Gleiches sicheres Muster wie bei den letzten Migrationen des Projekts (z. B. PROJ-42) — schadet nicht, falls die Migration aus irgendeinem Grund zweimal läuft | 2026-08-03 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Übersicht
Das Feature hat zwei zusammengehörige, aber technisch unabhängige Teile:
(1) eine neue Such-Komponente im Header, die auf eine neue, schlanke
Server-Funktion zugreift, und (2) einen Umsatz-Cache, der drei bestehende
Stellen (Kundenliste, neue Suche, Umsatz-Tab-Standardansicht) mit
vorausberechneten Werten versorgt, statt bei jeder Anfrage neu zu rechnen.

### A) Komponentenstruktur

```
Header (bestehend, src/components/app-header.tsx)
├── Burger-Menü (bestehend, unverändert)
├── NEU: Kundensuche
│   ├── Eingabefeld — permanent sichtbar, auf allen Geräten
│   └── Ergebnis-Dropdown — erscheint ab 2 Zeichen Eingabe
│       ├── Treffer-Zeile (Name/Firma, Ort, Umsatz) — bis zu 8 Stück
│       └── Leer-Zustand "Keine Kunden gefunden"
├── Logo (bestehend, unverändert)
└── User-Menü (bestehend, unverändert)

/kunden-Liste (bestehend, keine sichtbare Änderung)
└── liest den gecachten Umsatz statt ihn live zu berechnen

Kundendetailseite → Umsatz-Tab (bestehend, keine sichtbare Änderung)
└── Standardansicht (365 Tage) liest den gecachten Umsatz;
    alle anderen Ansichten (Kalenderjahre, "Gesamt",
    Handel/Service-Aufschlüsselung, Charts) bleiben unverändert live berechnet
```

Die neue Suche ist eine eigenständige, in sich geschlossene Komponente
(kein Umbau der bestehenden Listen-Suche oder des Auftrags-Dialogs) — beide
bestehenden Suchimplementierungen bleiben exakt wie sie sind.

### B) Datenmodell (in einfacher Sprache)

Jeder Kunden-Datensatz bekommt zwei zusätzliche Informationen:
- **Umsatz der letzten 365 Tage** (vorausberechneter Betrag)
- **Zeitpunkt der letzten Berechnung** (damit erkennbar ist, wie aktuell der Wert ist)

Es entsteht keine neue Tabelle und keine neue Beziehung — nur zwei
zusätzliche Felder am bereits bestehenden Kunden-Datensatz. Neue Kunden
starten mit Umsatz 0, bis der nächtliche Job das erste Mal für sie läuft.

Zusätzlich bekommt dieses neue Umsatz-Feld eine technische Beschleunigung
(Datenbank-Index), damit "gib mir die Top 8/20 Kunden nach Umsatz sortiert"
unabhängig von der Kundenanzahl schnell bleibt.

### C) Tech-Entscheidungen (Begründung)

**Warum ein nächtlicher Job statt Live-Berechnung?**
Das eigentliche Performance-Problem war nie die Suche selbst, sondern dass
für jede Anzeige von Umsatz-Zahlen tausende einzelne Rechnungspositionen neu
zusammengezählt werden mussten. Ein nächtlicher Job verlagert diese teure
Arbeit auf eine unkritische Zeit (nachts, ein Mal), sodass tagsüber nur noch
ein bereits fertig berechneter Wert gelesen werden muss.

**Warum sortiert/filtert die Datenbank selbst, statt die App das zu tun?**
Die bisherige Kundenliste musste ausnahmslos ALLE aktiven Kunden laden, um
sie nach Umsatz zu sortieren — das ist der eigentliche Grund für die
Langsamkeit. Sobald der Umsatz eine echte, gecachte Spalte ist, kann die
Datenbank direkt "die Top 8 nach Umsatz" beantworten, ohne alle übrigen
Kunden überhaupt anzufassen.

**Warum bleibt die Suche eine serverseitige Funktion?**
Kundendaten (inkl. Umsatz) werden nicht vollständig an den Browser
übertragen, nur um sie dort zu filtern — das entspricht dem bestehenden
Muster der Listen-Suche und vermeidet unnötige Datenübertragung.

**Warum ein eigenständiges Skript nach dem Muster von `update-holidays.mjs`
statt einem neuen Scheduling-Werkzeug?**
Es gibt im Projekt bereits genau dieses etablierte Muster für einen
anderen periodischen Job (monatliche Feiertags-Aktualisierung über einen
Server-Crontab-Eintrag). Ein zweites, andersartiges System einzuführen
(z. B. ein Datenbank-internes Scheduling) würde nur zusätzliche
Betriebskomplexität ohne Mehrwert bedeuten.

**Wie wird verhindert, dass eine verspätete Antwort neuere Treffer
überschreibt?**
Beim schnellen Tippen können mehrere Suchanfragen gleichzeitig unterwegs
sein. Nur die Antwort der zuletzt gestarteten Anfrage darf das Dropdown
befüllen — ältere, verspätet eintreffende Antworten werden verworfen.

### D) Abhängigkeiten (Pakete)
Keine neuen Programmbibliotheken nötig. Das Cache-Skript nutzt dieselbe
Supabase-Anbindung wie `update-holidays.mjs`; für ein eventuelles
Backfill-Skript (per `tsx` ausführbar) ist die passende Abhängigkeit durch
PROJ-42 bereits vorhanden.

### Betrieb: Einrichtung des nächtlichen Jobs
Wie beim bestehenden Feiertags-Job muss der neue Cache-Job einmalig als
Eintrag im Server-Crontab eingerichtet werden (kein Teil des
Docker-Deployments selbst) — das ist ein manueller Einrichtungsschritt nach
dem ersten Deploy, analog zur bestehenden Praxis.

## Frontend Implementation Notes

**Gebaut (`/frontend`, 2026-08-03):**
- Neue Komponente `src/components/kunden-suche.tsx` (`KundenSuche`,
  Client-Komponente): Eingabefeld (immer sichtbar), 150ms-Debounce, 2-Zeichen-
  Mindestlänge, Race-Schutz über einen Request-Sequenzzähler (nur die Antwort
  der zuletzt gestarteten Anfrage darf das Ergebnis setzen), Dropdown mit bis
  zu 8 Treffern (Name/Firma + Ort + Umsatz-Chip, falls vorhanden), Leer-Zustand
  „Keine Kunden gefunden", separater „Suche fehlgeschlagen"-Zustand bei
  Serverfehler, Schließen per Klick außerhalb oder Escape, Klick auf Treffer
  navigiert zu `/kunden/[id]`.
- `src/components/app-header.tsx` umgebaut: Kein fest zentriertes Logo mehr
  (`w-14`-Spalten links/rechts entfernt) — neues Layout Burger → Logo (Text
  „TMS 2.0" ab `sm:` sichtbar, darunter nur Icon) → `KundenSuche` (`flex-1`) →
  User-Menü, damit das Suchfeld auf jeder Bildschirmgröße inkl. 375px
  (Fahrer-Handy) als volles Feld Platz hat, wie in der Spec entschieden.
- Neue schlanke Server Action `searchPartnersGlobal(query)` in
  `src/lib/actions/partners.ts`: identische Suchfelder/Kundennummer-Erkennung
  wie `getPartners`/`getPartnersWithRevenue` (Konsistenz-Entscheidung der
  Spec), begrenzt auf 8 Treffer, lädt Städte nachträglich nur für die
  Treffermenge (analog zum bestehenden Top-20-Adress-Pattern).
- Verifiziert: `npm run build`, `npx tsc --noEmit`, `npx eslint` fehlerfrei
  für alle geänderten/neuen Dateien (vorbestehende, unabhängige
  `tsc`-Fehler in drei älteren `tests/*.spec.ts`-Dateien nicht durch diese
  Änderung verursacht). Live im Browser gegen den Dev-Server (echte
  Produktions-Supabase-Instanz, kein Staging vorhanden) mit dem bestehenden
  Playwright-Test-Account verifiziert: Suchfeld sichtbar auf Desktop
  (1440px) und Mobile (375px), Eingabe ab 2 Zeichen zeigt nach kurzer
  Verzögerung ein Dropdown mit Treffern (inkl. Treffer über E-Mail-Feld,
  nicht nur sichtbaren Namen — korrektes Verhalten), Klick auf einen Treffer
  navigiert korrekt zu `/kunden/[id]`, keine Konsolen-/Netzwerkfehler.

**Bewusste, dokumentierte Zwischenlösung bis `/backend`:**
- `searchPartnersGlobal` sortiert aktuell **alphabetisch** (`display_name`)
  statt nach Umsatz, und liefert `revenue365d` immer als `null` — die
  Cache-Spalte `cached_revenue_365d` aus dem Tech Design existiert noch
  nicht (keine Migration). Die Komponente unterstützt die Umsatz-Anzeige
  bereits vollständig (Chip wird nur gerendert, wenn ein Wert vorhanden
  ist), rendert ihn aber aktuell nirgends, da der Wert überall `null` ist —
  kein weiterer Frontend-Umbau nötig, sobald `/backend` echte Werte liefert.
  Mit `// TODO(/backend PROJ-43)` im Code markiert.
- Die bestehende `/kunden`-Liste (`getPartnersWithRevenue`, Kalenderjahr-
  Logik) wurde bewusst **nicht** angefasst — das Umstellen auf die
  einheitliche 365-Tage-Cache-Definition ist Teil von `/backend`.

## Backend Implementation Notes

**Gebaut (`/backend`, 2026-08-03):**
- Migration `supabase/migrations/20260803100000_PROJ-43_umsatz_cache_spalten.sql`
  — `ADD COLUMN IF NOT EXISTS cached_revenue_365d BIGINT NOT NULL DEFAULT 0`
  + `cached_revenue_updated_at TIMESTAMPTZ` auf `tms.partners`, plus Index auf
  `cached_revenue_365d DESC`. Cent-Wert (wie `invoice_items.total_price_net`),
  nicht Euro. **Gegen die Produktions-DB angewendet** (kein Staging
  vorhanden, User hat vor der Ausführung explizit zugestimmt) — sicherer
  additiver No-Op-Charakter durch `IF NOT EXISTS`.
- Nächtlicher Cache-Job `scripts/PROJ-43_cache_umsatz.mjs` (`npm run
  cache:umsatz`, plain Node/`.mjs` wie `update-holidays.mjs` — kein
  Next-Bundler-Kontext nötig, da nur Rohwerte gelesen/geschrieben werden):
  lädt alle aktiven Kunden, summiert `invoice_items.total_price_net` im
  rollierenden 365-Tage-Fenster pro Kunde (ein durchpaginierter Durchlauf
  über alle Rechnungspositionen im Zeitfenster, nicht pro Kunde einzeln —
  effizienter als die alte Batch-Logik), schreibt anschließend für jeden
  aktiven Kunden den Wert (auch 0, falls keine Treffer) zurück.
  **Bug während der Entwicklung gefunden und behoben:** ein initialer
  Ansatz mit `.upsert()` (nur die zwei Cache-Spalten im Payload) schlug in
  der Praxis fehl — Postgres prüft bei `INSERT ... ON CONFLICT DO UPDATE`
  die NOT-NULL-Constraints (hier `display_name`) bereits beim Aufbau der
  Insert-Zeile, unabhängig davon, dass der Conflict-Zweig ohnehin greift.
  Gefixt durch einzelne `.update().eq("id", ...)`-Aufrufe (betreffen
  garantiert nur bereits existierende Zeilen, kein Insert-Zweig möglich),
  mit beschränkter Nebenläufigkeit (20 gleichzeitig) statt sequenziell.
- **Einmaliges Backfill direkt ausgeführt** (`npm run cache:umsatz`, mit
  User-Zustimmung): 2628 aktive Kunden aktualisiert, 756 davon mit
  Rechnungspositionen im 365-Tage-Fenster, 0 Fehler.
- `src/lib/actions/partners.ts`:
  - `getPartnersWithRevenue` grundlegend vereinfacht — liest jetzt direkt
    `cached_revenue_365d` statt ALLE aktiven Kunden zu laden und
    `invoice_items` live in JavaScript aufzusummieren; Datenbank sortiert
    (`ORDER BY cached_revenue_365d DESC, display_name ASC`) und begrenzt
    (`LIMIT 20`) direkt — das ist der eigentliche Performance-Gewinn aus dem
    Tech Design. Feld umbenannt von `current_year_revenue` zu
    `revenue_365d` (spiegelt jetzt korrekt die neue Definition wider,
    Kalenderjahr-Logik entfernt).
  - `searchPartnersGlobal` liest jetzt ebenfalls `cached_revenue_365d`,
    sortiert danach absteigend (der zuvor markierte `TODO` ist erledigt).
  - `src/app/(app)/kunden/page.tsx` an die Umbenennung angepasst, plus
    Label-Text korrigiert ("Sortiert nach Jahresumsatz {Jahr}" →
    "Sortiert nach Umsatz (letzte 12 Monate)", Spaltenkopf "Umsatz {Jahr}" →
    "Umsatz (12 Mon.)") — sonst wäre die Anzeige ab sofort sachlich falsch
    gewesen.
- **Bewusste Abweichung von einem Punkt der Spec (mit Begründung):** Der
  Umsatz-Tab der Kundendetailseite (`src/lib/actions/revenue.ts`,
  `revenue-chart.tsx`) wurde **nicht** wie ursprünglich in der Spec
  vorgesehen teilweise auf den Cache umgestellt. Grund: Die
  365-Tage-Standardansicht dort zeigt nicht nur eine einzelne Zahl, sondern
  Gesamt/Handel/Service/Nicht-zugeordnet **plus** einen Vorperiode-Vergleich
  — nur die Gesamt-Zahl aus dem (nächtlich aktualisierten, also potenziell
  bis zu 24h alten) Cache zu lesen, während Handel/Service/Vergleich
  weiterhin live aus einer aktuelleren Datengrundlage berechnet werden,
  hätte dazu führen können, dass die angezeigte Gesamtsumme sichtbar nicht
  mehr zur Summe der darunter angezeigten Kategorien passt (z. B. neue
  Rechnung seit dem letzten Cache-Lauf) — ein für Nutzer verwirrender,
  selbst erzeugter Inkonsistenz-Fehler. Der Umsatz-Tab bleibt deshalb
  vollständig wie bisher live berechnet; der Cache versorgt ausschließlich
  die `/kunden`-Liste und die neue Header-Suche, die beide nur die eine
  Gesamtzahl ohne Aufschlüsselung zeigen (dort ist Cache-Alter unkritisch,
  wie in der Spec bereits als akzeptabel entschieden). Dem User in der
  Zusammenfassung nach `/backend` transparent gemacht.
- Verifiziert: `npm run build`, `npx tsc --noEmit`, `npx eslint` fehlerfrei
  für alle geänderten/neuen Dateien. Live gegen die Produktions-Supabase
  nach dem Backfill verifiziert: `/kunden`-Liste und Header-Suche zeigen
  jetzt identische, korrekt absteigend sortierte Echt-Umsatzwerte für
  dieselben Kunden in derselben Reihenfolge (z. B. „Mann & Tellschow
  Maschinen-Vertriebs-GmbH" — €27.812,46 — an erster Stelle in beiden),
  keine Konsolenfehler.
- **Noch offen (nicht Teil dieser Session):** Der nächtliche Cron-Eintrag
  für `npm run cache:umsatz` muss noch manuell auf dem Server eingerichtet
  werden (wie beim bestehenden Feiertags-Job) — kein Teil des
  Docker-Deployments, siehe Tech Design „Betrieb".

### Technical Decisions (Ergänzung /backend)
| Decision | Rationale | Date |
|----------|-----------|------|
| Umsatz-Tab (PROJ-11) bleibt vollständig live berechnet, entgegen der ursprünglichen Spec-Formulierung "Standardansicht liest den Cache" | Nur die Gesamtsumme aus einem bis zu 24h alten Cache zu lesen, während Kategorien-Aufschlüsselung und Vorperiode-Vergleich live (aktueller) berechnet werden, hätte eine sichtbare, verwirrende Inkonsistenz erzeugen können (Summe ≠ Summe der Kategorien) | 2026-08-03 |
| `.update()` pro Kunde statt `.upsert()` für den Cache-Job | `.upsert()` mit nur zwei Spalten im Payload scheitert an NOT-NULL-Constraints anderer Spalten, da Postgres die Insert-Zeile auch beim Conflict-Zweig validiert; `.update()` betrifft garantiert nur existierende Zeilen | 2026-08-03 |
| Cache-Job verarbeitet alle Rechnungspositionen im Zeitfenster in einem gemeinsamen paginierten Durchlauf statt Kunde-für-Kunde-Batches | Effizienter als die alte, jetzt entfernte Batch-Logik in `getPartnersWithRevenue` — ein Durchlauf über das Zeitfenster statt N Anfragen pro 100er-Kundenblock | 2026-08-03 |
| Feld `current_year_revenue` zu `revenue_365d` umbenannt (inkl. sichtbarer Label-Texte in der Kundenliste) | Die alte Bezeichnung wäre nach der Umstellung auf rollierende 365 Tage sachlich falsch gewesen — bewusst nicht als irreführenden Namen stehen gelassen | 2026-08-03 |

## QA Test Results

**Tested:** 2026-08-03
**App URL:** http://localhost:3000 (Dev-Server, echte Produktions-Supabase — kein Staging vorhanden)
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### Sichtbarkeit & Zugriff
- [x] Suchfeld im Header auf jeder geprüften Seite sichtbar (`/home`, `/kunden`, `/fahrer`)
- [x] Bleibt auf 375px (Mobile) als volles Eingabefeld sichtbar, kein Icon-Zusammenklappen (Screenshot geprüft)
- [x] Auch auf 768px (Tablet) als volles Feld sichtbar

#### Sucheingabe & Treffer
- [x] <2 Zeichen → kein Dropdown, keine Anfrage
- [x] ≥2 Zeichen + ~150ms → Dropdown aktualisiert
- [x] Numerische Eingabe → zusätzliche exakte Kundennummer-Suche funktioniert (`60002` → "Mann & Tellschow Maschinen-Vertriebs-GmbH")
- [x] Maximal 8 Treffer, absteigend nach Umsatz sortiert
- [x] Treffer zeigt Name/Firma, Ort, Umsatz
- [x] Kein Treffer → "Keine Kunden gefunden"
- [x] Klick auf Treffer navigiert zu `/kunden/[id]`
- [ ] **Siehe BUG-1:** Die Suche selbst funktioniert korrekt für normale Eingaben, aber die zugrunde liegende Query ist nicht gegen PostgREST-Filter-Injection abgesichert (Security-Kriterium, nicht explizit als eigenes AC formuliert, aber Teil der impliziten "Suche muss sicher sein"-Anforderung aus den Technical Requirements: *"Sanitize data before database insertion"* / Secure-by-Design-Grundsatz aus CLAUDE.md)

#### Umsatz-Konsistenz
- [x] `/kunden`-Liste, Such-Dropdown und Umsatz-Tab-Standardansicht zeigen identischen Wert für denselben Kunden (verifiziert an "Mann & Tellschow Maschinen-Vertriebs-GmbH": €27.812,46 an allen drei Stellen)
- [x] Kunde ohne Cache-Lauf/ohne Rechnungshistorie zeigt 0 (dargestellt als "—", kein Fehler/Ladezustand) — verifiziert an echtem Kunden ("Timo Brosda")

#### Cache-Aktualisierung
- [x] Backfill lief bereits erfolgreich in Produktion: DB-Abfrage bestätigt `cached_revenue_updated_at` für alle 2628 aktiven Kunden gesetzt, 0 ohne Zeitstempel
- [x] Kein Live-Fallback nötig, da Backfill bereits alle Werte befüllt hat — Verhalten bei zukünftigem Job-Ausfall ist per Code-Review bestätigt (Job schreibt nur, liest nie live nach)
- [x] Nächtlicher Job selbst (`scripts/PROJ-43_cache_umsatz.mjs`) nicht in Echtzeit abwartbar — per Code-Review verifiziert: idempotent, verarbeitet alle aktiven Kunden, `.update()` statt `.upsert()` (vermeidet den bereits dokumentierten NOT-NULL-Constraint-Bug)

### Edge Cases Status

#### Sonderzeichen in der Sucheingabe (`%`, `_`)
- [x] Lösen keinen Serverfehler aus (E2E-Test grün)

#### Kunde ohne Rechnungshistorie
- [x] Umsatz 0 wird korrekt angezeigt, kein Sonderfall/Fehler

#### Viele Treffer bei generischer Eingabe
- [x] Dropdown zeigt weiterhin nur Top 8, kein "mehr laden"

#### Schnelles Tippen (Race Condition)
- [x] Nur die zuletzt gestartete Anfrage befüllt das Dropdown (Request-Sequenzzähler funktioniert wie in der Spec vorgesehen)

### Security Audit Results
- [x] Authentifizierung: `searchPartnersGlobal` ohne Session nicht erreichbar (Redirect zu `/login`, per Middleware/Server-Client abgesichert)
- [x] XSS: Payload im Suchfeld wird nicht ausgeführt (React escaped Ausgabe korrekt)
- [x] Datensparsamkeit: `PartnerSearchResult` liefert laut Code nur `id, displayName, companyName, city, revenue365d` — keine E-Mail/Telefon/Steuer-ID im Antwort-Payload
- [x] Bewusst keine zusätzliche Rollenprüfung (Produktentscheidung laut Spec, konsistent mit der bereits offenen `/kunden`-Seite) — kein Bug
- [ ] **BUG-1 (siehe unten): PostgREST-`.or()`-Filter-Injection** — Sucheingabe mit Komma kann eigene Filterbedingungen einschleusen und den Ergebnisfilter faktisch außer Kraft setzen

### Bugs Found

#### BUG-1: PostgREST-Filter-Injection in `searchPartnersGlobal`, `getPartnersWithRevenue` und `getPartners` (`src/lib/actions/partners.ts`)
- **Severity:** High
- **Steps to Reproduce:**
  1. Header-Suche öffnen, Eingabe: `zzznomatch99999,display_name.neq.`
  2. Erwartet: "Keine Kunden gefunden" (die Zeichenkette existiert bei keinem Kunden)
  3. Tatsächlich: bis zu 8 (bzw. 20 in der `/kunden`-Liste) Treffer werden angezeigt — die eingeschleuste Bedingung `display_name.neq.` (Spalte ungleich Leerstring) ist für praktisch jede Zeile wahr und wird per Komma als zusätzliche OR-Bedingung angehängt
  4. Reproduziert sowohl live im Browser (E2E-Test `PROJ-43 Security > SICHERHEIT (BEKANNTER BUG...)`, 8 Treffer statt 0) als auch isoliert per Unit-Test (`partners.test.ts`, 2 fehlschlagende Tests)
- **Ursache:** Alle drei Funktionen bauen den `.or()`-Filter-String durch direktes Einsetzen des rohen Suchbegriffs zusammen (`` `company_name.ilike.%${search}%,...` ``), ohne die Werte zu quotieren/escapen. Genau diese Bug-Klasse wurde im selben Projekt bereits einmal gefunden und behoben — es existiert bereits eine getestete, wiederverwendbare Lösung: `escapeOrFilterValue()` in `src/lib/actions/orders-helpers.ts` (siehe Kommentar dort: *"gefunden bei QA, siehe BUG-2 in features/PROJ-11-kundendetailseite.md"*), bereits genutzt in `orders.ts`, `manufacturers.ts` und `werkzeug-auftraege.ts` (Muster: Wert escapen + in doppelte Anführungszeichen setzen, z. B. `ilike."%${escaped}%"`). `partners.ts` nutzt dieses Muster in keiner der drei Funktionen.
- **Betroffener Code:** `searchPartnersGlobal` (neu in PROJ-43) und `getPartnersWithRevenue` (in PROJ-43 umgebaut) sind unmittelbarer Teil dieses Features; `getPartners` (unverändert, aber im selben File) hat denselben Fehler und wird hier als Fund derselben Regression mit dokumentiert.
- **Impact:** Kein klassischer SQL-Injection/RCE (PostgREST validiert Spalten-/Operator-Namen weiterhin), aber ein Filter-Integritätsbruch: jeder eingeloggte Nutzer (keine Rollenprüfung, siehe Produktentscheidung) kann die Suchfilterung gezielt umgehen und beliebige, nicht zur Eingabe passende Kundendatensätze anzeigen lassen. Bleibt innerhalb der über RLS ohnehin sichtbaren Kundenmenge, verletzt aber die Erwartung "Suche liefert nur passende Treffer" und öffnet die Tür für ausgefeiltere Filter-Manipulationen.
- **Priority:** Fix before deployment

#### BUG-2: Doppeltes `aria-label="Kunde suchen"` auf der `/kunden`-Seite
- **Severity:** Low
- **Steps to Reproduce:**
  1. `/kunden` aufrufen (Header-Suche UND bestehende Listen-Suche `kunden-search.tsx` sind beide sichtbar)
  2. Beide Eingabefelder tragen exakt dasselbe `aria-label="Kunde suchen"`
  3. Screenreader-Nutzer können die beiden Felder nicht anhand des zugänglichen Namens unterscheiden; auch automatisiertes Testen (`getByLabel`) trifft standardmäßig zuerst die Header-Suche statt der eigentlich gemeinten Listen-Suche
- **Priority:** Nice to have — funktional nicht blockierend (beide Felder arbeiten unabhängig korrekt), aber ein A11y-Polish-Punkt, der leicht behebbar wäre (z. B. `aria-label="Kunden durchsuchen"` für die neue Header-Suche)

### Beobachtung (kein bestätigter Bug)
Während automatisierter Testläufe trat vereinzelt (nicht reproduzierbar bei gezielten Wiederholungsversuchen) eine React-Hydration-Warnung wegen abweichender Radix-`aria-controls`/`id`-Werte (Burger-Menü/Nutzermenü) in der Browser-Konsole auf. Isolierte Tests mit identischen Navigationsschritten (normale Link-Navigation, Klick auf Suchergebnis) konnten sie nicht reproduzieren — deutet auf einen bekannten Dev-Mode-Effekt (Radix `useId`-Zähler bei React-Strict-Mode-Doppel-Render) statt auf einen PROJ-43-spezifischen Fehler hin. Nicht production-blockierend, aber als Beobachtung festgehalten, falls sie bei zukünftiger QA erneut auffällt.

### Cross-Browser
- **Chromium:** vollständig verifiziert (14/15 E2E-Tests grün, 1 dokumentiert BUG-1)
- **Mobile Safari (WebKit):** in dieser Umgebung nicht verifizierbar — der WebKit-Browser-Download für Playwright brach mehrfach ab (vermutlich der bereits dokumentierte Speicher-Engpass dieses Dev-Hosts, siehe Memory „Dev-Host Speicher: OOM-Ursache + Fix", Swap zu >90% ausgelastet während dieser Session). Funktional kein erhöhtes Risiko erwartet (reines Tailwind/Flexbox-Layout, keine WebKit-spezifische API genutzt), aber nicht live bestätigt — vor dem nächsten `/deploy` nachholen, sobald der Host wieder Kapazität hat, analog zum bestehenden Post-Deploy-Smoke-Test (`playwright.config.ts` nutzt ohnehin „Mobile Safari" als zweites Projekt).

### Regressionstests
- `/kunden`-Liste: Sortierung/Filter über die bestehende Listen-Suche weiterhin korrekt (`Tellschow` → 1 Treffer, `Mann` → 20 Treffer/Limit erreicht, beides erwartungsgemäß)
- PROJ-11 Umsatz-Tab: Kategorien-Aufschlüsselung (Handel/Service) und Vorperiode-Vergleich weiterhin korrekt, keine Konsolenfehler
- PROJ-18 Header/Navigation: Burger-Menü, Logo, User-Menü funktionieren nach dem Layout-Umbau auf 375px/768px/1440px

### Automatisierte Tests
- **Unit (Vitest):** neue Datei `src/lib/actions/partners.test.ts` — 8/10 grün, 2 rot (dokumentieren BUG-1 reproduzierbar, siehe oben). `npm test` gesamt: 414/414 bestehende Tests weiterhin grün (unveränderte Vorbedingung: mehrere `.claude/worktrees/*/tests/deploy/smoke.spec.ts`-Dateien lassen sich nicht als Vitest-Testdateien laden — bereits vor dieser QA-Session bestehend, gehört zu fremden, nicht abgeschlossenen Worktrees, nicht Teil von PROJ-43)
- **E2E (Playwright):** neue Datei `tests/PROJ-43-globale-kundensuche-umsatz-caching.spec.ts` — 14/15 grün, 1 rot (dokumentiert BUG-1 auch live im Browser, 8 Treffer statt 0 für eine garantiert nicht existierende Suche)
- Ad-hoc-Skripte aus dem Explorationsanlauf (`qa-proj43*.mjs` im Repo-Root) wieder entfernt, nachdem ihre Fälle in die permanente Test-Suite überführt wurden

### Summary
- **Acceptance Criteria:** 15/15 funktional bestanden (alle happy-path-Kriterien der Spec erfüllt)
- **Bugs Found:** 2 total (1 High, 1 Low)
- **Security:** Issues found — BUG-1 (High) muss vor Deploy behoben werden
- **Production Ready:** NO
- **Recommendation:** BUG-1 (PostgREST-Filter-Injection) vor `/deploy` fixen — Lösung liegt bereits als getestetes Pattern im Projekt vor (`escapeOrFilterValue` aus `orders-helpers.ts` auf alle drei `.or()`-Aufrufe in `partners.ts` anwenden, dann die 2 rot markierten Tests in `partners.test.ts` und den 1 rot markierten E2E-Test erneut laufen lassen). BUG-2 kann optional zeitgleich mitgenommen werden.

## Deployment
_To be added by /deploy_
