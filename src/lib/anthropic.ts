import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { NORA_COMPANY_CONTEXT } from './nora-context'
import { DIGITAL_PRODUCT_RESEARCH } from './digital-product-research'
import { type ElaboratedSection } from './notion'
import { type LiveContext } from './live-context'

// NORA nutzt Opus 4.8 — höchste strategische Qualität, 1 Lauf/Tag.
const MODEL = 'claude-opus-4-8'
const MAX_RETRIES = 3
const MIN_SUGGESTIONS = 3
const MAX_SUGGESTIONS = 5

export const CATEGORIES = ['marketing', 'product', 'operations', 'design'] as const
export type Category = (typeof CATEGORIES)[number]

// PROJ-9: separate 4. Kategorie, NICHT Teil der Haupt-Generierung (eigener Call).
export const DIGITAL_PRODUCT_CATEGORY = 'digital_product' as const

export type GeneratedSuggestion = {
  category: Category | typeof DIGITAL_PRODUCT_CATEGORY
  title: string
  body: string
  insight: string
  source: string
}

const SuggestionSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string(),
  body: z.string(),
  insight: z.string(),
  source: z.string(),
})

const ResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema),
})

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Fehlende Umgebungsvariable: ANTHROPIC_API_KEY')
  }
  return new Anthropic({ apiKey })
}

function buildPrompt(liveContext: LiveContext): string {
  const { supabaseHistory, notionBizDevEntries, livingSpecContent } = liveContext

  const implemented = supabaseHistory.filter(e => e.status === 'implemented')
  const approved = supabaseHistory.filter(e => e.status === 'approved')
  const rejected = supabaseHistory.filter(e => e.status === 'rejected')

  const livingSpecSection = livingSpecContent
    ? `## QualiPilot — Aktueller Stand (Living Spec)\n${livingSpecContent}`
    : ''

  const implementedSection = implemented.length > 0
    ? `## Bereits umgesetzt (letzte 30 Tage) — Nächste Schritte darauf aufbauen:\n${implemented.map(e => `- ${e.title} (${e.category})`).join('\n')}`
    : ''

  const approvedLines = [
    ...notionBizDevEntries.map(e => `- ${e.title} (${e.category}${e.date ? ', ' + e.date : ''})`),
    ...approved.map(e => `- ${e.title} (${e.category})`),
  ]
  const approvedSection = approvedLines.length > 0
    ? `## Bereits bestätigt (letzte 30 Tage) — Folge-Schritte darauf aufbauen:\n${approvedLines.join('\n')}`
    : ''

  const rejectedSection = rejected.length > 0
    ? `## Abgelehnt (letzte 30 Tage) — Diese Richtungen NICHT wiederholen:\n${rejected.map(e => `- ${e.title} (${e.category})`).join('\n')}`
    : ''

  const allTitles = supabaseHistory.map(e => e.title)
  const allTitlesSection = allTitles.length > 0 && !approvedSection && !rejectedSection && !implementedSection
    ? `## Bereits vorgeschlagen (letzte 30 Tage) — NICHT wiederholen:\n${allTitles.map(t => `- ${t}`).join('\n')}`
    : ''

  const contextSections = [livingSpecSection, implementedSection, approvedSection, rejectedSection, allTitlesSection]
    .filter(Boolean)
    .join('\n\n')

  const contextBlock = contextSections || '## Historie\nNoch keine früheren Vorschläge vorhanden — dies ist der erste Lauf.'

  return `${NORA_COMPANY_CONTEXT}

${contextBlock}

## Deine Aufgabe
Du bist NORA, der tägliche BizDev-Assistent von Kordix AI. Generiere ${MIN_SUGGESTIONS}–${MAX_SUGGESTIONS} konkrete, sofort umsetzbare Verbesserungsvorschläge für Stefan.

Verteile sie flexibel auf die vier Kategorien (marketing, product, operations, design) — wähle die heute relevantesten Bereiche, keine feste Quote (an manchen Tagen passt z. B. kein Design-Vorschlag — das ist völlig in Ordnung). Jeder Vorschlag muss für einen Solo-Gründer in begrenzter Zeit realistisch allein umsetzbar sein.

Für jeden Vorschlag:
- **category**: einer von "marketing", "product", "operations", "design"
- **title**: knackige, konkrete Überschrift (z. B. "LinkedIn-Post: QualiPilot spart 80% Validierungszeit")
- **body**: der konkrete Vorschlag + erste Umsetzungsschritte (2–4 Sätze)
- **insight**: das WARUM — die Begründung/Logik dahinter (1–2 Sätze)
- **source**: NORAs Denkgrundlage (z. B. "Abgeleitet aus Kordix-Positionierung + GMP-Zielgruppe")

**Kategorie "design" (Design & Brand):** Maßnahmen zur visuellen Identität und Markenkonsistenz von Kordix AI — Logo-Einsatz, Farb- und Typografie-Konsistenz, Wiedererkennbarkeit über Touchpoints (Website, LinkedIn-Grafiken, Pitch-Deck, Doku-Templates). Beziehe dich konkret auf den Kordix AI Brand Guide (Sora-Font, Dark-Premium-Stil, Primärfarbe Electric Blue #0078FF, Signature-Gradient Cyan→Violet #38E5FF→#A720FF auf Navy #070B1E) statt generischer Design-Tipps. Keine Bild-/Grafikgenerierung — nur textuelle Maßnahmen-Entwürfe.

Vermeide generisches Marketing-Geschwätz. Sei fachlich, GMP-/Pharma-kompetent und spezifisch für Kordix AI.`
}

