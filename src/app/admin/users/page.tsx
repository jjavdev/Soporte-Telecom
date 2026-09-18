'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { Users, UserCheck, UserX } from 'lucide-react'
import type { User, UserRole } from '@/types/database'
import { roleColors } from '@/lib/constants'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus as User['status'] } : u))
    )
  }

  return (
    <div className="space-y-6 overflow-auto h-full">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-gray-dark">Gestionar Usuarios</h1>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-mid">Cargando usuarios...</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-primary hover:underline">
            Reintentar
          </button>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-mid">
                  <th className="pb-3 font-medium">Usuario</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Registro</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {user.full_name.charAt(0)}
                        </div>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-mid">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={roleColors[user.role]}>{user.role}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-mid">
                      {new Date(user.created_at).toLocaleDateString('es')}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          <option value="customer">Cliente</option>
                          <option value="agent">Agente</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          variant={user.status === 'active' ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleStatusToggle(user.id, user.status)}
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
        </Card>
      )}
    </div>
  )
}
