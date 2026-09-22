'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Ticket, Comment, TicketStatus } from '@/types/database'
import { can } from '@/lib/permissions'
import {
  ticketPriorityClass,
  ticketPriorityLabel,
  ticketStatusClass,
  ticketStatusLabel,
  ticketStatusOrder,
} from '@/lib/constants'

function TicketDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comentarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function TicketDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'public' | 'internal'>('public')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const canInternal = can(user?.role, 'comments.internal')
  const canUpdate = can(user?.role, 'tickets.update')

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data } = await supabase
          .from('tickets')
          .select('*, category:categories(*), client:users!tickets_client_id_fkey(full_name, email, avatar_url), agent:users!tickets_agent_id_fkey(full_name, email, avatar_url)')
          .eq('id', params.id)
          .single()

        setTicket(data as Ticket)
        setLoading(false)
      } catch {
        setError('Error al cargar el ticket')
        setLoading(false)
      }
    }

    const fetchComments = async () => {
      try {
        const { data } = await supabase
          .from('comments')
          .select('*, author:users(full_name, avatar_url)')
          .eq('ticket_id', params.id)
          .order('created_at', { ascending: true })

        setComments((data as Comment[]) || [])
      } catch {
        setError('Error al cargar los comentarios')
      }
    }

    fetchTicket()
    fetchComments()
  }, [params.id, supabase])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      ticket_id: params.id as string,
      author_id: user.id,
      content: newComment,
      type: commentType,
    })

    if (!error) {
      setNewComment('')
      setCommentType('public')
      const { data } = await supabase
        .from('comments')
        .select('*, author:users(full_name, avatar_url)')
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true })
      setComments((data as Comment[]) || [])
    }
    setSubmitting(false)
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', params.id as string)

    setTicket((prev) => (prev ? { ...prev, status: newStatus } : null))
  }

  if (loading) return <TicketDetailSkeleton />
  if (error) return <div className="py-12 text-center text-destructive">{error}</div>
  if (!ticket) return <div className="py-12 text-center text-muted-foreground">Ticket no encontrado</div>

  const initials = (name?: string) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const visibleComments = canInternal ? comments : comments.filter((c) => c.type === 'public')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
          <p className="text-sm text-muted-foreground">
            Creado el {new Date(ticket.created_at).toLocaleDateString('es')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={ticketStatusClass[ticket.status]}>
            {ticketStatusLabel[ticket.status]}
          </Badge>
          <Badge variant="outline" className={ticketPriorityClass[ticket.priority]}>
            {ticketPriorityLabel[ticket.priority]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-80 space-y-4 overflow-auto">
                {visibleComments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No hay comentarios</p>
                ) : (
                  visibleComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar size="sm">
                        <AvatarImage src={comment.author?.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(comment.author?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 rounded-lg bg-muted p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.author?.full_name}</span>
                          {comment.type === 'internal' && (
                            <Badge variant="outline" className="text-[10px]">Interno</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString('es')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <form onSubmit={handleAddComment} className="space-y-2">
                {canInternal && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={commentType === 'public' ? 'default' : 'outline'}
                      onClick={() => setCommentType('public')}
                    >
                      Público
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={commentType === 'internal' ? 'default' : 'outline'}
                      onClick={() => setCommentType('internal')}
                    >
                      Nota interna
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={commentType === 'internal' ? 'Nota interna (no visible al cliente)...' : 'Escribe un comentario...'}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
                    {submitting ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarImage src={ticket.client?.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(ticket.client?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <dt className="text-muted-foreground">Cliente</dt>
                    <dd className="font-medium">{ticket.client?.full_name}</dd>
                  </div>
                </div>
                <Separator />
                <div>
                  <dt className="text-muted-foreground">Categoría</dt>
                  <dd className="font-medium">{ticket.category?.name || 'Sin categoría'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Agente</dt>
                  <dd className="font-medium">{ticket.agent?.full_name || 'Sin asignar'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {canUpdate && (
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticketStatusOrder.map((status) => (
                  <Button
                    key={status}
                    variant={ticket.status === status ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    aria-pressed={ticket.status === status}
                    disabled={ticket.status === status}
                    onClick={() => handleStatusChange(status)}
                  >
                    {ticketStatusLabel[status]}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
