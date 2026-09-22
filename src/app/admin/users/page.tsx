'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Users, Search, UserCheck, UserX, Loader2, Edit2 } from 'lucide-react'
import type { User, UserRole } from '@/types/database'
import {
  userRoleClass,
  userRoleLabel,
  userStatusClass,
  userStatusLabel,
} from '@/lib/constants'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        setUsers((data as User[]) || [])
      } catch {
        setError('Error al cargar los usuarios')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
  }

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await supabase
      .from('users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId)

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: newStatus as User['status'] } : u
      )
    )
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setSelectedRole(user.role)
  }

  const saveRole = async () => {
    if (!editingUser) return
    setSaving(true)
    await handleRoleChange(editingUser.id, selectedRole)
    setSaving(false)
    setEditingUser(null)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Gestionar Usuarios</h1>
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Gestionar Usuarios</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Gestionar Usuarios</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 sm:w-72"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="grid gap-4 md:hidden">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-3 text-sm font-medium text-brand-11">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={userRoleClass[user.role]}>
                      {userRoleLabel[user.role]}
                    </Badge>
                    <Badge variant="outline" className={userStatusClass[user.status]}>
                      {userStatusLabel[user.status]}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('es')}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant={
                        user.status === 'active' ? 'destructive' : 'outline'
                      }
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleStatusToggle(user.id, user.status)
                      }
                    >
                      {user.status === 'active' ? (
                        <>
                          <UserX className="mr-1 h-3 w-3" /> Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-1 h-3 w-3" /> Activar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>
                {filteredUsers.length} usuario{filteredUsers.length !== 1 && 's'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-3 font-medium">Usuario</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Rol</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Registro</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-3 text-sm font-medium text-brand-11">
                              {user.full_name.charAt(0)}
                            </div>
                            <span className="font-medium">
                              {user.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={userRoleClass[user.role]}>
                            {userRoleLabel[user.role]}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={userStatusClass[user.status]}>
                            {userStatusLabel[user.status]}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('es')}
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={
                                user.status === 'active'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() =>
                                handleStatusToggle(user.id, user.status)
                              }
                            >
                              {user.status === 'active' ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Cambia el rol de {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rol</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  Object.entries(userRoleLabel) as [UserRole, string][]
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={selectedRole === value ? 'default' : 'outline'}
                    onClick={() => setSelectedRole(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={saveRole} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
