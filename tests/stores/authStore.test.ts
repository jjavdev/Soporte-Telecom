import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types/database'

const MOCK_USER: User = {
  id: 'u-1',
  email: 'cliente@soporte.test',
  full_name: 'Cliente Uno',
  role: 'customer',
  status: 'active',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

describe('authStore (estado global de autenticación)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true })
  })

  it('inicia con usuario nulo y cargando', () => {
    const { user, loading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(loading).toBe(true)
  })

  it('setUser almacena el perfil del usuario autenticado', () => {
    useAuthStore.getState().setUser(MOCK_USER)
    expect(useAuthStore.getState().user?.email).toBe('cliente@soporte.test')
    expect(useAuthStore.getState().user?.role).toBe('customer')
  })

  it('setUser(null) limpia la sesión al cerrar', () => {
    useAuthStore.getState().setUser(MOCK_USER)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setLoading controla el flag de carga', () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().loading).toBe(false)
  })
})
