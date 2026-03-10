import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Hook } from './hooks-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'
import { extractScriptFromContent } from './hook-utils'
import { getSkillItemsByType, getSkillItemBySlug } from './skill-items-db'

function getAllHooksFromFiles(): Hook[] {
  const hooksDirectory = path.join(process.cwd(), '../plugins/all-hooks/hooks')

  if (!fs.existsSync(hooksDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(hooksDirectory)

  const hooks = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const filePath = path.join(hooksDirectory, fileName)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)

      const slug = fileName.replace(/\.md$/, '')
      const category = data.category || 'automation'

      return {
        slug,
        name: data.name || slug,
        description: data.description || '',
        category,
        event: data.event || 'PostToolUse',
        matcher: data.matcher || '*',
        language: data.language,
        version: data.version,
        content,
        script: extractScriptFromContent(content) || undefined
      }
    })

  return hooks.sort((a, b) => a.name.localeCompare(b.name))
}

function getHookBySlugFromFiles(slug: string): Hook | null {
  const hooksDirectory = path.join(process.cwd(), '../plugins/all-hooks/hooks')
  const filePath = path.join(hooksDirectory, `${slug}.md`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const category = data.category || 'automation'

  return {
    slug,
    name: data.name || slug,
    description: data.description || '',
    category,
    event: data.event || 'PostToolUse',
    matcher: data.matcher || '*',
    language: data.language,
    version: data.version,
    content,
    script: extractScriptFromContent(content) || undefined
  }
}

export async function getAllHooks(): Promise<Hook[]> {
  const dbItems = await getSkillItemsByType('hook')
  if (dbItems.length > 0) {
    return dbItems.map(item => {
      const meta = (() => { try { return JSON.parse(item.metadata || '{}') } catch { return {} } })()
      return {
        slug: item.slug,
        name: item.name,
        description: item.description || '',
        category: item.category || 'automation',
        event: meta.event || 'PostToolUse',
        matcher: meta.matcher || '*',
        language: meta.language,
        version: meta.version,
        content: item.content,
        script: extractScriptFromContent(item.content) || undefined,
      } as Hook
    })
  }
  return getAllHooksFromFiles()
}

export async function getHookBySlug(slug: string): Promise<Hook | null> {
  const dbItem = await getSkillItemBySlug('hook', slug)
  if (dbItem) {
    const meta = (() => { try { return JSON.parse(dbItem.metadata || '{}') } catch { return {} } })()
    return {
      slug: dbItem.slug,
      name: dbItem.name,
      description: dbItem.description || '',
      category: dbItem.category || 'automation',
      event: meta.event || 'PostToolUse',
      matcher: meta.matcher || '*',
      language: meta.language,
      version: meta.version,
      content: dbItem.content,
      script: extractScriptFromContent(dbItem.content) || undefined,
    } as Hook
  }
  return getHookBySlugFromFiles(slug)
}

export async function getHooksByCategory(category: string): Promise<Hook[]> {
  const hooks = await getAllHooks()
  return hooks.filter(hook => hook.category === category)
}

export async function getHooksByEvent(event: string): Promise<Hook[]> {
  const hooks = await getAllHooks()
  return hooks.filter(hook => hook.event === event)
}

export async function searchHooks(query: string): Promise<Hook[]> {
  const normalizedQuery = query.toLowerCase()
  const hooks = await getAllHooks()
  return hooks.filter(hook =>
    hook.name.toLowerCase().includes(normalizedQuery) ||
    hook.description.toLowerCase().includes(normalizedQuery) ||
    hook.event.toLowerCase().includes(normalizedQuery) ||
    hook.content.toLowerCase().includes(normalizedQuery)
  )
}

export async function getAllHookCategories(): Promise<CategoryMetadata[]> {
  const hooks = await getAllHooks()
  const categoryCounts: Record<string, number> = {}

  hooks.forEach(hook => {
    const category = hook.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return generateCategoryMetadata(categoryCounts)
}

export async function getAllEventTypes(): Promise<string[]> {
  const hooks = await getAllHooks()
  const events = new Set(hooks.map(h => h.event))
  return Array.from(events).sort()
}

export async function getAllHookCategoryIds(): Promise<string[]> {
  const hooks = await getAllHooks()
  const categories = new Set(hooks.map(h => h.category))
  return Array.from(categories).sort()
}
