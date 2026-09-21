import type { ChatMessage } from '@/types/database'

export interface UiMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  isBot?: boolean
  isError?: boolean
}

/**
 * Combina mensajes de la BD con los optimistas (temp), sin duplicados y
 * ordenados por fecha. `isBot` = cualquier emisor que no sea el usuario actual.
 */
export function mergeChatMessages(
  db: ChatMessage[],
  temp: UiMessage[],
  userId?: string,
): UiMessage[] {
  const seen = new Set<string>()
  const all: UiMessage[] = []

  for (const m of db) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    all.push({
      id: m.id,
      content: m.content,
      sender_id: m.sender_id,
      created_at: m.created_at,
      isBot: m.sender_id !== userId,
      isError: false,
    })
  }

  for (const m of temp) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    all.push(m)
  }

  return all.sort((a, b) => {
    const ta = new Date(a.created_at).getTime()
    const tb = new Date(b.created_at).getTime()
    return ta === tb ? a.id.localeCompare(b.id) : ta - tb
  })
}
