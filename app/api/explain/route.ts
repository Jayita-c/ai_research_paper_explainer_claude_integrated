import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'claude-opus-4-8'

type Persona = {
  label: string
  audience: string
}

// Keys here must match the `persona` values sent by the client.
const PERSONAS: Record<string, Persona> = {
  researcher: {
    label: 'Researcher',
    audience:
      'a peer researcher in the field. Assume domain expertise. Focus on the novelty and significance of the contribution, how the methodology compares to prior work, the strength and rigor of the evidence, threats to validity, and reproducibility. Do not over-explain basics; engage critically.',
  },
  'product-manager': {
    label: 'Product Manager',
    audience:
      'a product manager with a technical-but-not-academic background. Focus on what real-world problem this solves, what could be built with it, who would benefit, feasibility and maturity, and the practical tradeoffs. Skip the heavy math; translate findings into product implications.',
  },
  executive: {
    label: 'Executive',
    audience:
      'a busy executive (e.g. a CTO). Lead with the bottom line. Focus on strategic implications, business value, risk, and the time horizon to impact. Be concise and avoid jargon entirely. A few short paragraphs at most.',
  },
  student: {
    label: 'Student',
    audience:
      'a student new to the topic. Explain concepts from first principles, define any jargon when it first appears, use concrete analogies, and build intuition step by step. Be encouraging and clear.',
  },
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'The server is not configured. Set ANTHROPIC_API_KEY.' },
      { status: 500 },
    )
  }

  const {
    paperContext,
    persona,
  }: { paperContext?: string; persona?: string } = await req.json()

  const selected = persona ? PERSONAS[persona] : undefined
  if (!selected) {
    return Response.json({ error: 'Unknown persona.' }, { status: 400 })
  }
  if (!paperContext) {
    return Response.json(
      { error: 'No paper has been analyzed yet.' },
      { status: 400 },
    )
  }

  const result = streamText({
    model: anthropic(MODEL),
    system: `You are Paperlens, explaining an academic paper to a specific audience. Tailor your explanation for ${selected.audience}

Base everything strictly on the paper context provided by the user; never invent facts. Write in plain prose with short paragraphs. You may use simple "- " bullets for lists, but avoid headings, tables, and heavy markdown.`,
    prompt: `Explain the following paper for ${selected.label.toLowerCase()} readers.

--- PAPER CONTEXT ---
${paperContext}
--- END CONTEXT ---`,
    onError: ({ error }) => {
      console.error('[explain] stream error:', error)
    },
  })

  return result.toTextStreamResponse()
}
