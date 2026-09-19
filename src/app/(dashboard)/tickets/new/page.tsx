'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTickets } from '@/hooks/useTickets'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category, TicketPriority } from '@/types/database'

interface TicketForm {
  title: string
  description: string
  category_id: string
  priority: TicketPriority
}

export default function NewTicketPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [serverError, setServerError] = useState('')

  const { user } = useAuth()
  const { createTicket } = useTickets()
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketForm>({
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
      priority: 'medium',
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    }
    fetchCategories()
  }, [supabase])

  const onSubmit = async (data: TicketForm) => {
    if (!user) return
    setServerError('')

    try {
      await createTicket({
        title: data.title,
        description: data.description,
        category_id: data.category_id || undefined,
        client_id: user.id,
        priority: data.priority,
        status: 'open',
      })
      router.push('/tickets')
    } catch {
      setServerError('Error al crear el ticket')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-dark">Nuevo Ticket</h1>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Describe brevemente tu problema"
                aria-invalid={!!errors.title}
                {...register('title', {
                  required: 'El título es obligatorio',
                  minLength: { value: 5, message: 'Mínimo 5 caracteres' },
                })}
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                rows={4}
                className="flex w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                placeholder="Explica tu problema con detalle..."
                aria-invalid={!!errors.description}
                {...register('description', {
                  required: 'La descripción es obligatoria',
                  minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                })}
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">Categoría</Label>
                <select
                  id="category_id"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  {...register('category_id')}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <select
                  id="priority"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  {...register('priority')}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
