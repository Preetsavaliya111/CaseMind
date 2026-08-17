import { useAuth } from '@/app/providers'
import { hasPermission, type Permission } from './permissions'

/**
 * React hook for permission checking.
 *
 * Usage:
 *   const canDelete = usePermission('tickets.delete')
 *   if (!canDelete) return null
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  return hasPermission(user, permission)
}

/**
 * Hook that returns multiple permissions at once.
 *
 * Usage:
 *   const { canDelete, canAssign } = usePermissions({ canDelete: 'tickets.delete', canAssign: 'tickets.assignAny' })
 */
export function usePermissions<K extends string>(
  permissions: Record<K, Permission>
): Record<K, boolean> {
  const { user } = useAuth()
  const result = {} as Record<K, boolean>
  for (const key in permissions) {
    result[key] = hasPermission(user, permissions[key])
  }
  return result
}
