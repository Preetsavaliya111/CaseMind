import type { TicketStatus, TicketPriority, TicketCategory } from '@/types'

export interface TicketFilters {
  search?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  assigneeId?: string
  page?: number
  pageSize?: number
}

export interface TicketTableRow {
  id: string
  title: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  assigneeName?: string
  reporterName: string
  slaBreached: boolean
  createdAt: string
}
