# PROJ-3: Preisberechnung mit konfigurierbarer Formel

**Status:** In Progress
**Created:** 2026-05-10

## User Story
Als Admin moechte ich pro Druckverfahren (FDM, SLS, DLP) eine eigene Preisformel mit eigenen Parametern konfigurieren koennen, damit die Kalkulation die unterschiedlichen Kostenstrukturen abbildet.

## Acceptance Criteria
- Pro Verfahren wird eine `FormulaConfig` gespeichert mit Parametern:
  - `materialMarkup` (Faktor auf Materialkosten)
  - `machineHourRate` (EUR/h)
  - `printSpeed` (cm^3/h, fuer Druckzeitschaetzung)
  - `setupFee` (EUR pro Auftrag)
  - `boundingBoxFactor` (EUR/cm^3 Bauraum-Block, optional)
  - `postProcessingFee` (EUR pro Teil)
  - `marginPercent` (Marge in %)
  - `minPrice` (Mindestpreis pro Teil)
- Verfahrensspezifisch:
  - **FDM:** linear ueber Volumen + Druckzeit.
  - **SLS:** Bauraum-Auslastung beruecksichtigt (Bounding-Box-Block).
  - **DLP:** Hoehen-getriebene Druckzeit (z-Achse dominant).
- Mengenstaffel als Liste `{minQty, discountPercent}` pro Verfahren.
- Berechnung gibt **Breakdown** zurueck (Materialkosten, Maschinenzeitkosten, Setup, Postprocessing, Marge, Rabatt, Mindestpreis-Anwendung).

## Out of Scope
- Versandkosten, Steuern (kommen optional spaeter im PDF dazu)
- Echte Slicer-Anbindung

## Implementation Notes
- Pure Function `calculatePrice(part, material, formula, qty, tiers) -> PriceBreakdown`.
- 100% deterministisch, voll testbar.
