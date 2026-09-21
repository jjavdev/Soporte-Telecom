'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ChatSession } from '@/types/database'

export function useChat(sessionId: string | null) {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const supabaseRef = useRef(createClient())

  const fetchSession = useCallback(async () => {
    if (!sessionId) return

    const { data } = await supabaseRef.current
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    setSession(data as ChatSession)
  }, [sessionId])

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return

    const { data } = await supabaseRef.current
      .from('chat_messages')
      .select('*, sender:users(full_name, avatar_url)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    setMessages((data as ChatMessage[]) || [])
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetchSession()
    fetchMessages()
  }, [fetchSession, fetchMessages])

  useEffect(() => {
    if (!sessionId) return

    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*, sender:users(full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) =>
              prev.some((m) => m.id === (data as ChatMessage).id) ? prev : [...prev, data as ChatMessage]
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const sendMessage = async (content: string, senderId: string) => {
    if (!sessionId) return null

    const { data, error } = await supabaseRef.current
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        content,
      })
      .select('*, sender:users(full_name, avatar_url)')
      .single()

    if (error) throw error

    if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === (data as ChatMessage).id) ? prev : [...prev, data as ChatMessage]
      )
    }
    return data as ChatMessage
  }

  const createSession = async (clientId: string) => {
    const { data, error } = await supabaseRef.current
      .from('chat_sessions')
      .insert({ client_id: clientId })
      .select()
      .single()

    if (error) throw error
    setSession(data as ChatSession)
    return data
  }

  return { session, messages, loading, sendMessage, createSession, refetch: fetchMessages }
}
