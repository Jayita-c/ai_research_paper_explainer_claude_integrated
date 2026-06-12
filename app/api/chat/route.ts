import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'claude-opus-4-8'

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'The server is not configured for chat. Set ANTHROPIC_API_KEY.' },
      { status: 500 },
    )
  }

  const {
    messages,
    paperContext,
  }: { messages: UIMessage[]; paperContext?: string } = await req.json()

  const result = streamText({
    model: anthropic(MODEL),
    system: `You are Paperlens, an assistant that helps researchers understand a specific academic paper they have uploaded. Answer questions strictly based on the paper context provided below. Be precise, cite sections or figures when relevant, and clearly say when something is not covered by the paper. Keep answers concise and scannable.

--- PAPER CONTEXT ---
${paperContext ?? 'No paper has been analyzed yet. Ask the user to upload a PDF.'}
--- END CONTEXT ---`,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error('[chat] stream error:', error)
      return 'Something went wrong while answering. Please try again.'
    },
  })
}
