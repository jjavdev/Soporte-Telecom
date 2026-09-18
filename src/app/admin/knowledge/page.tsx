'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Modal from '@/components/common/Modal'
import Badge from '@/components/common/Badge'
import { Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react'

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
        <h1 className="text-2xl font-bold text-gray-dark">Base de Conocimiento</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Artículo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
        <Input
          placeholder="Buscar artículos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Buscar artículos"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">cerrar</button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-mid">Cargando artículos...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-mid" />
            <p className="text-gray-mid">No se encontraron artículos</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-mid">
                <th className="pb-3 pr-4">Título</th>
                <th className="pb-3 pr-4">Categoría</th>
                <th className="pb-3 pr-4 text-right">Vistas</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((article) => (
                <tr key={article.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-dark">{article.title}</td>
                  <td className="py-3 pr-4">
                    <Badge>{article.category_name}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-mid">{article.views}</td>
                  <td className="py-3 pr-4 text-gray-mid">
                    {new Date(article.created_at).toLocaleDateString('es')}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(article)}
                        className="rounded p-1 text-gray-mid hover:bg-gray-100 hover:text-primary"
                        aria-label="Editar artículo"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(article.id)}
                        className="rounded p-1 text-gray-mid hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar artículo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Artículo' : 'Nuevo Artículo'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-dark">Título *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título del artículo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-dark">Categoría *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-dark">Slug (opcional)</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="se-genera-del-titulo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-dark">Contenido *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              rows={8}
              placeholder="Contenido del artículo (usa saltos de línea para separar párrafos)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim() || !form.content.trim() || !form.category_id}>
              {editingId ? 'Guardar Cambios' : 'Crear Artículo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal eliminar */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Eliminar Artículo"
      >
        <p className="mb-4 text-sm text-gray-mid">
          ¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
