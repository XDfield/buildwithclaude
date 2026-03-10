import { db } from '@/lib/db/client'
import { skillItems, skillArtifacts } from '@/lib/db/schema'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'
import { safeDbQuery } from '@/lib/db/safe-query'

export async function getSkillItemsByType(itemType: string, options?: {
  search?: string
  category?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const { search, category, status = 'active', limit = 100, offset = 0 } = options || {}
  
  const conditions = [eq(skillItems.itemType, itemType), eq(skillItems.status, status)]
  
  if (category) conditions.push(eq(skillItems.category, category))
  if (search) {
    conditions.push(or(
      ilike(skillItems.name, `%${search}%`),
      ilike(skillItems.description, `%${search}%`)
    )!)
  }

  const { data } = await safeDbQuery(
    () => db.select().from(skillItems)
      .where(and(...conditions))
      .orderBy(desc(skillItems.createdAt))
      .limit(limit)
      .offset(offset),
    [],
    `getSkillItemsByType:${itemType}`
  )
  return data
}

export async function getSkillItemBySlug(itemType: string, slug: string) {
  const { data } = await safeDbQuery(
    () => db.select().from(skillItems)
      .where(and(eq(skillItems.itemType, itemType), eq(skillItems.slug, slug)))
      .limit(1),
    [],
    `getSkillItemBySlug:${itemType}:${slug}`
  )
  return data[0] ?? null
}

export async function getSkillItemCategories(itemType: string) {
  const { data } = await safeDbQuery(
    () => db.select({
        category: skillItems.category,
        count: sql<number>`count(*)`,
      })
      .from(skillItems)
      .where(and(eq(skillItems.itemType, itemType), eq(skillItems.status, 'active')))
      .groupBy(skillItems.category),
    [],
    `getSkillItemCategories:${itemType}`
  )
  return data
}

export async function getSkillItemArtifacts(itemId: string) {
  const { data } = await safeDbQuery(
    () => db.select().from(skillArtifacts)
      .where(eq(skillArtifacts.itemId, itemId))
      .orderBy(desc(skillArtifacts.createdAt)),
    [],
    `getSkillItemArtifacts:${itemId}`
  )
  return data
}
