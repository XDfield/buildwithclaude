'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Plus } from 'lucide-react'
import { ItemCrudDialog } from '@/components/item-crud-dialog'
import { CapabilityItemCard } from '@/components/capability-item-card'
import { useRepoFilter } from '@/lib/repo-filter-context'
import { useRepoItems } from '@/hooks/use-repo-items'
import { itemApi, type CapabilityItem } from '@/lib/api-client'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'

const ITEMS_PER_PAGE = 24

export default function SkillsPage() {
  const t = useTranslations('skills')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const { selectedRepo } = useRepoFilter()
  const { items: repoItems, loading: repoLoading } = useRepoItems(selectedRepo, 'skill')

  const [globalItems, setGlobalItems] = useState<CapabilityItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchGlobal = useCallback(async (reset: boolean) => {
    setIsLoading(true)
    try {
      const offset = reset ? 0 : offsetRef.current
      const res = await itemApi.list({ type: 'skill', search: debouncedSearch || undefined, limit: ITEMS_PER_PAGE, offset })
      if (reset) {
        setGlobalItems(res.items)
        offsetRef.current = res.items.length
      } else {
        setGlobalItems(prev => [...prev, ...res.items])
        offsetRef.current += res.items.length
      }
      setTotal(res.total)
      setHasMore(res.hasMore)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (!selectedRepo) {
      offsetRef.current = 0
      fetchGlobal(true)
    }
  }, [fetchGlobal, selectedRepo])

  useEffect(() => {
    if (!selectedRepo) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isLoading) fetchGlobal(false) },
      { threshold: 0.1, rootMargin: '100px' }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading, fetchGlobal, selectedRepo])

  const isRepoMode = !!selectedRepo
  const items = isRepoMode ? repoItems : globalItems
  const loading = isRepoMode ? repoLoading : isLoading
  const displayTotal = isRepoMode ? repoItems.length : total

  const filteredOrgItems = isRepoMode && searchQuery
    ? repoItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : repoItems

  const displayItems = isRepoMode ? filteredOrgItems : globalItems

  return (
    <div className="min-h-screen">
      <div className="px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              {t('title')}
              {isRepoMode && <span className="text-base font-normal text-muted-foreground">— {selectedRepo.displayName || selectedRepo.name}</span>}
            </h1>
            <p className="text-sm text-muted-foreground">{displayTotal} {t('subtitle')}</p>
          </div>
          {user && (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              {t('newSkill')}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm bg-card border-border"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayItems.map((item) => (
              <CapabilityItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t('noResults')}</p>
          </div>
        )}

        {!isRepoMode && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{tc('loading')}</span>
              </div>
            )}
            {!hasMore && globalItems.length > 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">{t('showingAll', { count: globalItems.length.toLocaleString() })}</p>
            )}
          </div>
        )}
      </div>

      <ItemCrudDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        itemType="skill"
        onSaved={() => { setShowCreate(false); if (!selectedRepo) fetchGlobal(true) }}
      />
    </div>
  )
}
