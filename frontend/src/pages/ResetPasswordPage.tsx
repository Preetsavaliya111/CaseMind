import { useState, type FormEvent } from 'react'
import { ArrowLeft, Brain, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button, Input } from '@/components/ui'
import { authService } from '@/features/auth/services/authService'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (password.length < 10) { setError('Use at least 10 characters.'); return }
    if (password !== confirmation) { setError('Passwords do not match.'); return }
    setSaving(true)
    try {
      await authService.confirmPasswordReset(token, password)
      setComplete(true)
    } catch (caught) {
      setError(typeof caught === 'object' && caught && 'message' in caught ? String(caught.message) : 'This reset link is invalid or expired.')
    } finally { setSaving(false) }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
    <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-2xl shadow-black/20 sm:p-9">
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
      <div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"><Brain className="h-5 w-5 text-primary-foreground" /></span><span className="text-lg font-bold">CaseMind</span></div>
      {complete ? <div className="space-y-5"><CheckCircle2 className="h-10 w-10 text-success" /><div><h1 className="text-2xl font-bold">Password updated</h1><p className="mt-2 text-sm text-muted-foreground">Your previous sessions have been revoked. Sign in again with your new password.</p></div><Button asChild className="w-full"><Link to="/login">Sign in</Link></Button></div> : <>
        <KeyRound className="mb-4 h-7 w-7 text-muted-foreground" /><h1 className="text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use at least 10 characters. This one-time link cannot be reused.</p>
        {!token && <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">This reset link is incomplete. Request a new one.</p>}
        <form className="mt-7 space-y-4" onSubmit={submit} noValidate>
          <label className="block space-y-1.5 text-sm">New password<span className="relative block"><Input required minLength={10} maxLength={72} type={visible ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-2.5 text-muted-foreground" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
          <label className="block space-y-1.5 text-sm">Confirm new password<Input required minLength={10} maxLength={72} type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{error}</p>}
          <Button className="w-full" type="submit" loading={saving} disabled={!token}>Update password</Button>
        </form>
      </>}
    </section>
  </main>
}
