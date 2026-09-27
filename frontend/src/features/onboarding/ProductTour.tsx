import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import type { TourStep } from './tours'

interface ProductTourProps {
  open: boolean
  steps: TourStep[]
  onFinish: () => void
  onSkip: () => void
}

export function ProductTour({ open, steps, onFinish, onSkip }: ProductTourProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[index]

  const position = useCallback(() => {
    if (!open || !step) return
    const target = document.querySelector(step.target)
    if (!target) { setRect(null); return }
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setRect(target.getBoundingClientRect())
  }, [open, step])

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  useEffect(() => {
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [position])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
      if (event.key === 'ArrowRight') {
        if (index === steps.length - 1) onFinish()
        else setIndex((value) => value + 1)
      }
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, onFinish, onSkip, open, steps.length])

  if (!open || !step) return null
  const pad = 6
  const panelTop = rect && rect.bottom + 260 < window.innerHeight ? rect.bottom + 14 : Math.max(16, (rect?.top ?? 100) - 220)
  const panelLeft = rect ? Math.min(Math.max(16, rect.left), window.innerWidth - 376) : 16

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Product tour">
      {rect ? <>
        <div className="absolute inset-x-0 top-0 bg-slate-950/70" style={{ height: Math.max(0, rect.top - pad) }} />
        <div className="absolute inset-x-0 bottom-0 bg-slate-950/70" style={{ top: rect.bottom + pad }} />
        <div className="absolute left-0 bg-slate-950/70" style={{ top: rect.top - pad, width: Math.max(0, rect.left - pad), height: rect.height + pad * 2 }} />
        <div className="absolute right-0 bg-slate-950/70" style={{ top: rect.top - pad, left: rect.right + pad, height: rect.height + pad * 2 }} />
        <div className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-4 ring-offset-background" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      </> : <div className="absolute inset-0 bg-slate-950/70" />}
      <section className="absolute bottom-4 left-4 right-4 rounded-xl border bg-card p-5 shadow-2xl sm:bottom-auto sm:right-auto sm:w-[360px]" style={{ top: window.innerWidth >= 640 ? panelTop : undefined, left: window.innerWidth >= 640 ? panelLeft : undefined }}>
        <button onClick={onSkip} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Skip tour"><X className="h-4 w-4" /></button>
        <p className="text-xs font-semibold text-primary">{index + 1} of {steps.length}</p>
        <h2 className="mt-2 text-lg font-semibold">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onSkip}>Skip tour</Button>
          <div className="flex gap-2">
            {index > 0 && <Button variant="outline" size="sm" onClick={() => setIndex((value) => value - 1)}>Back</Button>}
            <Button size="sm" onClick={() => index === steps.length - 1 ? onFinish() : setIndex((value) => value + 1)}>{index === steps.length - 1 ? 'Finish' : 'Next'}</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
