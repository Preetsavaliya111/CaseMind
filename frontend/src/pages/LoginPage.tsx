import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { authService } from '@/features/auth/services/authService'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/common'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [mfaChallenge, setMfaChallenge] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const isExpired = searchParams.get('reason') === 'expired'
  const isRegistered = searchParams.get('registered') === 'true'


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setAuthError('')
    try {
      const result = await authService.login(data)
      if ('mfaRequired' in result) {
        setMfaChallenge(result.challengeToken)
        return
      }
      login({ accessToken: result.accessToken, expiresIn: result.expiresIn }, result.user)
      navigate('/dashboard')
    } catch (error) {
      const message = typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : 'Unable to sign in. Please try again.'
      setAuthError(message)
    }
  }

  const verifyMFA = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError(''); setIsVerifying(true)
    try {
      const result = await authService.verifyMFA(mfaChallenge, mfaCode)
      login({ accessToken: result.accessToken, expiresIn: result.expiresIn }, result.user)
      navigate('/dashboard')
    } catch (error) {
      setAuthError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to verify this code.')
    } finally { setIsVerifying(false) }
  }

  return (
    <div className="relative min-h-screen flex bg-background">
      <ThemeToggle className="absolute right-5 top-5 z-10 border border-border bg-card" />
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">CaseMind</span>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
              AI-Powered<br />Support Intelligence
            </h1>
            <p className="mt-4 text-sidebar-foreground/60 text-lg leading-relaxed">
              Transform every resolved case into reusable organizational knowledge.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Intelligent case classification & prioritization',
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
          © 2026 CaseMind · Support intelligence with evidence
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to CaseMind
          </Link>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
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

          {isRegistered && (
            <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
              <p className="font-semibold">Workspace created</p>
              <p className="mt-0.5 opacity-90">Sign in with your administrator account to continue.</p>
            </div>
          )}

          {/* Login form */}
          {mfaChallenge ? <form onSubmit={verifyMFA} className="space-y-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="text-sm font-semibold">Two-factor verification</p><p className="mt-1 text-xs text-muted-foreground">Enter the six-digit code from your authenticator app, or one unused recovery code.</p></div><div className="space-y-1.5"><label htmlFor="mfa-code" className="text-sm font-medium">Verification code</label><Input id="mfa-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} autoComplete="one-time-code" autoFocus placeholder="000000" /></div>{authError && <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2"><p className="text-xs text-destructive" role="alert">{authError}</p></div>}<Button type="submit" className="w-full" loading={isVerifying} disabled={mfaCode.trim().length < 6}>Verify and sign in</Button><Button type="button" variant="ghost" className="w-full" onClick={() => { setMfaChallenge(''); setMfaCode(''); setAuthError('') }}>Use another account</Button></form> : <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

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
              <div className="flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium">Password</label><Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link></div>
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
          </form>}

          <p className="text-center text-sm text-muted-foreground">
            New to CaseMind? <Link to="/register" className="font-medium text-primary hover:underline">Create a workspace</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
