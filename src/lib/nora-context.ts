/**
 * NORA — Firmen-Briefing über Kordix AI (Wissensbasis der Suggestion Engine, PROJ-2)
 *
 * Dieser Kontext wird Claude bei jedem Generierungs-Lauf mitgegeben. Er ersetzt
 * (für das MVP) externe Live-Datenquellen. Stefan kann diesen Text jederzeit
 * verfeinern — je präziser das Briefing, desto relevanter die Vorschläge.
 *
 * Quelle des Erstentwurfs: docs/PRD.md + docs/design-system.md (2026-06-07).
 */
export const NORA_COMPANY_CONTEXT = `
# Unternehmen: Kordix AI

**Tagline:** Intelligence. Compliance. Impact.
**Positionierung:** KI-gestützte Lösungen für Excellence in Pharma & Healthcare.

## Gründer
Stefan Billich — Solo-Gründer, GMP Qualification Specialist. Baut KI-Lösungen für
Pharma & Healthcare. Entwickelt allein; Zeit ist die knappste Ressource. Business
Development wird leicht zugunsten von Produktarbeit vernachlässigt — genau hier
soll NORA gegensteuern.

## Erstes Produkt: QualiPilot
QualiPilot ist Produkt #1 von Kordix AI ("QualiPilot — a Kordix AI product").
Es richtet sich an die GMP-Qualifizierung/Validierung im pharmazeutischen Umfeld
und zielt darauf ab, zeitaufwändige, regulierte Qualifizierungsprozesse durch KI
drastisch zu beschleunigen (z. B. Validierungsdokumentation, Compliance-Nachweise).

## Zielgruppe
- B2B: Pharma- und Healthcare-Unternehmen mit GMP-Anforderungen
- Entscheider: QA/QC-Leitung, Validierungs-/Qualifizierungs-Verantwortliche,
  Head of Quality, Compliance-Manager
- Schmerzpunkte der Zielgruppe: hoher manueller Dokumentationsaufwand, regulatorischer
  Druck (GMP, GxP, Annex 1, CSV/Computer System Validation), Fachkräftemangel,
  lange Validierungszyklen

## Markenwerte
Intelligent, Vertrauenswürdig (höchste Qualität & GMP-Konformität), Innovativ,
Vernetzt, Zukunftsorientiert, Impact (Mehrwert für Gesundheit & Gesellschaft).

## Visuelle Identität & Brand Guide (Dark Premium)
Kordix AI tritt visuell als seriöse, hochwertige B2B-Marke auf — Grundlage für
Vorschläge der Kategorie "design" (Design & Brand):
- Typografie: Sora (Google Fonts, modern-geometrisch) als UI-Font; Headlines
  uppercase mit weitem Zeichenabstand; Fallback Segoe UI → Arial.
- Wortmarke: „KORDIX" (weiß) + „AI" (Cyan/Blau-Akzent); Bildmarke: Hexagon-Netzwerk
  mit 3D-Kristall im Blau-Violett-Verlauf.
- Palette: Electric Blue #0078FF (Primär — Buttons/Links), Aqua/Cyan #38E5FF
  (helle Akzente), Indigo/Periwinkle #7B81FF (sekundär), Violet/Magenta #A720FF
  (Akzent/Verlauf-Endpunkt), Deep Teal #0E9594 (sekundärer Akzent). Hintergründe:
  Navy #070B1E, Surface #0E1430; Text #FFFFFF.
- Signature-Look: „Dark Premium" — Signature-Gradient Cyan→Violet
  (#38E5FF → #0078FF → #7B81FF → #A720FF) auf tiefem Navy.
- Co-Branding: „QualiPilot — a Kordix AI product".
- Vibe: premium, klar, vertrauenswürdig — passend zur seriösen Pharma-/GMP-Tonalität.
  Vollständige Specs: docs/design-system.md. Keine generischen Design-Tipps —
  immer auf diesen Brand Guide beziehen.

## Aktuelle Geschäftsziele (BizDev-Fokus)
1. Sichtbarkeit & Thought Leadership im Pharma/GMP-Umfeld aufbauen (v. a. LinkedIn)
2. QualiPilot von der Idee zum verkaufsfähigen ersten Produkt bringen
3. Erste Pilotkunden / Design-Partner aus der Pharma-Branche gewinnen
4. Operative Effizienz als Solo-Gründer steigern (Prozesse, Automatisierung)

## Tonalität & Stil
Premium, fachlich fundiert, vertrauenswürdig. Kein generisches Marketing-Geschwätz —
konkret, GMP-/Pharma-kompetent, auf Augenhöhe mit Fachentscheidern.

## Rahmenbedingungen
- Solo-Gründer mit begrenzter Zeit: Vorschläge müssen in < 2 Minuten bewertbar und
  realistisch allein umsetzbar sein.
- Kein bezahltes Marketing-Budget im MVP — Fokus auf organische, eigenleistbare Maßnahmen.
- Kein Auto-Posting: Vorschläge bleiben Entwürfe, die Stefan prüft.
`.trim()
