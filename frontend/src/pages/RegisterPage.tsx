import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Brain, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

import { Button, Input } from '@/components/ui'
import { authService } from '@/features/auth/services/authService'


const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name').max(255),
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(10, 'Use at least 10 characters').max(72),
  organizationName: z.string().min(2, 'Enter your organization name').max(255),
  organizationDomain: z.string().max(255).optional(),
  department: z.string().min(2).max(100),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { department: 'Customer Support' },
  })

  const onSubmit = async (data: RegisterForm) => {
    setSubmitError('')
    try {
      await authService.registerAccount(data)
      navigate('/login?registered=true')
    } catch (error) {
      setSubmitError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Unable to create your workspace.')
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/20 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="hidden border-r bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="flex items-center gap-3 text-sidebar-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"><Brain className="h-5 w-5" /></span>
            <span className="text-lg font-bold">CaseMind</span>
          </Link>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your private workspace</p>
            <h1 className="text-3xl font-bold leading-tight text-sidebar-foreground">Build support memory your team can trust.</h1>
            <div className="mt-8 space-y-4">
              {['Your account becomes the first workspace administrator', 'Organization data is isolated at the API layer', 'AI recommendations are designed to retain evidence'].map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-relaxed text-sidebar-foreground/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/40"><ShieldCheck className="h-4 w-4" /> No certification claims. Clear architecture controls.</div>
        </section>

        <section className="p-6 sm:p-10">
          <Link to="/" className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to CaseMind</Link>
          <h2 className="text-2xl font-bold">Create your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set up your organization and administrator account.</p>

          <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="space-y-1.5 text-sm">Full name<Input autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />{errors.name && <span className="block text-xs text-destructive">{errors.name.message}</span>}</label>
            <label className="space-y-1.5 text-sm">Work email<Input type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />{errors.email && <span className="block text-xs text-destructive">{errors.email.message}</span>}</label>
            <label className="space-y-1.5 text-sm">Organization<Input aria-invalid={Boolean(errors.organizationName)} {...register('organizationName')} />{errors.organizationName && <span className="block text-xs text-destructive">{errors.organizationName.message}</span>}</label>
            <label className="space-y-1.5 text-sm">Company domain <span className="text-muted-foreground">(optional)</span><Input placeholder="example.com" {...register('organizationDomain')} /></label>
            <label className="space-y-1.5 text-sm">Department<Input aria-invalid={Boolean(errors.department)} {...register('department')} />{errors.department && <span className="block text-xs text-destructive">{errors.department.message}</span>}</label>
            <label className="space-y-1.5 text-sm">Password
              <span className="relative block">
                <Input className="pr-10" type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
                <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </span>
              {errors.password && <span className="block text-xs text-destructive">{errors.password.message}</span>}
            </label>
            {submitError && <p className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive" role="alert">{submitError}</p>}
            <div className="sm:col-span-2 mt-2">
              <Button className="w-full" size="lg" type="submit" loading={isSubmitting}>Create workspace</Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link className="font-medium text-primary hover:underline" to="/login">Sign in</Link></p>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
