import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui'
import { FormField } from './FormField'
import type { Ticket } from '@/types'

const ticketSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z.string().min(30, 'Description must be at least 30 characters'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['bug', 'feature_request', 'billing', 'account', 'performance', 'security', 'integration', 'other']),
})

export type CreateTicketFormData = z.infer<typeof ticketSchema>

interface CreateTicketFormProps {
  onSubmit: (data: CreateTicketFormData) => Promise<void>
  onCancel?: () => void
}

export function CreateTicketForm({ onSubmit, onCancel }: CreateTicketFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: 'medium', category: 'bug' },
  })

  const priority = watch('priority')
  const category = watch('category')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField label="Title" htmlFor="title" error={errors.title?.message} required hint="Briefly describe the issue (min. 10 characters)">
        <Input
          id="title"
          placeholder="e.g. Payment gateway timeout during checkout"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
      </FormField>

      <FormField label="Description" htmlFor="description" error={errors.description?.message} required hint="Provide full details, steps to reproduce, and impact">
        <Textarea
          id="description"
          rows={5}
          placeholder="Describe the issue in detail…"
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Priority" htmlFor="priority" error={errors.priority?.message} required>
          <Select value={priority} onValueChange={(v) => setValue('priority', v as Ticket['priority'])}>
            <SelectTrigger id="priority" aria-invalid={Boolean(errors.priority)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">🔴 Critical</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Category" htmlFor="category" error={errors.category?.message} required>
          <Select value={category} onValueChange={(v) => setValue('category', v as Ticket['category'])}>
            <SelectTrigger id="category" aria-invalid={Boolean(errors.category)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Create Ticket
        </Button>
      </div>
    </form>
  )
}
