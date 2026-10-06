import { expect, test } from '@playwright/test'

test('authenticated workflow creation, execution and history', async ({ page, request }) => {
  test.skip(process.env.CASEMIND_BROWSER_API !== '1', 'Requires the disposable browser API server')
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`) })
  const email = `browser-${Date.now()}@example.com`
  const registered = await request.post('/api/v1/auth/register', { data: { name: 'Browser Admin', email, password: 'DisposableBrowser!123', organization_name: 'Browser-only workspace', department: 'Support' } })
  expect(registered.status()).toBe(201)
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('DisposableBrowser!123')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
  // Finish onboarding through the real API, using the local browser's test-only session.
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  const headers = { Authorization: `Bearer ${token}` }
  expect((await request.patch('/api/v1/auth/onboarding', { headers, data: { completed: true, step: 4, checklist_dismissed: true, tour_viewed: 'main' } })).ok()).toBe(true)
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Open workspace' }).first()).toHaveAttribute('href', '/dashboard')
  await page.goto('/workflows')
  await page.getByRole('button', { name: 'Use High-priority triage' }).click()
  await page.getByRole('checkbox', { name: 'Enable for future matching events' }).check()
  await page.getByRole('button', { name: 'Save workflow' }).click()
  await expect(page.getByText('Workflow saved.')).toBeVisible()
  const created = await request.post('/api/v1/cases', { headers, data: { subject: 'Browser-tested automation case', description: 'A high priority issue requiring an internal triage reminder.', priority: 'high' } })
  expect(created.status()).toBe(201)
  const data = await created.json()
  expect(data.comments[0].is_internal).toBe(true)
  await page.getByRole('button', { name: /Run history/ }).click()
  await expect(page.getByText('succeeded', { exact: true })).toBeVisible()
  await expect(page.getByText('1. Add internal note — succeeded')).toBeVisible()
  await page.getByRole('link', { name: 'Open triggering case' }).click()
  await expect(page).toHaveURL(new RegExp(`/tickets/${data.id}$`))
  await expect(page.getByText('Triage checklist: confirm impact, inspect related evidence and agree on the next step.')).toBeVisible()
  expect(errors).toEqual([])
})
