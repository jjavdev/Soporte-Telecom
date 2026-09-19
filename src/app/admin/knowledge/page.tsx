'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, BookOpen, Search, Eye } from 'lucide-react'

interface Article {
  id: string
  title: string
  content: string
  slug: string
  views: number
  category_id: string
  category_name: string
  created_at: string
}

interface Category {
  id: string
  name: string
  slug: string
}

const emptyForm = { title: '', content: '', slug: '', category_id: '' }

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AdminKnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [artsRes, catsRes] = await Promise.all([
        supabase
          .from('knowledge_articles')
          .select('*, category:categories(name, slug)')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .order('name'),
      ])

      const arts = (artsRes.data || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        title: a.title as string,
        content: a.content as string,
        slug: a.slug as string,
        views: a.views as number,
        category_id: a.category_id as string,
        category_name: (a.category as Record<string, unknown> | null)?.name as string || 'Sin categoría',
        created_at: a.created_at as string,
      }))
      setArticles(arts)
      setCategories((catsRes.data || []) as Category[])
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditingId(article.id)
    setForm({
      title: article.title,
      content: article.content,
      slug: article.slug,
      category_id: article.category_id,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.category_id) return
    setSaving(true)

    const slug = form.slug.trim() || form.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    try {
      if (editingId) {
        const { error } = await supabase
          .from('knowledge_articles')
          .update({ title: form.title, content: form.content, slug, category_id: form.category_id })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('knowledge_articles')
          .insert({ title: form.title, content: form.content, slug, category_id: form.category_id })
        if (error) throw error
      }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Error al guardar: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', deleteId)
      if (error) throw error
      setDeleteId(null)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Error al eliminar: ${msg}`)
    }
  }

  return (
    <div className="space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Base de Conocimiento</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar artículos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Buscar artículos"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">cerrar</button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron artículos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{article.title}</CardTitle>
                  <CardAction>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(article)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(article.id)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{article.category_name}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {article.views}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString('es')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase text-muted-foreground">
                  <th className="pb-3 pr-4">Título</th>
                  <th className="pb-3 pr-4">Categoría</th>
                  <th className="pb-3 pr-4 text-right">Vistas</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr key={article.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium">{article.title}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary">{article.category_name}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-right text-muted-foreground">{article.views}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString('es')}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(article)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(article.id)} aria-label="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Modifica los campos del artículo.' : 'Completa los campos para crear un nuevo artículo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título del artículo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <select
                id="category"
                value={form.category_id}
                onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (opcional)</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="se-genera-del-titulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenido *</Label>
              <textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                rows={6}
                placeholder="Contenido del artículo"
                className="flex w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.content.trim() || !form.category_id}
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Artículo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Artículo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
