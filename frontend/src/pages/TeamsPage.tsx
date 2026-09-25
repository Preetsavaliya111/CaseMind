import { useEffect, useState } from 'react'
import { Crown, Network, Plus, Trash2, UserPlus, Users } from 'lucide-react'

import { useAuth } from '@/app/providers'
import { Badge, Button, Card, CardContent, CardHeader, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SkeletonCard } from '@/components/ui'
import { adminService, type AdminUser } from '@/features/settings/services/adminService'
import { teamService, type Department, type Team } from '@/features/settings/services/teamService'
import type { ApiError } from '@/types'
import { hasApiPermission } from '@/permissions'

export function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({})
  const canCreate = hasApiPermission(user, 'team.create')
  const canManage = hasApiPermission(user, 'team.manage')

  useEffect(() => {
    const requests: Promise<unknown>[] = [teamService.teams().then(setTeams), teamService.departments().then((items) => { setDepartments(items); setDepartmentId(items[0]?.id ?? '') })]
    if (hasApiPermission(user, 'user.view')) requests.push(adminService.users().then(setUsers))
    Promise.all(requests).catch((caught: ApiError) => setError(caught.message)).finally(() => setLoading(false))
  }, [user])

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setCreateError('')
    const normalizedName = name.trim()
    if (normalizedName.length < 2) { setCreateError('Enter a team name with at least 2 characters.'); return }
    if (!departmentId) { setCreateError('Choose a department for this team.'); return }
    try { const team = await teamService.createTeam({ name: normalizedName, department_id: departmentId }); setTeams((items) => [...items, team]); setName(''); setCreateOpen(false) }
    catch (caught) { setCreateError((caught as ApiError).message) }
  }
  const replace = (team: Team) => setTeams((items) => items.map((item) => item.id === team.id ? team : item))
  const addMember = async (team: Team) => {
    const userId = selectedUsers[team.id]; if (!userId) return
    try { replace(await teamService.addMember(team.id, userId)); setSelectedUsers((value) => ({ ...value, [team.id]: '' })) }
    catch (caught) { setError((caught as ApiError).message) }
  }
  const removeMember = async (team: Team, userId: string) => {
    try { replace(await teamService.removeMember(team.id, userId)) }
    catch (caught) { setError((caught as ApiError).message) }
  }

  if (loading) return <div className="mx-auto grid max-w-7xl gap-4 p-6 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}</div>
  return <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div className="flex items-end justify-between"><div><p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Organization structure</p><h1 className="mt-1 text-2xl font-bold">Teams & Departments</h1><p className="mt-1 text-sm text-muted-foreground">Control Case queues and the scope of internal knowledge and AI evidence.</p></div>{canCreate && <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Create team</Button>}</div>
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
    <div className="grid gap-5 lg:grid-cols-2">{teams.map((team) => <Card key={team.id}><CardHeader><div className="flex items-start justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><Network className="h-4 w-4" />{team.name}</h2><p className="mt-1 text-xs text-muted-foreground">{team.department_name ?? 'No department'} · {team.members.length} members</p></div><Badge variant={team.is_active ? 'success' : 'secondary'}>{team.is_active ? 'Active' : 'Inactive'}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="divide-y rounded-lg border">{team.members.map((member) => <div key={member.id} className="flex items-center justify-between p-3"><div><p className="flex items-center gap-1.5 text-sm font-medium">{member.name}{member.is_lead && <Crown className="h-3.5 w-3.5 text-primary" />}</p><p className="text-2xs text-muted-foreground">{member.email}</p></div>{canManage && <Button size="icon" variant="ghost" aria-label={`Remove ${member.name}`} onClick={() => removeMember(team, member.id)}><Trash2 className="h-4 w-4" /></Button>}</div>)}{team.members.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No members assigned.</p>}</div>{canManage && users.length > 0 && <div className="flex gap-2"><Select value={selectedUsers[team.id] || undefined} onValueChange={(value) => setSelectedUsers((current) => ({ ...current, [team.id]: value }))}><SelectTrigger className="flex-1"><SelectValue placeholder="Choose a person" /></SelectTrigger><SelectContent>{users.filter((person) => person.is_active && !team.members.some((member) => member.id === person.id)).map((person) => <SelectItem key={person.id} value={person.id}>{person.name} · {person.workspace_role.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => addMember(team)} disabled={!selectedUsers[team.id]}><UserPlus className="h-4 w-4" />Add</Button></div>}</CardContent></Card>)}</div>
    {teams.length === 0 && <Card><CardContent className="flex flex-col items-center py-14 text-center"><Users className="h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No teams available</h2><p className="mt-1 text-sm text-muted-foreground">Create a team or ask an administrator to assign you.</p></CardContent></Card>}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCreateError(''); setName('') } }}><DialogContent><DialogHeader><DialogTitle>Create team</DialogTitle><DialogDescription>New Cases and internal evidence can be scoped to this team.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={create} noValidate><label className="block space-y-1.5 text-sm">Team name <span className="text-destructive">*</span><Input minLength={2} value={name} aria-invalid={Boolean(createError && name.trim().length < 2)} onChange={(event) => { setName(event.target.value); setCreateError('') }} autoFocus /></label><label className="block space-y-1.5 text-sm">Department <span className="text-destructive">*</span><Select value={departmentId} onValueChange={(value) => { setDepartmentId(value); setCreateError('') }}><SelectTrigger aria-invalid={Boolean(createError && !departmentId)}><SelectValue placeholder="Choose department" /></SelectTrigger><SelectContent>{departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}</SelectContent></Select></label>{createError && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{createError}</p>}<Button className="w-full" type="submit"><Plus className="h-4 w-4" />Create team</Button></form></DialogContent></Dialog>
  </div>
}
