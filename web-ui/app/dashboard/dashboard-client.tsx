'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Building2, Package, Trash2, Pencil, GitBranch, ChevronDown, ChevronUp } from 'lucide-react'
import { CreateRepoDialog } from '@/components/create-repo-dialog'
import { CreateCapabilityItemDialog } from '@/components/create-capability-item-dialog'
import { ItemCrudDialog } from '@/components/item-crud-dialog'
import { RepoSyncTab } from '@/components/repo-sync-tab'
import { repoApi, registryApi, itemApi, type Repository, type CapabilityItem, type CapabilityRegistry } from '@/lib/api-client'
import type { CasdoorUser } from '@/lib/auth'
import { useTranslations } from 'next-intl'

const ITEM_TYPE_COLORS: Record<string, string> = {
  skill: 'bg-blue-500/10 text-blue-500',
  subagent: 'bg-purple-500/10 text-purple-500',
  command: 'bg-green-500/10 text-green-500',
  hook: 'bg-orange-500/10 text-orange-500',
  mcp: 'bg-pink-500/10 text-pink-500',
}

interface DashboardClientProps {
  user: CasdoorUser | null
  loginUrl?: string
}

export default function DashboardClient({ user, loginUrl }: DashboardClientProps) {
  const t = useTranslations('dashboard')

  const [repos, setRepos] = useState<Repository[]>([])
  const [items, setItems] = useState<CapabilityItem[]>([])
  const [personalRegistry, setPersonalRegistry] = useState<CapabilityRegistry | null>(null)
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingItems, setLoadingItems] = useState(true)
  const [showCreateRepo, setShowCreateRepo] = useState(false)
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [editItem, setEditItem] = useState<CapabilityItem | null>(null)
  const [itemTypeFilter, setItemTypeFilter] = useState('all')
  const [expandedSyncRepo, setExpandedSyncRepo] = useState<string | null>(null)

  const userId = user?.sub ?? ''

  const loadRepos = useCallback(async () => {
    if (!userId) return
    setLoadingRepos(true)
    try {
      const res = await repoApi.listMy(userId)
      setRepos(res.repositories || [])
    } catch {}
    setLoadingRepos(false)
  }, [userId])

  const loadItems = useCallback(async () => {
    if (!userId) return
    setLoadingItems(true)
    try {
      const res = await itemApi.listMy(userId)
      setItems(res.items || [])
    } catch {}
    setLoadingItems(false)
  }, [userId])

  const ensureRegistry = useCallback(async () => {
    if (!userId || !user) return
    try {
      const reg = await registryApi.ensurePersonal(userId, user.preferred_username || user.name)
      setPersonalRegistry(reg)
    } catch {}
  }, [userId, user])

  useEffect(() => {
    if (!user) return
    loadRepos()
    loadItems()
    ensureRegistry()
  }, [user, loadRepos, loadItems, ensureRegistry])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('loginRequired')}</p>
          <a href={loginUrl} className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            {t('login')}
          </a>
        </div>
      </div>
    )
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm(t('deleteItemConfirm'))) return
    try {
      await itemApi.delete(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {}
  }

  const handleDeleteRepo = async (id: string) => {
    if (!confirm(t('deleteRepoConfirm'))) return
    try {
      await repoApi.delete(id)
      setRepos(prev => prev.filter(o => o.id !== id))
    } catch {}
  }

  const getItemTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      skill: t('itemTypeSkill'),
      subagent: t('itemTypeSubagent'),
      command: t('itemTypeCommand'),
      hook: t('itemTypeHook'),
      mcp: t('itemTypeMcp'),
    }
    return map[type] ?? type
  }

  const filteredItems = itemTypeFilter === 'all'
    ? items
    : items.filter(i => i.itemType === itemTypeFilter)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-display-2 mb-1">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('welcome', { name: user.preferred_username || user.name })}
            </p>
          </div>
          <Button onClick={() => setShowCreateItem(true)} disabled={!personalRegistry}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('newItem')}
          </Button>
        </div>

        {/* Repositories */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {t('repositories')}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowCreateRepo(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t('new')}
            </Button>
          </div>

          {loadingRepos ? (
            <div className="text-sm text-muted-foreground">{t('loadingRepos')}</div>
          ) : repos.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">{t('noReposYet')}</p>
              <Button variant="outline" size="sm" onClick={() => setShowCreateRepo(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('createRepository')}
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map(repo => (
                <div key={repo.id} className="p-4 rounded-lg border border-border bg-card flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{repo.displayName || repo.name}</div>
                      <div className="text-xs text-muted-foreground">{repo.name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        repo.visibility === 'public'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {repo.visibility === 'public' ? t('visibilityPublic') : repo.visibility}
                      </span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-auto pt-1">
                    {repo.repoType === 'sync' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setExpandedSyncRepo(expandedSyncRepo === repo.id ? null : repo.id)}
                      >
                        <GitBranch className="h-3 w-3 mr-1" />
                        {t('sync')}
                        {expandedSyncRepo === repo.id
                          ? <ChevronUp className="h-3 w-3 ml-1" />
                          : <ChevronDown className="h-3 w-3 ml-1" />
                        }
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
                      onClick={() => handleDeleteRepo(repo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {repo.repoType === 'sync' && expandedSyncRepo === repo.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <RepoSyncTab repoId={repo.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skill Items */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              {t('myItems')}
              {items.length > 0 && (
                <span className="text-sm text-muted-foreground font-normal">({items.length})</span>
              )}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowCreateItem(true)} disabled={!personalRegistry}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t('new')}
            </Button>
          </div>

          {/* Type filter */}
          {items.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {['all', 'skill', 'subagent', 'command', 'hook', 'mcp'].map(type => (
                <button
                  key={type}
                  onClick={() => setItemTypeFilter(type)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    itemTypeFilter === type
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {type === 'all' ? t('all') : getItemTypeLabel(type)}
                </button>
              ))}
            </div>
          )}

          {loadingItems ? (
            <div className="text-sm text-muted-foreground">{t('loadingItems')}</div>
          ) : filteredItems.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                {items.length === 0 ? t('noItemsYet') : t('noItemsOfType')}
              </p>
              {items.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowCreateItem(true)} disabled={!personalRegistry}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t('createItem')}
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('colName')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('colType')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('colCategory')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('colVisibility')}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ITEM_TYPE_COLORS[item.itemType] || 'bg-muted text-muted-foreground'}`}>
                          {getItemTypeLabel(item.itemType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.category || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.visibility === 'public'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.visibility === 'public' ? t('visibilityPublic') : t('visibilityRepo')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditItem(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <CreateRepoDialog
        open={showCreateRepo}
        onOpenChange={setShowCreateRepo}
        userId={userId}
        onCreated={repo => setRepos(prev => [repo, ...prev])}
      />

      {personalRegistry && (
        <CreateCapabilityItemDialog
          open={showCreateItem}
          onOpenChange={setShowCreateItem}
          registryId={personalRegistry.id}
          userId={userId}
          repositories={repos}
          onCreated={(item: CapabilityItem) => {
            setItems(prev => [item, ...prev])
            loadItems()
          }}
        />
      )}

      <ItemCrudDialog
        open={!!editItem}
        onOpenChange={open => { if (!open) setEditItem(null) }}
        itemType={editItem?.itemType || 'skill'}
        editItem={editItem}
        onSaved={updated => {
          setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
          setEditItem(null)
        }}
      />
    </div>
  )
}
