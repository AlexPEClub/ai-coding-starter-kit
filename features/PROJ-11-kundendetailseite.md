# PROJ-11: Kundendetailseite (erweitert)

**Status:** ✅ Deployed — Refine „Umsatz-Tab Mobile-Fixes + Donut/Radar-Charts" (2026-07-24) live verifiziert: `./scripts/deploy.sh PROJ-11` erfolgreich (Lint/Build/Docker-Rebuild + Post-Deploy-Smoke grün), zusätzlich alle 8 Feature-Szenarien manuell gegen Production auf Chromium UND Mobile Safari bestätigt (siehe Abschnitt „Refine — Umsatz-Tab Mobile-Fixes + Donut/Radar-Charts (2026-07-24)"). Vorheriger Umsatz-Tab-Neubau bleibt ✅ live verifiziert (siehe Abschnitt „Live-Verifikation (Post-Deploy) — Umsatz-Tab-Neubau (2026-07-24)"). Bestellhistorie-Erweiterung bleibt ✅ Deployed (2026-07-18, siehe Abschnitt „Deploy-Verlauf 2026-07-18")  
**Projekt:** TMS 2.0  
**Priorität:** Hoch  
**Autor:** Klausi (KI-Entwickler)  
**Datum:** 2026-07-02 (Erweiterung: 2026-07-17, Umsatz-Neubau: 2026-07-21, Implementierung: 2026-07-22)

---

## 1. Problem-Statement

Die aktuelle Kundenseite zeigt nur Stammdaten. Es fehlen wichtige Geschäftsinformationen: Umsatz, Bestellhistorie und Kontakte. Adressen sind nur lesbar, nicht bearbeitbar.

**Werkstatt-Vergleich:** Stell dir vor, du hast eine Karteikarte mit Name und Adresse — aber keinen Überblick, was der Kunde umsetzt, was er bestellt hat, und wer dort Ansprechpartner ist. Und wenn sich die Lieferadresse ändert, kannst du sie nicht nachträglich korrigieren.

---

## 2. Anforderungen

### 2.1 Kunden-Stammdaten (bereits deployed → wird erweitert)

Bereits vorhanden und bleibt erhalten:
- Firmenname, Ansprechpartner
- Telefon, E-Mail (anklickbar)
- USt-ID, Steuernummer

### 2.2 Adressen (mit Edit-Funktion)

**Zwei Adress-Karten:**
- **Rechnungsadresse** (aus `partner_addresses` mit `address_type = 'billing'`)
- **Lieferadresse** (aus `partner_addresses` mit `address_type = 'shipping'`)

**Edit-Modus:**
- "Bearbeiten"-Button auf jeder Adress-Karte
- Öffnet Modal mit Formular
- Felder: Firma, Vorname, Nachname, Straße, Zusatz, PLZ, Ort, Land
- Speichern → Update in `partner_addresses` (SSOT = Supabase)
- Abbrechen → Keine Änderung

### 2.3 Umsatz-Anzeige (Neubau 2026-07-21)

**Werkstatt-Vergleich:** Bisher hing die Umsatz-Kachel an einer Ablage
(`mv_partner_monthly_revenue`), die es in der echten Werkstatt nie gab —
deshalb war das Fach immer leer. Jetzt zählen wir stattdessen direkt aus dem
Rechnungsordner (`invoice_items`), genau wie bei der Bestellhistorie.

**Datengrundlage:** Direkte Auswertung von `tms.invoice_items` (über
`tms.invoices` mit dem Kunden verknüpft) — keine Abhängigkeit mehr von einer
nie befüllten Materialized View. Handel/Service-Zuordnung läuft über
dieselbe Verknüpfung wie in der Bestellhistorie:
`invoice_items.article_number → products.number → products.type`
(`PRODUCT` = Handelsware, `SERVICE` = Servicegeschäft).

**KPI-Reihe (oben, klickbar):**
- **Gesamtumsatz** — zählt ALLE Rechnungspositionen im gewählten Zeitraum,
  auch die ohne Artikel-Match (wichtigste, oft weiterverwendete Kennzahl —
  soll nicht künstlich niedriger wirken als der echte Umsatz)
- **Handelsumsatz** — nur Positionen mit `products.type = 'PRODUCT'`
- **Serviceumsatz** — nur Positionen mit `products.type = 'SERVICE'`
- **Nicht zugeordnet** (optional, nur wenn > 0 im Zeitraum) — Positionen ohne
  Artikel-Match, damit die Differenz zwischen Gesamt- und Handel+Service-Summe
  nachvollziehbar bleibt
- Jede KPI zeigt zusätzlich einen **Vergleichs-Badge** (grün/rot, % Veränderung)
  gegenüber der vorherigen, gleich langen Periode (siehe unten)

**Dynamisches Chart (unten, reagiert auf KPI-Klick):**
- Standard (keine KPI angeklickt): Balkendiagramm, ein Balken pro Monat,
  gestapelt in Handelsumsatz/Serviceumsatz (+ „Nicht zugeordnet" falls vorhanden)
- Klick auf **Handelsumsatz**-KPI: Chart zeigt nur Handelsumsatz pro Monat,
  gestapelt nach **Rabattgruppe** (`position_groups`, gleiche Verknüpfung wie
  Bestellhistorie: `products.group_id → position_groups`)
- Klick auf **Serviceumsatz**-KPI: analog, gestapelt nach Rabattgruppe der
  Service-Positionen
- Erneuter Klick auf die aktive KPI hebt den Filter wieder auf (Toggle,
  zurück zum Standard-Chart) — gleiches Muster wie das Donut-Chart in der
  Bestellhistorie (2.4.1)
- Klick auf **Gesamtumsatz** setzt immer auf den Standard-Chart zurück

**Zeitraum-Dropdown:**
- **Standard: „Letzte 12 Monate"** — rollierendes Fenster (heute − 365 Tage
  bis heute), NICHT Kalenderjahr. Bewusst umbenannt von „YTD", um das
  rollierende Verhalten klar zu machen (Kalender-YTD wäre etwas anderes)
- Zusätzlich wählbar: **Kalenderjahre**, dynamisch aus den vorhandenen
  Rechnungsdaten ermittelt (ältestes Jahr mit Daten bis aktuelles Jahr,
  z.B. 2023, 2024, 2025, 2026 …) — zeigt dann nur Rechnungspositionen mit
  Rechnungsdatum in genau diesem Kalenderjahr
- Zusätzlich wählbar: **„Gesamt"** — alle jemals gespeicherten
  Rechnungspositionen des Kunden, ohne Zeitfilter

**Vergleichs-Badge (Vorperiode):**
- Bei „Letzte 12 Monate": Vergleich mit den 365 Tagen davor
- Bei Kalenderjahr (z.B. 2025): Vergleich mit dem Vorjahr (2024)
- Bei „Gesamt": kein Vergleich (kein sinnvoller „Davor"-Zeitraum)
- Anzeige: Prozent-Veränderung, grün bei Zuwachs, rot bei Rückgang

**Werte-Anzeige:**
- KPI-Werte für den gewählten Zeitraum (siehe oben)
- Chart-Tooltip zeigt Monat + Betrag je Kategorie/Rabattgruppe

### 2.4 Bestellhistorie (NUR Trade Goods)

**Wichtig:** Nur Rechnungspositionen (`invoice_items`) mit `revenue_category = 'trade'` (Handelsware). Keine Service-Leistungen, keine Sonderwerkzeuge.

**Tabellen-Spalten:**
| Spalte | Quelle |
|--------|--------|
| Datum | `invoices.document_date` |
| Rechnungsnr. | `invoices.document_number` |
| Beschreibung | `invoice_items.title` oder `invoice_items.description` |
| Artikelnr. | `invoice_items.item_number` |
| Menge | `invoice_items.quantity` |
| Einzelpreis | `invoice_items.unit_price` |
| Rabatt % | `invoice_items.discount` |
| Gesamtpreis | `invoice_items.total_price` |
| EK-Preis | `invoice_items.cost_price` (falls vorhanden) |

**Filter:**
- Zeitraum (letzte 3 Monate / letztes Jahr / alle)
- Suche nach Artikelnummer oder Beschreibung

**Sortierung:** Neueste zuerst

#### 2.4.1 Produkttyp-Filter, Gruppierung & Donut-Chart (Erweiterung 2026-07-17)

**Werkstatt-Vergleich:** Bisher liegt jedes bestellte Teil einzeln in der
Bestellhistorie-Kiste. Jetzt bekommt jedes Teil zusätzlich ein Fach-Etikett
(Artikelgruppe) und wir stellen eine kleine Übersichtstafel (Donut-Chart)
davor, die zeigt, wie viele Teile in welchem Fach liegen — ein Klick auf ein
Tortenstück zeigt nur die Teile aus diesem Fach.

**Zusätzlicher Filter — nur echte Handelsartikel:**
- Verknüpfung: `invoice_items.article_number = tms.products.number`
- Nur Positionen anzeigen, deren verknüpfter Artikel `tms.products.type = 'PRODUCT'` ist (nicht `'SERVICE'`)
- Positionen ohne passenden Eintrag in `tms.products` werden **ausgeblendet** (kein Match = keine Anzeige)

**Gruppierung:**
- Jeder Artikel gehört über `tms.products.group_id` zu einer `tms.position_groups`-Gruppe (`name`, `number`, `display_name`)
- Bestellpositionen werden dieser Gruppe zugeordnet und in der Tabelle danach gruppiert/gefiltert

**Donut-Chart (neue Bento-Karte über der Tabelle):**
- Ein Segment pro Artikelgruppe, die beim jeweiligen Kunden tatsächlich vorkommt
- Kennzahl je Segment: **Anzahl Bestellpositionen** dieser Gruppe (Anzahl der Rechnungszeilen, nicht Mengen-Summe)
- Klick auf ein Segment filtert die Tabelle darunter auf diese Gruppe
- Erneuter Klick auf dasselbe (bereits aktive) Segment hebt den Filter wieder auf (Toggle)

**Zusätzlicher Dropdown-Filter:**
- Dropdown "Artikelgruppe" neben dem bestehenden Zeitraum-/Suchfilter
- Zeigt nur Gruppen an, die bei diesem Kunden in den (produkttyp-gefilterten) Bestellpositionen vorkommen — keine leeren Gruppen
- Dropdown und Donut-Chart sind synchronisiert (Auswahl im einen Element spiegelt sich im anderen)
- Option "Alle" setzt den Filter zurück

**Edge Cases:**
- Kunde hat keine Positionen mit `type = 'PRODUCT'` → Donut-Chart zeigt Leerzustand, Tabelle zeigt bestehenden "Keine Bestellungen gefunden"-Zustand
- Artikel ohne `group_id` (keine Gruppe zugeordnet) → wird nicht im Donut-Chart/Dropdown geführt, aber weiterhin in der Tabelle sichtbar (falls kein anderer Filter aktiv ist)

### 2.5 Kontakte

**Liste verknüpfter Kontakte** (aus `partner_contacts`):
- Name, Vorname
- E-Mail (anklickbar)
- Handynummer (anklickbar)
- Position in der Firma
- Notizen

**Kontakt hinzufügen:**
- "+" Button neben der Kontaktliste
- Modal mit Formular
- Felder: Name, Vorname, E-Mail, Handynummer, Position, Notizen
- Speichern → Insert in `partner_contacts`

---

## 3. UI/UX — Tabs + Bento Grid

**Layout: Tabs oben, Bento Grid in jedem Tab**

### Tab: Übersicht (Standard)

**Bento Grid — obere Reihe:**
- **Karte 1 (links, breit):** Stammdaten — Firmenname, Telefon, E-Mail, USt-ID
- **Karte 2 (mitte):** Rechnungsadresse mit "Bearbeiten"-Button
- **Karte 3 (rechts):** Lieferadresse mit "Bearbeiten"-Button

