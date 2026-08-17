import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, AuthTokens } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (tokens: AuthTokens, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore persisted user from localStorage on refresh
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('casemind_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = useCallback((tokens: AuthTokens, user: User) => {
    try {
      localStorage.setItem('access_token', tokens.accessToken)
      localStorage.setItem('refresh_token', tokens.refreshToken)
      localStorage.setItem('casemind_user', JSON.stringify(user))
    } catch {
      // storage error fallback
    }
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('casemind_user')
    } catch {
      // storage error fallback
    }
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
