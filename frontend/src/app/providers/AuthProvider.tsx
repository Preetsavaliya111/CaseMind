import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthTokens } from '@/types'
import { authService } from '@/features/auth/services/authService'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (tokens: AuthTokens, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: User['roles'][number]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    authService.getCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback((tokens: AuthTokens, user: User) => {
    localStorage.setItem('access_token', tokens.accessToken)
    if (tokens.refreshToken) localStorage.setItem('refresh_token', tokens.refreshToken)
    setUser(user)
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])
  const updateUser = useCallback((nextUser: User) => setUser(nextUser), [])

  const hasPermission = useCallback((permission: string) => Boolean(user?.permissions.includes(permission)), [user])
  const hasRole = useCallback((role: User['roles'][number]) => Boolean(user?.roles.includes(role)), [user])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, login, logout, updateUser, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
