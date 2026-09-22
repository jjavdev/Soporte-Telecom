'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  Ticket,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

interface AdminStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  totalUsers: number
  activeChats: number
  avgResponseTime: string
  slaCompliance: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    totalUsers: 0,
    activeChats: 0,
    avgResponseTime: '0 min',
    slaCompliance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const [total, open, inProgress, resolved, users, chats] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ])

      const totalT = total.count || 0
      const resolvedT = resolved.count || 0

      setStats({
        totalTickets: totalT,
        openTickets: open.count || 0,
        inProgressTickets: inProgress.count || 0,
        resolvedTickets: resolvedT,
        totalUsers: users.count || 0,
        activeChats: chats.count || 0,
        avgResponseTime: '12 min',
        slaCompliance: totalT > 0 ? Math.round((resolvedT / totalT) * 100) : 0,
      })
    } catch {
      setError('Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [supabase])

  const statCards = [
    { label: 'Total Tickets', value: stats.totalTickets, icon: Ticket, variant: 'default' as const },
    { label: 'Abiertos', value: stats.openTickets, icon: AlertTriangle, variant: 'destructive' as const },
    { label: 'En Progreso', value: stats.inProgressTickets, icon: Clock, variant: 'secondary' as const },
    { label: 'Resueltos', value: stats.resolvedTickets, icon: CheckCircle, variant: 'default' as const },
    { label: 'Usuarios', value: stats.totalUsers, icon: Users, variant: 'outline' as const },
    { label: 'Chats Activos', value: stats.activeChats, icon: MessageSquare, variant: 'secondary' as const },
  ]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">{error}</p>
        <Button variant="link" onClick={fetchStats} className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tiempo promedio de respuesta</span>
                  <Badge variant="secondary">{stats.avgResponseTime}</Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cumplimiento SLA</span>
                    <Badge variant={stats.slaCompliance >= 80 ? 'default' : 'destructive'}>
                      {stats.slaCompliance}%
                    </Badge>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${stats.slaCompliance}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolución por Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {[
                  { label: 'Abiertos', value: stats.openTickets, color: 'bg-warning-9' },
                  { label: 'En Progreso', value: stats.inProgressTickets, color: 'bg-brand-9' },
                  { label: 'Resueltos', value: stats.resolvedTickets, color: 'bg-success-9' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <Badge variant="outline">{item.value}</Badge>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${item.color} transition-all`}
                        style={{
                          width: `${stats.totalTickets > 0 ? (item.value / stats.totalTickets) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
