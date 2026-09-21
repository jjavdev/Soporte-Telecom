import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { mockSupabase, setTableResults, resetTableResults } from '../mocks/supabase-mock'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

const AUTH_USER = {
  id: 'u-1',
  email: 'agente@soporte.test',
  user_metadata: {},
  app_metadata: {},
  created_at: '2026-09-01T00:00:00Z',
}

const PROFILE = {
  id: 'u-1',
  email: 'agente@soporte.test',
  full_name: 'Agente Dos',
  role: 'agent',
  status: 'active',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

beforeEach(() => {
  resetTableResults()
  useAuthStore.setState({ user: null, loading: true })
})

describe('useAuth — autenticación con Supabase', () => {
  it('carga el perfil del usuario autenticado (rol y datos)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: AUTH_USER } })
    setTableResults('users', { select: { data: PROFILE, error: null } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.email).toBe('agente@soporte.test')
    expect(result.current.user?.role).toBe('agent')
    expect(result.current.user?.full_name).toBe('Agente Dos')
  })

  it('deja usuario en null si no hay sesión activa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('sincroniza el store global al autenticarse', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: AUTH_USER } })
    setTableResults('users', { select: { data: PROFILE, error: null } })

    renderHook(() => useAuth())

    await waitFor(() => expect(useAuthStore.getState().loading).toBe(false))
    expect(useAuthStore.getState().user?.id).toBe('u-1')
  })
})
