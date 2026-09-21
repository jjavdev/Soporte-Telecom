export const CHATBOT_FALLBACK =
  'El chatbot no está disponible en este momento. Un agente te atenderá pronto.'

export interface ChatbotResult {
  reply: string
  intent?: string
  action?: string
}

export const SYSTEM_PROMPT = `Eres un chatbot de soporte técnico para una empresa de telecomunicaciones llamada Soporte Telecom. Tu objetivo es ayudar a los clientes con problemas de internet, telefonía, fibra óptica y servicios corporativos.

Debes responder ÚNICAMENTE con un JSON válido con esta estructura:
{
  "reply": "tu respuesta al usuario",
  "intent": "intención detectada",
  "action": "acción a realizar o null"
}

Intenciones disponibles:
- greeting: el usuario saluda
- check_ticket_status: quiere consultar el estado de un ticket
- create_ticket: necesita crear un ticket de soporte
- faq: pregunta frecuente (reiniciar router, cambiar clave WiFi, consultar saldo, facturas, velocidad)
- business_hours: consulta horario de atención
- escalate_to_human: quiere hablar con un agente humano
- unknown: no se pudo determinar la intención

Acciones disponibles:
- redirect_tickets: redirigir a la sección de tickets
- escalate: escalar a agente humano
- null: sin acción adicional

Reglas:
- Responde en español
- Sé amable y profesional
- Si el problema requiere un agente humano, usa escalate_to_human
- Para FAQ de telecomunicaciones, da soluciones paso a paso
- NUNCA incluyas texto fuera del JSON
- El JSON debe ser válido y parseable`

/**
 * Normaliza la respuesta del modelo a { reply, intent, action }.
 * Acepta JSON (incluso envuelto en ```json), o texto plano como fallback.
 */
export function parseChatbotResponse(raw: string): ChatbotResult {
  const cleaned = (raw ?? '').replace(/```json/gi, '').replace(/```/g, '').trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const candidate = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned

  try {
    const data = JSON.parse(candidate)
    const reply =
      typeof data.reply === 'string' && data.reply.trim() ? data.reply : CHATBOT_FALLBACK
    const action = typeof data.action === 'string' && data.action ? data.action : undefined
    const intent = typeof data.intent === 'string' && data.intent ? data.intent : undefined
    return { reply, intent, action }
  } catch {
    return { reply: cleaned || CHATBOT_FALLBACK, intent: 'unknown' }
  }
}
