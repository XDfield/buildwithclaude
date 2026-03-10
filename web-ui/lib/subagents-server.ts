import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Subagent } from './subagents-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'
import { getSkillItemsByType, getSkillItemBySlug } from './skill-items-db'

function getAllSubagentsFromFiles(): Subagent[] {
  const subagentsDirectory = path.join(process.cwd(), '../plugins/all-agents/agents')
  const fileNames = fs.readdirSync(subagentsDirectory)
  
  const subagents = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const filePath = path.join(subagentsDirectory, fileName)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      
      const slug = fileName.replace(/\.md$/, '')
      const category = data.category || 'specialized-domains'
      
      return {
        slug,
        name: data.name || slug,
        description: data.description || '',
        tools: data.tools,
        content,
        category
      }
    })
  
  return subagents.sort((a, b) => a.name.localeCompare(b.name))
}

function getSubagentBySlugFromFiles(slug: string): Subagent | null {
  const subagentsDirectory = path.join(process.cwd(), '../plugins/all-agents/agents')
  const filePath = path.join(subagentsDirectory, `${slug}.md`)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const category = data.category || 'specialized-domains'
  
  return {
    slug,
    name: data.name || slug,
    description: data.description || '',
    tools: data.tools,
    content,
    category
  }
}

export async function getAllSubagents(): Promise<Subagent[]> {
  const dbItems = await getSkillItemsByType('subagent')
  if (dbItems.length > 0) {
    return dbItems.map(item => {
      const meta = (() => { try { return JSON.parse(item.metadata || '{}') } catch { return {} } })()
      return {
        slug: item.slug,
        name: item.name,
        description: item.description || '',
        tools: meta.tools,
        content: item.content,
        category: item.category || 'specialized-domains',
      } as Subagent
    })
  }
  return getAllSubagentsFromFiles()
}

export async function getSubagentBySlug(slug: string): Promise<Subagent | null> {
  const dbItem = await getSkillItemBySlug('subagent', slug)
  if (dbItem) {
    const meta = (() => { try { return JSON.parse(dbItem.metadata || '{}') } catch { return {} } })()
    return {
      slug: dbItem.slug,
      name: dbItem.name,
      description: dbItem.description || '',
      tools: meta.tools,
      content: dbItem.content,
      category: dbItem.category || 'specialized-domains',
    } as Subagent
  }
  return getSubagentBySlugFromFiles(slug)
}

export async function getSubagentsByCategory(category: string): Promise<Subagent[]> {
  const subagents = await getAllSubagents()
  return subagents.filter(subagent => subagent.category === category)
}

export async function searchSubagents(query: string): Promise<Subagent[]> {
  const normalizedQuery = query.toLowerCase()
  const subagents = await getAllSubagents()
  return subagents.filter(subagent => 
    subagent.name.toLowerCase().includes(normalizedQuery) ||
    subagent.description.toLowerCase().includes(normalizedQuery) ||
    subagent.content.toLowerCase().includes(normalizedQuery)
  )
}

export async function getAllCategories(): Promise<CategoryMetadata[]> {
  const subagents = await getAllSubagents()
  const categoryCounts: Record<string, number> = {}
  
  subagents.forEach(subagent => {
    const category = subagent.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })
  
  return generateCategoryMetadata(categoryCounts)
}

export async function getAllCategoryIds(): Promise<string[]> {
  const subagents = await getAllSubagents()
  const categories = new Set(subagents.map(s => s.category))
  return Array.from(categories).sort()
}
