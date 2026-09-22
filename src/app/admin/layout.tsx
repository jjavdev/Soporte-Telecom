'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/hooks/useAuth'
import { adminNav } from '@/lib/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') router.replace('/')
  }, [loading, user, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Verificando acceso…
      </div>
    )
  }

  return (
    <AppShell
      title="Admin Panel"
      homeHref="/admin"
      items={adminNav}
      backHref="/"
      backLabel="Volver al Dashboard"
    >
      {children}
    </AppShell>
  )
}
