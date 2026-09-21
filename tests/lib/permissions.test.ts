import { describe, it, expect } from 'vitest'
import { can, isStaff } from '@/lib/permissions'

describe('permissions — capacidades por rol', () => {
  it('cliente no tiene capacidades de staff ni admin', () => {
    expect(can('customer', 'admin.access')).toBe(false)
    expect(can('customer', 'tickets.viewAll')).toBe(false)
    expect(can('customer', 'tickets.update')).toBe(false)
    expect(can('customer', 'comments.internal')).toBe(false)
    expect(can('customer', 'reports.view')).toBe(false)
    expect(can('customer', 'kb.manage')).toBe(false)
    expect(can('customer', 'users.manage')).toBe(false)
  })

  it('agente atiende tickets y gestiona chat, pero no administra', () => {
    expect(can('agent', 'tickets.viewAll')).toBe(true)
    expect(can('agent', 'tickets.update')).toBe(true)
    expect(can('agent', 'comments.internal')).toBe(true)
    expect(can('agent', 'chat.handle')).toBe(true)
    expect(can('agent', 'admin.access')).toBe(false)
    expect(can('agent', 'users.manage')).toBe(false)
    expect(can('agent', 'kb.manage')).toBe(false)
  })

  it('supervisor ve reportes y tickets, sin panel admin', () => {
    expect(can('supervisor', 'reports.view')).toBe(true)
    expect(can('supervisor', 'tickets.viewAll')).toBe(true)
    expect(can('supervisor', 'admin.access')).toBe(false)
    expect(can('supervisor', 'users.manage')).toBe(false)
  })

  it('admin tiene todas las capacidades', () => {
    for (const cap of ['admin.access', 'reports.view', 'tickets.viewAll', 'tickets.update', 'comments.internal', 'kb.manage', 'users.manage', 'chat.handle'] as const) {
      expect(can('admin', cap)).toBe(true)
    }
  })

  it('sin rol no tiene capacidades', () => {
    expect(can(null, 'admin.access')).toBe(false)
    expect(can(undefined, 'tickets.viewAll')).toBe(false)
  })

  it('isStaff solo para agent/supervisor/admin', () => {
    expect(isStaff('customer')).toBe(false)
    expect(isStaff('agent')).toBe(true)
    expect(isStaff('supervisor')).toBe(true)
    expect(isStaff('admin')).toBe(true)
    expect(isStaff(null)).toBe(false)
  })
})
