import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  Conversation,
  AssistantMessage,
  MessageStatus,
  ConversationGroup,
} from '../types'
import { assistantService } from '../services/assistant.service'

export function useAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [status, setStatus] = useState<MessageStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [contextPanelOpen, setContextPanelOpen] = useState(true)
  const [historySidebarOpen, setHistorySidebarOpen] = useState(true)
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const list = await assistantService.getConversations()
        if (mounted) {
          setConversations(list)
          if (list.length > 0) {
            setActiveConversationId(list[0].id)
          }
          setLoadingInitial(false)
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load conversations.')
          setLoadingInitial(false)
        }
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [])

  // Active conversation object
  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null
    return conversations.find((c) => c.id === activeConversationId) || null
  }, [conversations, activeConversationId])

  // Filtered conversations based on search
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.summary && c.summary.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  // Grouped conversations by date
  const groupedConversations = useMemo<ConversationGroup[]>(() => {
    const today: Conversation[] = []
    const yesterday: Conversation[] = []
    const previous7Days: Conversation[] = []
    const older: Conversation[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 86400000
    const sevenDaysAgo = todayStart - 7 * 86400000

    filteredConversations.forEach((conv) => {
      const convTime = new Date(conv.updatedAt).getTime()
      if (convTime >= todayStart) {
        today.push(conv)
      } else if (convTime >= yesterdayStart) {
        yesterday.push(conv)
      } else if (convTime >= sevenDaysAgo) {
        previous7Days.push(conv)
      } else {
        older.push(conv)
      }
    })

    const groups: ConversationGroup[] = []
    if (today.length > 0) groups.push({ label: 'Today', conversations: today })
    if (yesterday.length > 0) groups.push({ label: 'Yesterday', conversations: yesterday })
    if (previous7Days.length > 0) groups.push({ label: 'Previous 7 days', conversations: previous7Days })
    if (older.length > 0) groups.push({ label: 'Older', conversations: older })

    return groups
  }, [filteredConversations])

  // Select conversation
  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setError(null)
  }, [])

  // Create new conversation
  const createNewConversation = useCallback(async (initialPrompt?: string) => {
    try {
      setStatus('idle')
      setError(null)
      const newConv = await assistantService.createConversation(initialPrompt)
      setConversations((prev) => [newConv, ...prev])
      setActiveConversationId(newConv.id)

      if (initialPrompt) {
        // Send the prompt immediately
        await sendMessageToConversation(newConv.id, initialPrompt)
      }
      return newConv
    } catch (err) {
      setError('Failed to create new conversation.')
      return null
    }
  }, [])

  // Helper to send message to a specific conversation
  const sendMessageToConversation = async (convId: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    setError(null)
    setStatus('thinking')

    // Optimistically add user message
    const tempUserMsg: AssistantMessage = {
      id: `temp_user_${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: trimmed,
      status: 'complete',
      createdAt: new Date().toISOString(),
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            messages: [...c.messages, tempUserMsg],
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      })
    )

    try {
      const aiResponse = await assistantService.sendMessage(convId, trimmed)
      setStatus('complete')

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            // Replace with real messages and update title
            return {
              ...c,
              title: c.title === 'New Conversation' ? trimmed.slice(0, 35) : c.title,
              messages: [...c.messages.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, aiResponse],
              updatedAt: new Date().toISOString(),
              contextSnapshot: aiResponse.context || c.contextSnapshot,
            }
          }
          return c
        })
      )
    } catch (err) {
      setStatus('error')
      setError('Failed to generate intelligence response. Please try again.')
    }
  }

  // Send message in current active conversation
  const sendMessage = useCallback(
    async (content: string) => {
      const targetConvId = activeConversationId
      if (!targetConvId) {
        await createNewConversation(content)
        return
      }
      await sendMessageToConversation(targetConvId, content)
    },
    [activeConversationId, createNewConversation]
  )

  // Delete conversation
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await assistantService.deleteConversation(id)
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== id)
          if (activeConversationId === id) {
            setActiveConversationId(filtered.length > 0 ? filtered[0].id : null)
          }
          return filtered
        })
      } catch (err) {
        setError('Failed to delete conversation.')
      }
    },
    [activeConversationId]
  )

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    if (!activeConversationId || !activeConversation) return
    const lastUserMsg = activeConversation.messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user')

    if (lastUserMsg) {
      await sendMessage(lastUserMsg.content)
    }
  }, [activeConversationId, activeConversation, sendMessage])

  return {
    conversations,
    activeConversation,
    groupedConversations,
    activeConversationId,
    status,
    error,
    searchQuery,
    contextPanelOpen,
    historySidebarOpen,
    loadingInitial,
    setSearchQuery,
    setContextPanelOpen,
    setHistorySidebarOpen,
    selectConversation,
    createNewConversation,
    sendMessage,
    deleteConversation,
    retryLastMessage,
  }
}
