import type { Ticket, PaginatedResponse } from '@/types'
import { mockTickets } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface TicketFilters {
  search?: string
  status?: string
  priority?: string
  category?: string
  assigneeId?: string
  page?: number
  pageSize?: number
}

export const ticketService = {
  async getTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> {
    await delay(400)
    let results = [...mockTickets]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
      )
    }
    if (filters.status) results = results.filter((t) => t.status === filters.status)
    if (filters.priority) results = results.filter((t) => t.priority === filters.priority)
    if (filters.category) results = results.filter((t) => t.category === filters.category)

    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20
    const start = (page - 1) * pageSize
    const paginated = results.slice(start, start + pageSize)

    return {
      data: paginated,
      total: results.length,
      page,
      pageSize,
      totalPages: Math.ceil(results.length / pageSize),
    }
  },

  async getTicketById(id: string): Promise<Ticket> {
    await delay(300)
    const ticket = mockTickets.find((t) => t.id === id)
    if (!ticket) throw new Error(`Ticket ${id} not found`)
    return ticket
  },

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    await delay(600)
    const ticket: Ticket = {
      id: `TKT-${1000 + mockTickets.length + 1}`,
      title: data.title ?? '',
      description: data.description ?? '',
      status: 'new',
      priority: data.priority ?? 'medium',
      category: data.category ?? 'other',
      reporterId: data.reporterId ?? 'usr_001',
      reporterName: data.reporterName ?? 'Unknown',
      organizationId: data.organizationId ?? 'org_001',
      tags: data.tags ?? [],
      comments: [],
      attachments: [],
      slaBreached: false,
      slaState: 'healthy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockTickets.unshift(ticket)
    return ticket
  },

  async updateTicketStatus(id: string, status: Ticket['status']): Promise<Ticket> {
    await delay(300)
    const ticket = mockTickets.find((t) => t.id === id)
    if (!ticket) throw new Error(`Ticket ${id} not found`)
    ticket.status = status
    ticket.updatedAt = new Date().toISOString()
    return ticket
  },

  async addComment(ticketId: string, content: string, isInternal: boolean, authorName: string = 'Sarah Chen'): Promise<Ticket> {
    await delay(300)
    const ticket = mockTickets.find((t) => t.id === ticketId)
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`)
    const newComment = {
      id: `cmt_${Date.now()}`,
      ticketId,
      authorId: 'usr_001',
      authorName,
      content,
      isInternal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    ticket.comments = [...ticket.comments, newComment]
    ticket.updatedAt = new Date().toISOString()
    return ticket
  },

  async deleteTicket(id: string): Promise<void> {
    await delay(400)
    const index = mockTickets.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`Ticket ${id} not found`)
    mockTickets.splice(index, 1)
  },
}

