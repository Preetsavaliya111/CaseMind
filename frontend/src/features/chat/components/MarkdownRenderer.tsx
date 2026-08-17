import { cn } from '@/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Lightweight enterprise Markdown renderer for Chat & Runbooks.
 * Handles headers (###), bold (**text**), bullet points (* or •), numbered lists (1.), inline code (`code`), and paragraphs.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const lines = content.split('\n')

  return (
    <div className={cn('space-y-2 text-xs md:text-sm leading-relaxed', className)}>
      {lines.map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={index} className="h-1.5" />
        }

        // Header 3: ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className="font-bold text-foreground text-xs md:text-sm pt-1 tracking-tight">
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          )
        }

        // Header 2: ## Title
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={index} className="font-bold text-foreground text-sm md:text-base pt-1.5 tracking-tight border-b pb-1">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          )
        }

        // Bullet point: • or * or -
        if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.replace(/^[•*-]\s+/, '')
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="text-primary font-bold mt-0.5 shrink-0 text-xs">▪</span>
              <span className="flex-1 text-foreground leading-relaxed">{formatInline(bulletText)}</span>
            </div>
          )
        }

        // Numbered list: 1. or 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="font-mono text-2xs font-bold text-primary shrink-0 mt-0.5 bg-primary/10 px-1.5 py-0.2 rounded">
                {numMatch[1]}
              </span>
              <span className="flex-1 text-foreground leading-relaxed">{formatInline(numMatch[2])}</span>
            </div>
          )
        }

        // Standard paragraph
        return (
          <p key={index} className="text-foreground leading-relaxed">
            {formatInline(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string): React.ReactNode[] {
  // Split on bold (**text**) and code (`code`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="font-mono text-2xs bg-muted/80 text-primary px-1.5 py-0.5 rounded border border-border/50"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
