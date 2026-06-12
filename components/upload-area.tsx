'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadAreaProps = {
  onFile: (file: File) => void
  isAnalyzing: boolean
}

export function UploadArea({ onFile, isAnalyzing }: UploadAreaProps) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      // Some OS/browser combos report an empty or non-standard MIME type for a
      // valid .pdf (especially on drag-drop), so accept by extension too —
      // matching the server's lenient check — and give feedback otherwise.
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        toast.error('Please choose a PDF file.')
        return
      }
      onFile(file)
    },
    [onFile],
  )

  // Using a <label> means clicking anywhere inside it opens the file dialog
  // natively — no programmatic .click(), so no event-bubbling loop. Drag-drop
  // is handled on the same element.
  return (
    <label
      aria-label="Upload a PDF research paper"
      onDragOver={(e) => {
        e.preventDefault()
        if (!isAnalyzing) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!isAnalyzing) handleFile(e.dataTransfer.files?.[0])
      }}
      className={cn(
        'group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center transition-colors',
        dragging && 'border-primary bg-accent/40',
        isAnalyzing && 'pointer-events-none opacity-80',
      )}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={isAnalyzing}
        // Reset value so selecting the same file again still fires onChange.
        onClick={(e) => {
          ;(e.target as HTMLInputElement).value = ''
        }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {isAnalyzing ? (
          <Loader2 className="size-6 animate-spin" />
        ) : dragging ? (
          <FileText className="size-6" />
        ) : (
          <UploadCloud className="size-6" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {isAnalyzing
          ? 'Reading and analyzing your paper…'
          : 'Drop a PDF here or click to upload'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isAnalyzing
          ? 'This can take up to a minute for longer papers.'
          : 'We support academic papers up to ~30 pages.'}
      </p>
    </label>
  )
}
