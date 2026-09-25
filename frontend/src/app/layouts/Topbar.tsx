import { Search, LogOut, User, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { Button, Avatar, AvatarFallback, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui'
import { get } from '@/services/apiClient'
import { initials } from '@/utils'
import { notificationService } from '@/features/settings/services/notificationService'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    notificationService.list({ page_size: 5 }).then((result) => setUnread(result.unread)).catch(() => undefined)
    const timer = window.setInterval(() => notificationService.list({ page_size: 5 }).then((result) => setUnread(result.unread)).catch(() => undefined), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', openSearch)
    return () => window.removeEventListener('keydown', openSearch)
  }, [])

  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) { setResults([]); return }
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const response = await get<SearchResponse>('/search', { params: { q: query.trim() } })
        setResults(response.results)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, searchOpen])

  const openResult = (result: SearchResult) => {
    setSearchOpen(false)
    setQuery('')
    navigate(result.locator)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl shrink-0 sm:px-6">
      <div><p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Workspace</p><h1 className="mt-0.5 font-display text-sm font-semibold text-foreground">{title}</h1></div>

      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Button variant="outline" size="sm" className="w-9 justify-center gap-2 border-border bg-card text-muted-foreground md:w-52 md:justify-start" aria-label="Search workspace" onClick={() => setSearchOpen(true)}>
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden text-xs md:inline">Search workspace…</span>
          <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs md:inline">Ctrl K</kbd>
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label={`${unread} unread notifications`} onClick={() => navigate('/notifications')}><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread > 99 ? '99+' : unread}</span>}</Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{user ? initials(user.name) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b p-4"><DialogTitle className="text-sm">Search your workspace</DialogTitle></DialogHeader>
          <div className="p-4"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases, memory, knowledge, and documents…" className="pl-9" /></div></div>
          <div className="max-h-[420px] overflow-y-auto border-t p-2">
            {query.trim().length < 2 ? <p className="px-3 py-8 text-center text-xs text-muted-foreground">Type at least two characters to search organization data.</p> : searching ? <p className="px-3 py-8 text-center text-xs text-muted-foreground">Searching…</p> : results.length === 0 ? <p className="px-3 py-8 text-center text-xs text-muted-foreground">No matching organization records.</p> : results.map((result) => <button key={`${result.type}-${result.id}`} onClick={() => openResult(result)} className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-muted/50"><Badge variant="outline" className="mt-0.5 capitalize">{result.type}</Badge><span className="min-w-0"><span className="block truncate text-sm font-medium">{result.title}</span><span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{result.description}</span></span></button>)}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

interface SearchResult {
  type: 'case' | 'memory' | 'knowledge' | 'document'
  id: string
  title: string
  description: string
  locator: string
}

interface SearchResponse {
  query: string
  results: SearchResult[]
}
