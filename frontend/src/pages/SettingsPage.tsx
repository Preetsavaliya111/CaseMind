import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { authService } from '@/features/auth/services/authService'
import { notificationService, type NotificationPreferences } from '@/features/settings/services/notificationService'
import { formatDate } from '@/utils'
import { User, Shield, Bell } from 'lucide-react'

export function SettingsPage() {
  const { user, updateUser, login } = useAuth()
  const [profileName, setProfileName] = useState(user?.name ?? '')
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' })
  const [accountMessage, setAccountMessage] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountBusy, setAccountBusy] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfaEnabled))
  const [currentPassword, setCurrentPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [securityMessage, setSecurityMessage] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securityBusy, setSecurityBusy] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({ case_assigned: true, case_reply: true, case_escalated: true, sla_alerts: true })
  const [notificationBusy, setNotificationBusy] = useState(false)

  useEffect(() => { authService.mfaStatus().then((result) => setMfaEnabled(result.enabled)).catch(() => undefined) }, [])
  useEffect(() => { notificationService.preferences().then(setNotificationPreferences).catch(() => undefined) }, [])

  const toggleNotification = async (key: keyof NotificationPreferences) => {
    const next = { ...notificationPreferences, [key]: !notificationPreferences[key] }
    setNotificationPreferences(next); setNotificationBusy(true)
    try { setNotificationPreferences(await notificationService.savePreferences(next)) }
    catch { setNotificationPreferences(notificationPreferences) }
    finally { setNotificationBusy(false) }
  }

  const saveProfile = async () => {
    setAccountBusy(true); setAccountError(''); setAccountMessage('')
    try { const nextUser = await authService.updateProfile(profileName); updateUser(nextUser); setAccountMessage('Profile updated.') }
    catch (error) { setAccountError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Profile update failed.') }
    finally { setAccountBusy(false) }
  }

  const savePassword = async () => {
    setAccountError(''); setAccountMessage('')
    if (passwordDraft.next !== passwordDraft.confirm) { setAccountError('The new passwords do not match.'); return }
    setAccountBusy(true)
    try {
      const result = await authService.changePassword(passwordDraft.current, passwordDraft.next)
      login({ accessToken: result.accessToken, expiresIn: result.expiresIn }, result.user)
      setPasswordDraft({ current: '', next: '', confirm: '' })
      setAccountMessage('Password changed. Older sessions have been signed out.')
    } catch (error) { setAccountError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Password change failed.') }
    finally { setAccountBusy(false) }
  }

  const beginMFA = async () => {
    setSecurityBusy(true); setSecurityError(''); setSecurityMessage('')
    try { setSetup(await authService.mfaSetup(currentPassword)); setSecurityMessage('Add the key to your authenticator, then verify one code.') }
    catch (error) { setSecurityError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'MFA setup failed.') }
    finally { setSecurityBusy(false) }
  }

  const enableMFA = async () => {
    setSecurityBusy(true); setSecurityError('')
    try { const result = await authService.mfaEnable(mfaCode); setRecoveryCodes(result.recovery_codes); setMfaEnabled(true); setSetup(null); setCurrentPassword(''); setMfaCode(''); setSecurityMessage('Two-factor authentication is enabled. Save the recovery codes now.') }
    catch (error) { setSecurityError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Code verification failed.') }
    finally { setSecurityBusy(false) }
  }

  const disableMFA = async () => {
    setSecurityBusy(true); setSecurityError('')
    try { await authService.mfaDisable(currentPassword, mfaCode); setMfaEnabled(false); setCurrentPassword(''); setMfaCode(''); setRecoveryCodes([]); setSecurityMessage('Two-factor authentication is disabled.') }
    catch (error) { setSecurityError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'MFA could not be disabled.') }
    finally { setSecurityBusy(false) }
  }

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
          <div className="space-y-2 border-t pt-4">
            <label className="text-xs font-medium">Display name<Input value={profileName} onChange={(event) => setProfileName(event.target.value)} autoComplete="name" /></label>
            <Button size="sm" onClick={saveProfile} loading={accountBusy} disabled={profileName.trim().length < 2 || profileName.trim() === user?.name}>Save profile</Button>
          </div>
          {accountMessage && <p className="rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">{accountMessage}</p>}
          {accountError && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{accountError}</p>}
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
          <div className="space-y-3 border-b pb-4">
            <div><p className="font-medium">Password</p><p className="text-xs text-muted-foreground">Changing it immediately signs out every older session.</p></div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input type="password" value={passwordDraft.current} onChange={(event) => setPasswordDraft({ ...passwordDraft, current: event.target.value })} placeholder="Current password" autoComplete="current-password" />
              <Input type="password" value={passwordDraft.next} onChange={(event) => setPasswordDraft({ ...passwordDraft, next: event.target.value })} placeholder="New password" autoComplete="new-password" />
              <Input type="password" value={passwordDraft.confirm} onChange={(event) => setPasswordDraft({ ...passwordDraft, confirm: event.target.value })} placeholder="Confirm new password" autoComplete="new-password" />
            </div>
            <Button size="sm" variant="outline" onClick={savePassword} loading={accountBusy} disabled={!passwordDraft.current || passwordDraft.next.length < 10 || passwordDraft.confirm.length < 10}>Change password</Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Protect sign-in with any standard authenticator app</p>
            </div>
            <Badge variant={mfaEnabled ? 'success' : 'secondary'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
          </div>
          {securityMessage && <p className="rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">{securityMessage}</p>}
          {securityError && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{securityError}</p>}
          {!mfaEnabled && !setup && <div className="space-y-2"><label className="text-xs font-medium">Confirm current password<Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label><Button size="sm" onClick={beginMFA} loading={securityBusy} disabled={!currentPassword}>Set up authenticator</Button></div>}
          {setup && <div className="space-y-3 rounded-lg border p-4"><div><p className="text-xs font-semibold">Manual setup key</p><code className="mt-1 block break-all rounded bg-muted p-2 text-xs">{setup.secret}</code></div><p className="text-xs text-muted-foreground">In Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app, add an account manually using this key, six digits, and a 30-second period.</p><label className="text-xs font-medium">Six-digit verification code<Input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" /></label><Button size="sm" onClick={enableMFA} loading={securityBusy} disabled={mfaCode.trim().length !== 6}>Verify and enable</Button></div>}
          {mfaEnabled && recoveryCodes.length === 0 && <div className="space-y-2 rounded-lg border p-4"><p className="text-xs text-muted-foreground">To disable MFA, confirm your password and enter a current authenticator code or unused recovery code.</p><Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" autoComplete="current-password" /><Input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="Authenticator or recovery code" autoComplete="one-time-code" /><Button size="sm" variant="destructive" onClick={disableMFA} loading={securityBusy} disabled={!currentPassword || mfaCode.trim().length < 6}>Disable MFA</Button></div>}
          {recoveryCodes.length > 0 && <div className="rounded-lg border border-warning/30 bg-warning/5 p-4"><p className="text-xs font-semibold">Recovery codes — shown once</p><p className="mt-1 text-xs text-muted-foreground">Store these somewhere safe. Each code can be used only once.</p><div className="mt-3 grid grid-cols-2 gap-2">{recoveryCodes.map((code) => <code key={code} className="rounded bg-background p-2 text-center text-xs">{code}</code>)}</div><Button className="mt-3" size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(recoveryCodes.join('\n'))}>Copy all codes</Button></div>}
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
          {([
            { key: 'case_assigned', label: 'Case assigned to me', description: 'Receive alerts when a Case is assigned' },
            { key: 'case_reply', label: 'Replies to my Cases', description: 'Receive alerts for new public replies' },
            { key: 'case_escalated', label: 'Case escalations', description: 'Receive alerts when work is escalated' },
            { key: 'sla_alerts', label: 'SLA risk and breach warnings', description: 'Receive alerts before and after SLA deadlines' },
          ] as Array<{ key: keyof NotificationPreferences; label: string; description: string }>).map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <button type="button" role="switch" aria-checked={notificationPreferences[item.key]} aria-label={`Toggle ${item.label}`} disabled={notificationBusy} onClick={() => toggleNotification(item.key)} className={`relative h-6 w-11 rounded-full border transition-colors ${notificationPreferences[item.key] ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-primary-foreground transition-transform ${notificationPreferences[item.key] ? 'left-5' : 'left-0.5'}`} /></button>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  )
}
