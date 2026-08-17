import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge
} from '@/components/ui'
import { useAuth, useToast } from '@/app/providers'
import { formatDate } from '@/utils'
import {
  User,
  Shield,
  Bell,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Laptop
} from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // --- Password Management State ---
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordLastChanged, setPasswordLastChanged] = useState('30 days ago')

  // --- 2FA State ---
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false)
  const [twoFactorStep, setTwoFactorStep] = useState<'qr' | 'verify' | 'recovery'>('qr')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [secretCopied, setSecretCopied] = useState(false)
  const [codesCopied, setCodesCopied] = useState(false)

  // --- Disable 2FA Modal State ---
  const [disable2FAModalOpen, setDisable2FAModalOpen] = useState(false)

  // --- Notification Preferences State ---
  const [notifications, setNotifications] = useState({
    ticketAssigned: true,
    slaWarnings: true,
    aiAnalysis: true,
    weeklyDigest: false,
  })

  // 2FA Secret & Recovery Codes
  const secretKey = 'CM2FA-9942-X7K1-AUTH'
  const recoveryCodes = [
    '8F2A-44B1',
    'C910-E732',
    '4A88-1F09',
    '7B33-90CD',
    'E221-884A',
    '1D99-5C33',
  ]

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' }
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' }
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  // Submit Password Change
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordLoading(true)
    setTimeout(() => {
      setPasswordLoading(false)
      setPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordLastChanged('Just now')
      toast({
        title: 'Password Updated',
        description: 'Your account password has been changed successfully.',
        variant: 'success',
      })
    }, 700)
  }

  // Handle 2FA Verification
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault()
    setVerificationError('')

    const cleanCode = verificationCode.replace(/\s+/g, '')
    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      setVerificationError('Please enter a valid 6-digit numeric verification code.')
      return
    }

    setVerificationLoading(true)
    setTimeout(() => {
      setVerificationLoading(false)
      setTwoFactorStep('recovery')
    }, 600)
  }

  // Complete 2FA Setup
  const handleFinish2FASetup = () => {
    setTwoFactorEnabled(true)
    setTwoFactorModalOpen(false)
    setTwoFactorStep('qr')
    setVerificationCode('')
    toast({
      title: 'Two-Factor Authentication Enabled',
      description: 'Your account is now protected with 2FA authenticator verification.',
      variant: 'success',
    })
  }

  // Disable 2FA
  const handleDisable2FA = () => {
    setTwoFactorEnabled(false)
    setDisable2FAModalOpen(false)
    toast({
      title: '2FA Disabled',
      description: 'Two-factor authentication has been removed from your account.',
      variant: 'default',
    })
  }

  // Copy helper
  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text)
    if (type === 'secret') {
      setSecretCopied(true)
      setTimeout(() => setSecretCopied(false), 2000)
    } else {
      setCodesCopied(true)
      setTimeout(() => setCodesCopied(false), 2000)
    }
  }

  // Toggle Notifications
  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    toast({
      title: 'Preferences Updated',
      description: 'Notification preference saved.',
      variant: 'default',
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      {/* 1. Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" aria-hidden="true" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0 border border-primary/20">
              {user?.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {user?.role} · {user?.department || 'Engineering'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
            <div>
              <p className="text-muted-foreground text-xs">Member since</p>
              <p className="font-medium text-foreground">{user?.createdAt ? formatDate(user.createdAt) : 'Jan 10, 2024'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Last login</p>
              <p className="font-medium text-foreground">{user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jul 15, 2024'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Security Section (Password & 2FA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* Password Row */}
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Last changed {passwordLastChanged}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPasswordError('')
                setPasswordModalOpen(true)
              }}
              className="text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5"
            >
              Change
            </Button>
          </div>

          {/* Two-Factor Authentication Row */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                {twoFactorEnabled ? (
                  <Badge variant="success" className="text-[10px] uppercase font-mono py-0 px-2">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono py-0 px-2">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {twoFactorEnabled
                  ? 'Your account is secured with authenticator app 2FA.'
                  : 'Add an extra layer of security using an authenticator app (Google Authenticator, Authy).'}
              </p>
            </div>

            {twoFactorEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisable2FAModalOpen(true)}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setTwoFactorStep('qr')
                  setVerificationCode('')
                  setVerificationError('')
                  setTwoFactorModalOpen(true)
                }}
                className="text-xs"
              >
                Enable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            {
              id: 'ticketAssigned' as const,
              label: 'Ticket assigned to me',
              description: 'Receive alerts when a support case is assigned to you',
            },
            {
              id: 'slaWarnings' as const,
              label: 'SLA breach warnings',
              description: 'Get notified 30 minutes before SLA resolution deadlines',
            },
            {
              id: 'aiAnalysis' as const,
              label: 'AI analysis complete',
              description: 'Notify when Organizational Memory completes incident synthesis',
            },
            {
              id: 'weeklyDigest' as const,
              label: 'Weekly performance digest',
              description: 'Receive a weekly email summarizing support CSAT & MTTR trends',
            },
          ].map((item) => {
            const isChecked = notifications[item.id]
            return (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isChecked}
                  onClick={() => handleToggleNotification(item.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isChecked ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 4. Active Sessions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-primary" aria-hidden="true" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground flex items-center gap-2">
                  Windows · Chrome (Current Session)
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </p>
                <p className="text-xs text-muted-foreground">CaseMind Enterprise · Active now</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-mono">127.0.0.1</span>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================
          CHANGE PASSWORD MODAL DIALOG
          ============================================================ */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            {passwordError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className="font-medium text-foreground">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 rounded-full ${
                          step <= passwordStrength.score ? passwordStrength.color : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={passwordLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          TWO-FACTOR AUTHENTICATION SETUP MODAL
          ============================================================ */}
      <Dialog open={twoFactorModalOpen} onOpenChange={setTwoFactorModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Setup Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Protect your CaseMind account with multi-factor authentication.
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: SCAN QR CODE */}
          {twoFactorStep === 'qr' && (
            <div className="space-y-5 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Step 1: Scan with Authenticator App</p>
                <p>
                  Open your authenticator app (Google Authenticator, 1Password, Microsoft Authenticator) and scan the QR code below or enter the key manually.
                </p>
              </div>

              {/* QR Code Canvas */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-border shadow-xs">
                <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs">
                  {/* High contrast SVG QR code simulation */}
                  <svg className="h-36 w-36 text-black" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="12" width="11" height="11" />
                    <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="77" y="12" width="11" height="11" />
                    <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="12" y="77" width="11" height="11" />
                    <rect x="38" y="10" width="6" height="6" />
                    <rect x="50" y="10" width="6" height="6" />
                    <rect x="42" y="24" width="8" height="8" />
                    <rect x="10" y="40" width="8" height="8" />
                    <rect x="25" y="42" width="6" height="6" />
                    <rect x="38" y="38" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="46" y="46" width="8" height="8" />
                    <rect x="70" y="42" width="8" height="8" />
                    <rect x="85" y="40" width="6" height="6" />
                    <rect x="40" y="70" width="8" height="8" />
                    <rect x="55" y="75" width="6" height="6" />
                    <rect x="72" y="72" width="18" height="18" />
                  </svg>
                </div>

                <p className="text-2xs text-muted-foreground font-mono mt-3">
                  Account: {user?.email || 'admin@casemind.io'}
                </p>
              </div>

              {/* Secret Key with Copy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Or enter key manually:</label>
                <div className="flex items-center gap-2">
                  <Input value={secretKey} readOnly className="font-mono text-xs bg-muted/50 select-all" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(secretKey, 'secret')}
                    className="shrink-0"
                  >
                    {secretCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{secretCopied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setTwoFactorModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setTwoFactorStep('verify')}>
                  Next: Enter 6-Digit Code
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ENTER CODE */}
          {twoFactorStep === 'verify' && (
            <form onSubmit={handleVerify2FA} className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Step 2: Verify Code</p>
                <p>Enter the 6-digit verification code generated by your authenticator app.</p>
              </div>

              {verificationError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="space-y-2 text-center py-2">
                <Input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center font-mono text-2xl tracking-[0.5em] h-12 font-bold max-w-[200px] mx-auto"
                  autoFocus
                />
                <p className="text-2xs text-muted-foreground">
                  (You can enter any 6 digits to complete simulation)
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setTwoFactorStep('qr')}>
                  Back
                </Button>
                <Button type="submit" loading={verificationLoading}>
                  Verify & Activate
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: BACKUP RECOVERY CODES */}
          {twoFactorStep === 'recovery' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  2FA Successfully Verified!
                </p>
                <p className="text-emerald-800">
                  Save these one-time recovery codes in a safe place. If you lose access to your authenticator app, you can use these to regain access to your account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/60 border grid grid-cols-2 gap-2 font-mono text-xs text-foreground">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-2 rounded bg-background border text-center font-bold">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'codes')}
                  className="gap-1.5"
                >
                  {codesCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{codesCopied ? 'Codes Copied' : 'Copy All Codes'}</span>
                </Button>

                <Button onClick={handleFinish2FASetup}>
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================
          DISABLE 2FA CONFIRMATION MODAL
          ============================================================ */}
      <Dialog open={disable2FAModalOpen} onOpenChange={setDisable2FAModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Disable Two-Factor Authentication?
            </DialogTitle>
            <DialogDescription>
              Disabling 2FA reduces your account security. Are you sure you want to turn off two-factor authentication?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDisable2FAModalOpen(false)}>
              Keep 2FA Enabled
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA}>
              Yes, Disable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
