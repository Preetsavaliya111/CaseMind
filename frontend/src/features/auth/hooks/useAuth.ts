import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '@/app/providers'
import type { LoginRequest } from '../types'

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      login({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn }, data.user)
      navigate('/dashboard')
    },
  })
}

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout()
      navigate('/login')
    },
  })
}
