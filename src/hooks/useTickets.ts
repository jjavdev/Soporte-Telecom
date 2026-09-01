'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Ticket, TicketStatus, TicketPriority } from '@/types/database'

interface UseTicketsFilters {
  status?: TicketStatus
  priority?: TicketPriority
  search?: string
}

export function useTickets(filters?: UseTicketsFilters) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('tickets')
      .select('*, category:categories(*), client:users!tickets_client_id_fkey(full_name, email), agent:users!tickets_agent_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.priority) query = query.eq('priority', filters.priority)
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setTickets(data as Ticket[])
    }
    setLoading(false)
  }, [filters?.status, filters?.priority, filters?.search, supabase])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const createTicket = async (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single()

    if (error) throw error
    await fetchTickets()
    return data
  }

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const { error } = await supabase
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    await fetchTickets()
  }

  return { tickets, loading, error, createTicket, updateTicket, refetch: fetchTickets }
}
