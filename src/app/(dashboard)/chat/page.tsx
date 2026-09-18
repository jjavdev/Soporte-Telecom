'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import { Send, MessageSquare, Bot, AlertCircle, Loader2 } from 'lucide-react'

interface UiMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  isBot?: boolean
  isError?: boolean
}

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [sending, setSending] = useState(false)
  const [botTyping, setBotTyping] = useState(false)
  const [tempMessages, setTempMessages] = useState<UiMessage[]>([])
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { session, messages, loading, sendMessage, createSession } = useChat(sessionId)

  const uiMessages = useMemo(() => {
    const dbMessages: UiMessage[] = messages.map(m => ({
      ...m,
      isBot: m.sender_id !== user?.id,
      isError: false,
    }))
    const existingIds = new Set(dbMessages.map(m => m.id))
    const uniqueTemp = tempMessages.filter(m => !existingIds.has(m.id))
    return [...dbMessages, ...uniqueTemp]
  }, [messages, tempMessages, user?.id])

  useEffect(() => {
    const container = messagesEndRef.current?.closest('[role="log"]')
    if (container) container.scrollTop = container.scrollHeight
  }, [uiMessages, botTyping])

  const handleStartChat = async () => {
    if (!user) return
    setInitializing(true)
    setConnectionError(null)
    try {
      const session = await createSession(user.id)
      setSessionId(session.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Error creating chat session:', message)
      setConnectionError('Error al iniciar el chat. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setInitializing(false)
    }
  }

  const callChatbot = async (userMessage: string): Promise<{ reply: string; intent?: string; action?: string } | null> => {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (!n8nUrl) {
      return { reply: 'El chatbot no está disponible en este momento. Un agente te atenderá pronto.', intent: 'unavailable' }
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${n8nUrl}/webhook/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          user_id: user?.id,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return { reply: 'No pude procesar tu mensaje. Por favor, intenta de nuevo o contacta a un agente.', intent: 'error' }
      }

      const text = await response.text()
      if (!text || !text.trim()) {
        return { reply: 'El chatbot no respondió. Verifica que el workflow esté activo en n8n.', intent: 'error' }
      }

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        return { reply: 'Respuesta inválida del chatbot.', intent: 'error' }
      }

      return {
        reply: (data.reply as string) || (data.message as string) || 'No entendí tu mensaje.',
        intent: data.intent as string,
        action: (data.action as string) || undefined,
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { reply: 'La respuesta está tardando demasiado. Un agente te atenderá pronto.', intent: 'timeout' }
      }
      console.error('Chatbot error:', err)
      return { reply: 'Error de conexión con el chatbot. Intenta de nuevo.', intent: 'connection_error' }
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user || !sessionId) return

    const userMessage = message
    setMessage('')
    setSending(true)
    setConnectionError(null)

    const tempUserMsg: UiMessage = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      isBot: false,
    }
    setTempMessages(prev => [...prev, tempUserMsg])

    try {
      await sendMessage(userMessage, user.id)
      setTempMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Error sending message:', msg)
      setTempMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
      setConnectionError('Error al enviar el mensaje. Intenta de nuevo.')
      setSending(false)
      return
    }

    setSending(false)
    setBotTyping(true)

    const botResult = await callChatbot(userMessage)

    setBotTyping(false)

    if (botResult) {
      const botMsg: UiMessage = {
        id: `bot-${Date.now()}`,
        content: botResult.reply,
        sender_id: 'bot',
        created_at: new Date().toISOString(),
        isBot: true,
        isError: botResult.intent === 'error' || botResult.intent === 'connection_error' || botResult.intent === 'timeout',
      }
      setTempMessages(prev => [...prev, botMsg])

      if (botResult.action === 'redirect_tickets') {
        setTimeout(() => router.push('/tickets'), 2000)
      }
    }
  }

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-2 text-xl font-bold">Chat de Soporte</h2>
          <p className="mb-6 text-sm text-gray-mid">
            Inicia una conversación con nuestro chatbot o con un agente de soporte.
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
          {session?.status === 'waiting'
            ? 'Esperando agente... (el bot responde automáticamente)'
            : 'Conectado'}
        </p>
      </div>

      {connectionError && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {connectionError}
          <button onClick={() => setConnectionError(null)} className="ml-auto text-red-500 hover:text-red-700" aria-label="Cerrar error">
            ×
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto p-4" role="log" aria-label="Mensajes del chat" aria-live="polite">
        {uiMessages.length === 0 && !loading && (
          <div className="py-8 text-center text-sm text-gray-mid">
            <Bot className="mx-auto mb-2 h-8 w-8" />
            Escribe un mensaje para comenzar. El bot responderá automáticamente.
          </div>
        )}

        <div className="space-y-4">
          {uiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : msg.isBot
                      ? 'bg-gray-100 text-gray-dark'
                      : 'bg-primary text-white'
                }`}
              >
                {msg.isBot && (
                  <div className={`mb-1 flex items-center gap-1 text-xs font-medium ${msg.isError ? 'text-red-500' : 'text-primary'}`}>
                    <Bot className="h-3 w-3" /> {msg.isError ? 'Sistema' : 'Bot'}
                  </div>
                )}
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                <p className={`mt-1 text-xs ${msg.isBot ? 'text-gray-mid' : 'text-blue-100'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {botTyping && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-3">
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                  <Bot className="h-3 w-3" /> Bot
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-mid">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Escribiendo...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4" aria-label="Enviar mensaje">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            aria-label="Mensaje de chat"
            disabled={sending || botTyping}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <Button type="submit" disabled={!message.trim() || sending || botTyping} loading={sending} aria-label="Enviar mensaje">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
