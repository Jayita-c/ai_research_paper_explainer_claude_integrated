'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Microscope,
  Briefcase,
  Building2,
  GraduationCap,
  Loader2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PersonaId = 'researcher' | 'product-manager' | 'executive' | 'student'

const PERSONAS: { id: PersonaId; label: string; icon: LucideIcon }[] = [
  { id: 'researcher', label: 'Researcher', icon: Microscope },
  { id: 'product-manager', label: 'Product Manager', icon: Briefcase },
  { id: 'executive', label: 'Executive', icon: Building2 },
  { id: 'student', label: 'Student', icon: GraduationCap },
]

export function PersonaExplainer({
  paperContext,
  ready,
}: {
  paperContext: string
  ready: boolean
}) {
  const [active, setActive] = useState<PersonaId | null>(null)
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Cancel any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), [])

  // Keep the view pinned to the bottom as tokens arrive.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [output])

  async function explain(persona: PersonaId) {
    if (!ready || isStreaming) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setActive(persona)
    setOutput('')
    setError(null)
    setIsStreaming(true)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperContext, persona }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: string })?.error ?? 'Could not generate the explanation.',
        )
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setOutput(text)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message)
    } finally {
      if (abortRef.current === controller) {
        setIsStreaming(false)
      }
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Explain like a…</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
        {PERSONAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => explain(id)}
            disabled={!ready || isStreaming}
            aria-pressed={active === id}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              active === id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {isStreaming && active === id ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin" />
            ) : (
              <Icon className="size-3.5 shrink-0" />
            )}
            {label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : output ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {output}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-primary align-middle" />
            )}
          </p>
        ) : (
          <div className="space-y-3 py-6 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {ready
                ? 'Pick an audience and get a tailored explanation of this paper.'
                : 'Upload a paper to get persona-tailored explanations.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
