import { expect, test } from '@playwright/test'

for (const width of [390, 768, 1440]) {
  test(`public landing at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('requestfailed', (request) => errors.push(`${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`))
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`) })
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your team solved this before.')
    await expect(page.getByRole('link', { name: 'Create your workspace' }).first()).toHaveAttribute('href', '/register')
    await page.getByRole('button', { name: 'Answer', exact: true }).click()
    await expect(page.getByText('Suggested next step', { exact: true })).toBeVisible()
    if (width < 1024) {
      await page.getByRole('button', { name: 'Open navigation' }).click()
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
    }
    await page.getByText('Does it connect to our existing helpdesk?', { exact: true }).click()
    await expect(page.getByText('External helpdesk, Slack, Jira and GitHub integrations are not available yet.', { exact: false })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`landing-${width}.png`), fullPage: true })
    await page.getByRole('link', { name: 'Sign in', exact: true }).last().click()
    await expect(page).toHaveURL(/\/login$/)
    expect(errors).toEqual([])
  })
}
