'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  BookOpen,
  Users,
  BarChart3,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/knowledge', label: 'Base de Conocimiento', icon: BookOpen },
]

const adminItems = [
  { href: '/admin', label: 'Admin Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Gestionar Usuarios', icon: Users },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-primary">Soporte Telecom</h1>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-mid hover:bg-gray-100 hover:text-gray-dark'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="my-3 border-t border-gray-200" />
              <p className="px-3 py-1 text-xs font-semibold uppercase text-gray-mid">Admin</p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-mid hover:bg-gray-100 hover:text-gray-dark'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.full_name || 'Usuario'}</p>
            <p className="text-xs text-gray-mid">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-mid hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
