import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, AuthTokens } from '@/types'
import { mockCurrentUser } from '@/mocks'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (tokens: AuthTokens, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // In mock mode, start as authenticated with mock user
  const [user, setUser] = useState<User | null>(mockCurrentUser)

  const login = useCallback((tokens: AuthTokens, user: User) => {
    localStorage.setItem('access_token', tokens.accessToken)
    localStorage.setItem('refresh_token', tokens.refreshToken)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
