'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { isStaff } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ticketStatusClass, ticketStatusLabel } from '@/lib/constants'
import {
  Ticket as TicketIcon,
  MessageSquare,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Plus,
} from 'lucide-react'
import type { Ticket, TicketStatus } from '@/types/database'

interface Stats {
  totalTickets: number
  openTickets: number
  activeChats: number
  knowledgeArticles: number
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn('shrink-0', ticketStatusClass[status])}>
      {ticketStatusLabel[status]}
    </Badge>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TicketRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    activeChats: 0,
    knowledgeArticles: 0,
  })
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { user } = useAuth()
  const staff = isStaff(user?.role)

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

    Promise.all([fetchStats(), fetchRecent()]).finally(() => setLoading(false))
  }, [supabase])

  const statCards = [
    { label: staff ? 'Total Tickets' : 'Mis Tickets', value: stats.totalTickets, icon: TicketIcon, iconBg: 'bg-neutral-3 text-neutral-11', href: '/tickets' },
    { label: staff ? 'Tickets Abiertos' : 'Abiertos', value: stats.openTickets, icon: TicketIcon, iconBg: 'bg-warning-3 text-warning-11', href: '/tickets?status=open' },
    { label: staff ? 'Chats Activos' : 'Mis Chats', value: stats.activeChats, icon: MessageSquare, iconBg: 'bg-success-3 text-success-11', href: '/chat' },
    { label: 'Artículos KB', value: stats.knowledgeArticles, icon: BookOpen, iconBg: 'bg-brand-3 text-brand-11', href: '/knowledge' },
  ]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{staff ? 'Dashboard' : 'Mi Panel'}</h1>
        <Button nativeButton={false} render={<Link href="/tickets/new" />}>
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat) => (
              <Link key={stat.label} href={stat.href} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Card className="h-full transition-colors hover:bg-neutral-2">
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className={cn('rounded-lg p-3', stat.iconBg)}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Recientes</CardTitle>
          <CardAction>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => <TicketRowSkeleton key={i} />)}
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">No hay tickets aún</p>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/tickets/new" />}>
                <Plus className="h-4 w-4" />
                Crear el primero
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile: card layout */}
              <div className="divide-y md:hidden">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.client?.full_name} · {ticket.category?.name}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </Link>
                ))}
              </div>

              {/* Desktop: table layout */}
              <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Título</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Categoría</th>
                    <th className="pb-3 text-right font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-3">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {ticket.client?.full_name}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {ticket.category?.name}
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={ticket.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
