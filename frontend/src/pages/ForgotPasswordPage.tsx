import { useState, type FormEvent } from 'react'
import { ArrowLeft, Brain, CheckCircle2, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button, Input } from '@/components/ui'
import { authService } from '@/features/auth/services/authService'
import { ThemeToggle } from '@/components/common'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    setSending(true); setError('')
    try {
      await authService.requestPasswordReset(email)
      setSent(true)
    } catch (caught) {
      setError(typeof caught === 'object' && caught && 'message' in caught ? String(caught.message) : 'Unable to submit this request.')
    } finally { setSending(false) }
  }

  return <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-12">
    <ThemeToggle className="absolute right-5 top-5 border border-border bg-card" />
    <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-2xl shadow-black/20 sm:p-9">
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
      <div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"><Brain className="h-5 w-5 text-primary-foreground" /></span><span className="text-lg font-bold">CaseMind</span></div>
      {sent ? <div className="space-y-5">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <div><h1 className="text-2xl font-bold">Check your email</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">If an active account exists for <span className="font-medium text-foreground">{email}</span>, a one-time reset link has been prepared. It expires in 30 minutes.</p></div>
        <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">If email delivery is not configured, ask your organization administrator to create a secure reset link from Users &amp; Roles.</p>
        <Button asChild className="w-full"><Link to="/login">Return to sign in</Link></Button>
      </div> : <>
        <Mail className="mb-4 h-7 w-7 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Enter your account email. For privacy, the response is the same whether or not the address exists.</p>
        <form className="mt-7 space-y-4" onSubmit={submit} noValidate>
          <label className="block space-y-1.5 text-sm">Email address<Input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@company.com" /></label>
          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{error}</p>}
          <Button className="w-full" type="submit" loading={sending}>Request reset link</Button>
        </form>
      </>}
    </section>
  </main>
}
