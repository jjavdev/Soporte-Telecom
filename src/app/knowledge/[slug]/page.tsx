'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, ArrowLeft, Eye, Calendar, Tag } from 'lucide-react'
import type { KnowledgeArticle } from '@/types/database'

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Separator />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
    return <ArticleSkeleton />
  }

  if (error || !article) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <Avatar size="lg">
          <AvatarFallback>
            <BookOpen className="size-5" />
          </AvatarFallback>
        </Avatar>
        <p className="text-center text-sm text-muted-foreground">
          {error || 'Artículo no encontrado'}
        </p>
        <Button variant="outline" onClick={() => router.push('/knowledge')}>
          <ArrowLeft className="mr-2 size-4" /> Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 overflow-auto h-full p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/knowledge')}
      >
        <ArrowLeft className="mr-2 size-4" /> Volver a la Base de Conocimiento
      </Button>

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            <Tag className="mr-1 size-3" />
            {article.category?.name || 'Sin categoría'}
          </Badge>
          <CardTitle className="text-xl md:text-2xl">
            {article.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(article.created_at).toLocaleDateString('es', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {article.views} vistas
            </span>
          </div>

          <Separator />

          <div className="prose prose-sm max-w-none text-foreground">
            {article.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-3 whitespace-pre-line leading-relaxed text-sm">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
