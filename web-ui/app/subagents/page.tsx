'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Bot, Loader2, Plus } from 'lucide-react'
import { ItemCrudDialog } from '@/components/item-crud-dialog'
import { CapabilityItemCard } from '@/components/capability-item-card'
import { useRepoFilter } from '@/lib/repo-filter-context'
import { useRepoItems } from '@/hooks/use-repo-items'
import { itemApi, type CapabilityItem } from '@/lib/api-client'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'

const ITEMS_PER_PAGE = 24

export default function SubagentsPage() {
  const t = useTranslations('subagents')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const { selectedRepo } = useRepoFilter()
  const { items: repoItems, loading: repoLoading } = useRepoItems(selectedRepo, 'subagent')

  const [allGlobal, setAllGlobal] = useState<CapabilityItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [showCreate, setShowCreate] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchGlobal = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await itemApi.list({ type: 'subagent', limit: 500 })
      setAllGlobal(res.items)
      setTotal(res.total)
    } catch { /* ignore */ } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { if (!selectedRepo) fetchGlobal() }, [fetchGlobal, selectedRepo])

  const sourceItems = selectedRepo ? repoItems : allGlobal
  const loading = selectedRepo ? repoLoading : isLoading

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of sourceItems) {
      if (item.category) counts.set(item.category, (counts.get(item.category) || 0) + 1)
    }
    return Array.from(counts.entries()).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count)
  }, [sourceItems])

  const filteredItems = useMemo(() => {
    let f = sourceItems
    if (selectedCategory !== 'all') f = f.filter(i => i.category === selectedCategory)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
    }
    return f
  }, [sourceItems, selectedCategory, searchQuery])

  const displayedItems = filteredItems.slice(0, displayCount)
  const hasMore = displayCount < filteredItems.length

  useEffect(() => { setDisplayCount(ITEMS_PER_PAGE) }, [selectedCategory, searchQuery, selectedRepo])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore) setDisplayCount(prev => prev + ITEMS_PER_PAGE) },
      { threshold: 0.1, rootMargin: '100px' }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore])

  return (
    <div className="min-h-screen">
      <div className="px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
              <Bot className="h-6 w-6 text-blue-500" />
              {t('title')}
              {selectedRepo && <span className="text-base font-normal text-muted-foreground">— {selectedRepo.displayName || selectedRepo.name}</span>}
            </h1>
            <p className="text-sm text-muted-foreground">{total} {t('subtitle')}</p>
          </div>
          {user && (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              {t('newSubagent')}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <Input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm bg-card border-border" />
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>{tc('all')}</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              {cat.id} ({cat.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filteredItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedItems.map(item => (
              <CapabilityItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16"><p className="text-muted-foreground">{t('noResults')}</p></div>
        )}

        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {hasMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          {!hasMore && displayedItems.length > 0 && <p className="text-sm text-muted-foreground">{t('showingAll', { count: filteredItems.length })}</p>}
        </div>
      </div>

      <ItemCrudDialog open={showCreate} onOpenChange={setShowCreate} itemType="subagent" onSaved={() => { setShowCreate(false); if (!selectedRepo) fetchGlobal() }} />
    </div>
  )
}
