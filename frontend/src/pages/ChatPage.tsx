import { useState, useRef, useEffect } from 'react'
import { Send, Brain, User } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { cn } from '@/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const MOCK_RESPONSES = [
  "Based on the ticket history, this issue appears to be related to connection pool exhaustion. I recommend increasing the pool size to 25 and implementing a circuit breaker pattern.",
  "I found 3 similar resolved tickets in the knowledge base. The most relevant resolution involved updating the SAML certificate and re-syncing IdP metadata.",
  "The sentiment analysis indicates high customer frustration. I suggest prioritizing this ticket and assigning it to a senior agent. Average resolution time for similar issues is 2.4 hours.",
  "I've analyzed the error patterns. This appears to be a recurring issue affecting enterprise accounts. Root cause: rate limit configuration not scaling with account tier.",
]

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm CaseMind AI. I can help you analyze tickets, search the knowledge base, and provide resolution recommendations. How can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)],
      timestamp: new Date(),
    }
    setIsTyping(false)
    setMessages((prev) => [...prev, aiMsg])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-6 animate-fade-in">
      <Card className="flex flex-col flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3 max-w-3xl', msg.role === 'user' && 'ml-auto flex-row-reverse')}
            >
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                msg.role === 'assistant' ? 'bg-primary/10' : 'bg-secondary',
              )}>
                {msg.role === 'assistant'
                  ? <Brain className="h-4 w-4 text-primary" aria-hidden="true" />
                  : <User className="h-4 w-4" aria-hidden="true" />
                }
              </div>
              <div className={cn(
                'rounded-lg px-4 py-2.5 text-sm max-w-[80%]',
                msg.role === 'assistant'
                  ? 'bg-muted text-foreground'
                  : 'bg-primary text-primary-foreground',
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-3xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          >
            <Input
              placeholder="Ask about tickets, resolutions, or knowledge base…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              aria-label="Chat input"
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isTyping} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
