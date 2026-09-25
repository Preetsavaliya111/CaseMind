import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Brain, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

import { useAuth } from '@/app/providers'
import { Button, Input, Skeleton } from '@/components/ui'
import { authService, type InvitationPreview } from '@/features/auth/services/authService'
import type { ApiError } from '@/types'

export function AcceptInvitationPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('This invitation link is invalid.')
      setLoading(false)
      return
    }
    authService.invitation(token)
      .then(setInvitation)
      .catch((caught: ApiError) => setError(caught.message))
      .finally(() => setLoading(false))
  }, [token])

  const accept = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 10) return setError('Use at least 10 characters for your password.')
    if (password !== confirmPassword) return setError('The passwords do not match.')
    setSubmitting(true)
    setError('')
    try {
      const result = await authService.acceptInvitation(token, password)
      login({ accessToken: result.accessToken, expiresIn: result.expiresIn }, result.user)
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      setError((caught as ApiError).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/20">
        <div className="border-b bg-sidebar px-8 py-7 text-sidebar-foreground">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"><Brain className="h-5 w-5" /></span>
            <span className="text-lg font-bold">CaseMind</span>
          </Link>
        </div>
        <section className="p-8">
          {loading ? <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /></div> : invitation ? <>
            <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-primary">Organization invitation</p>
            <h1 className="mt-2 text-2xl font-bold">Welcome, {invitation.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Join <span className="font-medium text-foreground">{invitation.organization_name}</span> as {invitation.role_name}.</p>
            <div className="mt-5 flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div><p className="font-medium">Access prepared for {invitation.email}</p><p className="mt-1 text-xs text-muted-foreground">Your permissions and workspace are assigned automatically after password setup.</p></div>
            </div>
            <form className="mt-6 space-y-4" onSubmit={accept} noValidate>
              <label className="block space-y-1.5 text-sm">Create password
                <span className="relative block"><Input className="pr-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>
              </label>
              <label className="block space-y-1.5 text-sm">Confirm password<Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
              {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{error}</p>}
              <Button className="w-full" size="lg" type="submit" loading={submitting}><CheckCircle2 className="mr-2 h-4 w-4" />Create account & continue</Button>
            </form>
          </> : <div className="text-center"><h1 className="text-2xl font-bold">Invitation unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error || 'This invitation cannot be used.'}</p><Button className="mt-6" variant="outline" asChild><Link to="/login">Go to sign in</Link></Button></div>}
        </section>
      </div>
    </main>
  )
}
