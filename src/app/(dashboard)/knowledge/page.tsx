'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, BookOpen, Eye } from 'lucide-react'
import type { KnowledgeArticle } from '@/types/database'

interface Category {
  id: string
  name: string
  slug: string
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          supabase
            .from('knowledge_articles')
            .select('*, category:categories(name, slug)')
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('id, name, slug')
            .order('name'),
        ])

        setArticles((articlesRes.data as KnowledgeArticle[]) || [])
        setCategories((categoriesRes.data as Category[]) || [])
      } catch {
        setError('Error al cargar los artículos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const filtered = articles.filter((article) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      article.title.toLowerCase().includes(q) ||
      article.content.toLowerCase().includes(q)
    const matchesCategory = !categoryFilter || article.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Base de Conocimiento</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar artículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-2 underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-8 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron artículos</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link key={article.id} href={`/knowledge/${article.slug}`}>
              <Card className="transition-colors hover:bg-muted/50 h-full">
                <CardContent className="flex flex-col h-full">
                  <div className="mb-2">
                    <Badge variant="secondary">
                      <BookOpen className="mr-1 h-3 w-3" />
                      {article.category?.name || 'Sin categoría'}
                    </Badge>
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{article.title}</h3>
                  <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {article.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(article.created_at).toLocaleDateString('es')}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views} vistas
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
