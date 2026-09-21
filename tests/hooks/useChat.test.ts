import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useChat } from '@/hooks/useChat'
import { mockSupabase, setTableResults, resetTableResults } from '../mocks/supabase-mock'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

const SESSION = {
  id: 's-1',
  client_id: 'u-1',
  agent_id: 'u-2',
  status: 'active',
  created_at: '2026-09-10T09:00:00Z',
  updated_at: '2026-09-10T09:00:00Z',
}

const MESSAGES = [
  {
    id: 'm-1',
    session_id: 's-1',
    sender_id: 'u-1',
    content: 'Hola, no tengo internet',
    created_at: '2026-09-10T09:01:00Z',
    sender: { full_name: 'Cliente Uno' },
  },
  {
    id: 'm-2',
    session_id: 's-1',
    sender_id: 'u-2',
    content: 'Hola, enseguida le reviso',
    created_at: '2026-09-10T09:02:00Z',
    sender: { full_name: 'Agente Dos' },
  },
]

beforeEach(() => {
  resetTableResults()
  mockSupabase.channel.mockClear()
  setTableResults('chat_sessions', { select: { data: SESSION, error: null } })
  setTableResults('chat_messages', { select: { data: MESSAGES, error: null } })
})

describe('useChat — chat en tiempo real', () => {
  it('RF-012: carga la sesión de chat activa', async () => {
    const { result } = renderHook(() => useChat('s-1'))

    await waitFor(() => expect(result.current.session?.id).toBe('s-1'))
    expect(result.current.session?.status).toBe('active')
  })

  it('RF-012: carga el historial de mensajes ordenado por fecha', async () => {
    const { result } = renderHook(() => useChat('s-1'))

    await waitFor(() => expect(result.current.messages.length).toBe(2))
    expect(result.current.messages[0].content).toBe('Hola, no tengo internet')
    expect(result.current.messages[1].content).toBe('Hola, enseguida le reviso')
  })

  it('RF-012: envía un mensaje al chat', async () => {
    setTableResults('chat_messages', {
      select: { data: MESSAGES, error: null },
      insert: { data: null, error: null },
    })

    const { result } = renderHook(() => useChat('s-1'))
    await waitFor(() => expect(result.current.messages.length).toBe(2))

    let sendError: unknown = null
    await act(async () => {
      try {
        await result.current.sendMessage('Gracias, quedó resuelto', 'u-1')
      } catch (e) {
        sendError = e
      }
    })

    expect(sendError).toBeNull()
    const insertCall = mockSupabase.from.mock.results.find(
      (r) => ((r.value as { insert?: { mock: { calls: unknown[][] } } }).insert?.mock.calls.length ?? 0) > 0
    )
    expect(insertCall).toBeDefined()
    const [payload] = (insertCall!.value as { insert: { mock: { calls: unknown[][] } } }).insert.mock.calls[0]
    expect(payload).toMatchObject({
      session_id: 's-1',
      sender_id: 'u-1',
      content: 'Gracias, quedó resuelto',
    })
  })

  it('RF-012: crea una nueva sesión de chat para el cliente', async () => {
    setTableResults('chat_sessions', {
      select: { data: SESSION, error: null },
      insert: { data: { ...SESSION, id: 's-2', status: 'waiting' }, error: null },
    })

    const { result } = renderHook(() => useChat(null))

    let created: { id: string; status: string } | null = null
    await act(async () => {
      created = (await result.current.createSession('u-1')) as { id: string; status: string }
    })

    expect(created?.id).toBe('s-2')
    expect(created?.status).toBe('waiting')
  })

  it('RF-012: no carga datos si no hay sesión (sessionId nulo)', async () => {
    const { result } = renderHook(() => useChat(null))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()
    expect(result.current.messages).toHaveLength(0)
  })
})