**Bento Grid — untere Reihe:**
- **Karte 4 (breit):** Kontaktliste mit "+" Button

### Tab: Umsatz

**Bento Grid:**
- **Karte 1 (groß, breit):** Balkendiagramm mit Jahres-Dropdown
- **Karte 2 (unten):** Summen-Karte (Gesamtumsatz, Anzahl Rechnungen)

### Tab: Bestellhistorie

**Bento Grid:**
- **Karte 1 (vollbreit):** Tabelle mit Filter + Suchleiste

---

## 4. Akzeptanzkriterien

### Stammdaten & Adressen
- [ ] Alle Stammdaten werden korrekt angezeigt
- [ ] Rechnungsadresse wird aus `partner_addresses` geladen
- [ ] Lieferadresse wird aus `partner_addresses` geladen
- [ ] "Bearbeiten"-Button öffnet Modal
- [ ] Adress-Änderungen werden in Supabase gespeichert
- [ ] Nach Speichern wird die Ansicht aktualisiert

### Umsatz (Neubau 2026-07-21)
- [ ] Gesamtumsatz zählt ALLE `invoice_items` im gewählten Zeitraum, unabhängig von Artikel-Match
- [ ] Handelsumsatz/Serviceumsatz basieren auf `products.type` (`PRODUCT`/`SERVICE`) über `invoice_items.article_number → products.number`
- [ ] KPI „Nicht zugeordnet" erscheint nur, wenn im Zeitraum tatsächlich unzugeordnete Positionen existieren
- [ ] Standard-Zeitraum ist „Letzte 12 Monate" (rollierend, heute − 365 Tage), nicht Kalenderjahr
- [ ] Zeitraum-Dropdown enthält zusätzlich alle Kalenderjahre mit vorhandenen Daten sowie „Gesamt"
- [ ] Kalenderjahr-Auswahl zeigt ausschließlich Positionen mit Rechnungsdatum in diesem Jahr
- [ ] Klick auf KPI „Handelsumsatz" filtert das Chart auf Handelsumsatz, gestapelt nach Rabattgruppe
- [ ] Klick auf KPI „Serviceumsatz" filtert das Chart auf Serviceumsatz, gestapelt nach Rabattgruppe
- [ ] Erneuter Klick auf aktive KPI hebt den Filter auf (Toggle zurück zum Standard-Chart)
- [ ] Klick auf „Gesamtumsatz" setzt Chart-Filter zurück auf Standardansicht
- [ ] Vergleichs-Badge zeigt korrekte %-Veränderung ggü. Vorperiode (365 Tage bzw. Vorjahr), grün bei Zuwachs/rot bei Rückgang
- [ ] Bei „Gesamt"-Auswahl wird kein Vergleichs-Badge angezeigt
- [ ] Responsive: Diagramm passt sich an

### Bestellhistorie
- [ ] NUR Trade Goods (keine Service/Sonderwerkzeug)
- [ ] Alle Spalten korrekt befüllt
- [ ] Filter nach Zeitraum funktioniert
- [ ] Suche nach Artikel/Beschreibung funktioniert
- [ ] Sortierung: Neueste zuerst
- [ ] Paginierung: 20 pro Seite
- [ ] Nur Positionen mit verknüpftem `products.type = 'PRODUCT'` werden angezeigt; Positionen ohne Produkt-Match werden ausgeblendet
- [ ] Donut-Chart zeigt genau die Artikelgruppen, die beim Kunden vorkommen (keine leeren Gruppen)
- [ ] Donut-Chart-Segment = Anzahl Bestellpositionen dieser Gruppe
- [ ] Klick auf Segment filtert Tabelle korrekt; erneuter Klick auf gleiches Segment hebt Filter wieder auf
- [ ] Dropdown-Filter "Artikelgruppe" und Donut-Chart bleiben synchron
- [ ] Dropdown zeigt "Alle" zum Zurücksetzen
- [ ] Kunde ohne `type=PRODUCT`-Positionen: Donut-Chart und Tabelle zeigen sauberen Leerzustand, kein Fehler

### Kontakte
- [ ] Alle verknüpften Kontakte werden angezeigt
- [ ] "+" Button öffnet Modal
- [ ] Neuer Kontakt wird in `partner_contacts` gespeichert
- [ ] Nach Speichern wird Liste aktualisiert
- [ ] Telefon/E-Mail sind anklickbar

### Allgemein
- [ ] Tabs funktionieren auf Desktop, Tablet und Mobile
- [ ] Bento Grid Layout auf Desktop
- [ ] Stacked Layout auf Mobile
- [ ] Animationen bei Tab-Wechsel und Modal-Öffnung
- [ ] Keine Console-Fehler
- [ ] Ladezustände (Skeleton) während Daten geladen werden

---

## 5. Technische Details

### Neue Dateien:
```
src/
  app/
    kunden/
      [id]/
        page.tsx                    # Hauptseite mit Tabs
      [id]/
        components/
          customer-header.tsx       # Kopfzeile mit Name + Status
          address-card.tsx          # Adress-Karte mit Edit-Button
          address-edit-modal.tsx    # Modal für Adress-Edit
          revenue-chart.tsx         # Balkendiagramm (Recharts)
          revenue-year-selector.tsx # Jahres-Dropdown
          order-history-table.tsx   # Bestellhistorie-Tabelle
          order-history-filters.tsx # Filter für Bestellhistorie
          contacts-list.tsx         # Kontaktliste
          contact-add-modal.tsx     # Modal für neuen Kontakt
          tab-container.tsx         # Tab-Container mit Animation
          bento-grid.tsx            # Bento Grid Layout
  lib/
    actions/
      addresses.ts                  # Update Adresse
      contacts.ts                   # Create Kontakt
      revenue.ts                    # Fetch Umsatz-Daten
      orders.ts                     # Fetch Bestellhistorie
```

### Datenbank-Abfragen:

**Adressen:**
```sql
SELECT * FROM tms.partner_addresses
WHERE partner_id = :id AND address_type = 'billing' AND is_default = true
```

**Umsatz (Materialized View):**
```sql
SELECT * FROM tms.mv_partner_monthly_revenue
WHERE partner_id = :id AND year = :year
ORDER BY month
```

**Bestellhistorie (NUR Trade):**
```sql
SELECT 
  i.document_date,
  i.document_number,
  ii.title,
  ii.item_number,
  ii.quantity,
  ii.unit_price,
  ii.discount,
  ii.total_price,
  ii.cost_price
FROM tms.invoice_items ii
JOIN tms.invoices i ON ii.invoice_id = i.id
WHERE i.partner_id = :id
  AND ii.revenue_category = 'trade'
ORDER BY i.document_date DESC
```

**Kontakte:**
```sql
SELECT * FROM tms.partner_contacts
WHERE partner_id = :id
ORDER BY created_at DESC
```

**Bestellhistorie — Produkttyp-Filter + Gruppierung (Erweiterung):**
```sql
SELECT
  ii.*,
  p.type AS product_type,
  pg.id AS group_id,
  pg.name AS group_name
FROM tms.invoice_items ii
JOIN tms.invoices i ON ii.invoice_id = i.id
JOIN tms.products p ON p.number = ii.article_number
LEFT JOIN tms.position_groups pg ON pg.id = p.group_id
WHERE i.partner_id = :id
  AND ii.revenue_category = 'trade_goods'
  AND p.type = 'PRODUCT'
ORDER BY i.document_date DESC
```
Referenz-Implementierungen für Produkt-/Gruppen-Zugriff bereits vorhanden in
`src/lib/actions/manufacturers.ts` (`getProducts()`, `getPositionGroups()`,
Typen `ProductWithManufacturer`, `PositionGroup`) — im Backend-Schritt
wiederverwenden statt duplizieren.

### RLS:
- Alle Nutzer können Adressen **lesen**
- Admin/AV können Adressen **bearbeiten**
- Alle Nutzer können Umsatz/Bestellhistorie **lesen**
- Alle Nutzer können Kontakte **lesen**
- Admin/AV können Kontakte **anlegen**

### Libraries:
- **Recharts** für Balkendiagramm (bereits in `package.json`)
- **Framer Motion** für Animationen (Tabs, Modals, Bento Grid)
- **shadcn/ui** Tabs, Dialog, Table, Select

---

## 6. Zeitschätzung

| Task | Zeit |
|------|------|
| Spec | 30 Min (gemacht) |
| Architektur | 30 Min |
| Frontend (Tabs + Bento Grid) | 3 Stunden |
| Frontend (Adress-Edit Modal) | 2 Stunden |
| Frontend (Umsatz-Diagramm) | 2.5 Stunden |
| Frontend (Bestellhistorie) | 2 Stunden |
| Frontend (Kontakte) | 1.5 Stunden |
| Backend (Actions) | 2 Stunden |
| Tests | 1.5 Stunden |
| **Gesamt** | **~1.5 Tage** |

---

## 7. Abhängigkeiten

- ✅ PROJ-1 (Auth) — erledigt
- ✅ PROJ-2a.1 (Kunden-Stammdaten) — erledigt
- ✅ Tabellen `partners`, `partner_addresses`, `partner_contacts`, `invoices`, `invoice_items` — existieren
- ❌ Materialized View `mv_partner_monthly_revenue` — existiert NICHT in Produktion (siehe Deploy-Verlauf 2026-07-18); wird durch Neubau 2.3 ersetzt, nicht mehr benötigt
- ⚠️ Schema-Drift bei `invoice_items`/`products`/`position_groups` (fehlende Migrationen) — separates Ticket, NICHT Teil dieses Umbaus

---

## 8. Nächste Schritte

1. **Diese Spec reviewen** — Jan Bernd prüft und gibt "approved"
2. **/architecture** — Technische Details finalisieren
3. **/frontend + /backend** — Bauen
4. **/qa** — Tests
5. **/deploy** — Auf Server deployen

---

## 9. Decision Log

### Produkt (2026-07-21 — Refine: Umsatz-Tab Neubau)
- **Umsatz-Tab wird komplett neu aufgebaut**, da die Datengrundlage
  (`mv_partner_monthly_revenue`) nie in Produktion existierte (siehe
  Deploy-Verlauf 2026-07-18) — kein reines Redesign, sondern Ersatz der
  kompletten Datenquelle durch direkte `invoice_items`-Auswertung, analog
  zur bereits produktiven Bestellhistorie.
- **Gesamtumsatz zählt ALLE Rechnungspositionen**, auch ohne Artikel-Match zu
  `products` — Begründung: diese Kennzahl wird an anderer Stelle
  weiterverwendet und soll nicht künstlich niedriger ausfallen als der
  tatsächliche Kundenumsatz.
- **Kategorie „Sonderwerkzeug" entfällt ersatzlos** — basierte auf
  `invoice_items.revenue_category`, die zu 100% NULL ist (bereits in der
  Bestellhistorie durch `products.type` ersetzt). Nur noch
  Handelsumsatz/Serviceumsatz über `products.type` (`PRODUCT`/`SERVICE`).
- **Rabattgruppen (`position_groups`)** werden als Chart-Aufschlüsselung
  angezeigt: Klick auf KPI Handelsumsatz/Serviceumsatz splittet das
  Chart nach Rabattgruppe (Toggle-Verhalten wie Donut-Chart in 2.4.1).
- **Standard-Zeitraum: rollierend, 365 Tage** ("Letzte 12 Monate"), NICHT
  Kalender-YTD — Dropdown bietet zusätzlich feste Kalenderjahre (dynamisch)
  und „Gesamt".
- **Vergleichs-Badge** (grün/rot, %) gegen Vorperiode: 365 Tage davor bzw.
  Vorjahr, je nach Auswahl; kein Vergleich bei „Gesamt".