const CATEGORY_PROMPTS: Record<string, string> = {
  marketing: `Schreibe einen fertigen LinkedIn-Post oder Blogpost-Entwurf (~200–250 Wörter) auf Basis dieses Marketing-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "LinkedIn-Post-Entwurf" — Der komplett fertig formulierte Post: Hook, Hauptaussage mit konkretem Bezug auf QualiPilot/Kordix AI, Call-to-Action.
2. "Hintergrund & Strategie" — Warum dieser Post jetzt? Für wen genau? Welchen Mehrwert bringt er für Stefans Zielgruppe?
3. "Nächste Aktion" — Konkrete erste Schritte für Stefan (z. B. Hashtags, bester Veröffentlichungszeitpunkt).`,

  product: `Schreibe ein strukturiertes Feature-/Spec-Konzept (~400–500 Wörter) auf Basis dieses Produkt-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "Problem" — Was ist das konkrete Problem aus Nutzersicht (GMP-Qualifizierer, QA-Lead)?
2. "Lösung" — Wie löst dieses Feature das Problem? Was macht QualiPilot damit besser?
3. "Umsetzungsschritte" — Konkrete technische oder organisatorische Schritte.
4. "Erfolgskriterium" — Woran erkennt Stefan, dass das Feature den gewünschten Effekt hat?`,

  operations: `Schreibe eine Schritt-für-Schritt-Prozessbeschreibung oder Checkliste (~300–400 Wörter) auf Basis dieses Operations-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "Kontext & Ziel" — Warum dieser Prozess? Was soll er für Stefan als Solo-Gründer erreichen?
2. "Schritte" — Nummerierte Schritt-für-Schritt-Anleitung zum direkten Umsetzen.
3. "Hinweise & Stolpersteine" — Was zu beachten ist; typische Fehler und wie man sie vermeidet.`,

  design: `Schreibe ein markenkonformes Design-/Brand-Konzept (~300–400 Wörter) auf Basis dieses Design-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "Ausgangslage" — Aktueller visueller/markenbezogener Stand und das konkrete Problem (Inkonsistenz, fehlende Wiedererkennbarkeit o. Ä.).
2. "Markenkonforme Lösung" — Wie die Maßnahme aussieht, mit konkretem Bezug auf den Kordix AI Brand Guide (Sora-Font, Dark-Premium-Stil, Electric Blue #0078FF, Signature-Gradient Cyan→Violet #38E5FF→#A720FF, Navy #070B1E).
3. "Umsetzungsschritte" — Konkrete, allein umsetzbare Schritte (Tools, Vorlagen, Reihenfolge).
4. "Erfolgskriterium" — Woran Stefan erkennt, dass die Marke konsistenter und wiedererkennbarer wirkt.`,
}

