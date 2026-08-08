import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Brain className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg font-semibold mb-1">Page not found</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  )
}
