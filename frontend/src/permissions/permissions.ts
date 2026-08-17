/**
 * Centralized RBAC — all permission checks live here.
 * Never put role checks inline in components.
 *
 * Permission check: hasPermission(user, 'tickets.delete')
 * React hook:       usePermission('tickets.delete')
 */

import type { UserRole, User } from '@/types'

// ─── Permission Map ────────────────────────────────────────────────────────────

/**
 * Role hierarchy (highest to lowest):
 *   admin > manager > engineer > product > agent > cs > viewer
 */

const ADMIN: UserRole[] = ['admin']
const MANAGER_UP: UserRole[] = ['admin', 'manager']
const ANALYST_UP: UserRole[] = ['admin', 'manager', 'engineer', 'product']
const AGENT_UP: UserRole[] = ['admin', 'manager', 'engineer', 'product', 'agent', 'cs']
const ALL_ROLES: UserRole[] = ['admin', 'manager', 'engineer', 'product', 'agent', 'cs', 'viewer']

export const PERMISSIONS = {
  // Tickets
  'tickets.view':         ALL_ROLES,
  'tickets.create':       AGENT_UP,
  'tickets.edit':         AGENT_UP,
  'tickets.delete':       MANAGER_UP,
  'tickets.assignAny':    MANAGER_UP,
  'tickets.viewAll':      MANAGER_UP,   // agents see only their own tickets by default
  'tickets.changeStatus': AGENT_UP,
  'tickets.addComment':   AGENT_UP,
  'tickets.viewInternal': AGENT_UP,     // viewers cannot see internal comments

  // Knowledge Base
  'knowledge.view':       ALL_ROLES,
  'knowledge.ingest':     ANALYST_UP,
  'knowledge.edit':       ANALYST_UP,
  'knowledge.delete':     MANAGER_UP,

  // Analytics
  'analytics.view':       ANALYST_UP,
  'analytics.export':     MANAGER_UP,

  // AI / Memory
  'ai.viewInsights':      AGENT_UP,
  'ai.viewMemory':        AGENT_UP,
  'memory.view':          AGENT_UP,
  'memory.manage':        MANAGER_UP,

  // Admin
  'admin.users':          ADMIN,
  'admin.models':         ADMIN,
  'admin.experiments':    ADMIN,
  'admin.viewSection':    ADMIN,

  // Chat
  'chat.use':             AGENT_UP,
} as const

export type Permission = keyof typeof PERMISSIONS

// ─── Permission Checker ────────────────────────────────────────────────────────

/**
 * Check if a user has a specific permission.
 * Returns false for null users (unauthenticated).
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  return allowedRoles.includes(user.role)
}

/**
 * Check if a role (string) has a specific permission.
 * Useful when you only have a role string available.
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  return allowedRoles.includes(role)
}
