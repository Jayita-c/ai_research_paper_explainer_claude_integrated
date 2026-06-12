import { extractText, getDocumentProxy } from 'unpdf'

/** Reject anything larger than this before we even try to parse it. */
export const MAX_PDF_BYTES = 20 * 1024 * 1024 // 20 MB

/**
 * Defensive cap on how much text we forward to the model. Claude Opus 4.8 has a
 * 1M-token context window, so a normal paper fits easily; this only guards
 * against pathologically large inputs. We mark the cut so the model knows the
 * text was truncated rather than silently ending.
 */
const MAX_TEXT_CHARS = 500_000

/** Thrown when a file is not a usable, text-bearing PDF. Maps to a 422. */
export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfExtractionError'
  }
}

export type ExtractedPdf = {
  text: string
  pages: number
  truncated: boolean
}

/**
 * Extract the plain text of a PDF using unpdf's serverless build of pdf.js
 * (no native dependencies, runs in the Next.js Node runtime).
 */
export async function extractPdfText(data: Uint8Array): Promise<ExtractedPdf> {
  let pdf
  try {
    pdf = await getDocumentProxy(data)
  } catch {
    throw new PdfExtractionError('The file could not be read as a valid PDF.')
  }

  const { text, totalPages } = await extractText(pdf, { mergePages: true })
  const cleaned = (text ?? '').replace(/[ \t]+\n/g, '\n').trim()

  // A near-empty result almost always means a scanned / image-only PDF that
  // would need OCR — surface that clearly instead of sending junk to the model.
  if (cleaned.length < 200) {
    throw new PdfExtractionError(
      'Could not extract enough text from this PDF. It may be a scanned or image-only document that requires OCR.',
    )
  }

  const truncated = cleaned.length > MAX_TEXT_CHARS
  return {
    text: truncated ? `${cleaned.slice(0, MAX_TEXT_CHARS)}\n\n[...text truncated...]` : cleaned,
    pages: totalPages,
    truncated,
  }
}
