'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTickets } from '@/hooks/useTickets'
import { useAuth } from '@/hooks/useAuth'
import { isStaff } from '@/lib/permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'
import {
  ticketPriorityClass,
  ticketPriorityLabel,
  ticketStatusClass,
  ticketStatusLabel,
  ticketStatusOrder,
} from '@/lib/constants'
import type { TicketPriority, TicketStatus } from '@/types/database'

export default function TicketsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>()
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | undefined>()

  const { tickets, loading } = useTickets({
    search: search || undefined,
    status: statusFilter,
    priority: priorityFilter,
  })

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{isStaff(user?.role) ? 'Tickets' : 'Mis Tickets'}</h1>
        <Link href="/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter((e.target.value as TicketStatus) || undefined)}
          className="h-11 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm"
        >
          <option value="">Todos los estados</option>
          {ticketStatusOrder.map((status) => (
            <option key={status} value={status}>
              {ticketStatusLabel[status]}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter || ''}
          onChange={(e) => setPriorityFilter((e.target.value as TicketPriority) || undefined)}
          className="h-11 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm"
        >
          <option value="">Todas las prioridades</option>
          {(Object.keys(ticketPriorityLabel) as TicketPriority[]).map((priority) => (
            <option key={priority} value={priority}>
              {ticketPriorityLabel[priority]}
            </option>
          ))}
        </select>

        {(search || statusFilter || priorityFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setStatusFilter(undefined)
              setPriorityFilter(undefined)
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-muted-foreground">No se encontraron tickets</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {ticket.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{ticket.client?.full_name}</span>
                        <span>·</span>
                        <span>{ticket.category?.name}</span>
                        <span>·</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString('es')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                      <Badge variant="outline" className={ticketStatusClass[ticket.status]}>
                        {ticketStatusLabel[ticket.status]}
                      </Badge>
                      <Badge variant="outline" className={ticketPriorityClass[ticket.priority]}>
                        {ticketPriorityLabel[ticket.priority]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Título</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Prioridad</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b last:border-b-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {ticket.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ticket.client?.full_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ticket.category?.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={ticketStatusClass[ticket.status]}>
                            {ticketStatusLabel[ticket.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={ticketPriorityClass[ticket.priority]}>
                            {ticketPriorityLabel[ticket.priority]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString('es')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
