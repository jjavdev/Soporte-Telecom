import { describe, it, expect } from 'vitest'
import { mergeChatMessages, type UiMessage } from '@/lib/chat-messages'
import type { ChatMessage } from '@/types/database'

function dbMsg(id: string, sender: string, at: string, content = id): ChatMessage {
  return { id, session_id: 's1', sender_id: sender, content, created_at: at }
}

const USER = 'user-1'
const BOT = 'bot-1'

describe('mergeChatMessages', () => {
  it('ordena por fecha (no por origen db/temp)', () => {
    const db = [dbMsg('m2', BOT, '2026-01-01T10:00:02Z')]
    const temp: UiMessage[] = [
      { id: 't1', content: 'hola', sender_id: USER, created_at: '2026-01-01T10:00:01Z' },
      { id: 't2', content: 'respuesta', sender_id: BOT, created_at: '2026-01-01T10:00:03Z', isBot: true },
    ]
    const out = mergeChatMessages(db, temp, USER)
    expect(out.map((m) => m.id)).toEqual(['t1', 'm2', 't2'])
  })

  it('elimina duplicados por id entre BD y temp', () => {
    const db = [dbMsg('m1', USER, '2026-01-01T10:00:00Z')]
    const temp: UiMessage[] = [{ id: 'm1', content: 'eco', sender_id: USER, created_at: '2026-01-01T10:00:00Z' }]
    expect(mergeChatMessages(db, temp, USER)).toHaveLength(1)
  })

  it('marca como bot todo emisor distinto al usuario', () => {
    const out = mergeChatMessages([dbMsg('m1', USER, '2026-01-01T10:00:00Z'), dbMsg('m2', BOT, '2026-01-01T10:00:01Z')], [], USER)
    expect(out.find((m) => m.id === 'm1')?.isBot).toBe(false)
    expect(out.find((m) => m.id === 'm2')?.isBot).toBe(true)
  })

  it('usa el id como desempate cuando la fecha es igual', () => {
    const same = '2026-01-01T10:00:00Z'
    const out = mergeChatMessages([dbMsg('b', BOT, same), dbMsg('a', BOT, same)], [], USER)
    expect(out.map((m) => m.id)).toEqual(['a', 'b'])
  })
})
