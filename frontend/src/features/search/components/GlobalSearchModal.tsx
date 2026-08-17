import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Ticket as TicketIcon, BookOpen, Brain, Navigation,
  ArrowRight, CornerDownLeft, X, PlusCircle, BarChart3,
  Bot, Settings, ShieldCheck, Users, Layers
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  Badge
} from '@/components/ui'
import { mockTickets, mockKnowledgeArticles, mockMemoryRecords } from '@/mocks'
import { PriorityBadge } from '@/components/common/TicketBadges'
import type { Ticket, KnowledgeArticle, OrganizationalMemory } from '@/types'

interface SearchItem {
  id: string
  type: 'ticket' | 'knowledge' | 'memory' | 'action'
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  icon?: React.ReactNode
  data?: Ticket | KnowledgeArticle | OrganizationalMemory
  onSelect: () => void
}

interface GlobalSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'tickets' | 'knowledge' | 'memory' | 'actions'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Focus input on open and reset state
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setActiveCategory('all')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  // Navigation / Action items
  const actionItems: SearchItem[] = useMemo(
    () => [
      {
        id: 'act_dashboard',
        type: 'action',
        title: 'Go to Dashboard',
        subtitle: 'View overall SLA metrics, recent tickets, and AI summaries',
        badge: 'Page',
        icon: <BarChart3 className="h-4 w-4 text-primary" />,
        onSelect: () => {
          navigate('/dashboard')
          onOpenChange(false)
        },
      },
      {
        id: 'act_create_ticket',
        type: 'action',
        title: 'Create New Ticket',
        subtitle: 'Submit a new customer issue for AI-assisted triaging',
        badge: 'Action',
        icon: <PlusCircle className="h-4 w-4 text-emerald-500" />,
        onSelect: () => {
          navigate('/tickets/new')
          onOpenChange(false)
        },
      },
      {
        id: 'act_tickets',
        type: 'action',
        title: 'Tickets Management',
        subtitle: 'Browse, filter, and assign customer tickets & SLAs',
        badge: 'Page',
        icon: <TicketIcon className="h-4 w-4 text-blue-500" />,
        onSelect: () => {
          navigate('/tickets')
          onOpenChange(false)
        },
      },
      {
        id: 'act_knowledge',
        type: 'action',
        title: 'Knowledge Base',
        subtitle: 'Search technical runbooks and index new documentation',
        badge: 'Page',
        icon: <BookOpen className="h-4 w-4 text-emerald-500" />,
        onSelect: () => {
          navigate('/knowledge')
          onOpenChange(false)
        },
      },
      {
        id: 'act_memory',
        type: 'action',
        title: 'Organizational Memory',
        subtitle: 'View historical resolution patterns, root causes & impact',
        badge: 'Page',
        icon: <Brain className="h-4 w-4 text-amber-500" />,
        onSelect: () => {
          navigate('/memory')
          onOpenChange(false)
        },
      },
      {
        id: 'act_analytics',
        type: 'action',
        title: 'Analytics & SLA Performance',
        subtitle: 'Track team resolution times, MTTR, and agent metrics',
        badge: 'Page',
        icon: <BarChart3 className="h-4 w-4 text-sky-500" />,
        onSelect: () => {
          navigate('/analytics')
          onOpenChange(false)
        },
      },
      {
        id: 'act_chat',
        type: 'action',
        title: 'AI Assistant / Copilot',
        subtitle: 'Chat with AI for troubleshooting and context retrieval',
        badge: 'AI',
        icon: <Bot className="h-4 w-4 text-violet-500" />,
        onSelect: () => {
          navigate('/chat')
          onOpenChange(false)
        },
      },
      {
        id: 'act_settings',
        type: 'action',
        title: 'Settings & Profile',
        subtitle: 'Configure account, SLA rules, and notification preferences',
        badge: 'Page',
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
        onSelect: () => {
          navigate('/settings')
          onOpenChange(false)
        },
      },
      {
        id: 'act_admin_models',
        type: 'action',
        title: 'Model Monitoring (Admin)',
        subtitle: 'Track LLM token latency, accuracy, and active experiments',
        badge: 'Admin',
        icon: <ShieldCheck className="h-4 w-4 text-rose-500" />,
        onSelect: () => {
          navigate('/admin/models')
          onOpenChange(false)
        },
      },
      {
        id: 'act_admin_users',
        type: 'action',
        title: 'User Management (Admin)',
        subtitle: 'Manage support engineers, admins, and role permissions',
        badge: 'Admin',
        icon: <Users className="h-4 w-4 text-indigo-500" />,
        onSelect: () => {
          navigate('/admin/users')
          onOpenChange(false)
        },
      },
    ],
    [navigate, onOpenChange]
  )

  // Search Results aggregation
  const searchResults: SearchItem[] = useMemo(() => {
    const q = query.trim().toLowerCase()

    // 1. Tickets
    const ticketResults: SearchItem[] = mockTickets
      .filter((t) => {
        if (!q) return true
        return (
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.reporterName.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      })
      .slice(0, q ? 8 : 3)
      .map((t) => ({
        id: `ticket_${t.id}`,
        type: 'ticket',
        title: `${t.id}: ${t.title}`,
        subtitle: `${t.category.toUpperCase()} · Assigned to ${t.assigneeName || 'Unassigned'} · Reporter: ${t.reporterName}`,
        badge: t.status.replace('_', ' '),
        badgeVariant: t.status === 'resolved' || t.status === 'closed' ? 'secondary' : 'default',
        data: t,
        onSelect: () => {
          navigate(`/tickets/${t.id}`)
          onOpenChange(false)
        },
      }))

    // 2. Knowledge Articles
    const kbResults: SearchItem[] = mockKnowledgeArticles
      .filter((k) => {
        if (!q) return true
        return (
          k.title.toLowerCase().includes(q) ||
          k.summary.toLowerCase().includes(q) ||
          k.category.toLowerCase().includes(q) ||
          k.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      })
      .slice(0, q ? 6 : 3)
      .map((k) => ({
        id: `kb_${k.id}`,
        type: 'knowledge',
        title: k.title,
        subtitle: `${k.category} · ${k.summary.slice(0, 110)}…`,
        badge: `${k.viewCount} views`,
        badgeVariant: 'outline',
        data: k,
        onSelect: () => {
          navigate('/knowledge')
          onOpenChange(false)
        },
      }))

    // 3. Organizational Memory
    const memoryResults: SearchItem[] = mockMemoryRecords
      .filter((m) => {
        if (!q) return true
        return (
          m.patternTitle.toLowerCase().includes(q) ||
          m.rootCause.toLowerCase().includes(q) ||
          m.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      })
      .slice(0, q ? 6 : 2)
      .map((m) => ({
        id: `mem_${m.id}`,
        type: 'memory',
        title: m.patternTitle,
        subtitle: `Root Cause: ${m.rootCause.slice(0, 110)}…`,
        badge: `${m.successRate}% Success`,
        badgeVariant: 'secondary',
        data: m,
        onSelect: () => {
          navigate('/memory')
          onOpenChange(false)
        },
      }))

    // 4. Action items filtered
    const filteredActions: SearchItem[] = actionItems.filter((a) => {
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q))
      )
    })

    // Filter by active category tab
    if (activeCategory === 'tickets') return ticketResults
    if (activeCategory === 'knowledge') return kbResults
    if (activeCategory === 'memory') return memoryResults
    if (activeCategory === 'actions') return filteredActions

    // 'all' category combines everything
    if (!q) {
      // Default view when input is blank: Quick actions first, then recent tickets, KB, memory
      return [
        ...filteredActions.slice(0, 4),
        ...ticketResults.slice(0, 3),
        ...kbResults.slice(0, 2),
      ]
    }

    return [
      ...filteredActions.slice(0, 3),
      ...ticketResults.slice(0, 4),
      ...kbResults.slice(0, 3),
      ...memoryResults.slice(0, 2),
    ]
  }, [query, activeCategory, actionItems, navigate, onOpenChange])

  // Reset selected index if search results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults.length, activeCategory])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Key navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % searchResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = searchResults[selectedIndex]
      if (item) {
        item.onSelect()
      }
    }
  }

  const getItemIcon = (item: SearchItem) => {
    if (item.icon) return item.icon
    switch (item.type) {
      case 'ticket':
        return <TicketIcon className="h-4 w-4 text-blue-500" />
      case 'knowledge':
        return <BookOpen className="h-4 w-4 text-emerald-500" />
      case 'memory':
        return <Brain className="h-4 w-4 text-amber-500" />
      case 'action':
      default:
        return <Navigation className="h-4 w-4 text-primary" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden shadow-2xl border-border bg-card top-[25%] sm:rounded-xl">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border/80 bg-background/80 backdrop-blur-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tickets, knowledge base, memory patterns, or jump to..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-0 border-none p-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center px-3 py-2 border-b border-border/60 bg-muted/20 gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Layers className="h-3 w-3" />
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('tickets')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              activeCategory === 'tickets'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <TicketIcon className="h-3 w-3" />
            Tickets
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('knowledge')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              activeCategory === 'knowledge'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <BookOpen className="h-3 w-3" />
            Knowledge Base
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('memory')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              activeCategory === 'memory'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Brain className="h-3 w-3" />
            Memory
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('actions')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              activeCategory === 'actions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Navigation className="h-3 w-3" />
            Navigation & Actions
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Try searching with ticket IDs (e.g. TKT-1001), keywords, categories, or select another tab.
              </p>
            </div>
          ) : (
            searchResults.map((item, index) => {
              const isSelected = index === selectedIndex
              const ticketData = item.type === 'ticket' ? (item.data as Ticket) : null

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={item.onSelect}
                  className={`group flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-accent-foreground shadow-xs'
                      : 'hover:bg-accent/40 text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1 pr-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border shadow-2xs ${
                        isSelected ? 'bg-background border-border' : 'bg-muted/50 border-border/50'
                      }`}
                    >
                      {getItemIcon(item)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold truncate leading-snug">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || 'secondary'}
                            className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider font-semibold shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {ticketData && (
                          <PriorityBadge priority={ticketData.priority} />
                        )}
                      </div>

                      {item.subtitle && (
                        <p className="text-2xs text-muted-foreground truncate leading-relaxed">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-2xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border font-mono shadow-2xs">
                        <span>Select</span>
                        <CornerDownLeft className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/80 bg-muted/30 text-2xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono border border-border">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono border border-border">↵</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono border border-border">Esc</kbd> Close
            </span>
          </div>

          <span className="text-muted-foreground/70 hidden sm:inline">
            CaseMind Universal AI Search
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
