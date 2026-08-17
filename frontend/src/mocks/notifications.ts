import type { AppNotification } from '@/types'

export const initialMockNotifications: AppNotification[] = [
  {
    id: 'notif_001',
    type: 'sla_alert',
    title: 'SLA Risk: Payment gateway timeout',
    message: 'Ticket TKT-1001 has entered At Risk state. Target resolution deadline in 45 minutes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    isRead: false,
    priority: 'critical',
    link: '/tickets/TKT-1001',
    ticketId: 'TKT-1001',
  },
  {
    id: 'notif_002',
    type: 'ai_insight',
    title: 'AI Root Cause Match (94% Conf.)',
    message: 'AI analyzed TKT-1001 and matched with memory pattern: "Payment gateway connection pool exhaustion".',
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(), // 28 mins ago
    isRead: false,
    priority: 'high',
    link: '/tickets/TKT-1001',
    ticketId: 'TKT-1001',
  },
  {
    id: 'notif_003',
    type: 'ticket_assigned',
    title: 'New Ticket Assigned to You',
    message: 'Sarah Chen assigned ticket TKT-1004 ("Bulk CSV export fails on large datasets") to you.',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1.25 hrs ago
    isRead: false,
    priority: 'medium',
    link: '/tickets/TKT-1004',
    ticketId: 'TKT-1004',
  },
  {
    id: 'notif_004',
    type: 'memory_match',
    title: 'Organizational Memory Suggested',
    message: 'New verified pattern "SAML SSO Certificate Expiry & Clock Skew" is available for TKT-1003.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hrs ago
    isRead: true,
    priority: 'medium',
    link: '/memory',
    memoryId: 'mem_002',
  },
  {
    id: 'notif_005',
    type: 'knowledge',
    title: 'Knowledge Article Updated',
    message: 'Article "Resolving Payment Gateway Connection Pool Exhaustion" was updated with new runbook steps.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    priority: 'low',
    link: '/knowledge',
    articleId: 'kb_001',
  },
]
