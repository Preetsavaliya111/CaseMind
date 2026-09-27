import { describe, expect, it } from 'vitest'

import type { User } from '@/types'
import { hasApiPermission, hasPermission, hasWorkspaceRole, roleHasPermission } from './permissions'

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'agent@example.com',
    name: 'Agent',
    role: 'agent',
    organizationId: 'org-1',
    organizationName: 'Example',
    roles: ['support_agent'],
    permissions: ['ticket.view_assigned', 'ticket.reply', 'ai.use'],
    teams: [],
    departments: [],
    defaultWorkspace: 'agent',
    department: 'Support',
    isActive: true,
    mfaEnabled: false,
    createdAt: '2026-09-24T00:00:00Z',
    onboardingCompleted: true,
    onboardingStep: 7,
    onboardingData: {},
    toursViewed: [],
    setupChecklistDismissed: false,
    ...overrides,
  }
}

describe('permission synchronization', () => {
  it('uses effective API permissions as the authorization source', () => {
    const current = user()
    expect(hasPermission(current, 'tickets.view')).toBe(true)
    expect(hasPermission(current, 'tickets.edit')).toBe(true)
    expect(hasPermission(current, 'tickets.delete')).toBe(false)
    expect(hasPermission(current, 'chat.use')).toBe(true)
  })

  it('does not grant legacy-role permissions when an effective permission list exists', () => {
    const administratorWithoutDelete = user({ role: 'admin', permissions: ['ticket.view_all_org'] })
    expect(hasPermission(administratorWithoutDelete, 'tickets.delete')).toBe(false)
    expect(hasPermission(administratorWithoutDelete, 'tickets.viewAll')).toBe(true)
  })

  it('supports exact API permissions and normalized workspace roles', () => {
    const current = user({ roles: ['senior_agent'], permissions: ['ticket.escalate'] })
    expect(hasApiPermission(current, 'ticket.escalate')).toBe(true)
    expect(hasWorkspaceRole(current, 'senior_agent')).toBe(true)
    expect(hasWorkspaceRole(current, 'customer')).toBe(false)
  })

  it('fails closed for unauthenticated users and preserves legacy fallback', () => {
    expect(hasPermission(null, 'tickets.view')).toBe(false)
    expect(roleHasPermission('viewer', 'tickets.view')).toBe(true)
    expect(roleHasPermission('viewer', 'tickets.create')).toBe(false)
  })
})
