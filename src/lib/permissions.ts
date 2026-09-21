import type { UserRole } from '@/types/database'

export type Capability =
  | 'admin.access'
  | 'reports.view'
  | 'tickets.viewAll'
  | 'tickets.update'
  | 'comments.internal'
  | 'kb.manage'
  | 'users.manage'
  | 'chat.handle'

const MATRIX: Record<UserRole, Capability[]> = {
  customer: [],
  agent: ['tickets.viewAll', 'tickets.update', 'comments.internal', 'chat.handle'],
  supervisor: ['reports.view', 'tickets.viewAll', 'tickets.update', 'comments.internal'],
  admin: [
    'admin.access',
    'reports.view',
    'tickets.viewAll',
    'tickets.update',
    'comments.internal',
    'kb.manage',
    'users.manage',
    'chat.handle',
  ],
}

export function can(role: UserRole | null | undefined, capability: Capability): boolean {
  if (!role) return false
  return MATRIX[role]?.includes(capability) ?? false
}

export function isStaff(role: UserRole | null | undefined): boolean {
  return role === 'agent' || role === 'supervisor' || role === 'admin'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Cliente',
  agent: 'Agente',
  supervisor: 'Supervisor',
  admin: 'Administrador',
}
