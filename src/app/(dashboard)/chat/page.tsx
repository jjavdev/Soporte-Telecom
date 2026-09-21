'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import { createClient } from '@/lib/supabase/client'
import { mergeChatMessages, type UiMessage } from '@/lib/chat-messages'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare, Bot, AlertCircle, Loader2, X } from 'lucide-react'

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
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { session, messages, loading, sendMessage, createSession, refetch } = useChat(sessionId)

  const uiMessages = useMemo(
    () => mergeChatMessages(messages, tempMessages, user?.id),
    [messages, tempMessages, user?.id],
  )

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const viewport = scrollViewportRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      } else if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [uiMessages, botTyping, scrollToBottom])

  const handleStartChat = async () => {
    if (!user) return
    setInitializing(true)
    setConnectionError(null)
    try {
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('client_id', user.id)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        setSessionId(existing.id)
        return
      }

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
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch('/api/chatbot', {
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

      const data = await response.json().catch(() => null)
      if (data?.reply) {
        return { reply: data.reply as string, intent: data.intent as string, action: data.action as string }
      }
      return { reply: 'No pude procesar tu mensaje. Por favor, intenta de nuevo o contacta a un agente.', intent: 'error' }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { reply: 'La respuesta está tardando demasiado. Un agente te atenderá pronto.', intent: 'timeout' }
      }
      console.warn('Chatbot no disponible:', err)
      return { reply: 'El chatbot no está disponible en este momento. Un agente te atenderá pronto.', intent: 'connection_error' }
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

    if (botResult) {
      const notPersisted = ['error', 'timeout', 'connection_error', 'unavailable'].includes(botResult.intent ?? '')
      if (notPersisted) {
        setTempMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            content: botResult.reply,
            sender_id: 'bot',
            created_at: new Date().toISOString(),
            isBot: true,
            isError: true,
          },
        ])
      } else {
        await refetch()
      }
    }

    setBotTyping(false)

    if (botResult?.action === 'redirect_tickets') {
      setTimeout(() => router.push('/tickets'), 2000)
    }
  }

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar size="lg" className="mb-4">
              <AvatarFallback>
                <MessageSquare className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-foreground">Chat de Soporte</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia una conversación con nuestro chatbot o con un agente de soporte.
            </p>
          </CardContent>
          <div className="flex justify-center px-6 pb-6">
            <Button onClick={handleStartChat} disabled={initializing} className="w-full">
              {initializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Iniciar Chat'
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <Avatar size="sm">
          <AvatarFallback>
            <Bot className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Chat de Soporte</h2>
          <p className="text-xs text-muted-foreground">
            {session?.status === 'waiting'
              ? 'Esperando agente...'
              : 'Conectado'}
          </p>
        </div>
        <div className={`h-2 w-2 rounded-full ${session?.status === 'waiting' ? 'bg-yellow-500' : 'bg-green-500'}`} />
      </div>

      {/* Error banner */}
      {connectionError && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{connectionError}</span>
          <button
            onClick={() => setConnectionError(null)}
            className="shrink-0 text-destructive/70 hover:text-destructive"
            aria-label="Cerrar error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea ref={scrollViewportRef} className="flex-1 min-h-0" role="log" aria-label="Mensajes del chat" aria-live="polite">
        <div className="flex flex-col gap-3 p-4">
          {uiMessages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Avatar className="mb-3">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Escribe un mensaje para comenzar.
                <br />
                El bot responderá automáticamente.
              </p>
            </div>
          )}

          {uiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              {msg.isBot && (
                <Avatar size="sm" className="shrink-0">
                  <AvatarFallback>
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[80vw] sm:max-w-[70%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                  msg.isError
                    ? 'border border-destructive/20 bg-destructive/10 text-destructive'
                    : msg.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                }`}
              >
                {msg.isBot && (
                  <p className={`mb-1 text-xs font-medium ${msg.isError ? 'text-destructive' : 'text-primary'}`}>
                    {msg.isError ? 'Sistema' : 'Bot'}
                  </p>
                )}
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${msg.isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {botTyping && (
            <div className="flex items-end gap-2 justify-start">
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback>
                  <Bot className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Escribiendo...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <form onSubmit={handleSend} className="border-t bg-background p-3 sm:p-4" aria-label="Enviar mensaje">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            aria-label="Mensaje de chat"
            disabled={sending || botTyping}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sending || botTyping}
            aria-label="Enviar mensaje"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
