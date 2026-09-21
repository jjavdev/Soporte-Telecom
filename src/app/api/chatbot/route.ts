import { NextResponse } from 'next/server'
import { SYSTEM_PROMPT, CHATBOT_FALLBACK, parseChatbotResponse } from '@/lib/chatbot'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const API_URL = process.env.CHATBOT_API_URL ?? 'https://api.deepseek.com/chat/completions'
const MODEL = process.env.CHATBOT_MODEL ?? 'deepseek-chat'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ reply: 'No autorizado.', intent: 'unauthorized' }, { status: 401 })
  }

  let message = ''
  try {
    const body = await request.json()
    message = typeof body?.message === 'string' ? body.message.trim() : ''
  } catch {
    return NextResponse.json({ reply: 'Mensaje inválido.', intent: 'error' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ reply: 'Escribe un mensaje.', intent: 'error' }, { status: 400 })
  }

  const apiKey = process.env.CHATBOT_API_KEY
  if (!apiKey) {
    return NextResponse.json({ reply: CHATBOT_FALLBACK, intent: 'unavailable' }, { status: 503 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn('[chatbot] LLM respondió', response.status)
      return NextResponse.json(
        { reply: 'No pude procesar tu mensaje. Intenta de nuevo o contacta a un agente.', intent: 'error' },
        { status: 502 },
      )
    }

    const data = await response.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    const result = parseChatbotResponse(content)
    return NextResponse.json(result)
  } catch (err) {
    clearTimeout(timeout)
    const aborted = err instanceof DOMException && err.name === 'AbortError'
    console.warn('[chatbot] error de conexión con el LLM', aborted ? '(timeout)' : '')
    if (aborted) {
      return NextResponse.json(
        { reply: 'La respuesta está tardando demasiado. Un agente te atenderá pronto.', intent: 'timeout' },
        { status: 504 },
      )
    }
    return NextResponse.json({ reply: CHATBOT_FALLBACK, intent: 'connection_error' }, { status: 502 })
  }
}
