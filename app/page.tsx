'use client'

import { useState } from 'react'
import { parsePartialJson } from 'ai'
import { toast } from 'sonner'
import { BookOpen, FileText, Moon, RotateCcw, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UploadArea } from '@/components/upload-area'
import { AnalysisView } from '@/components/analysis-view'
import { CitationPanel } from '@/components/citation-panel'
import { ChatInterface } from '@/components/chat-interface'
import { PersonaExplainer } from '@/components/persona-explainer'
import type { Citation, PartialAnalysis } from '@/lib/types'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}

function buildContext(a: PartialAnalysis): string {
  const join = (xs?: (string | null)[]) =>
    (xs ?? []).filter((x): x is string => typeof x === 'string').join('; ')
  return [
    `Title: ${a.title ?? ''}`,
    `Authors: ${join(a.authors)}`,
    `Venue: ${a.venue ?? ''}`,
    `Summary: ${a.summary ?? ''}`,
    `Key Contributions: ${join(a.keyContributions)}`,
    `Methodology: ${join(a.methodology)}`,
    `Limitations: ${join(a.limitations)}`,
    `Future Work: ${join(a.futureWork)}`,
    `Citations: ${(a.citations ?? [])
      .map((c) => `[${c.id}] ${c.label} — ${c.detail}`)
      .join('; ')}`,
  ].join('\n')
}

export default function Page() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [analysis, setAnalysis] = useState<PartialAnalysis | null>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setIsAnalyzing(true)
    setDone(false)
    setAnalysis({}) // empty object → every section shows "Generating…" right away
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/analyze', { method: 'POST', body: form })

      // Pre-stream failures (bad upload, extraction, config) return JSON errors.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: string })?.error ?? 'Analysis failed.',
        )
      }

      // Read the streamed object and reveal sections as they parse.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      let latest: PartialAnalysis = {}
      for (;;) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        text += decoder.decode(value, { stream: true })
        const { value: parsed } = await parsePartialJson(text)
        if (parsed && typeof parsed === 'object') {
          latest = parsed as PartialAnalysis
          setAnalysis(latest)
        }
      }

      if (!latest.title || !latest.summary) {
        throw new Error('The analysis did not complete. Please try again.')
      }
      setDone(true)
      toast.success('Paper analyzed', { description: latest.title })
    } catch (err) {
      toast.error('Could not analyze the paper', {
        description: (err as Error).message,
      })
      setAnalysis(null)
      setFileName(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  function reset() {
    setAnalysis(null)
    setFileName(null)
    setIsAnalyzing(false)
    setDone(false)
  }

  const context = done && analysis ? buildContext(analysis) : ''
  const citations: Citation[] = (analysis?.citations ?? []).filter(
    (c): c is Citation =>
      Boolean(c && c.id && c.label && c.detail),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="size-4" />
        </div>
        <div className="mr-auto">
          <h1 className="text-sm font-semibold leading-none">Paperlens</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI Research Paper Explainer
          </p>
        </div>
        {fileName && (
          <span className="hidden max-w-[200px] items-center gap-1.5 truncate rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground md:flex">
            <FileText className="size-3 shrink-0" />
            <span className="truncate">{fileName}</span>
          </span>
        )}
        {analysis && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" />
            New paper
          </Button>
        )}
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        {!analysis && !isAnalyzing ? (
          <div className="mx-auto max-w-2xl space-y-6 py-8">
            <div className="space-y-2 text-center">
              <h2 className="text-balance text-2xl font-semibold tracking-tight">
                Understand any research paper in seconds
              </h2>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Upload a PDF and Paperlens generates a plain-language summary,
                key contributions, methodology, limitations, and future work —
                then lets you chat with the paper.
              </p>
            </div>
            <UploadArea onFile={handleFile} isAnalyzing={isAnalyzing} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              {analysis ? (
                <AnalysisView analysis={analysis} streaming={isAnalyzing} />
              ) : null}
            </div>

            <div className="lg:h-[calc(100vh-7rem)] lg:sticky lg:top-20">
              <Tabs defaultValue="chat" className="flex h-full flex-col">
                <TabsList className="w-full">
                  <TabsTrigger value="chat" className="flex-1">
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="explain" className="flex-1">
                    Explain
                  </TabsTrigger>
                  <TabsTrigger value="citations" className="flex-1">
                    Citations
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="chat"
                  className="mt-3 flex-1 overflow-hidden rounded-xl border border-border bg-card"
                >
                  <ChatInterface paperContext={context} ready={done} />
                </TabsContent>
                <TabsContent
                  value="explain"
                  className="mt-3 flex-1 overflow-hidden"
                >
                  <PersonaExplainer paperContext={context} ready={done} />
                </TabsContent>
                <TabsContent value="citations" className="mt-3 flex-1 overflow-hidden">
                  <CitationPanel citations={citations} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