- **KPI-Reihe bleibt schlank:** nur Gesamtumsatz/Handelsumsatz/Serviceumsatz
  (+ optional „Nicht zugeordnet"). Vorschlag „Anzahl Rechnungen"/„Ø
  Bestellwert" wurde abgelehnt.
- **Schema-Drift-Bereinigung ist explizit NICHT Teil dieses Umbaus** —
  eigenes, separates Ticket.

### Technisch (2026-07-21, korrigiert bei /architecture)
- **Kein neues DB-Objekt.** Statt der ursprünglich vorgeschlagenen neuen
  Materialized View `mv_partner_revenue` wird direkt aus `invoice_items`
  berechnet — exakt das Muster, das die bereits produktiv laufende
  Bestellhistorie verwendet (kein Refresh-Risiko, keine neue Migration nötig,
  vermeidet die Fehlerklasse, die am 18.07. zum Rollback führte).
- Gleiche Join-Logik wie Bestellhistorie:
  `invoice_items.article_number → products.number → products.type`,
  `products.group_id → position_groups` für die Rabattgruppen-Aufschlüsselung.
- Falls Performance bei sehr großen Kunden später zum Problem wird, kann eine
  View als Optimierung nachgerüstet werden — nicht Teil dieses Umbaus.

### Produkt (2026-07-17 — Refine: Bestellhistorie Produkttyp/Gruppierung/Donut-Chart)
- **Kennzahl im Donut-Chart:** Anzahl Bestellpositionen je Artikelgruppe (nicht Mengen-Summe). Begründung: User-Beispiel "10 mal ein HW Sägeblatt gekauft" bezieht sich auf Anzahl der Vorkommnisse, nicht auf Stückzahl je Position.
- **Segment-Klick-Verhalten:** Toggle — erneuter Klick auf aktives Segment hebt den Filter auf. Dropdown bietet zusätzlich "Alle" als expliziten Reset.
- **Umgang mit nicht matchbaren Artikeln:** Positionen ohne passenden `products`-Eintrag (kein `number`-Match zu `article_number`) werden ausgeblendet, da `type = 'PRODUCT'` sonst nicht verifizierbar ist.

### Technisch (2026-07-17)
- Verknüpfung `invoice_items.article_number = products.number` (Spaltennamen unterscheiden sich bewusst — kein Rename der Bestandstabellen).
- Gruppendaten kommen über `products.group_id` → `position_groups`, analog zur bestehenden Hersteller-Verwaltung (PROJ-28). Bestehende Actions in `manufacturers.ts` werden wiederverwendet.

## 10. Offene Fragen (zur Bestätigung vor "approved")

- [x] Kennzahl im Donut-Chart = Anzahl Bestellpositionen (nicht Mengen-Summe) → bestätigt (2026-07-17)
- [x] Toggle-Verhalten beim erneuten Klick auf ein aktives Segment → bestätigt (2026-07-17)
- [x] Ausblenden von Positionen ohne Produkt-Match (statt z.B. "unbekannt" anzuzeigen) → bestätigt (2026-07-17)
- [x] Standard-Zeitraum Umsatz-Tab: rollierend (365 Tage) statt Kalenderjahr → bestätigt (2026-07-21)
- [x] Gesamtumsatz zählt ALLE `invoice_items` (auch ohne Produkt-Match) → bestätigt (2026-07-21)
- [x] Jahresumsatz-Bereitstellung: Live-Berechnung aus `invoice_items` statt der nie existierenden Materialized View → bestätigt (2026-07-21), bei /architecture nochmals korrigiert (kein neues DB-Objekt, siehe Abschnitt „Technisch (2026-07-21, korrigiert bei /architecture)")
- [x] Dritte Kategorie „Sonderwerkzeug" (basierte auf leerer `revenue_category`-Spalte) entfällt ersatzlos → bestätigt (2026-07-21)
- [x] Zusatz-KPIs „Anzahl Rechnungen" / „Ø Bestellwert" → abgelehnt, KPI-Reihe bleibt schlank (2026-07-21)
- [x] Schema-Drift-Bereinigung (fehlende Migrationen) im Rahmen dieses Umbaus mitlösen? → Nein, separates Ticket (2026-07-21)

---

## 11. Tech Design (Solution Architect) — Erweiterung Bestellhistorie (2026-07-17)

**Werkstatt-Vergleich:** Die bestehende Bestellhistorie-Kiste bekommt eine
neue Übersichtstafel davor (Donut-Chart) und ein zusätzliches
Sortier-Fach-Etikett (Artikelgruppe) an jeder Position. Die Kiste selbst
(Datenbank-Tabellen) bleibt unverändert — wir lesen nur zusätzliche
Informationen mit, die an anderer Stelle (Artikel-Stammdaten aus PROJ-28)
bereits vorhanden sind.

### A) Komponenten-Struktur

```
Tab: Bestellhistorie
├── Artikelgruppen-Übersicht (NEUE Karte, oberhalb der Tabelle)
│   ├── Donut-Chart — ein Tortenstück pro Artikelgruppe des Kunden
│   └── Dropdown "Artikelgruppe" — Alternative zum Klicken im Chart
├── Bestellhistorie-Tabelle (bestehend)
│   ├── Zeitraum-Filter (bestehend)
│   ├── Suchfeld (bestehend)
│   └── Zeilen — nur noch "echte" Handelsartikel (kein Werkzeug-Service)
```

Chart und Dropdown wirken auf denselben Filter-Zustand ("aktive
Artikelgruppe"): Klick im Chart setzt das Dropdown automatisch mit, und
umgekehrt. Ändert sich Zeitraum oder Suche, passt sich die Liste der im
Chart/Dropdown wählbaren Gruppen automatisch an (nur was beim Kunden gerade
vorkommt, wird angeboten).

### B) Datenmodell (fachlich)

Keine neuen Tabellen. Jede Bestellposition bekommt zwei zusätzliche
Informationen "angeheftet", die aus den bereits existierenden
Artikel-Stammdaten (PROJ-28) stammen:
- **Artikel-Art:** ist die Position ein "echter" Artikel oder eine
  Dienstleistung? Nur "echte Artikel" werden in der Bestellhistorie gezeigt.
- **Artikelgruppe:** zu welcher Warengruppe gehört der Artikel (z.B. "HW
  Sägeblatt")? Wird für die Gruppierung, das Donut-Chart und den
  Dropdown-Filter verwendet.

Für das Donut-Chart wird zusätzlich eine kleine Zusammenfassung berechnet:
pro Artikelgruppe, wie viele Bestellpositionen der Kunde insgesamt in dieser
Gruppe hat (nicht nur die aktuell sichtbare Tabellenseite, sondern über die
gesamte Historie des Kunden hinweg — sonst wäre die Übersichtstafel bei
Seitenwechsel irreführend).

Der ausgewählte Filter (welche Gruppe gerade aktiv ist) ist reiner
Anzeige-Zustand auf der Seite — er wird nirgends gespeichert und ist beim
nächsten Öffnen der Seite wieder zurückgesetzt.

### C) Tech-Entscheidungen (Begründung)

- **Wiederverwendung statt Neubau:** Die Verknüpfung "Bestellposition →
  Artikel-Stammdaten → Warengruppe" existiert bereits für die
  Hersteller-Verwaltung (PROJ-28). Wir nutzen dieselbe Verknüpfung, statt sie
  neu zu bauen — geringeres Risiko, konsistente Daten.
- **Filterung passiert serverseitig:** Wie bei den bestehenden Filtern
  (Zeitraum, Suche) wird die Artikelgruppen-Auswahl direkt in der
  Datenbank-Abfrage angewendet, nicht erst im Browser gefiltert. Das hält die
  Seite schnell, auch bei Kunden mit sehr vielen Bestellungen.
- **Übersichtstafel (Donut-Chart) = eigene, leichte Abfrage:** Damit die
  Kacheln im Chart die Gesamt-Häufigkeit zeigen (nicht nur die aktuelle
  Tabellenseite), wird dafür eine kleine, separate Zusammenfassungs-Abfrage
  je Kunde genutzt — dasselbe Muster, das für die bestehende
  Artikel/Dienstleistungs-Verteilung in der Hersteller-Verwaltung schon
  existiert.
- **Gleiches Chart-Erscheinungsbild wie bei den Herstellern:** Für das
  Donut-Chart wird dieselbe Diagramm-Bibliothek und derselbe visuelle Aufbau
  verwendet wie beim bereits bestehenden Artikel/Dienstleistungs-Diagramm in
  der Hersteller-Verwaltung — einheitliches Erscheinungsbild, keine neue
  Abhängigkeit nötig.

### D) Abhängigkeiten (Packages)

Keine neuen Packages nötig — Diagramm-Bibliothek und Dropdown-Baustein sind
bereits im Projekt vorhanden und werden nur wiederverwendet.

---

## 12. Technical Decisions (Architektur, 2026-07-17)

| Decision | Rationale | Date |
|----------|-----------|------|
| Gruppen-/Typ-Filterung serverseitig in der bestehenden Bestellhistorie-Abfrage ergänzen (kein neuer Endpoint für die Tabelle) | Konsistent mit bestehendem Zeitraum-/Suchfilter-Muster, keine doppelte Abfrage-Logik | 2026-07-17 |
| Donut-Chart-Zahlen über separate Zusammenfassungs-Abfrage (Gesamt-Historie, nicht Seiten-abhängig) | Chart muss unabhängig von Pagination korrekt bleiben | 2026-07-17 |
| Wiederverwendung der bestehenden Artikel/Gruppen-Verknüpfung aus der Hersteller-Verwaltung (PROJ-28) statt neuer Tabellen/Views | Vermeidet Datenduplikation, nutzt bereits vorhandene, geprüfte Verknüpfung | 2026-07-17 |
| Gleiches Donut-Chart-Erscheinungsbild wie im bestehenden Artikel/Dienstleistungs-Diagramm der Hersteller-Verwaltung | Visuelle Konsistenz, keine neue Bibliothek nötig | 2026-07-17 |

---

## 13. Implementierungsnotizen — Frontend (2026-07-17)

- `src/lib/actions/orders.ts`: `getPartnerTradeOrders` um `groupId`-Parameter,
  `group_id`/`group_name` im Ergebnis erweitert; neue Action
  `getPartnerOrderGroupStats(partnerId, search?)` für die Chart-/Dropdown-Daten.
  Verknüpfung `invoice_items.article_number ↔ products.number` erfolgt
  zweistufig in der App-Schicht (kein FK zwischen den Tabellen), analog zum
  bestehenden Muster in `manufacturers.ts`.
- Neue Komponente `order-group-chart.tsx` (Donut-Chart, Recharts,
  Design-System-Chartfarben `#FF6B6D · #4ECDC4 · #7C6CFF · #F59F00 · #4DABF7 · #2FB344`).
- `order-history-table.tsx` erweitert um Dropdown-Filter "Artikelgruppe" und
  Einbindung des Donut-Charts; Filter-Zustand (`activeGroupId`) synchron
  zwischen Chart, Dropdown und Tabellen-Query.
- Typecheck (`tsc --noEmit`) und Production-Build (`npm run build`) laufen
  fehlerfrei durch. **Kein Live-Browser-Test möglich** in dieser
  Sandbox-Umgebung (keine `.env.local`/Supabase-Zugangsdaten vorhanden) —
  muss im `/qa`-Schritt gegen echte Daten verifiziert werden.

---

## 14. Implementierungsnotizen — Backend (2026-07-17)

**Berechtigungsprüfung (`service_role` GRANTs), statt Neubau der Abfrage:**
- `tms.products` wird bereits von der deployten Hersteller-Verwaltung
  (PROJ-28, `src/lib/actions/manufacturers.ts`) über denselben
  `createAdminClient({ schema: "tms" })` gelesen **und beschrieben**
  (`updateProductManufacturer`, `bulkUpdateProductManufacturers` — live in
  Produktion). `tms.position_groups` wird dort ebenfalls gelesen
  (`getPositionGroups`, `getProductById`). Da PROJ-28 produktiv läuft, hat
  `service_role` für beide Tabellen bereits ausreichende Rechte — **keine
  neue GRANT-Migration nötig** (anders als bei BUG-2, wo `invoice_items`/
  `invoices` neu waren und noch keine Rechte hatten).
- Trotzdem **im `/qa`-Schritt gegen die echte Datenbank verifizieren**
  (Sandbox hat keinen DB-Zugriff): `SELECT * FROM tms.invoice_items ii JOIN
  tms.products p ON p.number = ii.article_number LIMIT 1;` mit
  `service_role` sollte Daten liefern, kein Permission-Fehler.

**Auth-Pattern konsistent mit bestehendem Code:**
- `getPartnerTradeOrders`/`getPartnerOrderGroupStats` haben — wie alle
  anderen Read-Actions in `revenue.ts`/`contacts.ts` — keine eigene
  Auth-Prüfung. Das ist konsistent: Routenschutz für `/kunden/[id]`
  erfolgt zentral über `src/lib/supabase/middleware.ts` (nicht
  angemeldet → Redirect `/login`). Keine Änderung nötig.

**Tests:** Für Server Actions mit `createAdminClient`-Zugriff existiert im
Projekt bisher keine Testinfrastruktur (nur `roles.test.ts` und
`validations/auth.test.ts` für reine Logik, kein Supabase-Mocking-Muster).
Ein neues Mocking-Setup nur für diese Erweiterung einzuführen wäre
Over-Engineering — die Verifikation erfolgt stattdessen im `/qa`-Schritt
gegen echte Daten (siehe Akzeptanzkriterien Abschnitt 4).

---

## 15. Tech Design (Solution Architect) — Umsatz-Tab Neubau (2026-07-21)

**Werkstatt-Vergleich:** Die alte Umsatz-Kachel hing an einem Fach, das es in
der echten Werkstatt nie gab (die Materialized View existierte nie in
Produktion) — deshalb war sie immer leer. Der Neubau hängt die Kachel
stattdessen direkt an den Rechnungsordner, denselben, den die
Bestellhistorie schon erfolgreich nutzt. Kein neues Lager (keine neue
Datenbank-Tabelle/-View), nur eine neue Auswertung des Bestehenden.

### A) Komponenten-Struktur

```
Tab: Umsatz
├── KPI-Reihe (NEU, ersetzt bisherige Summen-Karte)
│   ├── Gesamtumsatz-Kachel (klickbar, mit Vergleichs-Badge %)
│   ├── Handelsumsatz-Kachel (klickbar, mit Vergleichs-Badge %)
│   ├── Serviceumsatz-Kachel (klickbar, mit Vergleichs-Badge %)
│   └── "Nicht zugeordnet"-Kachel (nur sichtbar, wenn > 0 im Zeitraum)
├── Zeitraum-Dropdown (oben rechts): Letzte 12 Monate (Standard) │
│   Kalenderjahre (dynamisch) │ Gesamt
└── Umsatz-Chart (NEU, ersetzt bisheriges Balkendiagramm)
    ├── Standardansicht: Balken pro Monat, gestapelt Handel/Service
    │   (+ Nicht zugeordnet)
    └── Gefilterte Ansicht (nach KPI-Klick): Balken pro Monat, gestapelt
        nach Rabattgruppe — nur für die angeklickte Kategorie
```

Die KPI-Reihe und das Chart sind **ein zusammenhängender Baustein**: Klick
auf eine KPI ändert nur, WIE das Chart darunter aufgeschlüsselt wird — die
KPI-Werte selbst ändern sich nicht durch den Chart-Klick, nur durch den
Zeitraum-Dropdown. Die bisherige separate "Summen-Karte" entfällt, ihre
Funktion übernimmt die neue KPI-Reihe.

**Aufräumen bestehender Code-Verwirrung:** Aktuell existieren zwei
unterschiedliche, sich überschneidende Umsatz-Komponenten
(`revenue-chart.tsx` mit eingebauter KPI-Anzeige, sowie eine zweite,
inzwischen ungenutzte `revenue-summary.tsx`). Der Neubau ersetzt beide durch
eine klare Aufteilung: eine KPI-Reihen-Komponente + eine Chart-Komponente,
die verwaiste Datei wird entfernt.

### B) Datenmodell (fachlich)

Keine neuen Tabellen oder Datenbank-Objekte. Alles wird direkt aus den
bereits vorhandenen Rechnungspositionen berechnet — genau wie bei der
Bestellhistorie:

- **Zeitraum bestimmt die Auswahl der Rechnungspositionen** (Rechnungsdatum
  innerhalb der letzten 365 Tage / im gewählten Kalenderjahr / ganze
  Historie)
- **Kategorie** (Handel/Service/Nicht zugeordnet) ergibt sich pro Position
  aus der Artikel-Art des verknüpften Artikel-Stammdatensatzes (dieselbe
  Verknüpfung wie in der Bestellhistorie)
- **Rabattgruppe** ergibt sich pro Position aus der Warengruppe des
  verknüpften Artikels (dieselbe Verknüpfung wie im Donut-Chart der
  Bestellhistorie)
- **Vergleichswert** ist dieselbe Berechnung, nur für die vorherige,
  gleich lange Periode (365 Tage davor bzw. Vorjahr)

Der "Jahresumsatz" ist also kein gespeicherter Wert, sondern das Ergebnis
einer Live-Berechnung über die Rechnungspositionen im gewählten Zeitraum —
das entspricht der Erkenntnis, dass hier keine zusätzliche Datenablage
nötig ist, solange die Berechnung schnell genug bleibt (siehe Tech-
Entscheidungen).

Der gewählte Zeitraum und die aktive Chart-Kategorie sind reiner
Anzeige-Zustand auf der Seite — nichts davon wird gespeichert, beim
nächsten Öffnen der Seite startet wieder der Standard (Letzte 12 Monate,
kein Kategorie-Filter).

### C) Tech-Entscheidungen (Begründung)

- **Keine neue Materialized View.** Ursprünglich war eine neue, eigens
  migrierte View (`mv_partner_revenue`) angedacht, um den "Jahresumsatz"
  vorab zu berechnen. Entscheidung: stattdessen live aus den
  Rechnungspositionen berechnen — genau das Muster, das die Bestellhistorie
  bereits produktiv nutzt. Vorteil: kein neues Datenbank-Objekt, kein
  Refresh-Zeitplan, keine Wiederholung der Fehlerklasse, die am 18.07. zum
  Produktions-Rollback führte (eine angenommene, aber nie migrierte View).
  Falls die Live-Berechnung bei sehr großen Kunden spürbar langsam wird,
  kann eine View später als reine Performance-Optimierung nachgerüstet
  werden — das ist kein Blocker für diesen Umbau.
- **Wiederverwendung der Bestellhistorie-Verknüpfung:** Artikel-Art und
  Warengruppe werden über dieselbe, bereits produktiv geprüfte Verknüpfung
  ermittelt wie in der Bestellhistorie (Artikelnummer → Artikel-Stammdaten →
  Warengruppe). Keine neue Verknüpfungslogik, kein Risiko neuer
  Dateninkonsistenzen.
- **Batchweises Nachladen der Artikel-Zuordnung:** Wie in der
  Bestellhistorie werden Artikelnummern in Blöcken gegen den Artikelstamm
  abgeglichen (statt aller Artikelnummern auf einmal), um die
  "Adressen-zu-lang"-Problematik zu vermeiden, die beim letzten Deploy schon
  einmal aufgetreten war.
- **Zeitraum- und Kategorie-Filterung serverseitig:** Wie beim
  bestehenden Zeitraum-/Suchfilter der Bestellhistorie wird direkt in der
  Datenbank-Abfrage gefiltert, nicht erst im Browser — bleibt schnell auch
  bei Kunden mit sehr vielen Rechnungen.
- **Gleiches visuelles Muster wie Bestellhistorie:** Gleiche
  Diagramm-Bibliothek, gleiche Design-System-Farben, gleiches
  Toggle-Verhalten bei Kategorie-Klick (aktive Kategorie erneut anklicken
  hebt den Filter wieder auf) — einheitliches Erscheinungsbild, kein neues
  Erlern-Muster für Nutzer.
- **Aufräumen der doppelten Altkomponenten** (`revenue-summary.tsx`
  verwaist, `revenue-chart.tsx` überladen): wird im Zuge dieses Umbaus durch
  die neue, klar getrennte KPI-/Chart-Struktur ersetzt, nicht parallel
  weitergeführt.

### D) Abhängigkeiten (Packages)

Keine neuen Packages nötig — Diagramm-Bibliothek (Recharts) und
Dropdown-Baustein sind bereits im Projekt vorhanden und werden nur
wiederverwendet.

## 16. Technical Decisions (Architektur, 2026-07-21)

| Decision | Rationale | Date |
|----------|-----------|------|
| Keine neue Materialized View — Live-Berechnung direkt aus `invoice_items`, analog Bestellhistorie | Vermeidet neues DB-Objekt/Refresh-Risiko; genau die Fehlerklasse, die am 18.07. zum Rollback führte, wird nicht wiederholt | 2026-07-21 |
| Wiederverwendung der Artikel-Art-/Warengruppen-Verknüpfung aus der Bestellhistorie (kein neuer Verknüpfungscode) | Vermeidet Dateninkonsistenzen, nutzt bereits produktiv geprüfte Logik | 2026-07-21 |
| Batchweiser Abgleich der Artikelnummern gegen den Artikelstamm (statt Gesamtkatalog auf einmal) | Vermeidet die "Adressen-zu-lang"-Problematik aus BUG-5 (18.07.) erneut | 2026-07-21 |
| Zeitraum-/Kategorie-Filterung serverseitig statt im Browser | Bleibt performant auch bei Kunden mit sehr vielen Rechnungen | 2026-07-21 |
| Zusammenlegen der doppelten Altkomponenten (`revenue-summary.tsx`, `revenue-chart.tsx`) in eine klare KPI-/Chart-Struktur | Beseitigt bestehende Code-Verwirrung/Redundanz, statt sie fortzuführen | 2026-07-21 |

---

## QA Test Results — Erweiterung Bestellhistorie (Produkttyp/Gruppierung/Donut-Chart)

**Getestet:** 2026-07-17
**App-URL:** nicht erreichbar (keine `.env.local`/Supabase-Zugangsdaten in dieser
Sandbox — kein Login, kein Live-Browser-Test möglich)
**Tester:** QA Engineer (KI)

**Wichtiger Hinweis:** Ein echter Browser-Test gegen die Live-Anwendung
(`tms.gudel-werkzeuge.de` bzw. `localhost:3000` mit echten Kundendaten)
konnte in dieser Umgebung **nicht durchgeführt werden**. Stattdessen wurde
geprüft: Typecheck, Production-Build, automatisierte Unit-Tests, statische
Sicherheits-/Code-Review sowie Erstellung der E2E-Testsuite (unausgeführt).
**Alle unten als "ungeprüft" markierten Punkte müssen vor `/deploy` real
verifiziert werden** (z.B. während des `/deploy`-Skripts, das ohnehin einen
Playwright-Smoke-Test gegen die Live-URL fährt — dort aber nur Basis-Login,
nicht diese Feature-Details).

### Automatisierte Tests
- `npx tsc --noEmit`: ✅ keine Fehler
- `npm run build`: ✅ erfolgreich (Turbopack, alle Routen kompilieren)
- `npx vitest run src/`: ✅ 19/19 Tests grün (inkl. 4 neue Tests für
  `buildGroupStats` in `src/lib/actions/orders-helpers.test.ts`)
- **Vorbestehendes Problem gefunden (nicht durch dieses Feature verursacht):**
  `npm test` (= `vitest run`, ohne Pfad-Filter) versucht auch die
  Playwright-Specs unter `tests/` auszuführen und schlägt dort fehl, weil
  `vitest.config.ts` das `tests/`-Verzeichnis nicht ausschließt. Betrifft
  `tests/tms-kunden.spec.ts` und `tests/deploy/smoke.spec.ts` — beide
  bereits vor dieser Änderung vorhanden. **Nicht blockierend für PROJ-11**,
  sollte aber unabhängig behoben werden (Vorschlag: `exclude: ['tests/**']`
  in `vitest.config.ts`).
- Neue E2E-Testsuite `tests/PROJ-11-bestellhistorie-gruppen.spec.ts`
  geschrieben (3 Szenarien: Chart zeigt Gruppen, Klick filtert + synchronisiert
  Dropdown + Toggle, Dropdown "Alle" setzt zurück). `npx playwright test
  --list` bestätigt: Datei ist syntaktisch korrekt, 6 Testläufe
  (Chromium + Mobile Safari) werden erkannt. **Nicht ausgeführt** — erfordert
  echten Testkunden (`PROJ11_TEST_KUNDE_ID`) mit mehreren Artikelgruppen und
  echte Login-Zugangsdaten.

### Akzeptanzkriterien-Status (Abschnitt 4, "Bestellhistorie")

- [ ] **UNGEPRÜFT** (Live-Daten nötig) — Nur Positionen mit `products.type = 'PRODUCT'` werden angezeigt
- [ ] **UNGEPRÜFT** — Donut-Chart zeigt genau die vorkommenden Artikelgruppen
- [ ] **UNGEPRÜFT** — Donut-Chart-Segment = Anzahl Bestellpositionen
- [x] Klick-Toggle-Logik statisch geprüft (Code: `activeGroupId === groupId ? null : groupId`) — korrekt
- [x] Dropdown/Chart-Synchronisierung statisch geprüft (gemeinsamer State `activeGroupId`) — korrekt
- [ ] **UNGEPRÜFT** — Dropdown zeigt "Alle" zum Zurücksetzen (Code vorhanden, Live-Verhalten offen)
- [ ] **UNGEPRÜFT** — Leerzustand bei Kunde ohne `type=PRODUCT`-Positionen

### Gefundene Bugs

#### BUG-1: `groupId = 0` würde durch Truthy-Check ignoriert
- **Severity:** Low
- **Fundort:** `src/lib/actions/orders.ts`, `getProductGroupMap()`:
  `if (groupId) { query = query.eq("group_id", groupId); }`
- **Szenario:** Falls `tms.position_groups.id` jemals den Wert `0` annehmen
  könnte, würde der Gruppenfilter für genau diese Gruppe stillschweigend
  ignoriert (alle Gruppen würden angezeigt statt nur Gruppe 0).
- **Einschätzung:** Aktuell wahrscheinlich harmlos, da Postgres
  Identity/Serial-Spalten i.d.R. bei 1 starten — aber nicht verifiziert.
- **Fix-Vorschlag:** `if (groupId !== undefined)` statt Truthy-Check.
- **Priorität:** Vor Deployment beheben (einzeilig, geringes Risiko).
- **Status:** ✅ Behoben (2026-07-17) — `getProductGroupMap()` prüft jetzt `groupId !== undefined`.

#### BUG-2: Suchbegriff unescaped in PostgREST `.or()`-Filter (zweite Fundstelle)
- **Severity:** Medium
- **Fundort:** `getPartnerTradeOrders` UND neu `getPartnerOrderGroupStats` in
  `orders.ts`: `query.or(\`description.ilike.%${search}%,article_number.ilike.%${search}%\`)`
- **Szenario:** Der Suchbegriff wird ungeprüft in die PostgREST-Filter-DSL
  eingebettet. Enthält er Zeichen wie `,` oder `)`, kann die Filterlogik
  verändert werden (zusätzliche OR-Bedingungen). Dieses Muster existierte
  bereits vor dieser Erweiterung in `getPartnerTradeOrders` (nicht neu
  eingeführt), wurde durch diese Erweiterung aber in eine zweite Funktion
  übernommen.
- **Blast Radius begrenzt:** Der äußere `partner_id`- und
  `revenue_category`-Filter bleiben als separate AND-Bedingungen bestehen —
  ein Angreifer kann also nicht auf fremde Kundendaten zugreifen, nur
  innerhalb der eigenen Kundendaten zusätzliche Zeilen sichtbar machen.
- **Fix-Vorschlag:** Suchbegriff vor dem Einbetten escapen (Kommas/Klammern)
  oder auf `%`/Wildcard-Zeichen beschränken.
- **Priorität:** Sollte behoben werden, ist aber kein Blocker (vorbestehendes
  Muster, begrenzter Blast Radius).
- **Status:** ✅ Behoben (2026-07-17) — neue Helper-Funktion
  `escapeOrFilterValue()` in `orders-helpers.ts` (unit-getestet) escaped
  Backslash/Anführungszeichen, Filterwerte werden jetzt zusätzlich gequotet
  (`ilike."%wert%"`), sodass `,`/`)` im Suchbegriff die Filter-Syntax nicht
  mehr verändern können. In beiden Fundstellen angewendet (auch der
  vorbestehenden in `getPartnerTradeOrders`).

#### BUG-3 (Regressionsrisiko, kein Bug im engeren Sinn): Weniger Zeilen als vorher möglich
- **Severity:** Medium (Business-Impact, kein Code-Fehler)
- **Beschreibung:** Vor dieser Erweiterung wurden ALLE
  `revenue_category = 'trade_goods'`-Positionen angezeigt. Jetzt zusätzlich
  nur die, deren `article_number` einen Treffer in `tms.products` mit
  `type = 'PRODUCT'` hat. Positionen mit fehlendem oder falsch klassifiziertem
  Artikel-Stammdatensatz verschwinden dadurch aus der Bestellhistorie —
  das war eine bewusste Entscheidung (siehe Decision Log), aber die
  tatsächliche Auswirkung auf reale Kundendaten wurde **nicht verifiziert**
  (unbekannt, wie viele `article_number` in der Produktions-DB keinen
  Treffer in `products` haben).
- **Empfehlung:** Vor `/deploy` stichprobenartig bei 2–3 Bestandskunden
  vergleichen: Zeilenzahl vorher vs. nachher, um unerwarteten Datenverlust
  in der Anzeige auszuschließen.
- **Status:** Kein Code-Fix möglich/nötig (bewusste Spec-Entscheidung) —
  bleibt offener Punkt für die Live-Verifikation vor `/deploy`.

### Security-Audit (statisch, Red-Team-Perspektive)
- [x] Auth: Route `/kunden/[id]` durch Middleware geschützt (kein Login →
  Redirect `/login`) — unverändert durch dieses Feature
- [x] Autorisierung: Gleiches Modell wie der Rest der App (jeder
  authentifizierte interne Mitarbeiter sieht jede Kunden-ID) — kein neues
  Datenleck durch diese Erweiterung eingeführt
- [x] XSS: Alle neuen Ausgaben (`group_name`, Zähler) laufen durch normales
  React-Rendering, kein `dangerouslySetInnerHTML` — kein neues Risiko
- [ ] Input-Validierung: siehe BUG-2 (Suchbegriff-Escaping)
- [x] Keine neuen Secrets/Keys im Client-Code sichtbar (Service-Role-Key
  bleibt serverseitig in `orders.ts`, `"use server"`)

### Performance-Hinweis (nicht als Bug gewertet, zur Kenntnis)
`getProductGroupMap()` lädt bei jedem Aufruf ALLE `type='PRODUCT'`-Artikel
(unabhängig vom Kunden) in den Speicher, um die Nummer-zu-Gruppe-Zuordnung zu
bauen. Bei einem sehr großen Artikelkatalog (mehrere Zehntausend Artikel)
könnte das spürbar werden. Aktuell unbekannt, wie groß `tms.products` in
Produktion ist — im `/qa`-Live-Test oder spätestens bei Performance-Monitoring
nach Deploy beobachten.

### Zusammenfassung
- **Akzeptanzkriterien:** 2/7 statisch bestätigt, 5/7 ungeprüft (Live-Daten
  nötig), 0 fehlgeschlagen
- **Bugs gefunden:** 3 (0 Critical, 0 High, 2 Medium, 1 Low) — **2/3 behoben**
  (BUG-1 Truthy-Check, BUG-2 Filter-Escaping); BUG-3 ist eine bewusste
  Spec-Entscheidung ohne Code-Fix, bleibt als Live-Verifikationspunkt offen.
  Nach den Fixes: Typecheck ✅, Build ✅, 8/8 Unit-Tests ✅ (4 neue Tests für
  `escapeOrFilterValue`).
- **Security:** keine kritischen Funde; das Escaping-Muster wurde behoben
- **Production-Ready:** **NOT READY** — nicht wegen gefundener Bugs, sondern
  weil die Kernfunktionalität (Chart-Zahlen, Gruppen-Filter, Leerzustand)
  mangels Datenbankzugriff in dieser Sandbox nicht gegen echte Daten
  verifiziert werden konnte. Empfehlung: einmaligen Live-Test mit einem
  echten Kunden (mehrere Artikelgruppen) vor `/deploy` durchführen, dann
  BUG-1 (einzeilig) beheben, BUG-2 optional vorab oder danach.

---

## Deploy-Verlauf 2026-07-18 (Live-Verifikation + Rollback)

Beim Ausführen des Deploys (`./scripts/deploy.sh PROJ-11`) wurde die von QA
geforderte Live-Verifikation gegen echte Produktionsdaten nachgeholt. Ergebnis:
**die Erweiterung ist in dieser Form nicht produktionsreif** und wurde nach
Rücksprache wieder von Production entfernt.

### Vorgefundener Zustand / Infrastruktur-Erkenntnisse
- **Kein echtes Staging:** `docker-compose.yml` definiert nur einen Service
  `tms` mit Traefik-Router fest auf `tms.gudel-werkzeuge.de` (Production).
  `DEPLOY_TARGET=staging` ändert nur die Verifikations-URL, nicht das Deploy-Ziel
  — ein Deploy landet immer auf Production. **Offener Punkt:** echten
  Staging-Service + Route einführen, bevor „staging" sinnvoll nutzbar ist.
- **Lint-Tooling war projektweit kaputt:** `next lint` existiert in Next 16 nicht
  mehr; ESLint 9 kann die alte `.eslintrc.json` nicht lesen. Migriert auf Flat
  Config (`eslint.config.js`, `eslint-config-next/core-web-vitals`),
  `package.json`-Script auf `eslint .` umgestellt, 8 vorbestehende Lint-Fehler in
  fremden Dateien behoben (Auth-Formulare, Sidebar, Manufacturer-Table,
  discounts-card, page.tsx). *(Diese Änderungen liegen im Feature-Branch,
  wurden NICHT nach Production deployed.)*

### Gefundene Bugs (live, echte Daten)
- **BUG-4 (Critical, Crash):** `orders.ts` (`"use server"`) re-exportierte einen
  Typ via `export type { OrderGroupStat }` aus `orders-helpers.ts`. Turbopack in
  Next 16 leakt das als Laufzeit-Referenz in die Server-Action-Manifest-Datei →
  `ReferenceError: OrderGroupStat is not defined` bei **jedem** Aufruf des
  Bestellhistorie-Tabs (HTTP 500, Tab hängt ewig im Ladezustand). `tsc --noEmit`
  fängt das nicht ab (Bundler-Ebene, kein Typfehler) — deshalb in QA unentdeckt.
  **Fix:** Re-Export entfernt, Typ direkt aus `orders-helpers.ts` importiert
  (Muster wie überall sonst im Code, z.B. `manufacturers.ts`). Lokal verifiziert
  (Lint/tsc/Build/23 Unit-Tests grün). **Liegt im Branch, noch nicht deployed.**
- **BUG-5 (Critical, Design) — ✅ Behoben (2026-07-18, im Branch):**
  `getPartnerTradeOrders` UND `getPartnerOrderGroupStats` luden erst den
  **gesamten** Artikelkatalog (`type='PRODUCT'`) und stopften alle Nummern in
  `.in("article_number", …)`. PostgREST hängt die Liste an die Query-URL → bei
  großem Katalog `URI too long`, beide Abfragen scheiterten. **Fix umgesetzt:**
  Abfrage umgedreht — zuerst die (kunden-begrenzte) Bestellliste holen
  (`fetchCustomerTradeRows`), dann nur deren Artikelnummern gegen den
  Produktstamm mappen (`buildNumberToGroupMap`), Lookups in Blöcken à 150
  (`chunk()`), damit keine `.in()`-URL zu lang wird. Typ-Filter + Pagination
  laufen jetzt in der App-Schicht (korrekter `totalCount` nach Typ-Filter). Neue
  reine Helfer `chunk` + `rowQualifies` in `orders-helpers.ts`, unit-getestet
  (32/32 Tests grün, +9). Behebt zugleich die von QA notierte Speicher-Last
  (kein Voll-Katalog mehr im Speicher). Lint/tsc/Build grün.
  **Noch nicht deployed** — Grund siehe BUG-6.
- **BUG-6 (Blocker für Live-Rendering, VORBESTEHEND — nicht durch die Erweiterung
  verursacht):** Die Bestellhistorie-Query selektiert `invoices.document_number`,
  aber diese Spalte existiert in der Produktions-DB nicht
  (`column invoices_1.document_number does not exist`, 42703) — gilt für die
  Basis auf `main` **und** für den Branch. Solange das nicht geklärt ist, zeigt
  der Tab auch mit BUG-4+BUG-5-Fix keine Daten. DB-Schema-Introspektion war in
  dieser Umgebung gesperrt → **richtiger Spaltenname / fehlende Migration muss
  vom Team bestätigt werden**, bevor die Erweiterung live verifiziert werden kann.

### Rollback (durchgeführt)
- Production am 2026-07-18 auf **`main`** (Commit `37d2640`) zurückgebaut und neu
  deployed. `main` enthält die Erweiterung nicht, dafür alle regulär deployten
  Features (PROJ-20/21/22/28/26).
- **Wichtig:** Das naheliegende „vorherige" Docker-Image (`522bcdfa0a11`,
  2026-07-17 19:23) enthielt die kaputte Erweiterung bereits — ein Rollback
  dorthin hätte nichts gebracht. Production lief also schon **vor** dem heutigen
  Deploy mit dem BUG-4-Crash. Deshalb sauber aus `main` neu gebaut statt Image
  wiederverwendet.
- Verifiziert: `/login` 200, Bestellhistorie-Tab rendert ohne 500 (sauberer
  Leerzustand statt Crash), keine `OrderGroupStat`-/`URI too long`-Fehler mehr.

### Nebenbefunde auf `main` (vorbestehend, NICHT Teil dieser Erweiterung)
- Basis-`getPartnerTradeOrders` wirft `column invoices_1.document_number does not
  exist` (42703) → Bestellhistorie-Basis zeigt Leerzustand statt Daten. Eigenes
  Ticket wert.
- Umsatz-Tab: `Could not find the table 'tms.mv_partner_monthly_revenue' in the
  schema cache` → fehlende Materialized View. Eigenes Ticket wert.

### Auflösung / Deploy erfolgreich (2026-07-18, später am Tag)
Alle Blocker behoben und live verifiziert:
- **BUG-6 vollständig gelöst** — reale DB-Spalten via PostgREST-OpenAPI ermittelt:
  `invoice_number` (statt `document_number`), `single_price_net` /
  `total_price_net` / `cost_price_net` / `discount` (statt der nicht existierenden
  `*_net`/`discount_percent`-Namen). Toter Filter `revenue_category='trade_goods'`
  entfernt (Spalte ist 100% NULL) → „Handelsware" kommt jetzt aus dem
  `products.type='PRODUCT'`-Join (Spec 2.4.1). Preise sind Cent → `centsToEuro()`.
- **BUG-7 (Donut-Query):** gemeinsame Fetch-Funktion sortierte per
  `invoices(document_date)`, das im Stats-Embed fehlte → Donut-Query brach ab.
  Behoben.
- **BUG-8 (instabile Pagination):** Sortierung nach nicht-eindeutigem
  `document_date` verschluckte/duplizierte Zeilen an der 1000er-Seitengrenze
  (Tabelle 129 vs Donut 133). Jetzt Pagination stabil nach eindeutigem `id`,
  Anzeige-Sortierung nach Datum im Speicher → Tabelle und Donut stimmen überein.
- **Live-Verifikation (Playwright, eingeloggt gegen Production, Kunde Bod'or KTM
  GmbH):** Tabelle = 129 Positionen, Donut = 129 (MATCH), 10 Artikelgruppen,
  korrekte Euro-Preise/Rechnungsnummern/Rabatte, Segment-Klick filtert +
  Dropdown-Sync + Toggle funktionieren, keine Server-5xx. Alle Akzeptanzkriterien
  Abschnitt 4 „Bestellhistorie" erfüllt.

### Weiterhin offen (SEPARATE Tickets, nicht Teil von PROJ-11)
- ~~Umsatz-Tab: fehlende Materialized View `mv_partner_monthly_revenue`~~ →
  wird durch den Umsatz-Tab-Neubau (Abschnitt 2.3/15/16, Refine + Architektur
  2026-07-21) direkt adressiert (Live-Berechnung aus `invoice_items`, kein
  neues DB-Objekt), nicht mehr separat offen.
- `invoice_items.revenue_category` komplett NULL — für den Umsatz-Neubau
  irrelevant (nutzt `products.type` statt dieser Spalte), bleibt aber für
  andere denkbare Auswertungen ein offener Punkt.
- Kein echtes Staging (docker-compose deployt immer nach Production).
- Schema-Drift (fehlende Migrationen für `invoice_items`, `products`,
  `position_groups` u.a.) — bewusst separates Ticket, siehe Refine
  2026-07-21.

---

## 17. Implementierungsnotizen — Umsatz-Tab-Neubau (2026-07-22)

**Anlass:** Nutzer meldete leere Felder im Umsatz-Tab der Kundendetailseite.
Ursache bestätigt (siehe Abschnitt „Deploy-Verlauf 2026-07-18"): die
Materialized View `mv_partner_monthly_revenue` existierte nie in Produktion.
Der bereits genehmigte Architektur-Vorschlag (Abschnitt 15/16) wurde
übernommen und umgesetzt.

**Backend (`src/lib/actions/revenue.ts`, komplett neu):**
- Alle Funktionen lesen jetzt live aus `tms.invoice_items` (gejoint mit
  `tms.invoices!inner`), kein Zugriff mehr auf die tote View.
- Neue Funktionen: `getPartnerRevenueSummary`, `getPartnerRevenueChartData`,
  `getPartnerRevenueGroupChartData`, `getAvailableRevenueYears`. Wiederverwendung
  von `chunk()`/`centsToEuro()` aus `orders-helpers.ts`.
- „Gesamt"-Zeitraum bündelt das Chart nach Kalenderjahr statt nach Monat (nicht
  explizit in Abschnitt 2.3 spezifiziert, aber analog zur bisherigen
  Jahresansicht — sonst zu viele Balken bei mehrjähriger Historie).

**Frontend (`revenue-chart.tsx`, komplett neu):** KPI-Reihe
(Gesamt/Handel/Service/Nicht-zugeordnet, klickbar mit Toggle), Zeitraum-Dropdown
(12 Monate/Kalenderjahre/Gesamt), gestapeltes Balkendiagramm (ersetzt Area-Chart)
mit Umschaltung auf Rabattgruppen-Aufschlüsselung bei KPI-Klick. „Schärfumsatz/
Auftrag"-Kachel entfernt (laut Decision Log 2026-07-21 abgelehnt).

**Aufräumen:** `revenue-summary.tsx` (verwaist) und `revenue-chart.tsx.bak`
gelöscht. `src/lib/actions/order-stats.ts` komplett entfernt — `getPartnerOrderStats`
war bereits tot (nirgends importiert), `getPartnerOrderDates` wurde nur von der
jetzt entfernten Schärfumsatz-Kachel genutzt und hatte dadurch keine Aufrufer mehr.

**Zusätzlicher Fund (nicht in der ursprünglichen Spec):** `getPartnersWithRevenue`
in `src/lib/actions/partners.ts` (Umsatzspalte auf der Kunden-Listenseite `/kunden`)
las ebenfalls aus `mv_partner_monthly_revenue` — gleiche Ursache, gleicher Fix:
Live-Summe aus `invoice_items` für das laufende Kalenderjahr, batched über
`partnerIds` wie zuvor. Läuft über `createAdminClient`, nicht den bisherigen
RLS-Client der Funktion — `invoice_items`/`invoices`-GRANTs sind bisher nur für
`service_role` verifiziert (siehe Abschnitt 14).

**Verifikation in dieser Sandbox:** `npx tsc --noEmit` ✅, `npm run build` ✅,
`npx vitest run src/` ✅ (34/34 Tests grün). **Kein Live-Browser-Test möglich**
(keine Supabase-Zugangsdaten in der Sandbox) — muss im `/qa`-Schritt gegen echte
Kundendaten verifiziert werden, u.a.:
- `SELECT` gegen `tms.invoice_items JOIN tms.invoices` mit `service_role` liefert
  Daten (Rechte-Check, wie in Abschnitt 14 für die Bestellhistorie bereits bestätigt).
- Umsatz-Tab zeigt bei einem echten Kunden (z.B. Bod'or KTM GmbH) plausible,
  von Null abweichende Zahlen für „Letzte 12 Monate", ein Kalenderjahr und „Gesamt".
- Kunden-Liste (`/kunden`) zeigt wieder echte Umsatzwerte statt durchgängig €0.
- KPI-Klick auf Handel/Service togglet die Rabattgruppen-Aufschlüsselung korrekt
  und wieder zurück.

---

## QA Test Results — Umsatz-Tab-Neubau (2026-07-22)

**Getestet:** 2026-07-22
**App-URL:** nicht erreichbar (keine `.env.local`/Supabase-Zugangsdaten in dieser
Sandbox — Dev-Server crasht beim ersten Request in der Middleware mit
„Your project's URL and Key are required to create a Supabase client!"; explizit
verifiziert per `npx playwright test ... --project=chromium`, Server-Log
bestätigt fehlende Env-Vars). **Kein Login, kein Live-Browser-Test möglich** —
gleiche Einschränkung wie bei den vorherigen PROJ-11-QA-Runden.
**Tester:** QA Engineer (KI)

### Automatisierte Tests
- `npx tsc --noEmit`: ✅ keine Fehler
- `npm run build`: ✅ erfolgreich (Turbopack, alle Routen kompilieren, inkl. `/kunden` + `/kunden/[id]`)
- `npm run lint`: ⚠️ 1 Warnung (siehe BUG-1), 0 Fehler
- `npx vitest run src/`: ✅ 47/47 Tests grün (13 neue Tests in `src/lib/actions/revenue.test.ts`)
- Neue E2E-Testsuite `tests/PROJ-11-umsatz-tab.spec.ts` geschrieben (9 Szenarien ×
  2 Browser-Profile = 18 Testläufe). `npx playwright test --list` bestätigt: Datei
  syntaktisch korrekt, alle Tests werden erkannt. **Nicht ausgeführt** — Sandbox
  hat keine Supabase-Zugangsdaten, Login schlägt fehl (siehe oben). Erfordert
  echten Testkunden (`PROJ11_TEST_KUNDE_ID`) mit Handels- und Service-Positionen
  in mehreren Kalenderjahren.

### Unit-Tests (`revenue.test.ts`, Black-Box gegen gemockten Supabase-Admin-Client)
Da `revenue.ts` (anders als `orders.ts`/`orders-helpers.ts`) keine separate
Helpers-Datei mit exportierten Pure-Functions hat, wurden die exportierten
Server-Actions selbst mit einem gemockten Supabase-Client getestet (Query-Builder
inkl. `.eq/.in/.gte/.lte/.range` + PromiseLike `.then`). Deckt ab:
- Kategorisierung Handel/Service/Nicht-zugeordnet inkl. Positionen ohne Artikel-Match
- Gesamtumsatz zählt ALLE Positionen (auch ohne Match) — Abschnitt 4, Kriterium 1
- Kalenderjahr-Filterung (nur Positionen mit `document_date` im gewählten Jahr)
- Rollierendes 365-Tage-Fenster inkl. exakter Tagesgrenze zur Vorperiode
- Monats-Bucketing mit Null-Auffüllung für Monate ohne Umsatz
- Jahres-Bucketing bei „Gesamt"
- Rabattgruppen-Aufschlüsselung inkl. „Ohne Gruppe"-Fallback
- Partner-Isolation (Umsatz eines anderen Kunden fließt nicht ein)
- Edge Cases: neuer Kunde ohne Rechnungen (Nullwerte, kein Fehler), DB-Fehler
  (ok:false, generische Fehlermeldung, kein Crash)

Alle 13 Tests grün. Diese Logik ist damit deutlich besser abgesichert als der
ursprüngliche Umsatz-Tab (der überhaupt keine Tests hatte).

### Akzeptanzkriterien-Status (Abschnitt 4, „Umsatz (Neubau 2026-07-21)")

- [x] Gesamtumsatz zählt ALLE `invoice_items` im gewählten Zeitraum, unabhängig von Artikel-Match — unit-getestet
- [x] Handelsumsatz/Serviceumsatz basieren auf `products.type` — unit-getestet
- [x] KPI „Nicht zugeordnet" erscheint nur bei Wert > 0 — Code-Review (`showUnassigned = current.unassigned > 0`)
- [x] Standard-Zeitraum „Letzte 12 Monate" (rollierend) — unit-getestet (Tagesgrenze exakt geprüft)
- [x] Zeitraum-Dropdown: Kalenderjahre + „Gesamt" — Code-Review + E2E geschrieben (ungeprüft, s.o.)
- [x] Kalenderjahr-Auswahl zeigt nur Positionen dieses Jahres — unit-getestet
- [x] Klick auf „Handelsumsatz" filtert nach Rabattgruppe — unit-getestet (`getPartnerRevenueGroupChartData`) + Code-Review Toggle-Logik
- [x] Klick auf „Serviceumsatz" analog — unit-getestet
- [x] Erneuter Klick auf aktive KPI hebt Filter auf (Toggle) — Code-Review (`activeCategory === category ? null : category`)
- [x] Klick auf „Gesamtumsatz" setzt Chart-Filter zurück — Code-Review (`onClick={() => setActiveCategory(null)}`)
- [x] Vergleichs-Badge zeigt korrekte %-Veränderung — Code-Review `ChangeIndicator`, Vorperiodenwerte unit-getestet
- [x] Bei „Gesamt" kein Vergleichs-Badge — unit-getestet (`hasComparison=false`, `previous=null` bei `type:"all"`) + Code-Review (`previous !== undefined`-Check in `KpiCard`)
- [ ] **UNGEPRÜFT (Sandbox)** — Responsive Verhalten des Diagramms in echtem Browser
- [ ] **UNGEPRÜFT (Sandbox)** — visuelle Darstellung, Ladezustände, Animationen live

### Edge Cases (identifiziert + getestet)
- [x] Neuer Kunde ohne Rechnungspositionen → Nullwerte, kein Fehler (unit-getestet)
- [x] Datenbank-Fehler bei der Abfrage → `ok:false`, generische Fehlermeldung, kein Crash (unit-getestet)
- [x] Artikel ohne Rabattgruppe in der Aufschlüsselung → Fallback „Ohne Gruppe" (unit-getestet)
- [x] Rollierendes Fenster an der exakten Tagesgrenze zur Vorperiode (unit-getestet)
- [x] Umsatz eines anderen Kunden fließt nicht ein (Partner-Isolation, unit-getestet)

### Security-Audit (Red-Team)
- [x] **Authentifizierung:** `/kunden` und `/kunden/[id]` sind nicht in `PUBLIC_PATHS`
  (`middleware.ts`) — nicht angemeldete Requests werden zu `/login` umgeleitet,
  bevor eine Server Action ausgeführt wird. Der Matcher in `src/proxy.ts` greift
  pfadbasiert (nicht methodenspezifisch), deckt also auch die POST-Requests der
  neuen Server Actions ab. Kein neuer Endpoint, keine neue Angriffsfläche.
- [x] **Injection:** Der Umsatz-Tab hat kein Freitext-Suchfeld. Einzige
  Nutzereingabe ist die Zeitraum-Auswahl (`partnerId`, `period.year`) — beide
  laufen über parametrisierte PostgREST-Filter (`.eq/.gte/.lte`), keine
  String-Konkatenation in rohes SQL. Kein XSS-Vektor: Rabattgruppen-Namen kommen
  aus `tms.position_groups` (interne Stammdaten, kein User-Input) und werden von
  React/Recharts als Text gerendert, nicht als HTML.
- [x] **Fehlerbehandlung:** Alle neuen Funktionen fangen Fehler ab und geben nur
  generische Meldungen („Unerwarteter Fehler") an den Client zurück; Details
  landen ausschließlich in `console.error` (serverseitig). Kein Leak von
  DB-Fehlermeldungen oder internen Strukturen an den Browser.
- [~] **Autorisierung (informativ, kein neuer Befund):** Alle vier neuen
  Funktionen sowie der geänderte Teil von `getPartnersWithRevenue` laufen über
  `createAdminClient` (`service_role`, umgeht RLS) ohne eigene Rollenprüfung —
  identisch zum bereits akzeptierten Muster der Bestellhistorie (Abschnitt 14).
  Jede der 7 internen Rollen kann damit den Umsatz jedes Kunden sehen; das PRD
  sieht keine kundenspezifische Zugriffsbeschränkung vor, insofern kein neuer
  Befund, nur zur Vollständigkeit dokumentiert.
- **BUG-2 (Low, informativ):** `period.year`/`partnerId` werden nicht mit Zod
  validiert, bevor sie in die Server Actions einfließen (Abweichung von
  `backend.md`-Konvention) — deckungsgleich mit dem bereits bestehenden Muster
  in `orders.ts` (`groupId`, `page`, `pageSize` sind dort ebenfalls unvalidiert).
  Fehlverhalten wird durch das bestehende try/catch abgefangen (fail-closed,
  generische Fehlermeldung) — kein Crash, kein Leak. Nicht neu durch diesen
  Umbau eingeführt.

### Regressionstest
- Build/Typecheck/Vitest-Suite komplett grün (s.o.) — keine anderen Dateien
  importieren die entfernten Exporte (`getPartnerRevenue`,
  `getPartnerRevenueWithComparison`, `getPartnerYearlyRevenue`,
  `getPartnerRollingRevenue`, `getPartnerOrderStats`, `getPartnerOrderDates`);
  verifiziert per Grep + erfolgreichem Production-Build.
- Bestellhistorie-Tab (deployed, PROJ-11 Abschnitt 2.4/2.4.1) ist von diesem Diff
  nicht betroffen — keine der geänderten/gelöschten Dateien wird dort importiert.
- Kunden-Liste (`/kunden`): einzige Änderung ist die Datenquelle der
  Umsatzspalte in `getPartnersWithRevenue`; Sortier-/Paginierungs-/Suchlogik
  unverändert.

### Bugs Found

#### BUG-1: ESLint-Warnung — instabiler Ausdruck in `useEffect`-Dependency-Array
- **Severity:** Low
- **Fundort:** `src/app/(app)/kunden/[id]/components/revenue-chart.tsx:133`
  (`react-hooks/exhaustive-deps`)
- **Szenario:** `periodKey(period)` wird direkt im Dependency-Array verwendet;
  ESLint kann nicht statisch prüfen, ob der Ausdruck stabil ist. Funktional
  korrekt (liefert einen primitiven String, Vergleich funktioniert wie
  vorgesehen) — reiner Lint-Hygiene-Punkt, kein beobachtbares Fehlverhalten.
- **Fix-Vorschlag:** `const key = useMemo(() => periodKey(period), [period])`
  einmal berechnen und in allen drei `useEffect`s referenzieren.
- **Priorität:** Nice to have, nicht blockierend.

#### BUG-2: siehe Security-Audit oben (fehlende Zod-Validierung, Low, kein neuer Befund)

### Summary
- **Acceptance Criteria:** 12/14 verifiziert (unit-getestet/Code-Review), 2/14
  ungeprüft (Sandbox-Limitierung, kein Live-Browser möglich)
- **Bugs Found:** 2 total (0 Critical, 0 High, 0 Medium, 2 Low)
- **Security:** Pass — keine neuen Befunde, ein informativer Low-Punkt
- **Production Ready:** YES, mit einer Auflage (siehe unten)
- **Recommendation:** Deploy freigeben. Direkt nach dem Deploy denselben
  Live-Check wiederholen, der für die Bestellhistorie am 2026-07-18 gemacht
  wurde (echter Kunde, z.B. Bod'or KTM GmbH: Umsatz-Tab zeigt plausible,
  von Null abweichende Zahlen für „Letzte 12 Monate"/ein Kalenderjahr/„Gesamt",
  KPI-Klicks togglen die Rabattgruppen-Ansicht korrekt) — das ist die einzige
  Möglichkeit, die live-abhängigen Punkte zu schließen, da diese Sandbox keine
  Supabase-Zugangsdaten hat.

---

## Live-Verifikation (Post-Deploy) — Umsatz-Tab-Neubau (2026-07-24)

**Anlass:** QA-Auflage vom 2026-07-22 ("Production Ready: YES, mit einer
Auflage") — nach dem Deploy muss der Umsatz-Tab gegen einen echten Kunden
live geprüft werden, analog zum Bestellhistorie-Live-Check vom 2026-07-18.

### Kritischer Befund: Umsatz-Tab-Neubau war trotz Commit gar nicht live

Vor der eigentlichen Verifikation zeigte ein erster Testlauf gegen
`tms.gudel-werkzeuge.de` noch die **alte** Umsatz-Tab-UI ("Handelsware"/
"Service"-Kacheln, weiterhin vorhandene "Schärfumsatz/Auftrag"-Kachel,
12-Monate/Jahr-Umschalter statt Dropdown, durchgängig €0,00). Ursache
gefunden: Der laufende Docker-Container wurde am **2026-07-23 06:12 UTC**
gebaut — Commit `831d928` (Umsatz-Tab-Neubau) wurde aber erst um
**2026-07-23 10:34 UTC** erstellt, also 4,5 Stunden *nach* dem letzten
Container-Build. Bestätigt per Grep im laufenden Container: gebaute Assets
enthielten noch `"Schärfumsatz"` (alt), nirgends `"Handelsumsatz"` (neu).
**Der als "deployed" markierte Commit wurde also nie tatsächlich auf
Production ausgerollt** — reiner Prozess-/Deploy-Lücke, kein Bug im Code.

**Behoben:** `docker compose build` + `docker compose up -d` gegen den
aktuellen `main`-Stand (Commit `831d928`) ausgeführt. Erster Build-Versuch
schlug nach ~50 Min. mit einem transienten `Module not found:
@vercel/turbopack-next/internal/font/google/font`-Fehler beim Laden der
Google-Font "Inter" fehl (Netzwerkzugriff aus dem Docker-Build-Kontext
separat verifiziert — funktioniert, war ein einmaliger Hänger). Zweiter
Build-Versuch (~63 Min., Host ist stark speicherbegrenzt: 7,6 GB RAM, kein
Swap) lief durch. Container neu gestartet, per Grep im neuen Container
bestätigt: `"Handelsumsatz"` jetzt vorhanden, `"Schärfumsatz"` nicht mehr.
Post-Deploy-Smoke-Test (`tests/deploy/smoke.spec.ts`) grün.

### Live-Test-Setup

Neue Datei `tests/deploy/PROJ-11-umsatz-tab.spec.ts` (deploy-tauglich,
relative Pfade + `DEPLOY_BASE_URL`, siehe CLAUDE.md-Konvention für
Feature-spezifische Deploy-Tests). **Testkunde:** nicht Bod'or KTM GmbH
(dessen letzte Rechnung vom 2026-02-11 stammt, damit außerhalb des
Standard-Zeitraums "Letzte 12 Monate" liegt und dort nur Nullwerte gezeigt
hätte — kein guter Kandidat für diese Prüfung), sondern **Mann & Tellschow
Maschinen-Vertriebs-GmbH** (`partner_id = c8fa7118-8445-45d7-a05a-3ca87669d041`,
laufende Rechnungsaktivität, mehrere Kategorien/Jahre).

### Ergebnis: 8/8 Szenarien grün, Zahlen decken sich exakt mit der DB

Direkte Gegenprobe per SQL gegen `tms.invoice_items`/`tms.invoices`:

| Zeitraum | UI-Wert (Gesamtumsatz) | DB-Summe | Match |
|----------|------------------------|----------|-------|
| Letzte 12 Monate | €28.794,36 | 2.879.436 Cent | ✅ |
| Kalenderjahr 2024 | €30.426,68 | 3.042.668 Cent | ✅ |
| Gesamt | €2.688.522,32 | 268.852.232 Cent | ✅ |

Auch Handels-/Service-Aufschlüsselung und "Nicht zugeordnet" (bei "Gesamt")
stimmten mit der DB überein. Kein Vergleichs-Badge bei "Gesamt" (korrekt),
Vergleichs-Badges bei "Letzte 12 Monate"/Kalenderjahr vorhanden.

**Ein falscher Erstbefund, aufgeklärt:** Der erste Testlauf nach dem Redeploy
zeigte 6/8 Fehlschläge, u.a. dass die KPI-Kacheln nach Auswahl von "Gesamt"
scheinbar bei den "Letzte 12 Monate"-Werten samt Vergleichs-Badge stehen
blieben. Ein isoliertes manuelles Nachstellen (eigenes Skript, längere
Wartezeit statt `networkidle` + 5s-Assertion) zeigte: **die Anwendung
aktualisiert korrekt** — der erste Fehlschlag war reines Timing auf diesem
stark speicherbegrenzten Host (Rendering brauchte länger als das
Test-Timeout), kein Anwendungsfehler. Zusätzlich enthielt der Testfall zum
Handelsumsatz-Toggle einen echten Testfehler (mehrdeutiger `getByText`-Locator
traf sowohl die KPI-Kachel als auch die Chart-Überschrift "Handelsumsatz nach
Rabattgruppe") — behoben durch `{ exact: true }`. Nach beiden Fixes (Locator
+ großzügigeres Timeout für die Gesamt-Badge-Prüfung) liefen alle 8 Szenarien
mit `--workers=1` grün durch.

### Akzeptanzkriterien-Status (Abschnitt 4, „Umsatz") — Update

Die beiden zuvor als "UNGEPRÜFT (Sandbox)" markierten Punkte sind jetzt
live verifiziert:
- [x] Responsives Verhalten des Diagramms — Chromium + Mobile-Viewport
  über Live-Test bestätigt (Layout ohne Overflow/Fehler)
- [x] Visuelle Darstellung, Ladezustände, Animationen — live gegen
  Production bestätigt, keine Console-Fehler beim Laden des Tabs

**Damit sind alle 14/14 Akzeptanzkriterien aus Abschnitt 4 „Umsatz"
verifiziert.** Auch BUG-3-Analogon aus dem Bestellhistorie-Bericht (weniger
Zeilen als erwartet durch Produkt-Match-Filter) ist für den Umsatz-Tab nicht
relevant, da „Gesamtumsatz" bewusst ALLE Positionen zählt (siehe Decision Log).

### Verbleibend (informativ, kein Blocker)

- Der neue Test `tests/deploy/PROJ-11-umsatz-tab.spec.ts` bleibt dauerhaft
  im Repo (CLAUDE.md-Konvention) und läuft künftig bei jedem `/deploy`
  automatisch mit.
- Auffällige Dateninhalte beim Testkunden (Rechnungspositionen aus 2021/2022
  mit stark überdurchschnittlichen Summen sowie 10 Positionen mit Datum
  1970-01-01) sind reale Datenqualitäts-Fragen der easybill-Synchronisation,
  keine PROJ-11-Bugs — ggf. eigenes Ticket wert, nicht Teil dieser Prüfung.

---

## Refine — Umsatz-Tab Mobile-Fixes + Donut/Radar-Charts (2026-07-24)

**Anlass:** User meldete per Screenshots drei Mobile-Probleme im Umsatz-Tab:
KPI-Kacheln-Titel abgeschnitten ("Gesamtum...", "Handelsu..." etc.), lange
nicht-einklappbare Rabattgruppen-Legende, und den Wunsch nach anderen
Chart-Typen (Donut, Radar/Netz) für die Rabattgruppen-Aufschlüsselung,
belegt durch zwei Design-Referenz-Screenshots (ChartJS-Dashboard-Tutorial:
Donut + Radar; Dribbble "MingCute": sauberer Kartenstil mit kompakter
horizontaler Legende).

**Umgesetzt:**
- **KPI-Titel-Fix:** `KpiCard` (`revenue-chart.tsx`) hat jetzt eine
  `shortTitle`-Prop ("Gesamt"/"Handel"/"Service"/"Unzugeordnet"), die per
  `sm:hidden`/`hidden sm:inline` auf Mobile statt des vollen, sonst
  abgeschnittenen Titels angezeigt wird. `truncate` durch `leading-tight`
  ersetzt, Grid-Padding responsive (`p-3 sm:p-4`, `gap-2 sm:gap-3`).
- **Neue Komponente `revenue-group-legend-table.tsx`:** einklappbare
  Rabattgruppen-Legende (shadcn/ui `Collapsible`) — ausgeklappt eine
  kompakte Tabelle (Farbe/Name + Wert je Zeile, Summenzeile), Touch-Ziele
  ≥48px. Ersetzt die vorherige lange Recharts-Standard-`<Legend>`.
- **Neue Komponente `revenue-group-donut-chart.tsx`:** ersetzt den
  bisherigen gestapelten Balken-Drilldown bei Klick auf Handelsumsatz/
  Serviceumsatz-KPI durch ein Donut-Chart (Recharts `PieChart`, gleiches
  Muster wie das bestehende Donut-Chart der Bestellhistorie in
  `order-group-chart.tsx`), kombiniert mit der neuen Legend-Table.
- **Neue Komponente `revenue-group-radar-chart.tsx`:** zusätzliches
  Radar-/Netz-Chart "Rabattgruppen-Vergleich" (eine Achse je Rabattgruppe,
  Serien Handel/Service), über einen neuen Toggle-Button
  ("Rabattgruppen vergleichen") sichtbar — lädt beide Kategorien parallel
  (`getPartnerRevenueGroupChartData` für `"handel"` und `"service"`,
  keine Backend-Änderung nötig).
- **Refactoring:** `CHART_GROUP_COLORS` aus `orders-helpers.ts` exportiert
  und in `revenue-chart.tsx` sowie `order-group-chart.tsx` wiederverwendet
  statt der bisherigen Duplizierung der Farbkonstante.
- Die bestehende "Umsatzentwicklung"-Monatsansicht (gestapeltes
  Balkendiagramm) bleibt unverändert.

**Verifikation in dieser Sandbox:** `npx tsc --noEmit` ✅ (nach Löschen
eines veralteten `.next`-Cache-Eintrags, der einen entfernten
`api/cron/sync-manufacturers`-Endpunkt referenzierte — unabhängig von
diesem Refine), `npm run build` ✅, `npm run lint` ✅ (0 neue Fehler; die
876 gemeldeten Probleme stammen ausschließlich aus einem fremden
Worktree-Verzeichnis `.claude/worktrees/bridge-cse_.../`, das gebaute
`.next`-Artefakte enthält — nicht Teil dieses Refines. Einzige Meldung in
`revenue-chart.tsx` ist die bereits bekannte, nicht-blockierende
`react-hooks/exhaustive-deps`-Warnung, siehe BUG-1 im QA-Bericht vom
2026-07-22).

**Kein Live-Browser-Test in dieser Sandbox möglich** (kein Supabase-Zugriff
für den lokalen Dev-Server) — daher direkt per `/deploy` gegen Production
verifiziert (User-Entscheidung, da bereits vorher ein Produktions-Deploy
in dieser Session stattgefunden hatte).

### Deploy (2026-07-24) — Befunde und Fixes

**Vorab-Fix nötig:** `./scripts/deploy.sh PROJ-11` schlug beim ersten
Anlauf schon beim Lint-Precheck fehl — `eslint.config.js` ignorierte
`.next/**` nur auf oberster Ebene, nicht rekursiv, wodurch gebaute
Artefakte in fremden Git-Worktrees (`.claude/worktrees/bridge-cse_.../`,
Überbleibsel abgeschlossener Sessions) mitgelintet wurden (826 Fehler).
Behoben: `ignores` auf `**/.next/**`, `**/node_modules/**` und zusätzlich
`.claude/worktrees/**` erweitert. Nicht durch dieses Refine verursacht,
aber blockierend für den Deploy — daher mitbehoben.

**Deploy lief danach durch** (Lint ✅, Build ✅, Image gebaut, Container
gestartet), die automatische Post-Deploy-Playwright-Verifikation
(`tests/deploy/`) schlug zunächst nur an einer fehlenden/beschädigten
Webkit-Installation dieser Sandbox (Mobile Safari), nicht an der App selbst.

**Zwei echte, durch die Mobile-Titel-Änderung verursachte Testfehler
gefunden und behoben** (kein App-Bug, sondern Nachjustierung der
E2E-Tests auf das neue responsive Verhalten):
- Kurz-/Langform der KPI-Titel (`sm:hidden`/`hidden sm:inline`) existieren
  beide gleichzeitig im DOM — auf Mobile ist die Langform (`Gesamtumsatz`
  etc.) unsichtbar, wodurch `getByText('Gesamtumsatz').toBeVisible()` und
  `getByText('Handelsumsatz').click()` auf schmalen Viewports fehlschlugen.
  **Fix:** `data-testid` (`kpi-total`/`kpi-handel`/`kpi-service`/
  `kpi-unassigned`) auf die `KpiCard`-Wurzel ergänzt, Tests (in
  `tests/deploy/PROJ-11-umsatz-tab.spec.ts` UND `tests/PROJ-11-umsatz-tab.spec.ts`)
  auf `getByTestId(...)` umgestellt — robust unabhängig vom Breakpoint.
- Tab-Label „Umsatz" wird auf schmalen Viewports zu „Ums." abgekürzt
  (bestehendes Verhalten des globalen Headers, PROJ-18, nicht Teil dieses
  Refines) — Tab-Locator in beiden Testdateien von `/Umsatz/i` auf `/Ums/i`
  angepasst.

**Finales Ergebnis:** Nach den Fixes alle 8 Feature-Szenarien + 3
Smoke-Tests auf **Chromium UND Mobile Safari** grün gegen
`tms.gudel-werkzeuge.de` (Testkunde Mann & Tellschow Maschinen-Vertriebs-GmbH).
`./scripts/deploy.sh PROJ-11` (nur Verifikationsschritt, `SKIP_DEPLOY=1`)
meldet „Deployed ✅ (verifiziert nach 1 Anlauf)".

---

*Diese Spec folgt dem Workflow aus MEMORY.md: /init → /write-spec → User-Review → /architecture → /frontend → /backend → /qa → /deploy*
