import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle2, Copy, KeyRound, Search, Shield, UserPlus, Users, XCircle } from 'lucide-react'

import { Badge, Button, Card, CardContent, CardHeader, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SkeletonCard } from '@/components/ui'
import { StatCard } from '@/components/common'
import { adminService, type AdminUser, type Invitation, type InvitationCreate } from '@/features/settings/services/adminService'
import type { ApiError, WorkspaceRole } from '@/types'
import { formatDate } from '@/utils'

const inviteRoles: Array<{ value: Exclude<WorkspaceRole, 'super_admin'>; label: string; description: string }> = [
  { value: 'customer', label: 'Customer', description: 'Own cases and public knowledge' },
  { value: 'support_agent', label: 'Support Agent', description: 'Assigned and team cases' },
  { value: 'senior_agent', label: 'Senior Agent', description: 'Complex cases and reassignment' },
  { value: 'team_lead', label: 'Team Lead', description: 'Team operations and workload' },
  { value: 'support_manager', label: 'Support Manager', description: 'Department and support management' },
  { value: 'knowledge_manager', label: 'Knowledge Manager', description: 'Knowledge publishing workspace' },
  { value: 'ai_manager', label: 'AI / RAG Manager', description: 'Models, retrieval, and evaluation' },
  { value: 'org_admin', label: 'Organization Admin', description: 'Organization-wide administration' },
]
const emptyInvite: InvitationCreate = { name: '', email: '', role: 'support_agent', department: 'Support' }

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState<InvitationCreate>(emptyInvite)
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteValidated, setInviteValidated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resetUserName, setResetUserName] = useState('')
  const [resetLink, setResetLink] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([adminService.users(), adminService.invitations()])
      .then(([people, invites]) => { setUsers(people); setInvitations(invites) })
      .catch((caught: ApiError) => setError(caught.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.department}`.toLowerCase().includes(search.toLowerCase())), [users, search])
  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending')

  const update = async (user: AdminUser, data: { workspace_role?: Exclude<WorkspaceRole, 'super_admin'>; is_active?: boolean }) => {
    setSavingId(user.id); setError(null)
    try {
      const updated = await adminService.updateUser(user.id, data)
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (caught) { setError((caught as ApiError).message) }
    finally { setSavingId(null) }
  }

  const createInvite = async (event: React.FormEvent) => {
    event.preventDefault(); setInviteError('')
    setInviteValidated(true)
    const name = inviteForm.name.trim()
    const email = inviteForm.email.trim().toLowerCase()
    const department = inviteForm.department.trim()
    if (name.length < 2) { setInviteError('Enter the person’s full name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInviteError('Enter a valid email address.'); return }
    if (department.length < 2) { setInviteError('Enter a department name.'); return }
    setInviting(true)
    try {
      const invitation = await adminService.createInvitation({ ...inviteForm, name, email, department })
      setInvitations((current) => [invitation, ...current])
      setInviteLink(`${window.location.origin}/invite/${invitation.token}`)
      setInviteValidated(false)
    } catch (caught) { setInviteError((caught as ApiError).message) }
    finally { setInviting(false) }
  }

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const closeInvite = (open: boolean) => {
    setInviteOpen(open)
    if (!open) { setInviteForm(emptyInvite); setInviteLink(''); setInviteError(''); setInviteValidated(false); setCopied(false) }
  }

  const issueReset = async (user: AdminUser) => {
    setSavingId(user.id); setError(null)
    try {
      const result = await adminService.passwordResetLink(user.id)
      setResetUserName(user.name); setResetLink(result.reset_link); setCopied(false)
    } catch (caught) { setError((caught as ApiError).message) }
    finally { setSavingId(null) }
  }

  const copyReset = async () => {
    await navigator.clipboard.writeText(resetLink)
    setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  const revoke = async (invitation: Invitation) => {
    setSavingId(invitation.id); setError(null)
    try {
      await adminService.revokeInvitation(invitation.id)
      setInvitations((current) => current.map((item) => item.id === invitation.id ? { ...item, status: 'revoked' } : item))
    } catch (caught) { setError((caught as ApiError).message) }
    finally { setSavingId(null) }
  }

  if (loading) return <div className="mx-auto grid max-w-7xl gap-4 p-6 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Organization administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Users & Roles</h1><p className="mt-1 text-sm text-muted-foreground">Invite people with an exact workspace role and manage active organization access.</p></div><Button onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" />Invite person</Button></div>
    <div className="grid gap-4 sm:grid-cols-4"><StatCard title="Organization users" value={users.length} icon={Users} /><StatCard title="Active users" value={users.filter((user) => user.is_active).length} icon={CheckCircle2} /><StatCard title="Pending invites" value={pendingInvitations.length} icon={UserPlus} /><StatCard title="Active roles" value={new Set(users.filter((user) => user.is_active).map((user) => user.workspace_role)).size} icon={Shield} /></div>
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
    {pendingInvitations.length > 0 && <Card><CardHeader><div><h2 className="font-semibold">Pending invitations</h2><p className="mt-1 text-xs text-muted-foreground">Links expire seven days after creation and can only be accepted once.</p></div></CardHeader><CardContent><div className="divide-y rounded-lg border">{pendingInvitations.map((invitation) => <div key={invitation.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{invitation.name} <span className="font-normal text-muted-foreground">· {invitation.email}</span></p><p className="mt-1 text-xs text-muted-foreground">{invitation.role_name} · expires {formatDate(invitation.expires_at)}</p></div><Button size="sm" variant="ghost" disabled={savingId === invitation.id} onClick={() => revoke(invitation)}><XCircle className="h-4 w-4" />Revoke</Button></div>)}</div></CardContent></Card>}
    <Card><CardHeader><div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people…" /></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">User</th><th className="px-4 py-3">Workspace role</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3 text-right">Access</th></tr></thead><tbody className="divide-y">{filtered.map((user) => <tr key={user.id}><td className="px-4 py-3"><p className="font-medium">{user.name}</p><p className="text-2xs text-muted-foreground">{user.email}</p></td><td className="px-4 py-3"><Select value={user.workspace_role} disabled={savingId === user.id} onValueChange={(role) => update(user, { workspace_role: role as Exclude<WorkspaceRole, 'super_admin'> })}><SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger><SelectContent>{inviteRoles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent></Select></td><td className="px-4 py-3 text-xs text-muted-foreground">{user.department}</td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.created_at)}</td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><Badge variant={user.is_active ? 'success' : 'secondary'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>{user.is_active && <Button size="sm" variant="ghost" disabled={savingId === user.id} onClick={() => issueReset(user)} title="Create a one-time password reset link"><KeyRound className="h-4 w-4" />Reset</Button>}<Button size="sm" variant="ghost" disabled={savingId === user.id} onClick={() => update(user, { is_active: !user.is_active })}>{user.is_active ? 'Deactivate' : 'Activate'}</Button></div></td></tr>)}</tbody></table></div>{filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No matching users.</p>}</CardContent></Card>
    <Dialog open={inviteOpen} onOpenChange={closeInvite}><DialogContent><DialogHeader><DialogTitle>{inviteLink ? 'Invitation ready' : 'Invite someone to CaseMind'}</DialogTitle><DialogDescription>{inviteLink ? 'Copy this secure link and send it to the invited person. It is shown only now.' : 'Choose their operational role. CaseMind will apply its permissions and default workspace.'}</DialogDescription></DialogHeader>{inviteLink ? <div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-3"><p className="break-all font-mono text-xs">{inviteLink}</p></div><Button className="w-full" onClick={copyInvite}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy invitation link'}</Button><p className="text-center text-xs text-muted-foreground">For security, CaseMind stores only a fingerprint of this link.</p></div> : <form className="space-y-4" onSubmit={createInvite} noValidate><label className="block space-y-1.5 text-sm">Full name <span className="text-destructive">*</span><Input minLength={2} value={inviteForm.name} aria-invalid={inviteValidated && inviteForm.name.trim().length < 2} onChange={(event) => { setInviteForm((current) => ({ ...current, name: event.target.value })); setInviteError('') }} /></label><label className="block space-y-1.5 text-sm">Email <span className="text-destructive">*</span><Input type="email" value={inviteForm.email} aria-invalid={inviteValidated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email.trim())} onChange={(event) => { setInviteForm((current) => ({ ...current, email: event.target.value })); setInviteError('') }} /></label><label className="block space-y-1.5 text-sm">Role <span className="text-destructive">*</span><Select value={inviteForm.role} onValueChange={(role) => setInviteForm((current) => ({ ...current, role: role as InvitationCreate['role'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{inviteRoles.map((role) => <SelectItem key={role.value} value={role.value}><span className="font-medium">{role.label}</span><span className="ml-2 text-xs text-muted-foreground">— {role.description}</span></SelectItem>)}</SelectContent></Select></label><label className="block space-y-1.5 text-sm">Department <span className="text-destructive">*</span><Input minLength={2} value={inviteForm.department} aria-invalid={inviteValidated && inviteForm.department.trim().length < 2} onChange={(event) => { setInviteForm((current) => ({ ...current, department: event.target.value })); setInviteError('') }} /></label>{inviteError && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{inviteError}</p>}<Button className="w-full" type="submit" loading={inviting}><UserPlus className="h-4 w-4" />Create secure invitation</Button></form>}</DialogContent></Dialog>
    <Dialog open={Boolean(resetLink)} onOpenChange={(open) => { if (!open) { setResetLink(''); setResetUserName(''); setCopied(false) } }}><DialogContent><DialogHeader><DialogTitle>Password reset link ready</DialogTitle><DialogDescription>Share this one-time link with {resetUserName}. It expires in 30 minutes and becomes invalid after use.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-3"><p className="break-all font-mono text-xs">{resetLink}</p></div><Button className="w-full" onClick={copyReset}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy reset link'}</Button><p className="text-center text-xs text-muted-foreground">CaseMind stores only a fingerprint. Creating another link invalidates this one.</p></div></DialogContent></Dialog>
  </div>
}
