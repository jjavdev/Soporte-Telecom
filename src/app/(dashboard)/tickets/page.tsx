'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTickets } from '@/hooks/useTickets'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { Plus, Search, Filter } from 'lucide-react'
import type { TicketStatus, TicketPriority } from '@/types/database'

const statusColors: Record<TicketStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
}

const priorityColors: Record<TicketPriority, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
}

export default function TicketsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>()
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | undefined>()

  const { tickets, loading } = useTickets({
    search: search || undefined,
    status: statusFilter,
    priority: priorityFilter,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-dark">Tickets</h1>
        <Link href="/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
            <Input
              placeholder="Buscar tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus || undefined)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En Progreso</option>
          <option value="resolved">Resuelto</option>
          <option value="closed">Cerrado</option>
        </select>

        <select
          value={priorityFilter || ''}
          onChange={(e) => setPriorityFilter(e.target.value as TicketPriority || undefined)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todas las prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-mid">Cargando tickets...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-gray-mid">No se encontraron tickets</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-dark">{ticket.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-mid">
                      {ticket.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-mid">
                      <span>{ticket.client?.full_name}</span>
                      <span>·</span>
                      <span>{ticket.category?.name}</span>
                      <span>·</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString('es')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusColors[ticket.status]}>{ticket.status}</Badge>
                    <Badge variant={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
