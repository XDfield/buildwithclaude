'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { itemApi } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

export default function CommandSlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  useEffect(() => {
    itemApi.list({ type: 'command', search: slug, limit: 10 }).then(res => {
      const match = res.items.find(i => i.slug === slug)
      if (match) {
        router.replace(`/items/${match.id}`)
      } else {
        router.replace('/commands')
      }
    }).catch(() => router.replace('/commands'))
  }, [slug, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
