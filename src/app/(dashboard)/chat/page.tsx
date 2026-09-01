'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import { Send, MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [initializing, setInitializing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { session, messages, loading, sendMessage, createSession } = useChat(sessionId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartChat = async () => {
    if (!user) return
    setInitializing(true)
    const session = await createSession(user.id)
    setSessionId(session.id)
    setInitializing(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return

    const content = message
    setMessage('')
    await sendMessage(content, user.id)
  }

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-2 text-xl font-bold">Chat de Soporte</h2>
          <p className="mb-6 text-sm text-gray-mid">
            Inicia una conversación con nuestro equipo de soporte o con nuestro chatbot.
          </p>
          <Button onClick={handleStartChat} loading={initializing}>
            Iniciar Chat
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Chat de Soporte</h2>
        <p className="text-xs text-gray-mid">
          {session?.status === 'waiting' ? 'Esperando agente...' : 'Conectado'}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="py-8 text-center text-gray-mid">Cargando mensajes...</div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    msg.sender_id === user?.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-dark'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`mt-1 text-xs ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-mid'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
