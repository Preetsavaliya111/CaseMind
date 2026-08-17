import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button, Input, Textarea,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui'
import { useCreateTicket } from '@/features/tickets/hooks/useTickets'
import { useAuth } from '@/app/providers'
import { cn } from '@/utils'

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title too long'),
  description: z.string().min(30, 'Description must be at least 30 characters'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['bug', 'feature_request', 'billing', 'account', 'performance', 'security', 'integration', 'other']),
  reporterName: z.string().min(2, 'Reporter name is required'),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const priorityOptions = [
  { value: 'critical', label: '🔴 Critical', desc: 'System down, data loss, security breach' },
  { value: 'high',     label: '🟠 High',     desc: 'Major feature broken, many users affected' },
  { value: 'medium',   label: '🟡 Medium',   desc: 'Feature degraded, workaround exists' },
  { value: 'low',      label: '🟢 Low',      desc: 'Minor issue, cosmetic, enhancement' },
]

const categoryOptions = [
  { value: 'bug',             label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'performance',     label: 'Performance' },
  { value: 'security',        label: 'Security' },
  { value: 'integration',     label: 'Integration' },
  { value: 'billing',         label: 'Billing' },
  { value: 'account',         label: 'Account' },
  { value: 'other',           label: 'Other' },
]

export function CreateTicketPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mutateAsync: createTicket } = useCreateTicket()
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      category: 'bug',
      reporterName: user?.name ?? '',
    },
  })

  const priority = watch('priority')
  const category = watch('category')

  const onSubmit = async (data: FormData) => {
    const ticket = await createTicket({
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      reporterId: user?.id ?? 'usr_001',
      reporterName: data.reporterName,
      organizationId: 'org_001',
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    setSuccess(ticket.id)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[500px] animate-fade-in">
        <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-5 mb-4">
          <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold mb-1">Ticket Created</h2>
        <p className="text-muted-foreground text-sm mb-1">
          Your ticket has been submitted and is being analyzed by AI.
        </p>
        <p className="font-mono text-sm text-primary font-semibold mb-6">{success}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/tickets')}>
            View All Tickets
          </Button>
          <Button onClick={() => navigate(`/tickets/${success}`)}>
            View Ticket
          </Button>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Create New Ticket</h1>
          <p className="text-sm text-muted-foreground">AI will automatically analyze and categorize your ticket</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Ticket Details</CardTitle>
            <CardDescription>Provide as much detail as possible for accurate AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. Payment gateway timeout during checkout"
                aria-invalid={Boolean(errors.title)}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive" role="alert">{errors.title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Min. 10 characters — be specific and concise</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Textarea
                id="description"
                rows={6}
                placeholder={`Describe the issue in detail:\n• What happened?\n• Steps to reproduce\n• Expected vs actual behavior\n• Impact on users`}
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive" role="alert">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Min. 30 characters — more detail = better AI recommendations</p>
            </div>

            {/* Priority + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Select value={priority} onValueChange={(v) => setValue('priority', v as FormData['priority'])}>
                  <SelectTrigger id="priority" aria-invalid={Boolean(errors.priority)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div>
                          <p className="font-medium">{o.label}</p>
                          <p className="text-xs text-muted-foreground">{o.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-xs text-destructive" role="alert">{errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium">
                  Category <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Select value={category} onValueChange={(v) => setValue('category', v as FormData['category'])}>
                  <SelectTrigger id="category" aria-invalid={Boolean(errors.category)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive" role="alert">{errors.category.message}</p>
                )}
              </div>
            </div>

            {/* Reporter */}
            <div className="space-y-1.5">
              <label htmlFor="reporterName" className="text-sm font-medium">
                Reporter <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="reporterName"
                placeholder="Customer or organization name"
                aria-invalid={Boolean(errors.reporterName)}
                {...register('reporterName')}
              />
              {errors.reporterName && (
                <p className="text-xs text-destructive" role="alert">{errors.reporterName.message}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-sm font-medium">Tags</label>
              <Input
                id="tags"
                placeholder="payment, checkout, timeout  (comma separated)"
                {...register('tags')}
              />
              <p className="text-xs text-muted-foreground">Optional — helps with search and grouping</p>
            </div>
          </CardContent>
        </Card>

        {/* Priority indicator */}
        <div className={cn(
          'rounded-lg border px-4 py-3 text-sm flex items-center gap-3',
          priority === 'critical' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
          priority === 'high'     && 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30',
          priority === 'medium'   && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
          priority === 'low'      && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
        )}>
          <span className="text-lg" aria-hidden="true">
            {priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : priority === 'medium' ? '🟡' : '🟢'}
          </span>
          <div>
            <p className="font-medium capitalize">{priority} Priority</p>
            <p className="text-xs text-muted-foreground">
              {priorityOptions.find((o) => o.value === priority)?.desc}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tickets')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </div>
  )
}
