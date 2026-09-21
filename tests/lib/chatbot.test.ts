import { describe, it, expect } from 'vitest'
import { parseChatbotResponse, CHATBOT_FALLBACK } from '@/lib/chatbot'

describe('parseChatbotResponse', () => {
  it('parsea el JSON esperado del modelo', () => {
    const raw = '{"reply":"Hola, ¿en qué te ayudo?","intent":"greeting","action":null}'
    const r = parseChatbotResponse(raw)
    expect(r.reply).toBe('Hola, ¿en qué te ayudo?')
    expect(r.intent).toBe('greeting')
    expect(r.action).toBeUndefined()
  })

  it('acepta action cuando viene definida', () => {
    const r = parseChatbotResponse('{"reply":"Te paso con un agente","intent":"escalate_to_human","action":"escalate"}')
    expect(r.action).toBe('escalate')
    expect(r.intent).toBe('escalate_to_human')
  })

  it('limpia las code fences de markdown', () => {
    const raw = '```json\n{"reply":"ok","intent":"faq","action":null}\n```'
    expect(parseChatbotResponse(raw).reply).toBe('ok')
  })

  it('extrae el JSON aunque venga con texto alrededor', () => {
    const raw = 'Aquí está: {"reply":"ok","intent":"faq","action":null} fin'
    const r = parseChatbotResponse(raw)
    expect(r.reply).toBe('ok')
    expect(r.intent).toBe('faq')
  })

  it('usa el texto plano como reply si no hay JSON', () => {
    const r = parseChatbotResponse('Lo siento, no entendí tu mensaje.')
    expect(r.reply).toBe('Lo siento, no entendí tu mensaje.')
    expect(r.intent).toBe('unknown')
  })

  it('devuelve el fallback si la respuesta viene vacía', () => {
    const r = parseChatbotResponse('')
    expect(r.reply).toBe(CHATBOT_FALLBACK)
  })
})
