'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import { Ticket as TicketIcon, MessageSquare, BookOpen } from 'lucide-react'
import type { Ticket } from '@/types/database'
import { statusColors } from '@/lib/constants'

interface Stats {
  totalTickets: number
  openTickets: number
  activeChats: number
  knowledgeArticles: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    activeChats: 0,
    knowledgeArticles: 0,
  })
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tickets, open, chats, articles] = await Promise.all([
          supabase.from('tickets').select('id', { count: 'exact', head: true }),
          supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('knowledge_articles').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          totalTickets: tickets.count || 0,
          openTickets: open.count || 0,
          activeChats: chats.count || 0,
          knowledgeArticles: articles.count || 0,
        })
      } catch {
        setError('Error al cargar las estadísticas')
      }
    }

    const fetchRecent = async () => {
      try {
        const { data } = await supabase
          .from('tickets')
          .select('*, category:categories(name), client:users!tickets_client_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentTickets((data as Ticket[]) || [])
      } catch {
        setError('Error al cargar los tickets recientes')
      }
    }

    fetchStats()
    fetchRecent()
  }, [supabase])

  const statCards = [
    { label: 'Total Tickets', value: stats.totalTickets, icon: TicketIcon, color: 'text-primary' },
    { label: 'Tickets Abiertos', value: stats.openTickets, icon: TicketIcon, color: 'text-warning' },
    { label: 'Chats Activos', value: stats.activeChats, icon: MessageSquare, color: 'text-success' },
    { label: 'Artículos KB', value: stats.knowledgeArticles, icon: BookOpen, color: 'text-primary-light' },
  ]

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
      <h1 className="text-2xl font-bold text-gray-dark">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`rounded-lg bg-gray-50 p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-mid">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tickets Recientes</h2>
          <Link href="/tickets" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <p className="py-8 text-center text-gray-mid">No hay tickets aún</p>
        ) : (
          <div className="divide-y">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-sm text-gray-mid">
                    {ticket.client?.full_name} · {ticket.category?.name}
                  </p>
                </div>
                <Badge variant={statusColors[ticket.status]}>
                  {ticket.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
