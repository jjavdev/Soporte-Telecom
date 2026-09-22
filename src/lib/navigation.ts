import {
  BarChart3,
  BookOpen,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  short: string
  icon: LucideIcon
  /** Only active on an exact match (used for the section root). */
  exact?: boolean
}

export const mainNav: NavItem[] = [
  { href: '/', label: 'Dashboard', short: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/tickets', label: 'Tickets', short: 'Tickets', icon: Ticket },
  { href: '/chat', label: 'Chat', short: 'Chat', icon: MessageSquare },
  { href: '/knowledge', label: 'Base de Conocimiento', short: 'Ayuda', icon: BookOpen },
]

export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', short: 'Inicio', icon: BarChart3, exact: true },
  { href: '/admin/users', label: 'Usuarios', short: 'Usuarios', icon: Users },
  { href: '/admin/knowledge', label: 'Base de Conocimiento', short: 'Artículos', icon: BookOpen },
  { href: '/admin/reports', label: 'Reportes', short: 'Reportes', icon: FileText },
]

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
