import { anthropic } from '@ai-sdk/anthropic'
import { streamObject } from 'ai'
import { z } from 'zod'
import {
  extractPdfText,
  MAX_PDF_BYTES,
  PdfExtractionError,
} from '@/lib/pdf'

// PDF parsing + a long model call: run on Node, allow up to 60s.
export const runtime = 'nodejs'
export const maxDuration = 60

// Per the skill default — use the latest Opus unless the user asks otherwise.
const MODEL = 'claude-opus-4-8'

const analysisSchema = z.object({
  title: z.string().describe('The full title of the paper'),
  authors: z.array(z.string()).describe('List of author names'),
  venue: z
    .string()
    .describe('Publication venue and year, or "Preprint" if unknown'),
  summary: z
    .string()
    .describe(
      'Executive summary: a clear 3-5 sentence plain-language overview of the paper for a technical but non-specialist reader',
    ),
  keyContributions: z
    .array(z.string())
    .describe('The main novel contributions, as concise bullet points'),
  methodology: z
    .array(z.string())
    .describe('How the work was carried out, as concise bullet points'),
  limitations: z
    .array(z.string())
    .describe('Stated or evident limitations, as concise bullet points'),
  futureWork: z
    .array(z.string())
    .describe('Suggested or natural future directions, as bullet points'),
  citations: z
    .array(
      z.object({
        id: z.string().describe('Short identifier, e.g. "1"'),
        label: z.string().describe('A short reference title or author-year'),
        detail: z
          .string()
          .describe('A one-line description of what was cited and why'),
      }),
    )
    .describe('Up to 8 of the most important references cited in the paper'),
})

const SYSTEM_PROMPT =
  'You are an expert research librarian. You read academic papers and produce accurate, structured, plain-language explanations for a technical but non-specialist audience. Base every statement strictly on the provided text and never invent facts, authors, or citations that are not supported by the document.'

function json(body: unknown, status: number) {
  return Response.json(body, { status })
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[analyze] ANTHROPIC_API_KEY is not set')
    return json(
      { error: 'The server is not configured for analysis. Set ANTHROPIC_API_KEY.' },
      500,
    )
  }

  // 1. Read the uploaded file from multipart/form-data.
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json({ error: 'Expected a multipart form upload.' }, 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return json({ error: 'No PDF file was uploaded.' }, 400)
  }
  if (file.type && file.type !== 'application/pdf') {
    return json({ error: 'Only PDF files are supported.' }, 415)
  }
  if (file.size === 0) {
    return json({ error: 'The uploaded file is empty.' }, 400)
  }
  if (file.size > MAX_PDF_BYTES) {
    return json(
      { error: `PDF is too large. The limit is ${MAX_PDF_BYTES / (1024 * 1024)} MB.` },
      413,
    )
  }

  // 2. Extract the text server-side.
  let extracted
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    extracted = await extractPdfText(bytes)
  } catch (err) {
    if (err instanceof PdfExtractionError) {
      return json({ error: err.message }, 422)
    }
    console.error('[analyze] extraction error:', err)
    return json({ error: 'Failed to read the PDF.' }, 500)
  }

  // 3. Stream the structured explanation back as it is generated. The client
  // parses the partial JSON and reveals each section as it arrives.
  const result = streamObject({
    model: anthropic(MODEL),
    schema: analysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `Analyze the following research paper${
      extracted.truncated ? ' (text was truncated due to length)' : ''
    } and return the structured explanation. The text was extracted from a PDF, so formatting may be imperfect.\n\n--- PAPER TEXT ---\n${extracted.text}\n--- END PAPER TEXT ---`,
    onError: ({ error }) => {
      console.error('[analyze] model stream error:', error)
    },
  })

  return result.toTextStreamResponse()
}
