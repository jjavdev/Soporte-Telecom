'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import { FileText } from 'lucide-react'
import type { Ticket } from '@/types/database'

export default function AdminReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await supabase
          .from('tickets')
          .select('*, category:categories(name), client:users!tickets_client_id_fkey(full_name), agent:users!tickets_agent_id_fkey(full_name)')
          .order('created_at', { ascending: false })

        setTickets((data as Ticket[]) || [])
      } catch {
        setError('Error al cargar los tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [supabase])

  const stats = {
    total: tickets.length,
    byStatus: {
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    },
    byPriority: {
      low: tickets.filter((t) => t.priority === 'low').length,
      medium: tickets.filter((t) => t.priority === 'medium').length,
      high: tickets.filter((t) => t.priority === 'high').length,
      urgent: tickets.filter((t) => t.priority === 'urgent').length,
    },
  }

  if (loading) return <div className="py-12 text-center text-gray-mid">Cargando reportes...</div>
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-danger">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-primary hover:underline">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-dark">Reportes</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Tickets por Estado</h2>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <Badge variant={
                  status === 'open' ? 'warning' :
                  status === 'in_progress' ? 'info' :
                  status === 'resolved' ? 'success' : 'default'
                }>
                  {status.replace('_', ' ')}
                </Badge>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Tickets por Prioridad</h2>
          <div className="space-y-3">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <Badge variant={
                  priority === 'urgent' ? 'danger' :
                  priority === 'high' ? 'warning' :
                  priority === 'medium' ? 'info' : 'default'
                }>
                  {priority}
                </Badge>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Resumen General</h2>
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <div>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-gray-mid">Total Tickets</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-warning">{stats.byStatus.open}</p>
            <p className="text-sm text-gray-mid">Abiertos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-success">{stats.byStatus.resolved}</p>
            <p className="text-sm text-gray-mid">Resueltos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-danger">{stats.byPriority.urgent}</p>
            <p className="text-sm text-gray-mid">Urgentes</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
