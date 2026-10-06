// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { WorkflowsPage } from './WorkflowsPage'
import { starterTemplates, type Workflow } from '@/features/workflows/workflowService'

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'actor', organizationId: 'org', permissions: ['workflow.view', 'workflow.manage', 'ticket.view_all_org', 'ticket.internal_note'] } },
  service: { list: vi.fn(), options: vi.fn(), create: vi.fn(), update: vi.fn(), toggle: vi.fn(), runs: vi.fn() },
}))
vi.mock('@/app/providers', () => ({ useAuth: () => mocks.auth }))
vi.mock('@/features/workflows/workflowService', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/features/workflows/workflowService')>(), workflowService: mocks.service,
}))
const item: Workflow = { ...starterTemplates[0], id: 'workflow-1', revision: 1, created_at: '2026-10-03T12:00:00Z', updated_at: '2026-10-03T12:00:00Z' }
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter><WorkflowsPage /></MemoryRouter></QueryClientProvider>)
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.user.permissions = ['workflow.view', 'workflow.manage', 'ticket.view_all_org', 'ticket.internal_note']
  mocks.service.list.mockResolvedValue({ items: [], total: 0 })
  mocks.service.options.mockResolvedValue({ users: [{ id: 'actor', name: 'Alex' }], teams: [], recipients: [{ id: 'actor', name: 'Alex' }] })
  mocks.service.create.mockResolvedValue(item)
  mocks.service.update.mockResolvedValue({ ...item, revision: 2 })
  mocks.service.toggle.mockResolvedValue({ ...item, enabled: true, revision: 2 })
  mocks.service.runs.mockResolvedValue({ items: [], total: 0 })
})
afterEach(cleanup)

describe('workflows workspace', () => {
  it('shows permission denial without requesting organization data', () => {
    mocks.auth.user.permissions = []; show()
    expect(screen.getByText('Workflow access required')).toBeTruthy()
    expect(mocks.service.list).not.toHaveBeenCalled()
    expect(mocks.service.options).not.toHaveBeenCalled()
  })
  it('creates a disabled starter with editable conditions and actions', async () => {
    show(); const user = userEvent.setup()
    await screen.findByText('Your first workflow starts with a useful rule')
    await user.click(screen.getByRole('button', { name: 'Use High-priority triage' }))
    expect(screen.getByRole('checkbox').getAttribute('checked')).toBeNull()
    await user.selectOptions(screen.getByLabelText('Condition 1 value'), 'critical')
    await user.click(screen.getByRole('button', { name: 'Add action' }))
    await user.selectOptions(screen.getByLabelText('Action 2 type'), 'set_priority')
    await user.selectOptions(screen.getByLabelText('Action 2 priority'), 'high')
    await user.click(screen.getByRole('button', { name: 'Save workflow' }))
    await waitFor(() => expect(mocks.service.create).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, conditions: [{ field: 'priority', operator: 'equals', value: 'critical' }], actions: [expect.anything(), { type: 'set_priority', priority: 'high' }] })))
    expect(await screen.findByText('Workflow saved.')).toBeTruthy()
  })
  it('edits with revision checks and toggles enabled state', async () => {
    mocks.service.list.mockResolvedValue({ items: [item], total: 1 })
    show(); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^Edit/ }))
    await user.clear(screen.getByRole('textbox', { name: 'Workflow name' }))
    await user.type(screen.getByRole('textbox', { name: 'Workflow name' }), 'Critical triage')
    await user.click(screen.getByRole('button', { name: 'Save workflow' }))
    await waitFor(() => expect(mocks.service.update).toHaveBeenCalledWith(item.id, expect.objectContaining({ name: 'Critical triage' }), 1))
    await user.click(screen.getByRole('button', { name: /^Enable/ }))
    expect(await screen.findByText('Workflow enabled.')).toBeTruthy()
    expect(mocks.service.toggle).toHaveBeenCalledWith(item, expect.anything())
  })
  it('shows run failures, recorded actions and case links', async () => {
    mocks.service.list.mockResolvedValue({ items: [item], total: 1 })
    mocks.service.runs.mockResolvedValue({ total: 1, items: [{ id: 'run-1', case_id: 'case-1', event_id: 'event-1', actor_id: 'actor', event_type: 'case.created', workflow_revision: 1, definition: starterTemplates[0], status: 'failed', executed_actions: [], failure_code: 'invalid_action_target', failure_detail: 'Actions were rolled back. Check active organization targets.', started_at: item.created_at, finished_at: item.created_at }] })
    show(); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^Run history/ }))
    expect(await screen.findByText('invalid_action_target')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open triggering case' }).getAttribute('href')).toBe('/tickets/case-1')
    await user.click(screen.getByText('Event and configuration details'))
    expect(screen.getByText('event-1')).toBeTruthy()
  })
  it('supports loading and retry after a list error', async () => {
    mocks.service.list.mockRejectedValueOnce({ message: 'Workflows are temporarily unavailable.' })
    show(); const user = userEvent.setup()
    expect(screen.getByRole('status').textContent).toBe('Loading workflows…')
    expect(await screen.findByText('Workflows are temporarily unavailable.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Retry workflows' }))
    expect(await screen.findByText('Your first workflow starts with a useful rule')).toBeTruthy()
  })
  it('keeps user input when the API rejects a save', async () => {
    mocks.service.create.mockRejectedValue({ message: 'Select an active team in this organization' })
    show(); const user = userEvent.setup()
    await screen.findByText('Your first workflow starts with a useful rule')
    await user.click(screen.getByRole('button', { name: 'Use Resolution review' }))
    await user.click(screen.getByRole('button', { name: 'Save workflow' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect((screen.getByRole('textbox', { name: 'Workflow name' }) as HTMLInputElement).value).toBe('Resolution review')
  })
})
