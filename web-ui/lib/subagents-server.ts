import { itemApi, type CapabilityItem } from './api-client'
import { Subagent } from './subagents-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'

function toSubagent(item: CapabilityItem): Subagent {
  const meta = (() => { try { return JSON.parse((item as unknown as Record<string, string>).metadata || '{}') } catch { return {} } })()
  return {
    slug: item.slug,
    name: item.name,
    description: item.description || '',
    tools: meta.tools,
    content: item.content,
    category: item.category || 'specialized-domains',
  }
}

export async function getAllSubagents(): Promise<Subagent[]> {
  const res = await itemApi.list({ type: 'subagent', limit: 10000 })
  return res.items.map(toSubagent)
}

export async function getSubagentBySlug(slug: string): Promise<Subagent | null> {
  const res = await itemApi.list({ type: 'subagent', limit: 10000 })
  const item = res.items.find(i => i.slug === slug)
  return item ? toSubagent(item) : null
}

export async function getSubagentsByCategory(category: string): Promise<Subagent[]> {
  const res = await itemApi.list({ type: 'subagent', category, limit: 10000 })
  return res.items.map(toSubagent)
}

export async function searchSubagents(query: string): Promise<Subagent[]> {
  const res = await itemApi.list({ type: 'subagent', search: query, limit: 10000 })
  return res.items.map(toSubagent)
}

export async function getAllCategories(): Promise<CategoryMetadata[]> {
  const subagents = await getAllSubagents()
  const categoryCounts: Record<string, number> = {}
  subagents.forEach(s => { categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1 })
  return generateCategoryMetadata(categoryCounts)
}

export async function getAllCategoryIds(): Promise<string[]> {
  const subagents = await getAllSubagents()
  return Array.from(new Set(subagents.map(s => s.category))).sort()
}
