import { useState, type ReactNode } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { actionLabels, events, eventLabels, fieldLabels, fields, newAction, priorities, statuses, type Action, type Condition, type WorkflowDraft, type WorkflowOptions } from './workflowService'

export function Choice({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="block space-y-2 text-sm"><span>{label}</span><select required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>
}
function options(values: readonly string[]) { return values.map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>) }
function targets(values: { id: string; name: string }[]) { return <><option value="">Select a member or team…</option>{values.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</> }

export function WorkflowEditor({ initial, choices, saving, error, onSave, onCancel }: { initial: WorkflowDraft; choices: WorkflowOptions; saving: boolean; error: string; onSave: (draft: WorkflowDraft) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<WorkflowDraft>(initial)
  const change = <K extends keyof WorkflowDraft>(key: K, value: WorkflowDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const condition = (index: number, value: Condition) => change('conditions', draft.conditions.map((item, i) => i === index ? value : item))
  const action = (index: number, value: Action) => change('actions', draft.actions.map((item, i) => i === index ? value : item))
  return <form onSubmit={(event) => { event.preventDefault(); onSave(draft) }} className="space-y-6">
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    <fieldset disabled={saving} className="space-y-5">
      <label className="block space-y-2 text-sm">Workflow name<Input required minLength={3} maxLength={100} value={draft.name} onChange={(event) => change('name', event.target.value)} /></label>
      <label className="block space-y-2 text-sm">Description<Textarea maxLength={500} value={draft.description} onChange={(event) => change('description', event.target.value)} /></label>
      <Choice label="When this happens" value={draft.event_type} onChange={(value) => change('event_type', value as WorkflowDraft['event_type'])}>{events.map((event) => <option key={event} value={event}>{eventLabels[event]}</option>)}</Choice>
      <section className="space-y-4 rounded-xl border border-border p-4"><div><h3 className="text-sm font-semibold">If all conditions match</h3><p className="mt-1 text-xs text-muted-foreground">No conditions means every case for this event. Maximum six conditions.</p></div>
        {draft.conditions.map((item, index) => <fieldset key={index} className="space-y-3 border-t border-border pt-4"><legend className="text-xs text-muted-foreground">Condition {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2">
          <Choice label={`Condition ${index + 1} field`} value={item.field} onChange={(value) => condition(index, { field: value as Condition['field'], operator: value === 'tags' ? 'contains' : 'equals', value: value === 'priority' ? 'high' : value === 'status' ? 'new' : '' })}>{fields.map((field) => <option key={field} value={field}>{fieldLabels[field]}</option>)}</Choice>
          {item.field === 'priority' || item.field === 'status' ? <Choice label={`Condition ${index + 1} value`} value={item.value} onChange={(value) => condition(index, { ...item, value })}>{options(item.field === 'priority' ? priorities : statuses)}</Choice>
            : item.field === 'team_id' || item.field === 'assignee_id' ? <Choice label={`Condition ${index + 1} value`} value={item.value} onChange={(value) => condition(index, { ...item, value })}>{targets(item.field === 'team_id' ? choices.teams : choices.users)}</Choice>
              : <label className="block space-y-2 text-sm">{item.field === 'tags' ? 'Tag contains' : 'Category equals'}<Input required maxLength={64} value={item.value} onChange={(event) => condition(index, { ...item, value: event.target.value })} /></label>}
        </div><Button type="button" variant="ghost" size="sm" onClick={() => change('conditions', draft.conditions.filter((_, i) => i !== index))}>Remove condition {index + 1}</Button></fieldset>)}
        <Button type="button" variant="outline" size="sm" disabled={draft.conditions.length >= 6} onClick={() => change('conditions', [...draft.conditions, { field: 'priority', operator: 'equals', value: 'high' }])}>Add condition</Button>
      </section>
      <section className="space-y-4 rounded-xl border border-border p-4"><div><h3 className="text-sm font-semibold">Then take these actions, in order</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Maximum five actions. All actions roll back if one fails. Notifications require the recipient to be able to view the case.</p></div>
        {draft.actions.map((item, index) => <fieldset key={index} className="space-y-3 border-t border-border pt-4"><legend className="text-xs text-muted-foreground">Action {index + 1}</legend>
          <Choice label={`Action ${index + 1} type`} value={item.type} onChange={(value) => action(index, newAction(value as Action['type']))}>{Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Choice>
          {item.type === 'assign_user' && <Choice label={`Action ${index + 1} user`} value={item.user_id} onChange={(user_id) => action(index, { ...item, user_id })}>{targets(choices.users)}</Choice>}
          {item.type === 'assign_team' && <Choice label={`Action ${index + 1} team`} value={item.team_id} onChange={(team_id) => action(index, { ...item, team_id })}>{targets(choices.teams)}</Choice>}
          {item.type === 'set_status' && <Choice label={`Action ${index + 1} status`} value={item.status} onChange={(status) => action(index, { ...item, status: status as typeof item.status })}>{options(statuses)}</Choice>}
          {item.type === 'set_priority' && <Choice label={`Action ${index + 1} priority`} value={item.priority} onChange={(priority) => action(index, { ...item, priority: priority as typeof item.priority })}>{options(priorities)}</Choice>}
          {item.type === 'internal_note' && <label className="block space-y-2 text-sm">Internal note {index + 1}<Textarea required maxLength={1000} value={item.content} onChange={(event) => action(index, { ...item, content: event.target.value })} /></label>}
          {item.type === 'notify_user' && <><Choice label={`Action ${index + 1} recipient`} value={item.user_id} onChange={(user_id) => action(index, { ...item, user_id })}>{targets(choices.recipients)}</Choice><label className="block space-y-2 text-sm">Notification message {index + 1}<Textarea required maxLength={300} value={item.message} onChange={(event) => action(index, { ...item, message: event.target.value })} /></label></>}
          <Button type="button" variant="ghost" size="sm" disabled={draft.actions.length === 1} onClick={() => change('actions', draft.actions.filter((_, i) => i !== index))}>Remove action {index + 1}</Button>
        </fieldset>)}
        <Button type="button" variant="outline" size="sm" disabled={draft.actions.length >= 5} onClick={() => change('actions', [...draft.actions, newAction('internal_note')])}>Add action</Button>
      </section>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(event) => change('enabled', event.target.checked)} />Enable for future matching events</label>
      <p className="text-xs leading-6 text-muted-foreground">Runs use the triggering person’s current permissions, not the workflow creator’s. Customer events cannot grant staff privileges. Workflow updates do not trigger other workflows. Email and external actions are unavailable.</p>
    </fieldset>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button><Button type="submit" loading={saving}>Save workflow</Button></div>
  </form>
}