const DEFAULT_ELABORATION_PROMPT = `Schreibe ein strategisches Umsetzungs-Dokument (~300 Wörter) auf Basis dieses BizDev-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "Kontext" — Hintergrund und Relevanz des Vorschlags für Kordix AI.
2. "Ziel" — Was konkret erreicht werden soll.
3. "Maßnahmen" — Konkrete Umsetzungsschritte.
4. "Nächste Aktion" — Der erste konkrete Schritt für Stefan.`

const ElaborationSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
    })
  ).min(1),
})

function buildElaborationPrompt(params: {
  title: string
  body: string
  insight: string | null
  source: string | null
  category: string
}): string {
  const categoryInstruction = CATEGORY_PROMPTS[params.category] ?? DEFAULT_ELABORATION_PROMPT
  const insightLine = params.insight ? `\n**Insight:** ${params.insight}` : ''
  const sourceLine = params.source ? `\n**Quelle/Kontext:** ${params.source}` : ''

  return `${NORA_COMPANY_CONTEXT}

## Zu bearbeitender Vorschlag

**Titel:** ${params.title}

**Vorschlag:** ${params.body}${insightLine}${sourceLine}

## Deine Aufgabe

${categoryInstruction}

Schreibe in der Markenstimme von Kordix AI: premium, fachlich fundiert, GMP-/Pharma-kompetent. Kein generisches Marketing-Geschwätz — konkret und auf Augenhöhe mit Fachentscheidern.
Sprache: Deutsch.`
}

export async function elaborateDocument(params: {
  title: string
  body: string
  insight: string | null
  source: string | null
  category: string
}): Promise<{ sections: ElaboratedSection[] }> {
  const client = getClient()
  const prompt = buildElaborationPrompt(params)

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.parse({
        model: MODEL,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(ElaborationSchema),
        },
        messages: [{ role: 'user', content: prompt }],
      })

      const parsed = response.parsed_output
      if (!parsed || parsed.sections.length === 0) {
        throw new Error('Claude lieferte kein verwertbares Dokument.')
      }

      return { sections: parsed.sections }
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  throw new Error(
    `Ausarbeitung nach ${MAX_RETRIES} Versuchen fehlgeschlagen: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  )
}

/**
 * Ruft Claude auf und liefert 3–5 Vorschläge. Versucht bei Fehlern bis zu
 * MAX_RETRIES Mal mit kurzer, wachsender Pause. Wirft, wenn alle Versuche scheitern.
 */
export async function generateSuggestions(
  liveContext: LiveContext
): Promise<GeneratedSuggestion[]> {
  const client = getClient()
  const prompt = buildPrompt(liveContext)

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(ResponseSchema),
        },
        messages: [{ role: 'user', content: prompt }],
      })

      const parsed = response.parsed_output
      if (!parsed || parsed.suggestions.length === 0) {
        throw new Error('Claude lieferte keine verwertbaren Vorschläge.')
      }

      // Auf den gültigen Bereich begrenzen (Schema kann Anzahl nicht erzwingen).
      return parsed.suggestions.slice(0, MAX_SUGGESTIONS)
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  throw new Error(
    `Generierung nach ${MAX_RETRIES} Versuchen fehlgeschlagen: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  )
}

// ─── PROJ-9: Produkt-Chance (Digital Product Research) ──────────────────────

// Strukturierte Felder, die Claude liefert. Aus diesen wird deterministisch
// title/body/insight/source einer normalen Suggestion zusammengesetzt — so sind
// die geforderten Detailfelder (AC) garantiert sichtbar.
const ProductOpportunitySchema = z.object({
  title: z.string(),
  format: z.string(),
  price_range: z.string(),
  promise: z.string(),
  target_customer: z.string(),
  problem: z.string(),
  platforms: z.string(),
  demand_evidence: z.string(),
  proven_format: z.string(),
})

