import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { NORA_COMPANY_CONTEXT } from './nora-context'

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

function buildPrompt(recentTitles: string[]): string {
  const historySection =
    recentTitles.length > 0
      ? `## Bereits vorgeschlagen (letzte 30 Tage) — NICHT wiederholen, darauf aufbauen oder Neues vorschlagen:\n${recentTitles.map(t => `- ${t}`).join('\n')}`
      : '## Historie\nNoch keine früheren Vorschläge vorhanden — dies ist der erste Lauf.'

  return `${NORA_COMPANY_CONTEXT}

${historySection}

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

/**
 * Ruft Claude auf und liefert 3–5 Vorschläge. Versucht bei Fehlern bis zu
 * MAX_RETRIES Mal mit kurzer, wachsender Pause. Wirft, wenn alle Versuche scheitern.
 */
export async function generateSuggestions(
  recentTitles: string[]
): Promise<GeneratedSuggestion[]> {
  const client = getClient()
  const prompt = buildPrompt(recentTitles)

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
