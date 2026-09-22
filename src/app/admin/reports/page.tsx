'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, RefreshCw, AlertTriangle } from 'lucide-react'
import type { Ticket } from '@/types/database'
import {
  ticketPriorityClass,
  ticketPriorityLabel,
  ticketPriorityOrder,
  ticketStatusClass,
  ticketStatusLabel,
  ticketStatusOrder,
} from '@/lib/constants'

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="mx-auto h-10 w-16 mb-2" />
              <Skeleton className="mx-auto h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-xs" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTickets = async () => {
    setLoading(true)
    setError(null)
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

  useEffect(() => {
    fetchTickets()
  }, [supabase])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchTickets}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

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

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-auto h-full">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Reportes</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning-11">{stats.byStatus.open}</p>
            <p className="text-sm text-muted-foreground">Abiertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-success-11">{stats.byStatus.resolved}</p>
            <p className="text-sm text-muted-foreground">Resueltos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-danger-11">{stats.byPriority.urgent}</p>
            <p className="text-sm text-muted-foreground">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Por Estado</TabsTrigger>
          <TabsTrigger value="priority">Por Prioridad</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketStatusOrder.map((status) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant="outline" className={ticketStatusClass[status]}>
                    {ticketStatusLabel[status]}
                  </Badge>
                  <span className="font-bold text-lg">{stats.byStatus[status]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Prioridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketPriorityOrder.map((priority) => (
                <div key={priority} className="flex items-center justify-between">
                  <Badge variant="outline" className={ticketPriorityClass[priority]}>
                    {ticketPriorityLabel[priority]}
                  </Badge>
                  <span className="font-bold text-lg">{stats.byPriority[priority]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