function buildProductOpportunityPrompt(liveContext: LiveContext): string {
  // Dedup: bereits vorgeschlagene Produkt-Chancen (egal welcher Status) nicht wiederholen.
  const priorOpportunities = liveContext.supabaseHistory
    .filter(e => e.category === DIGITAL_PRODUCT_CATEGORY)
    .map(e => `- ${e.title} (${e.status})`)

  const dedupSection = priorOpportunities.length > 0
    ? `## Bereits vorgeschlagene Produkt-Chancen — NICHT wiederholen (auch keine sehr ähnliche Idee):\n${priorOpportunities.join('\n')}`
    : '## Bereits vorgeschlagene Produkt-Chancen\nNoch keine — dies ist die erste Produkt-Chance.'

  return `${DIGITAL_PRODUCT_RESEARCH}

${dedupSection}

## Deine Aufgabe
Du bist NORA. Leite aus der obigen Research-Sheet GENAU EINE konkrete, sofort angehbare
**Produkt-Chance** für ein digitales Produkt ab, das Stefan als zusätzliche Einnahmequelle
aufbauen könnte. Die Idee muss nachfrage-validiert sein: Sie MUSS auf mindestens einem der
oben gelisteten, bereits verkauften Formate aufbauen — nenne dieses Format als Beleg.

Die Produkt-Chance ist nischenoffen (jedes bewährte Format ist erlaubt) und muss für einen
Solo-Gründer realistisch allein erstellbar sein. Wiederhole keine bereits vorgeschlagene Idee.

Liefere diese Felder:
- **title**: prägnanter Produktname (z. B. „Notion-Template: Freelancer-Finanz-OS")
- **format**: das konkrete Produktformat (z. B. „Notion-Template", „Printable Planner-Bundle")
- **price_range**: realistischer Preisrahmen (z. B. „19–39 $"), abgeleitet aus dem Beleg-Format
- **promise**: das zentrale Versprechen / die Transformation (ein Satz)
- **target_customer**: die konkrete Zielgruppe
- **problem**: das gelöste Problem aus Kundensicht (ein bis zwei Sätze)
- **platforms**: Verkaufsplattformen, auf denen das Format nachweislich läuft
- **demand_evidence**: WARUM es Nachfrage gibt — der konkrete Beleg aus der Sheet (Suchvolumen, GMV, Verkäufer-Einnahmen etc.)
- **proven_format**: das belegende, bereits verkaufte Format aus der Research-Sheet (Name + kurze Begründung)

Sprache: Deutsch. Sei konkret und spezifisch — kein generisches Geschwätz.`
}

/**
 * PROJ-9: erzeugt GENAU EINE nachfrage-validierte Produkt-Chance, gegroundet in der
 * Research-Sheet. Best-effort: fehlt die Sheet oder scheitert Claude, wird `null`
 * zurückgegeben (kein Wurf) — der tägliche Hauptlauf darf dadurch NIE blockiert werden.
 */
export async function generateProductOpportunity(
  liveContext: LiveContext
): Promise<GeneratedSuggestion | null> {
  // Best-effort: ohne Wissensbasis keine Produkt-Chance.
  if (!DIGITAL_PRODUCT_RESEARCH.trim()) return null

  let client: Anthropic
  try {
    client = getClient()
  } catch {
    return null
  }

  const prompt = buildProductOpportunityPrompt(liveContext)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.parse({
        model: MODEL,
        max_tokens: 4000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(ProductOpportunitySchema),
        },
        messages: [{ role: 'user', content: prompt }],
      })

      const p = response.parsed_output
      if (!p || !p.title) {
        throw new Error('Claude lieferte keine verwertbare Produkt-Chance.')
      }

      // Klartext-Labels (kein Markdown): die Dashboard-Card rendert den body als
      // reinen Text mit whitespace-pre-line — Zeilenumbrüche bleiben, ** würde
      // literal erscheinen.
      const body = [
        `Format: ${p.format}`,
        `Preisrahmen: ${p.price_range}`,
        `Versprechen: ${p.promise}`,
        `Zielgruppe: ${p.target_customer}`,
        `Gelöstes Problem: ${p.problem}`,
        `Verkaufsplattformen: ${p.platforms}`,
      ].join('\n')

      return {
        category: DIGITAL_PRODUCT_CATEGORY,
        title: p.title,
        body,
        insight: p.demand_evidence,
        source: `Belegt durch: ${p.proven_format}`,
      }
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  // Alle Versuche gescheitert → best-effort: still überspringen.
  return null
}
