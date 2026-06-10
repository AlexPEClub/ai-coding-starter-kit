import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { NORA_COMPANY_CONTEXT } from './nora-context'
import { type ElaboratedSection } from './notion'
import { type LiveContext } from './live-context'

// NORA nutzt Opus 4.8 — höchste strategische Qualität, 1 Lauf/Tag.
const MODEL = 'claude-opus-4-8'
const MAX_RETRIES = 3
const MIN_SUGGESTIONS = 3
const MAX_SUGGESTIONS = 5

export const CATEGORIES = ['marketing', 'product', 'operations'] as const
export type Category = (typeof CATEGORIES)[number]

export type GeneratedSuggestion = {
  category: Category
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
Du bist NORA, der tägliche BizDev-Assistent von Nexora AI. Generiere ${MIN_SUGGESTIONS}–${MAX_SUGGESTIONS} konkrete, sofort umsetzbare Verbesserungsvorschläge für Stefan.

Verteile sie flexibel auf die drei Kategorien (marketing, product, operations) — wähle die heute relevantesten Bereiche, keine feste Quote. Jeder Vorschlag muss für einen Solo-Gründer in begrenzter Zeit realistisch allein umsetzbar sein.

Für jeden Vorschlag:
- **category**: einer von "marketing", "product", "operations"
- **title**: knackige, konkrete Überschrift (z. B. "LinkedIn-Post: QualiPilot spart 80% Validierungszeit")
- **body**: der konkrete Vorschlag + erste Umsetzungsschritte (2–4 Sätze)
- **insight**: das WARUM — die Begründung/Logik dahinter (1–2 Sätze)
- **source**: NORAs Denkgrundlage (z. B. "Abgeleitet aus Nexora-Positionierung + GMP-Zielgruppe")

Vermeide generisches Marketing-Geschwätz. Sei fachlich, GMP-/Pharma-kompetent und spezifisch für Nexora AI.`
}

const CATEGORY_PROMPTS: Record<string, string> = {
  marketing: `Schreibe einen fertigen LinkedIn-Post oder Blogpost-Entwurf (~200–250 Wörter) auf Basis dieses Marketing-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "LinkedIn-Post-Entwurf" — Der komplett fertig formulierte Post: Hook, Hauptaussage mit konkretem Bezug auf QualiPilot/Nexora AI, Call-to-Action.
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
}

const DEFAULT_ELABORATION_PROMPT = `Schreibe ein strategisches Umsetzungs-Dokument (~300 Wörter) auf Basis dieses BizDev-Vorschlags.

Gliedere das Dokument in folgende Abschnitte:
1. "Kontext" — Hintergrund und Relevanz des Vorschlags für Nexora AI.
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

Schreibe in der Markenstimme von Nexora AI: premium, fachlich fundiert, GMP-/Pharma-kompetent. Kein generisches Marketing-Geschwätz — konkret und auf Augenhöhe mit Fachentscheidern.
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
