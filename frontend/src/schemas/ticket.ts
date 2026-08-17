import { z } from 'zod'

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(10000, 'Description is too long'),
  category: z.enum(
    ['bug', 'feature_request', 'billing', 'account', 'performance', 'security', 'integration', 'other'],
    { required_error: 'Select a category' }
  ),
  priority: z.enum(['critical', 'high', 'medium', 'low'], {
    required_error: 'Select a priority',
  }),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})

export const updateTicketStatusSchema = z.object({
  status: z.enum([
    'new', 'assigned', 'in_progress', 'waiting_customer',
    'waiting_engineering', 'resolved', 'closed', 'reopened',
  ]),
  comment: z.string().min(1, 'Please provide a reason for the status change').optional(),
})

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
  isInternal: z.boolean().default(false),
})

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>
export type UpdateTicketStatusValues = z.infer<typeof updateTicketStatusSchema>
export type AddCommentFormValues = z.infer<typeof addCommentSchema>
