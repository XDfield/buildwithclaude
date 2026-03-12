'use client'

import { useState, useEffect } from 'react'
import { itemApi, type CapabilityItem, type Repository } from '@/lib/api-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function getRepoRegistry(repoId: string): Promise<{ id: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/repositories/${repoId}/registry`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function useRepoItems(selectedRepo: Repository | null, itemType: string) {
  const [items, setItems] = useState<CapabilityItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedRepo) {
      setItems([])
      return
    }
    setLoading(true)
    getRepoRegistry(selectedRepo.id).then(registry => {
      if (!registry) {
        setItems([])
        setLoading(false)
        return
      }
      return itemApi.list({ type: itemType, registryId: registry.id, limit: 100 })
    }).then(res => {
      setItems(res?.items || [])
    }).catch(() => {
      setItems([])
    }).finally(() => {
      setLoading(false)
    })
  }, [selectedRepo, itemType])

  return { items, loading }
}
