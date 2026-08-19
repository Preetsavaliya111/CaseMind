import { useState, useMemo, useEffect } from 'react'
import {
  Users, UserPlus, Shield, CheckCircle2, Mail, AlertTriangle, Search
} from 'lucide-react'
import {
  Card, CardContent, CardHeader,
  Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Input,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui'

import { StatCard } from '@/components/common'
import { useAdminUsers, useInviteUser, useUpdateUserRole, useToggleUserStatus } from '@/features/admin/hooks/useAdmin'
import type { User, UserRole } from '@/types'
import { formatDate } from '@/utils'

const ROLE_LABELS: Record<UserRole, string> = {
  admin:    'System Administrator',
  manager:  'Support Manager',
  agent:    'Support Agent',
  engineer: 'Engineering Team',
  product:  'Product Manager',
  cs:       'Customer Success',
  viewer:   'Viewer',
}

const ROLE_BADGE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'info' | 'success' | 'warning' | 'critical'> = {
  admin:    'critical',
  manager:  'warning',
  agent:    'info',
  engineer: 'default',
  product:  'success',
  cs:       'secondary',
  viewer:   'secondary',
}

function InviteDialog({ open, onClose, onUserInvited }: { open: boolean; onClose: () => void; onUserInvited: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('Customer Support')
  const [role, setRole] = useState<UserRole>('agent')
  const [sent, setSent] = useState(false)
  const inviteMutation = useInviteUser()

  const handleInvite = async () => {
    if (!email || !name) return
    const newUser = await inviteMutation.mutateAsync({
      name,
      email,
      role,
      department,
    })
    onUserInvited(newUser)
    setSent(true)
  }

  const handleClose = () => {
    setEmail('')
    setName('')
    setRole('agent')
    setSent(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
            Invite Organization Member
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send an onboarding invitation with single-sign-on credentials and role assignment.
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <div className="space-y-3.5 mt-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Full Name</label>
              <Input
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Work Email</label>
              <Input
                type="email"
                placeholder="alex@casemind.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Assigned Role</label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, label]) => (
                      <SelectItem key={r} value={r} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Department</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <Button
              className="w-full text-xs h-9 mt-2"
              onClick={handleInvite}
              disabled={!email.includes('@') || !name.trim() || inviteMutation.isPending}
              loading={inviteMutation.isPending}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Send Invitation & Provision Account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm">Invitation Dispatched</p>
              <p className="text-xs text-muted-foreground mt-1">
                {email} has been provisioned with the <strong className="text-foreground">{ROLE_LABELS[role]}</strong> role.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2 text-xs">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AdminUsersPage() {
  const { data: initialUsers = [] } = useAdminUsers()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const updateRoleMutation = useUpdateUserRole()
  const toggleStatusMutation = useToggleUserStatus()

  // Sync with fetched users
  useEffect(() => {
    if (initialUsers.length > 0) {
      setUsers(initialUsers)
    }
  }, [initialUsers])

  const departments = useMemo(() => {
    return ['all', ...Array.from(new Set(users.map((u) => u.department)))]
  }, [users])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchDept = departmentFilter === 'all' || u.department === departmentFilter
      return matchSearch && matchDept
    })
  }, [users, search, departmentFilter])

  const activeCount = users.filter((u) => u.isActive).length
  const roleCount = new Set(users.map((u) => u.role)).size

  const toggleActive = (user: User) => {
    if (user.isActive) {
      setDeactivateTarget(user)
    } else {
      toggleStatusMutation.mutate({ userId: user.id, isActive: true })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: true } : u))
    }
  }

  const confirmDeactivation = () => {
    if (!deactivateTarget) return
    toggleStatusMutation.mutate({ userId: deactivateTarget.id, isActive: false })
    setUsers((prev) => prev.map((u) => u.id === deactivateTarget.id ? { ...u, isActive: false } : u))
    setDeactivateTarget(null)
  }

  const changeRole = (id: string, role: UserRole) => {
    updateRoleMutation.mutate({ userId: id, role })
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          User Management & RBAC
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage team member roles, departments, permissions, and security provisioning.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Provisioned Users" value={users.length} icon={Users} iconClassName="bg-primary/10" />
        <StatCard title="Active Team Members" value={activeCount} icon={CheckCircle2} iconClassName="bg-success/10" />
        <StatCard title="Roles in Active Use" value={roleCount} icon={Shield} iconClassName="bg-info/10" />
      </div>

      {/* User table Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search user by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40 text-xs h-8">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs capitalize">
                      {d === 'all' ? 'All Departments' : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5 h-8 text-xs shrink-0">
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b text-xs text-muted-foreground">
                <tr className="text-left">
                  <th scope="col" className="px-4 py-2.5">User</th>
                  <th scope="col" className="px-4 py-2.5">Assigned Role</th>
                  <th scope="col" className="px-4 py-2.5 hidden md:table-cell">Department</th>
                  <th scope="col" className="px-4 py-2.5 hidden lg:table-cell">Last Login</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0 font-mono">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-foreground truncate">{user.name}</p>
                          <p className="text-2xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={user.role} onValueChange={(v) => changeRole(user.id, v as UserRole)}>
                        <SelectTrigger className="h-7 text-xs w-44 border-transparent bg-transparent hover:bg-muted/50">
                          <Badge variant={ROLE_BADGE_VARIANT[user.role]} className="text-2xs">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, label]) => (
                            <SelectItem key={r} value={r} className="text-xs">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{user.department}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.isActive ? (
                        <Badge variant="success" className="text-2xs font-mono">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-2xs font-mono text-muted-foreground">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={user.isActive ? 'text-xs h-7 text-destructive hover:bg-destructive/10' : 'text-xs h-7 text-success hover:bg-success/10'}
                        onClick={() => toggleActive(user)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onUserInvited={(newUser) => setUsers((prev) => [newUser, ...prev])}
      />

      {/* Deactivate Confirmation Modal */}
      <Dialog open={Boolean(deactivateTarget)} onOpenChange={() => setDeactivateTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Deactivate User Account
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs">
              Are you sure you want to deactivate <strong className="text-foreground">{deactivateTarget?.name}</strong> ({deactivateTarget?.email})? They will immediately lose access to CaseMind until reactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeactivation}>
              Deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
