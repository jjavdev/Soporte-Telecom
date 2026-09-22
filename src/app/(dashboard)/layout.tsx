'use client'

import { ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/permissions'
import { mainNav, type NavItem } from '@/lib/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const items: NavItem[] = can(user?.role, 'admin.access')
    ? [
        ...mainNav,
        { href: '/admin', label: 'Admin', short: 'Admin', icon: ShieldCheck },
      ]
    : mainNav

  return (
    <AppShell title="Soporte Telecom" homeHref="/" items={items}>
      {children}
    </AppShell>
  )
}
