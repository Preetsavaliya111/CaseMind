// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from './LandingPage'

const auth = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }))
vi.mock('@/app/providers', () => ({ useAuth: () => auth }))
vi.mock('@/components/common', () => ({ ThemeToggle: () => null }))
afterEach(() => { cleanup(); auth.isAuthenticated = false; auth.isLoading = false })
const show = () => render(<MemoryRouter><LandingPage /></MemoryRouter>)

describe('public landing', () => {
  it('offers registration and sign-in with an honestly labeled preview', () => {
    show()
    expect(screen.getAllByRole('link', { name: /Create your workspace/ }).every((link) => link.getAttribute('href') === '/register')).toBe(true)
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0].getAttribute('href')).toBe('/login')
    expect(screen.getByText('Illustrative product preview · sample content')).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
  it('sends authenticated visitors into their workspace', () => {
    auth.isAuthenticated = true; show()
    expect(screen.getAllByRole('link', { name: /Open workspace/ }).every((link) => link.getAttribute('href') === '/dashboard')).toBe(true)
    expect(screen.queryByRole('link', { name: /Create your workspace/ })).toBeNull()
  })
  it('supports preview interaction and Escape on mobile navigation', async () => {
    show(); const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Answer' }))
    expect(screen.getByText('Suggested next step')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open navigation' }))
  })
})
