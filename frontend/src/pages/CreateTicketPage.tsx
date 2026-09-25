import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowLeft, Check, CheckCircle, FileText, ShieldCheck, Tag, UserRound } from 'lucide-react'
import {
  Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui'
import { useCreateTicket } from '@/features/tickets/hooks/useTickets'
import { useAuth } from '@/app/providers'
import { cn } from '@/utils'

const schema = z.object({
  title: z.string().trim().min(10, 'Title must be at least 10 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().min(30, 'Description must be at least 30 characters').max(20_000, 'Description is too long'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['bug', 'feature_request', 'billing', 'account', 'authentication', 'performance', 'security', 'integration', 'other']),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const priorityOptions = [
  { value: 'critical', label: 'Critical', desc: 'Service unavailable, data loss, or security incident' },
  { value: 'high', label: 'High', desc: 'Major workflow blocked for multiple users' },
  { value: 'medium', label: 'Medium', desc: 'Feature degraded, but a workaround exists' },
  { value: 'low', label: 'Low', desc: 'Minor defect, question, or enhancement' },
] as const

const categoryOptions = [
  ['bug', 'Bug'], ['feature_request', 'Feature request'], ['authentication', 'Authentication'],
  ['performance', 'Performance'], ['security', 'Security'], ['integration', 'Integration'],
  ['billing', 'Billing'], ['account', 'Account'], ['other', 'Other'],
] as const

function errorMessage(error: unknown) {
  return typeof error === 'object' && error && 'message' in error
    ? String(error.message)
    : 'The case could not be created. Please try again.'
}

export function CreateTicketPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutateAsync: createTicket } = useCreateTicket()
  const [success, setSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', category: 'bug', tags: '' },
  })
  const priority = watch('priority')
  const category = watch('category')

  const onSubmit = async (data: FormData) => {
    setSubmitError('')
    try {
      const ticket = await createTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        tags: data.tags?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [],
      })
      setSuccess(ticket.id)
    } catch (error) {
      setSubmitError(errorMessage(error))
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center p-5 sm:p-8">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-8 sm:p-10">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border bg-muted/40"><CheckCircle className="h-6 w-6" /></div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Case created</h1>
            <p className="mt-2 text-sm text-muted-foreground">The case is saved and ready for your team to review.</p>
            <p className="mt-4 rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">{success}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center"><Button variant="outline" onClick={() => navigate('/tickets')}>View all cases</Button><Button onClick={() => navigate(`/tickets/${success}`)}>Open case</Button></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedPriority = priorityOptions.find((option) => option.value === priority) ?? priorityOptions[2]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex items-start gap-3 border-b pb-5">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')} aria-label="Back to cases" className="mt-0.5 shrink-0 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Cases</p><h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Create a new case</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Give your team clear, actionable context so investigation can start without another round of questions.</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Case details</CardTitle><CardDescription>Required fields are marked with an asterisk.</CardDescription></CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input id="title" autoFocus placeholder="e.g. Payment gateway times out during checkout" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : 'title-help'} {...register('title')} />
              {errors.title ? <p id="title-error" className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert"><AlertCircle className="h-3.5 w-3.5" />{errors.title.message}</p> : <p id="title-help" className="text-xs text-muted-foreground">Use at least 10 characters and describe the observable problem.</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
              <Textarea id="description" rows={8} className="min-h-48 resize-y" placeholder="Describe what happened, the steps to reproduce it, expected versus actual behavior, user impact, and anything already tried." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : 'description-help'} {...register('description')} />
              {errors.description ? <p id="description-error" className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert"><AlertCircle className="h-3.5 w-3.5" />{errors.description.message}</p> : <p id="description-help" className="text-xs text-muted-foreground">Include evidence, impact, and reproduction steps. Minimum 30 characters.</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><label htmlFor="priority" className="text-sm font-medium">Priority <span className="text-destructive">*</span></label><Select value={priority} onValueChange={(value) => setValue('priority', value as FormData['priority'], { shouldValidate: true })}><SelectTrigger id="priority" aria-invalid={Boolean(errors.priority)}><SelectValue /></SelectTrigger><SelectContent>{priorityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><label htmlFor="category" className="text-sm font-medium">Category <span className="text-destructive">*</span></label><Select value={category} onValueChange={(value) => setValue('category', value as FormData['category'], { shouldValidate: true })}><SelectTrigger id="category" aria-invalid={Boolean(errors.category)}><SelectValue /></SelectTrigger><SelectContent>{categoryOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><label htmlFor="tags" className="flex items-center gap-1.5 text-sm font-medium"><Tag className="h-3.5 w-3.5" />Tags</label><Input id="tags" placeholder="payment, checkout, timeout" {...register('tags')} /><p className="text-xs text-muted-foreground">Optional. Separate tags with commas.</p></div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card><CardHeader className="pb-4"><CardTitle className="text-sm">Submission summary</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3"><UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Reporter</p><p className="mt-0.5 text-xs text-muted-foreground">{user?.name ?? 'Signed-in user'}</p></div></div>
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{selectedPriority.label} priority</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{selectedPriority.desc}</p></div></div>
            <div className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="font-medium">Secure ownership</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Your account and organization are applied automatically.</p></div></div>
          </CardContent></Card>
          {submitError && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{submitError}</span></div></div>}
          <div className={cn('grid gap-2 rounded-lg border bg-card p-3', submitError && 'border-destructive/40')}><Button type="submit" loading={isSubmitting}>{isSubmitting ? 'Creating case…' : 'Create case'}</Button><Button type="button" variant="ghost" onClick={() => navigate('/tickets')} disabled={isSubmitting}>Cancel</Button></div>
        </div>
      </form>
    </div>
  )
}
