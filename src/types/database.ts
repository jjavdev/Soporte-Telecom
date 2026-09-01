export type UserRole = 'customer' | 'agent' | 'supervisor' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'suspended'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type CommentType = 'public' | 'internal'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  slug: string
  created_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  category_id?: string
  client_id: string
  agent_id?: string
  priority: TicketPriority
  status: TicketStatus
  sla_deadline?: string
  satisfaccion?: number
  created_at: string
  updated_at: string
  category?: Category
  client?: User
  agent?: User
}

export interface Comment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  type: CommentType
  created_at: string
  author?: User
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category_id?: string
  author_id?: string
  slug: string
  views: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface ChatSession {
  id: string
  client_id: string
  agent_id?: string
  status: 'waiting' | 'active' | 'closed'
  created_at: string
  updated_at: string
  client?: User
  agent?: User
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}
