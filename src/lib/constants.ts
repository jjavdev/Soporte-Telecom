import type { TicketStatus, UserRole } from '@/types/database'

export const statusColors: Record<TicketStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
}

export const roleColors: Record<UserRole, 'info' | 'success' | 'warning' | 'danger'> = {
  customer: 'info',
  agent: 'success',
  supervisor: 'warning',
  admin: 'danger',
}
