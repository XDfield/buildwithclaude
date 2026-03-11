'use client'

import { useState, useEffect } from 'react'
import { itemApi, type SkillItem, type Organization } from '@/lib/api-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function getOrgRegistry(orgId: string): Promise<{ id: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/organizations/${orgId}/registry`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function useOrgItems(selectedOrg: Organization | null, itemType: string) {
  const [items, setItems] = useState<SkillItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedOrg) {
      setItems([])
      return
    }
    setLoading(true)
    getOrgRegistry(selectedOrg.id).then(registry => {
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
  }, [selectedOrg, itemType])

  return { items, loading }
}
