import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTickets } from '@/hooks/useTickets'
import { mockSupabase, setTableResults, resetTableResults } from '../mocks/supabase-mock'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

const CATEGORIA = { id: 'c-1', name: 'Internet', slug: 'internet', created_at: '2026-01-01T00:00:00Z' }
const CLIENTE = { id: 'u-1', email: 'cliente@soporte.test', full_name: 'Cliente Uno' }
const AGENTE = { id: 'u-2', email: 'agente@soporte.test', full_name: 'Agente Dos' }

const TICKETS = [
  {
    id: 't-1',
    title: 'No tengo internet',
    description: 'Sin conexión desde ayer',
    category_id: 'c-1',
    client_id: 'u-1',
    agent_id: 'u-2',
    priority: 'high',
    status: 'open',
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
    category: CATEGORIA,
    client: CLIENTE,
    agent: AGENTE,
  },
  {
    id: 't-2',
    title: 'Cambio de clave WiFi',
    description: 'Quiero cambiar la contraseña',
    category_id: 'c-1',
    client_id: 'u-1',
    agent_id: 'u-2',
    priority: 'low',
    status: 'in_progress',
    created_at: '2026-09-11T10:00:00Z',
    updated_at: '2026-09-11T10:00:00Z',
    category: CATEGORIA,
    client: CLIENTE,
    agent: AGENTE,
  },
]

beforeEach(() => {
  resetTableResults()
  setTableResults('tickets', { select: { data: TICKETS, error: null } })
})

describe('useTickets — gestión de tickets', () => {
  it('RF-002: lista tickets con categoría, cliente y agente relacionados', async () => {
    const { result } = renderHook(() => useTickets())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickets).toHaveLength(2)
    expect(result.current.tickets[0].category?.name).toBe('Internet')
    expect(result.current.tickets[0].client?.full_name).toBe('Cliente Uno')
    expect(result.current.tickets[0].agent?.full_name).toBe('Agente Dos')
  })

  it('RF-002: cada ticket contiene título, descripción, prioridad y estado', async () => {
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const ticket = result.current.tickets[0]
    expect(ticket.id).toBe('t-1')
    expect(ticket.title).toBeTruthy()
    expect(ticket.description).toBeTruthy()
    expect(ticket.priority).toBe('high')
    expect(ticket.status).toBe('open')
    expect(ticket.created_at).toBeTruthy()
  })

  it('RF-005: filtra tickets por estado', async () => {
    setTableResults('tickets', { select: { data: [TICKETS[0]], error: null } })
    const { result } = renderHook(() => useTickets({ status: 'open' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickets).toHaveLength(1)
    expect(result.current.tickets[0].status).toBe('open')

    const fromCall = mockSupabase.from.mock.calls[0][0]
    expect(fromCall).toBe('tickets')
  })

  it('RF-005: filtra tickets por prioridad', async () => {
    setTableResults('tickets', { select: { data: [TICKETS[0]], error: null } })
    const { result } = renderHook(() => useTickets({ priority: 'high' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tickets).toHaveLength(1)
    expect(result.current.tickets[0].priority).toBe('high')
  })

  it('RF-001: crea un ticket y lo agrega a la lista', async () => {
    const nuevo = {
      title: 'Factura incorrecta',
      description: 'Cobro duplicado en agosto',
      client_id: 'u-1',
      priority: 'medium' as const,
      status: 'open' as const,
      category_id: 'c-1',
    }

    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    setTableResults('tickets', {
      insert: { data: { ...nuevo, id: 't-3', created_at: '2026-09-12T00:00:00Z' }, error: null },
      select: { data: [...TICKETS, { ...nuevo, id: 't-3' }], error: null },
    })

    let created: { id: string; title: string } | null = null
    await act(async () => {
      created = (await result.current.createTicket(nuevo)) as { id: string; title: string }
    })

    expect(created?.id).toBe('t-3')
    expect(created?.title).toBe('Factura incorrecta')
    await waitFor(() => expect(result.current.tickets).toHaveLength(3))
  })

  it('RF-005: actualiza el estado de un ticket', async () => {
    setTableResults('tickets', {
      update: { data: null, error: null },
      select: { data: [TICKETS[0], TICKETS[1]], error: null },
    })

    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateTicket('t-1', { status: 'in_progress' })
    })

    const updateCall = mockSupabase.from.mock.results.find(
      (r) => ((r.value as { update?: { mock: { calls: unknown[][] } } }).update?.mock.calls.length ?? 0) > 0
    )
    expect(updateCall).toBeDefined()
  })

  it('RNF-010: expone el error cuando la consulta falla', async () => {
    setTableResults('tickets', { select: { data: null, error: { message: 'Relación no permitida' } } })
    const { result } = renderHook(() => useTickets())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Relación no permitida')
    expect(result.current.tickets).toHaveLength(0)
  })
})
