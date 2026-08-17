import { useRef, useEffect, useState } from 'react'
import { AlertCircle, RotateCcw, X } from 'lucide-react'
import { useAssistant } from '../hooks/useAssistant'
import { AssistantHeader } from '../components/AssistantHeader'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { ContextPanel } from '../components/ContextPanel'
import { UserMessage } from '../components/UserMessage'
import { AiMessage } from '../components/AiMessage'
import { ThinkingIndicator } from '../components/ThinkingIndicator'
import { Composer } from '../components/Composer'
import { EmptyState } from '../components/EmptyState'
import { cn } from '@/utils'

export function AssistantPage() {
  const {
    activeConversation,
    groupedConversations,
    activeConversationId,
    status,
    error,
    searchQuery,
    contextPanelOpen,
    historySidebarOpen,
    setSearchQuery,
    setContextPanelOpen,
    setHistorySidebarOpen,
    selectConversation,
    createNewConversation,
    sendMessage,
    deleteConversation,
    retryLastMessage,
  } = useAssistant()

  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const [mobileContextOpen, setMobileContextOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isThinking = status === 'thinking'
  const messages = activeConversation?.messages || []
  const hasMessages = messages.length > 0

  // Scroll to bottom when new messages arrive or status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, status])

  const handleActionClick = (action: string) => {
    sendMessage(action)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#000000] text-white select-text">
      {/* 1. Assistant Top Bar */}
      <AssistantHeader
        historyOpen={historySidebarOpen}
        contextOpen={contextPanelOpen}
        onToggleHistory={() => {
          setHistorySidebarOpen(!historySidebarOpen)
          setMobileHistoryOpen(!mobileHistoryOpen)
        }}
        onToggleContext={() => {
          setContextPanelOpen(!contextPanelOpen)
          setMobileContextOpen(!mobileContextOpen)
        }}
        onNewConversation={() => {
          createNewConversation()
          setMobileHistoryOpen(false)
        }}
        isThinking={isThinking}
      />

      {/* 2. Main Workspace Layout */}
      <div className="relative flex flex-1 w-full overflow-hidden bg-[#000000]">
        {/* Left Desktop Conversation Sidebar (collapsible) */}
        <div
          className={cn(
            'hidden lg:block transition-all duration-250 ease-out overflow-hidden',
            historySidebarOpen ? 'w-64 xl:w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}
        >
          <ConversationSidebar
            groups={groupedConversations}
            activeId={activeConversationId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelect={(id) => {
              selectConversation(id)
            }}
            onNew={() => createNewConversation()}
            onDelete={deleteConversation}
            className="w-64 xl:w-72"
          />
        </div>

        {/* Center Main Conversation Area */}
        <main
          className="flex flex-1 flex-col h-full min-w-0 overflow-hidden bg-[#050505]"
          aria-label="CaseMind AI Chat Workspace"
        >
          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 scrollbar-none">
            {!hasMessages ? (
              <EmptyState onSelectPrompt={(prompt) => sendMessage(prompt)} />
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Secondary Workspace Subheading */}
                <div className="text-center py-2 border-b border-white/[0.04]">
                  <p className="text-xs text-[#888888] font-medium">
                    Your organization&apos;s support intelligence, in one place.
                  </p>
                </div>

                {messages.map((msg) =>
                  msg.role === 'user' ? (
                    <UserMessage key={msg.id} message={msg} />
                  ) : (
                    <AiMessage
                      key={msg.id}
                      message={msg}
                      onActionClick={handleActionClick}
                    />
                  )
                )}

                {/* AI Thinking State */}
                {isThinking && <ThinkingIndicator />}

                {/* Error State with Retry */}
                {error && (
                  <div className="max-w-3xl flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/20 text-white text-xs animate-in fade-in-50">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="h-4 w-4 text-white shrink-0" />
                      <span>{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={retryLastMessage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-2xs font-semibold hover:bg-[#ededed] transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Try again</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Bottom Fixed AI Composer */}
          <Composer
            onSend={sendMessage}
            disabled={isThinking}
            isThinking={isThinking}
          />
        </main>

        {/* Right Desktop Context Panel (collapsible) */}
        <div
          className={cn(
            'hidden lg:block transition-all duration-250 ease-out overflow-hidden',
            contextPanelOpen ? 'w-72 xl:w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}
        >
          <ContextPanel
            context={activeConversation?.contextSnapshot}
            onActionClick={handleActionClick}
            onCollapse={() => setContextPanelOpen(false)}
            className="w-72 xl:w-80"
          />
        </div>

        {/* 3. Mobile / Tablet Drawer Overlays */}
        {/* Mobile History Drawer */}
        {mobileHistoryOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileHistoryOpen(false)}
            />
            <div className="relative flex flex-col w-72 max-w-[80vw] h-full bg-[#050505] border-r border-white/[0.12] z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between p-3.5 border-b border-white/[0.08]">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Conversations
                </span>
                <button
                  type="button"
                  onClick={() => setMobileHistoryOpen(false)}
                  className="p-1 rounded-md text-[#777777] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ConversationSidebar
                groups={groupedConversations}
                activeId={activeConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelect={(id) => {
                  selectConversation(id)
                  setMobileHistoryOpen(false)
                }}
                onNew={() => {
                  createNewConversation()
                  setMobileHistoryOpen(false)
                }}
                onDelete={deleteConversation}
                className="flex-1 border-r-0"
              />
            </div>
          </div>
        )}

        {/* Mobile Context Drawer */}
        {mobileContextOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileContextOpen(false)}
            />
            <div className="relative flex flex-col w-80 max-w-[85vw] h-full bg-[#050505] border-l border-white/[0.12] z-10 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between p-3.5 border-b border-white/[0.08]">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Context Intelligence
                </span>
                <button
                  type="button"
                  onClick={() => setMobileContextOpen(false)}
                  className="p-1 rounded-md text-[#777777] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ContextPanel
                context={activeConversation?.contextSnapshot}
                onActionClick={(action) => {
                  handleActionClick(action)
                  setMobileContextOpen(false)
                }}
                onCollapse={() => setMobileContextOpen(false)}
                className="flex-1 border-l-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
