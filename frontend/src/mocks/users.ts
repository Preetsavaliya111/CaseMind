import type { User } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'usr_001',
    email: 'sarah.chen@casemind.io',
    name: 'Sarah Chen',
    role: 'admin',
    department: 'Engineering',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
    lastLoginAt: '2024-07-15T09:30:00Z',
  },
  {
    id: 'usr_002',
    email: 'james.wilson@casemind.io',
    name: 'James Wilson',
    role: 'manager',
    department: 'Customer Support',
    isActive: true,
    createdAt: '2024-01-12T08:00:00Z',
    lastLoginAt: '2024-07-15T08:15:00Z',
  },
  {
    id: 'usr_003',
    email: 'priya.sharma@casemind.io',
    name: 'Priya Sharma',
    role: 'agent',
    department: 'Customer Support',
    isActive: true,
    createdAt: '2024-02-01T08:00:00Z',
    lastLoginAt: '2024-07-14T17:45:00Z',
  },
  {
    id: 'usr_004',
    email: 'marcus.johnson@casemind.io',
    name: 'Marcus Johnson',
    role: 'agent',
    department: 'Customer Support',
    isActive: true,
    createdAt: '2024-02-15T08:00:00Z',
    lastLoginAt: '2024-07-15T10:00:00Z',
  },
  {
    id: 'usr_005',
    email: 'elena.rodriguez@casemind.io',
    name: 'Elena Rodriguez',
    role: 'viewer',
    department: 'Product',
    isActive: true,
    createdAt: '2024-03-01T08:00:00Z',
    lastLoginAt: '2024-07-13T14:20:00Z',
  },
]

export const mockCurrentUser = mockUsers[0]
