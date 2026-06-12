'use client'

import {
  Lightbulb,
  FlaskConical,
  TriangleAlert,
  Rocket,
  FileText,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PartialAnalysis } from '@/lib/types'

const sectionMeta: Record<
  string,
  { icon: LucideIcon; label: string; tone: string }
> = {
  keyContributions: {
    icon: Lightbulb,
    label: 'Contributions',
    tone: 'text-chart-1',
  },
  methodology: {
    icon: FlaskConical,
    label: 'Methodology',
    tone: 'text-chart-2',
  },
  limitations: {
    icon: TriangleAlert,
    label: 'Limitations',
    tone: 'text-chart-5',
  },
  futureWork: { icon: Rocket, label: 'Future Work', tone: 'text-chart-4' },
}

/** Keep only the strings that have actually streamed in (drop nulls/blanks). */
function clean(items: (string | null)[] | undefined): string[] {
  return (items ?? []).filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0,
  )
}

function GeneratingLine({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      Generating {label}…
    </p>
  )
}

function BulletCard({
  sectionKey,
  items,
  streaming,
}: {
  sectionKey: keyof typeof sectionMeta
  items: (string | null)[] | undefined
  streaming: boolean
}) {
  const { icon: Icon, label, tone } = sectionMeta[sectionKey]
  const list = clean(items)
  const pending = list.length === 0

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Icon className={`size-4 ${tone}`} />
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
        {list.length > 0 ? (
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {list.length}
          </Badge>
        ) : streaming ? (
          <Loader2 className="ml-auto size-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </CardHeader>
      <CardContent>
        {pending ? (
          streaming ? (
            <GeneratingLine label={label} />
          ) : (
            <p className="text-sm text-muted-foreground">None noted.</p>
          )
        ) : (
          <ul className="space-y-2.5">
            {list.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-current ${tone}`}
                  aria-hidden
                />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function AnalysisView({
  analysis,
  streaming,
}: {
  analysis: PartialAnalysis
  streaming: boolean
}) {
  const authors = (analysis.authors ?? []).filter(
    (a): a is string => typeof a === 'string' && a.length > 0,
  )

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-b from-accent/40 to-card">
        <CardHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-balance text-lg leading-snug">
                {analysis.title ?? (
                  <span className="text-muted-foreground">Generating title…</span>
                )}
              </CardTitle>
              {authors.length > 0 && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {authors.slice(0, 4).join(', ')}
                  {authors.length > 4 ? ' et al.' : ''}
                  {analysis.venue ? ` · ${analysis.venue}` : ''}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analysis.summary ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              {analysis.summary}
              {streaming && (
                <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-primary align-middle" />
              )}
            </p>
          ) : (
            <GeneratingLine label="Summary" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <BulletCard
          sectionKey="keyContributions"
          items={analysis.keyContributions}
          streaming={streaming}
        />
        <BulletCard
          sectionKey="methodology"
          items={analysis.methodology}
          streaming={streaming}
        />
        <BulletCard
          sectionKey="limitations"
          items={analysis.limitations}
          streaming={streaming}
        />
        <BulletCard
          sectionKey="futureWork"
          items={analysis.futureWork}
          streaming={streaming}
        />
      </div>
    </div>
  )
}
