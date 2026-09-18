'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Users,
  FileText,
  BookOpen,
  ArrowLeft,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/knowledge', label: 'Base de Conocimiento', icon: BookOpen },
  { href: '/admin/reports', label: 'Reportes', icon: FileText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Navegación de administración">
          {navItems.map((item) => (
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
        </nav>

        <div className="border-t border-gray-200 p-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-mid hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
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

      <main className="flex-1 overflow-hidden p-6">{children}</main>
    </div>
  )
}
