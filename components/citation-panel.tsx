'use client'

import { Quote } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Citation } from '@/lib/types'

export function CitationPanel({ citations }: { citations: Citation[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Quote className="size-4 text-primary" />
          Citations
        </CardTitle>
        <CardDescription>
          Key references pulled from the paper.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {citations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No citations were extracted from this paper.
            </p>
          ) : (
            <ol className="space-y-3">
              {citations.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border bg-muted/40 p-3"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[11px] font-semibold tabular-nums text-primary">
                      {c.id}
                    </span>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {c.label}
                    </p>
                  </div>
                  <p className="mt-1.5 pl-7 text-xs leading-relaxed text-muted-foreground">
                    {c.detail}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
