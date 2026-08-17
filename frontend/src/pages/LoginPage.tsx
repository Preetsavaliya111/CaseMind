import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, ShieldCheck, Users, Headphones, BarChart3, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { mockUsers, mockCredentials } from '@/mocks'
import { cn } from '@/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@casemind.io',
    password: 'Admin@1234',
    icon: ShieldCheck,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    desc: 'Full platform access',
  },
  {
    role: 'Manager',
    email: 'manager@casemind.io',
    password: 'Manager@1234',
    icon: BarChart3,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    desc: 'Team & analytics access',
  },
  {
    role: 'Agent',
    email: 'agent@casemind.io',
    password: 'Agent@1234',
    icon: Headphones,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    desc: 'Ticket management',
  },
  {
    role: 'Viewer',
    email: 'viewer@casemind.io',
    password: 'Viewer@1234',
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    desc: 'Read-only access',
  },
]

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const isExpired = searchParams.get('reason') === 'expired'


  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setAuthError('')
    await new Promise((r) => setTimeout(r, 700))

    const correctPassword = mockCredentials[data.email]
    if (!correctPassword || correctPassword !== data.password) {
      setAuthError('Invalid email or password. Use one of the demo accounts below.')
      return
    }

    const user = mockUsers.find((u) => u.email === data.email)
    if (!user) {
      setAuthError('Account not found.')
      return
    }

    login(
      { accessToken: `mock_token_${user.role}_${Date.now()}`, refreshToken: 'mock_refresh', expiresIn: 3600 },
      user,
    )
    navigate('/dashboard')
  }

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
    setAuthError('')
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Brain className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">CaseMind</span>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
              AI-Powered<br />Support Intelligence
            </h1>
            <p className="mt-4 text-sidebar-foreground/60 text-lg leading-relaxed">
              Transform every resolved ticket into reusable organizational knowledge.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Intelligent ticket classification & prioritization',
              'RAG-powered knowledge base search',
              'Real-time SLA monitoring & alerts',
              'ML-driven resolution recommendations',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <span className="text-sm text-sidebar-foreground/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/30">
          © 2024 CaseMind · Enterprise Support Intelligence Platform
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold">CaseMind</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Access your enterprise support dashboard
            </p>
          </div>

          {isExpired && (
            <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 flex items-start gap-2.5 text-xs text-warning">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Session Expired</p>
                <p className="opacity-90">Your previous session has timed out. Please sign in again to continue.</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@casemind.io"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>
              )}
            </div>

            {authError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive" role="alert">{authError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground px-2">Demo Accounts</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(({ role, email, password, icon: Icon, color, bg, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillCredentials(email, password)}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all hover:shadow-sm active:scale-[0.98]',
                    bg,
                  )}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{role}</p>
                    <p className="text-2xs text-muted-foreground truncate">{desc}</p>
                    <p className="text-2xs font-mono text-muted-foreground/70 mt-0.5 truncate">{password}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-2xs text-muted-foreground text-center">
              Click any account to auto-fill credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
