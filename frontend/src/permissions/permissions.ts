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
  'documents.view':       ALL_ROLES,
  'documents.manage':     MANAGER_UP,
  'teams.view':           AGENT_UP,
  'sla.view':             AGENT_UP,

  // Analytics
  'analytics.view':       ANALYST_UP,
  'analytics.export':     MANAGER_UP,

  // AI / Memory
  'ai.viewInsights':      AGENT_UP,
  'ai.viewMemory':        AGENT_UP,
  'memory.view':          AGENT_UP,
  'memory.create':        AGENT_UP,
  'memory.manage':        MANAGER_UP,

  // Admin
  'admin.users':          ADMIN,
  'admin.models':         ADMIN,
  'admin.experiments':    ADMIN,
  'admin.audit':          MANAGER_UP,
  'admin.viewSection':    ADMIN,

  // Chat
  'chat.use':             AGENT_UP,
} as const

export type Permission = keyof typeof PERMISSIONS

const API_PERMISSION_ALIASES: Record<Permission, string[]> = {
  'tickets.view': ['ticket.view_own', 'ticket.view_assigned', 'ticket.view_team', 'ticket.view_department', 'ticket.view_all_org'],
  'tickets.create': ['ticket.create'],
  'tickets.edit': ['ticket.reply'],
  'tickets.delete': ['ticket.delete'],
  'tickets.assignAny': ['ticket.assign', 'ticket.reassign'],
  'tickets.viewAll': ['ticket.view_all_org'],
  'tickets.changeStatus': ['ticket.change_status'],
  'tickets.addComment': ['ticket.reply'],
  'tickets.viewInternal': ['ticket.internal_note'],
  'knowledge.view': ['knowledge.read_public', 'knowledge.read_internal'],
  'knowledge.ingest': ['knowledge.create'],
  'knowledge.edit': ['knowledge.edit'],
  'knowledge.delete': ['knowledge.archive'],
  'documents.view': ['document.read'],
  'documents.manage': ['document.manage'],
  'teams.view': ['team.view'],
  'sla.view': ['sla.view'],
  'analytics.view': ['analytics.personal', 'analytics.team', 'analytics.department', 'analytics.organization'],
  'analytics.export': ['analytics.organization'],
  'ai.viewInsights': ['ai.use'],
  'ai.viewMemory': ['knowledge.read_internal'],
  'memory.view': ['knowledge.read_internal'],
  'memory.create': ['knowledge.create'],
  'memory.manage': ['knowledge.publish'],
  'admin.users': ['user.assign_role'],
  'admin.models': ['ai.manage_models'],
  'admin.experiments': ['ai.evaluate'],
  'admin.audit': ['audit.view'],
  'admin.viewSection': ['user.assign_role', 'ai.manage_models', 'settings.organization', 'audit.view'],
  'chat.use': ['ai.use'],
}

// ─── Permission Checker ────────────────────────────────────────────────────────

/**
 * Check if a user has a specific permission.
 * Returns false for null users (unauthenticated).
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  if (user.permissions?.length) {
    return API_PERMISSION_ALIASES[permission].some((code) => user.permissions.includes(code))
  }
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  return allowedRoles.includes(user.role)
}

export function hasApiPermission(user: User | null, permission: string): boolean {
  return Boolean(user?.permissions?.includes(permission))
}

export function hasWorkspaceRole(user: User | null, role: User['roles'][number]): boolean {
  return Boolean(user?.roles?.includes(role))
}

/**
 * Check if a role (string) has a specific permission.
 * Useful when you only have a role string available.
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  return allowedRoles.includes(role)
}
