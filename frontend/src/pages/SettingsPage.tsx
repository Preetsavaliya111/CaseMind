import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { formatDate } from '@/utils'
import { User, Shield, Bell } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden="true" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user?.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role} · {user?.department}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
            <div>
              <p className="text-muted-foreground text-xs">Member since</p>
              <p className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last login</p>
              <p className="font-medium">{user?.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <button className="text-primary text-xs hover:underline">Change</button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <button className="text-primary text-xs hover:underline">Enable</button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { label: 'Ticket assigned to me', description: 'Receive alerts when a ticket is assigned' },
            { label: 'SLA breach warnings', description: 'Get notified before SLA deadlines' },
            { label: 'AI analysis complete', description: 'Notify when AI finishes analyzing a ticket' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-primary cursor-pointer" role="switch" aria-checked="true" tabIndex={0} />
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  )
}
