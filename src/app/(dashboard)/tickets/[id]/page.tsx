'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import type { Ticket, Comment, TicketStatus } from '@/types/database'

const statusColors: Record<TicketStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTicket = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*, category:categories(*), client:users!tickets_client_id_fkey(full_name, email), agent:users!tickets_agent_id_fkey(full_name, email)')
        .eq('id', params.id)
        .single()

      setTicket(data as Ticket)
      setLoading(false)
    }

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, author:users(full_name, avatar_url)')
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true })

      setComments((data as Comment[]) || [])
    }

    fetchTicket()
    fetchComments()
  }, [params.id, supabase])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    const { error } = await supabase.from('comments').insert({
      ticket_id: params.id as string,
      author_id: user.id,
      content: newComment,
      type: 'public',
    })

    if (!error) {
      setNewComment('')
      const { data } = await supabase
        .from('comments')
        .select('*, author:users(full_name, avatar_url)')
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true })
      setComments((data as Comment[]) || [])
    }
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', params.id as string)

    setTicket((prev) => (prev ? { ...prev, status: newStatus } : null))
  }

  if (loading) return <div className="py-12 text-center text-gray-mid">Cargando...</div>
  if (!ticket) return <div className="py-12 text-center text-gray-mid">Ticket no encontrado</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-dark">{ticket.title}</h1>
          <p className="text-sm text-gray-mid">
            Creado el {new Date(ticket.created_at).toLocaleDateString('es')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusColors[ticket.status]}>{ticket.status}</Badge>
          <Badge>{ticket.priority}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="text-sm text-gray-mid whitespace-pre-wrap">{ticket.description}</p>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Comentarios</h2>

            <div className="mb-4 max-h-80 space-y-3 overflow-auto">
              {comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-mid">No hay comentarios</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.author?.full_name}</span>
                      <span className="text-xs text-gray-mid">
                        {new Date(comment.created_at).toLocaleString('es')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1"
              />
              <Button type="submit" size="sm">
                Enviar
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-semibold">Detalles</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-mid">Cliente</dt>
                <dd>{ticket.client?.full_name}</dd>
              </div>
              <div>
                <dt className="text-gray-mid">Categoría</dt>
                <dd>{ticket.category?.name || 'Sin categoría'}</dd>
              </div>
              <div>
                <dt className="text-gray-mid">Agente</dt>
                <dd>{ticket.agent?.full_name || 'Sin asignar'}</dd>
              </div>
            </dl>
          </Card>

          {(user?.role === 'admin' || user?.role === 'agent') && (
            <Card>
              <h2 className="mb-3 font-semibold">Cambiar Estado</h2>
              <div className="space-y-2">
                {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={ticket.status === status ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusChange(status)}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
