'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { isActive, type NavItem } from '@/lib/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface AppShellProps {
  title: string
  homeHref: string
  items: NavItem[]
  backHref?: string
  backLabel?: string
  children: React.ReactNode
}

/**
 * Single navigation shell used by both the app and admin sections.
 * Desktop renders the nav inline in the header; mobile renders the same items
 * in a bottom bar. There is no burger/sheet menu.
 */
export function AppShell({
  title,
  homeHref,
  items,
  backHref,
  backLabel = 'Volver',
  children,
}: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const initials = user?.email?.slice(0, 2).toUpperCase() || '??'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-dvh flex-col bg-neutral-2">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-6">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label={backLabel}
              render={<Link href={backHref} />}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Link
            href={homeHref}
            className="truncate py-3 text-base font-semibold text-foreground"
          >
            {title}
          </Link>

          {/* Desktop navigation — hidden on mobile */}
          <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = isActive(pathname, item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-neutral-3 text-foreground'
                      : 'text-muted-foreground hover:bg-neutral-3 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand-3 text-xs text-brand-11">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      {/* Mobile bottom navigation — the only mobile nav */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {items.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors',
                  active ? 'text-brand-11' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.short}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
