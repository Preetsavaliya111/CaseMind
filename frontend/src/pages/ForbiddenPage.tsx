import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { useAuth } from '@/app/providers'

export function ForbiddenPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6 animate-fade-in">
      <Card className="max-w-md w-full border-danger/30 bg-card shadow-lg">
        <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-4">
            <ShieldAlert className="h-9 w-9" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold font-display tracking-display text-foreground">
            Access Restricted (403)
          </h1>

          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your current role (<span className="font-semibold text-foreground uppercase text-xs tracking-wider">{user?.role ?? 'Viewer'}</span>) does not have sufficient permissions to view this resource.
          </p>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground w-full text-left space-y-1">
            <p className="font-medium text-foreground">Need access?</p>
            <p>Contact your CaseMind administrator (<code className="text-primary font-mono">admin@casemind.io</code>) to request role escalation.</p>
          </div>

          <div className="flex items-center gap-3 mt-6 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
