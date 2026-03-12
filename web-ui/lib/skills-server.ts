import { itemApi, type CapabilityItem } from './api-client'
import { Skill } from './skills-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'

function toSkill(item: CapabilityItem): Skill {
  const meta = (() => { try { return JSON.parse((item as unknown as Record<string, string>).metadata || '{}') } catch { return {} } })()
  return {
    slug: item.slug,
    name: item.name,
    description: item.description || '',
    category: item.category || 'uncategorized',
    content: item.content,
    allowedTools: meta.allowedTools,
    model: meta.model,
    license: meta.license,
  }
}

export async function getAllSkills(): Promise<Skill[]> {
  const res = await itemApi.list({ type: 'skill', limit: 10000 })
  return res.items.map(toSkill)
}

export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  const res = await itemApi.list({ type: 'skill', limit: 1 })
  const items = res.items.filter(i => i.slug === slug)
  return items.length > 0 ? toSkill(items[0]) : null
}

export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const res = await itemApi.list({ type: 'skill', category, limit: 10000 })
  return res.items.map(toSkill)
}

export async function searchSkills(query: string): Promise<Skill[]> {
  const res = await itemApi.list({ type: 'skill', search: query, limit: 10000 })
  return res.items.map(toSkill)
}

export async function getAllSkillCategories(): Promise<CategoryMetadata[]> {
  const skills = await getAllSkills()
  const categoryCounts: Record<string, number> = {}
  skills.forEach(s => { categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1 })
  return generateCategoryMetadata(categoryCounts)
}

export async function getAllSkillCategoryIds(): Promise<string[]> {
  const skills = await getAllSkills()
  return Array.from(new Set(skills.map(s => s.category))).sort()
}
