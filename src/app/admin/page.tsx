'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import {
  BarChart3,
  Ticket,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
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
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
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
      }
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    { label: 'Total Tickets', value: stats.totalTickets, icon: Ticket, color: 'text-primary' },
    { label: 'Abiertos', value: stats.openTickets, icon: AlertTriangle, color: 'text-warning' },
    { label: 'En Progreso', value: stats.inProgressTickets, icon: Clock, color: 'text-blue-500' },
    { label: 'Resueltos', value: stats.resolvedTickets, icon: CheckCircle, color: 'text-success' },
    { label: 'Usuarios', value: stats.totalUsers, icon: Users, color: 'text-purple-500' },
    { label: 'Chats Activos', value: stats.activeChats, icon: MessageSquare, color: 'text-green-500' },
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-gray-dark">Panel de Administración</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Rendimiento</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-mid">Tiempo promedio de respuesta</span>
                <span className="font-medium">{stats.avgResponseTime}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-mid">Cumplimiento SLA</span>
                <span className="font-medium">{stats.slaCompliance}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-success"
                  style={{ width: `${stats.slaCompliance}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Resolución por Estado</h2>
          <div className="space-y-3">
            {[
              { label: 'Abiertos', value: stats.openTickets, total: stats.totalTickets, color: 'bg-warning' },
              { label: 'En Progreso', value: stats.inProgressTickets, total: stats.totalTickets, color: 'bg-blue-500' },
              { label: 'Resueltos', value: stats.resolvedTickets, total: stats.totalTickets, color: 'bg-success' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-mid">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
