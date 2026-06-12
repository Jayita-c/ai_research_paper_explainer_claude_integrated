export type Citation = {
  id: string
  label: string
  detail: string
}

export type PaperAnalysis = {
  title: string
  authors: string[]
  venue: string
  summary: string
  keyContributions: string[]
  methodology: string[]
  limitations: string[]
  futureWork: string[]
  citations: Citation[]
}

/**
 * Shape seen while the analysis is still streaming in: any field may be
 * missing, arrays may be partially filled, and the trailing item of an array
 * may itself be a partial string or object.
 */
export type PartialAnalysis = {
  title?: string
  authors?: (string | null)[]
  venue?: string
  summary?: string
  keyContributions?: (string | null)[]
  methodology?: (string | null)[]
  limitations?: (string | null)[]
  futureWork?: (string | null)[]
  citations?: Partial<Citation>[]
}
