'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import { BookOpen, ArrowLeft, Eye, Calendar } from 'lucide-react'
import type { KnowledgeArticle } from '@/types/database'

export default function KnowledgeArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<KnowledgeArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('knowledge_articles')
          .select('*, category:categories(name, slug)')
          .eq('slug', slug)
          .single()

        if (fetchError || !data) {
          setError('Artículo no encontrado')
          return
        }

        setArticle(data as KnowledgeArticle)

        // Incrementar vistas
        await supabase
          .from('knowledge_articles')
          .update({ views: ((data as KnowledgeArticle).views || 0) + 1 })
          .eq('id', data.id)
      } catch {
        setError('Error al cargar el artículo')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [slug, supabase])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-mid">Cargando artículo...</p>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <BookOpen className="h-12 w-12 text-gray-mid" />
        <p className="text-gray-mid">{error || 'Artículo no encontrado'}</p>
        <Button variant="secondary" onClick={() => router.push('/knowledge')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl overflow-auto h-full p-4">
      <Button
        variant="ghost"
        onClick={() => router.push('/knowledge')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Base de Conocimiento
      </Button>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">
            {article.category?.name || 'Sin categoría'}
          </span>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-gray-dark">{article.title}</h1>

        <div className="mb-6 flex items-center gap-4 text-xs text-gray-mid">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.created_at).toLocaleDateString('es', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.views} vistas
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-dark">
          {article.content.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-3 whitespace-pre-line leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </Card>
    </div>
  )
}
