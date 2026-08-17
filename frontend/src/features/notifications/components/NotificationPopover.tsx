import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Trash2, Clock, AlertTriangle, Sparkles,
  UserCheck, Brain, BookOpen, Info, Check, X,
  ArrowRight
} from 'lucide-react'
import {
  Button,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui'
import { useNotifications } from '../context/NotificationContext'
import { formatRelative } from '@/utils'
import type { AppNotification, NotificationType } from '@/types'

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'sla_alert':
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    case 'ai_insight':
      return <Sparkles className="h-4 w-4 text-primary" />
    case 'ticket_assigned':
      return <UserCheck className="h-4 w-4 text-sky-500" />
    case 'memory_match':
      return <Brain className="h-4 w-4 text-amber-500" />
    case 'knowledge':
      return <BookOpen className="h-4 w-4 text-emerald-500" />
    case 'system':
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />
  }
}

function getNotificationBg(type: NotificationType, isRead: boolean) {
  if (isRead) return 'bg-transparent'
  switch (type) {
    case 'sla_alert':
      return 'bg-destructive/10 border-destructive/20'
    case 'ai_insight':
      return 'bg-primary/10 border-primary/20'
    case 'ticket_assigned':
      return 'bg-sky-500/10 border-sky-500/20'
    case 'memory_match':
      return 'bg-amber-500/10 border-amber-500/20'
    default:
      return 'bg-accent/40 border-accent'
  }
}

export function NotificationPopover() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    hasCriticalAlerts,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'sla' | 'ai'>('all')

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead
    if (activeTab === 'sla') return n.type === 'sla_alert'
    if (activeTab === 'ai') return n.type === 'ai_insight' || n.type === 'memory_match'
    return true
  })

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      markAsRead(n.id)
    }
    if (n.link) {
      setIsOpen(false)
      navigate(n.link)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-foreground/80 hover:text-foreground hover:bg-accent focus-visible:ring-1 focus-visible:ring-primary"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm ${
                hasCriticalAlerts
                  ? 'bg-destructive animate-pulse'
                  : 'bg-primary'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 max-w-[calc(100vw-2rem)] p-0 shadow-2xl border-border bg-card overflow-hidden rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-2xs px-1.5 py-0 h-4 font-mono font-medium">
                {unreadCount} new
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Read all</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={clearAll}
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center border-b border-border px-3 py-1.5 gap-1 bg-muted/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'all'
                ? 'bg-accent text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'unread'
                ? 'bg-accent text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sla')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'sla'
                ? 'bg-accent text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            SLA Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'ai'
                ? 'bg-accent text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            AI & Memory
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-2">
                <Bell className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'unread' ? "You're all caught up!" : 'No notifications in this view.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer hover:bg-accent/50 ${getNotificationBg(
                  n.type,
                  n.isRead
                )}`}
              >
                {/* Icon avatar */}
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-xs">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-xs font-semibold truncate ${n.isRead ? 'text-foreground/80' : 'text-foreground'}`}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-2 text-2xs text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(n.timestamp)}
                    </span>

                    {n.priority === 'critical' && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 uppercase tracking-wider font-semibold">
                        Critical
                      </Badge>
                    )}
                    {n.ticketId && (
                      <span className="font-mono text-2xs text-primary/90 font-medium">
                        {n.ticketId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Quick Actions */}
                <div
                  className="absolute right-2 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-md p-0.5 border border-border shadow-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => (n.isRead ? markAsUnread(n.id) : markAsRead(n.id))}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    title={n.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNotification(n.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="border-t border-border/80 bg-muted/20 px-3 py-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/tickets')
              }}
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View all active tickets & SLAs</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
