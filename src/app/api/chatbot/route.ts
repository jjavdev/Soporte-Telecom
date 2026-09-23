import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SYSTEM_PROMPT, CHATBOT_FALLBACK, parseChatbotResponse, type ChatbotResult } from '@/lib/chatbot'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const API_URL = process.env.CHATBOT_API_URL ?? 'https://api.deepseek.com/chat/completions'
const MODEL = process.env.CHATBOT_MODEL ?? 'deepseek-chat'
const BOT_ID = process.env.CHATBOT_USER_ID
const N8N_URL = process.env.N8N_WEBHOOK_URL ?? process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

/**
 * Acepta tanto una URL base (self-hosted, ej. http://localhost:5678) como una
 * URL completa de webhook (n8n Cloud, ej. https://xxx.app.n8n.cloud/webhook/chatbot).
 */
function n8nWebhookUrl(base: string): string {
  const trimmed = base.replace(/\/+$/, '')
  return /\/webhook\//.test(trimmed) ? trimmed : `${trimmed}/webhook/chatbot`
}

const NON_PERSISTED = ['error', 'timeout', 'connection_error', 'unavailable', 'unauthorized']

function admin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return null
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

/** Llama al workflow de n8n (preferido si está configurado). */
async function callN8n(
  message: string,
  sessionId: string | null,
  userId: string,
  signal: AbortSignal,
): Promise<ChatbotResult> {
  const response = await fetch(n8nWebhookUrl(N8N_URL!), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId, user_id: userId }),
    signal,
  })
  if (!response.ok) throw new Error(`n8n ${response.status}`)
  const text = await response.text()
  if (!text.trim()) throw new Error('n8n respuesta vacía')
  return parseChatbotResponse(text)
}

/** Llama directo al proveedor de IA (OpenAI-compatible). */
async function callDirect(message: string, signal: AbortSignal): Promise<ChatbotResult> {
  const apiKey = process.env.CHATBOT_API_KEY
  if (!apiKey) throw new Error('sin CHATBOT_API_KEY')

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
    signal,
  })
  if (!response.ok) throw new Error(`ia ${response.status}`)
  const data = await response.json()
  return parseChatbotResponse(data?.choices?.[0]?.message?.content ?? '')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ reply: 'No autorizado.', intent: 'unauthorized' }, { status: 401 })
  }

  let message = ''
  let sessionId: string | null = null
  try {
    const body = await request.json()
    message = typeof body?.message === 'string' ? body.message.trim() : ''
    sessionId = typeof body?.session_id === 'string' ? body.session_id : null
  } catch {
    return NextResponse.json({ reply: 'Mensaje inválido.', intent: 'error' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ reply: 'Escribe un mensaje.', intent: 'error' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let result: ChatbotResult | null = null
  let source = 'direct'

  try {
    if (N8N_URL) {
      try {
        result = await callN8n(message, sessionId, user.id, controller.signal)
        source = 'n8n'
      } catch (err) {
        console.warn('[chatbot] n8n no disponible, usando API directa:', err instanceof Error ? err.message : err)
      }
    }

    if (!result) {
      result = await callDirect(message, controller.signal)
      source = 'direct'
    }
  } catch (err) {
    clearTimeout(timeout)
    const aborted = err instanceof DOMException && err.name === 'AbortError'
    console.warn('[chatbot] error del proveedor de IA', aborted ? '(timeout)' : '')
    if (aborted) {
      return NextResponse.json(
        { reply: 'La respuesta está tardando demasiado. Un agente te atenderá pronto.', intent: 'timeout' },
        { status: 504 },
      )
    }
    return NextResponse.json({ reply: CHATBOT_FALLBACK, intent: 'connection_error' }, { status: 502 })
  }

  clearTimeout(timeout)

  // Persistir la respuesta del bot para que quede en el historial
  if (sessionId && BOT_ID && !NON_PERSISTED.includes(result.intent ?? '')) {
    const db = admin()
    if (db) {
      try {
        const { data: owned } = await db
          .from('chat_sessions')
          .select('id')
          .eq('id', sessionId)
          .eq('client_id', user.id)
          .maybeSingle()
        if (owned) {
          await db.from('chat_messages').insert({
            session_id: sessionId,
            sender_id: BOT_ID,
            content: result.reply,
          })
        }
      } catch {
        console.warn('[chatbot] no se pudo persistir el mensaje del bot')
      }
    }
  }

  return NextResponse.json({ ...result, source })
}
