import type { TicketPriority, TicketStatus, UserRole, UserStatus } from '@/types/database'

/*
 * Single source of truth for ticket & user taxonomy.
 * Every page reads labels/classes from here — no per-page duplicate maps.
 */

export const ticketStatusLabel: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

export const ticketStatusOrder: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export const ticketStatusClass: Record<TicketStatus, string> = {
  open: 'border-warning-6 bg-warning-3 text-warning-11',
  in_progress: 'border-brand-6 bg-brand-3 text-brand-11',
  resolved: 'border-success-6 bg-success-3 text-success-11',
  closed: 'border-neutral-6 bg-neutral-3 text-neutral-11',
}

export const ticketPriorityLabel: Record<TicketPriority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const ticketPriorityOrder: TicketPriority[] = ['urgent', 'high', 'medium', 'low']

export const ticketPriorityClass: Record<TicketPriority, string> = {
  urgent: 'border-danger-6 bg-danger-3 text-danger-11',
  high: 'border-warning-6 bg-warning-3 text-warning-11',
  medium: 'border-brand-6 bg-brand-3 text-brand-11',
  low: 'border-neutral-6 bg-neutral-3 text-neutral-11',
}

export const userRoleLabel: Record<UserRole, string> = {
  customer: 'Cliente',
  agent: 'Agente',
  supervisor: 'Supervisor',
  admin: 'Admin',
}

export const userRoleClass: Record<UserRole, string> = {
  customer: 'border-neutral-6 bg-neutral-3 text-neutral-11',
  agent: 'border-brand-6 bg-brand-3 text-brand-11',
  supervisor: 'border-warning-6 bg-warning-3 text-warning-11',
  admin: 'border-danger-6 bg-danger-3 text-danger-11',
}

export const userStatusLabel: Record<UserStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
}

export const userStatusClass: Record<UserStatus, string> = {
  active: 'border-success-6 bg-success-3 text-success-11',
  inactive: 'border-neutral-6 bg-neutral-3 text-neutral-11',
  suspended: 'border-danger-6 bg-danger-3 text-danger-11',
}
