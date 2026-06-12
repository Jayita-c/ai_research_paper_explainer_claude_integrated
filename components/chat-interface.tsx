'use client'

import { useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ArrowUp, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Explain this paper to me like I have no background.',
  'What problem does this solve and why does it matter?',
  'What are the main results?',
  'How could this be applied in practice?',
]

function messageText(m: UIMessage) {
  return (
    m.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('') || ''
  )
}

export function ChatInterface({
  paperContext,
  ready,
}: {
  paperContext: string
  ready: boolean
}) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  function submit(text: string) {
    const value = text.trim()
    if (!value || !ready || isStreaming) return
    sendMessage({ text: value }, { body: { paperContext } })
    setInput('')
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Chat with the paper</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="size-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                {ready
                  ? 'Ask anything about this paper.'
                  : 'Upload a paper to start chatting.'}
              </p>
              {ready && (
                <div className="mx-auto flex max-w-sm flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex',
                m.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                {messageText(m)}
              </div>
            </div>
          ))}

          {status === 'submitted' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(input)
        }}
        className="border-t border-border p-3"
      >
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-primary/50">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit(input)
              }
            }}
            disabled={!ready || isStreaming}
            rows={1}
            placeholder={
              ready ? 'Ask a question…' : 'Upload a paper first…'
            }
            className="min-h-0 resize-none border-0 bg-transparent p-1.5 shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!ready || isStreaming || !input.trim()}
            className="size-8 shrink-0 rounded-lg"
          >
            <ArrowUp className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
