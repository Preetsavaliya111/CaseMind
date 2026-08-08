import type { LoginRequest, LoginResponse } from '../types'
import { mockCurrentUser } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await delay(800)
    // Validate mock credentials — any email + 8+ char password works
    if (!credentials.email || credentials.password.length < 8) {
      throw new Error('Invalid credentials')
    }
    return {
      user: { ...mockCurrentUser, email: credentials.email },
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600,
    }
  },

  async logout(): Promise<void> {
    await delay(200)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  async refreshToken(token: string): Promise<Pick<LoginResponse, 'accessToken' | 'expiresIn'>> {
    await delay(300)
    if (!token) throw new Error('Invalid refresh token')
    return {
      accessToken: 'mock_access_token_refreshed_' + Date.now(),
      expiresIn: 3600,
    }
  },
}
