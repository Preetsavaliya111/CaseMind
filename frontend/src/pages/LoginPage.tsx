import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Brain,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Headphones,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react'
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
    color: 'text-red-600',
    bg: 'bg-red-50 hover:bg-red-100/70 border-red-200',
    badge: 'Full Access',
  },
  {
    role: 'Manager',
    email: 'manager@casemind.io',
    password: 'Manager@1234',
    icon: BarChart3,
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100/70 border-purple-200',
    badge: 'Team & Analytics',
  },
  {
    role: 'Agent',
    email: 'agent@casemind.io',
    password: 'Agent@1234',
    icon: Headphones,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100/70 border-blue-200',
    badge: 'Tickets & AI',
  },
  {
    role: 'Viewer',
    email: 'viewer@casemind.io',
    password: 'Viewer@1234',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200',
    badge: 'Read-only',
  },
]

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null)
  const isExpired = searchParams.get('reason') === 'expired'

  // If already authenticated, go directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@casemind.io',
      password: 'Admin@1234',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setAuthError('')
    await new Promise((r) => setTimeout(r, 400))

    const correctPassword = mockCredentials[data.email]
    if (!correctPassword || correctPassword !== data.password) {
      setAuthError('Invalid email or password. Click any demo account below to sign in.')
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
    navigate('/dashboard', { replace: true })
  }

  // Quick 1-click Demo Login
  const handleQuickLogin = async (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
    setValue('password', pass, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
    setAuthError('')
    setQuickLoginLoading(email)

    await new Promise((r) => setTimeout(r, 300))
    const user = mockUsers.find((u) => u.email === email)
    if (user) {
      login(
        { accessToken: `mock_token_${user.role}_${Date.now()}`, refreshToken: 'mock_refresh', expiresIn: 3600 },
        user,
      )
      navigate('/dashboard', { replace: true })
    }
    setQuickLoginLoading(null)
  }

  return (
    <div className="min-h-screen flex bg-bg-page text-text-primary">
      {/* Left panel — Enterprise branding showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-bg-secondary border-r border-border-subtle p-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary shadow-default">
            <Brain className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xl font-bold text-text-primary font-display tracking-tight">CaseMind</span>
            <span className="block text-[10px] text-text-muted font-medium uppercase tracking-wider">Enterprise Support Intelligence</span>
          </div>
        </div>

        <div className="space-y-8 z-10 my-auto py-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-accent-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Organizational Memory Engine
            </div>
            <h1 className="text-4xl font-bold text-text-primary leading-tight font-display tracking-tight">
              AI-Powered<br />Support Intelligence
            </h1>
            <p className="text-text-secondary text-base leading-relaxed max-w-lg">
              Transform every resolved support case into reusable organizational knowledge with instant root-cause analysis and automated resolution synthesis.
            </p>
          </div>

          <div className="space-y-3.5 bg-bg-primary/80 p-5 rounded-2xl border border-border-subtle shadow-subtle backdrop-blur-xs max-w-lg">
            {[
              'Autonomous ticket classification & SLA risk prediction',
              'RAG-powered organizational knowledge retrieval',
              'Real-time incident precedent & root cause discovery',
              'Dedicated full-page AI Assistant workspace',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-accent-secondary shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-text-secondary">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-6 border-t border-border-subtle z-10">
          <p>© 2024 CaseMind Technologies Inc.</p>
          <span className="font-mono text-2xs bg-bg-primary px-2 py-0.5 rounded border border-border-subtle">
            SOC2 Type II Certified
          </span>
        </div>
      </div>

      {/* Right panel — login form & 1-click accounts */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary shadow-default">
              <Brain className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="text-lg font-bold text-text-primary">CaseMind</span>
              <span className="block text-2xs text-text-muted">Enterprise Platform</span>
            </div>
          </div>

          {/* Form header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display text-text-primary tracking-tight">Sign in to CaseMind</h2>
            <p className="text-xs text-text-muted">
              Access your intelligent support operations dashboard
            </p>
          </div>

          {isExpired && (
            <div className="rounded-xl bg-warning-bg border border-warning-border p-3.5 flex items-start gap-3 text-xs text-warning-text">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Session Expired</p>
                <p className="opacity-90">Your previous session has timed out. Please sign in again.</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-text-primary">
                Work Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@casemind.io"
                autoComplete="email"
                error={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-error-text" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-text-primary">
                  Password
                </label>
                <span className="text-2xs text-accent-primary font-medium">Default: Admin@1234</span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  error={Boolean(errors.password)}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error-text" role="alert">{errors.password.message}</p>
              )}
            </div>

            {authError && (
              <div className="rounded-xl bg-error-bg border border-error-border p-3 text-xs text-error-text flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <Button type="submit" variant="default" className="w-full h-10 font-semibold shadow-default" loading={isSubmitting}>
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Authenticating…' : 'Sign in to Platform'}</span>
            </Button>
          </form>

          {/* Demo 1-Click Accounts */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
                1-Click Demo Accounts
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map(({ role, email, password, icon: Icon, color, bg, badge }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuickLogin(email, password)}
                  disabled={quickLoginLoading !== null}
                  className={cn(
                    'flex flex-col p-3 rounded-xl border text-left transition-all duration-200 shadow-subtle hover:shadow-medium active:scale-[0.98] group relative overflow-hidden',
                    bg,
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
                      <span className="text-xs font-bold text-text-primary">{role}</span>
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/80 text-text-secondary border border-black/5">
                      {badge}
                    </span>
                  </div>
                  <p className="text-2xs text-text-muted truncate font-mono">{email}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent-primary opacity-90 group-hover:opacity-100">
                    <span>{quickLoginLoading === email ? 'Signing in…' : '1-Click Login'}</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-2xs text-text-muted text-center">
              Click any demo account card above for instant authenticated access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
