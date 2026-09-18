'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import Input from '@/components/common/Input'
import { Search, BookOpen, Eye } from 'lucide-react'
import type { KnowledgeArticle } from '@/types/database'

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('knowledge_articles')
          .select('*, category:categories(name, slug)')
          .order('created_at', { ascending: false })

        if (search) {
          query = query.ilike('title', `%${search}%`)
        }

        const { data } = await query
        setArticles((data as KnowledgeArticle[]) || [])
      } catch {
        setError('Error al cargar los artículos')
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [search, supabase])

  return (
    <div className="space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-dark">Base de Conocimiento</h1>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
        <Input
          placeholder="Buscar artículos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar artículos"
          className="pl-10"
        />
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-primary hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {!error && loading ? (
        <div className="py-12 text-center text-gray-mid">Cargando artículos...</div>
      ) : articles.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-mid" />
            <p className="text-gray-mid">No se encontraron artículos</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/knowledge/${article.slug}`}>
              <Card hover>
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-xs text-gray-mid">{article.category?.name}</span>
                </div>
                <h3 className="mb-2 font-semibold text-gray-dark">{article.title}</h3>
                <p className="mb-3 line-clamp-3 text-sm text-gray-mid">{article.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-mid">
                  <span>{new Date(article.created_at).toLocaleDateString('es')}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {article.views} vistas
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
