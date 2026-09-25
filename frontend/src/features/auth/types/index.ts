import type { User } from '@/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export interface MFAChallenge {
  mfaRequired: true
  challengeToken: string
  expiresIn: number
}

export type LoginResult = LoginResponse | MFAChallenge

export interface RegisterRequest {
  name: string
  email: string
  password: string
  department: string
  organizationName: string
  organizationDomain?: string
}
