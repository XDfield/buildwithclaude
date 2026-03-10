import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Skill } from './skills-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'
import { getSkillItemsByType, getSkillItemBySlug } from './skill-items-db'

function getAllSkillsFromFiles(): Skill[] {
  const skillsDirectory = path.join(process.cwd(), '../plugins/all-skills/skills')

  if (!fs.existsSync(skillsDirectory)) {
    console.warn('Skills directory not found:', skillsDirectory)
    return []
  }

  const dirNames = fs.readdirSync(skillsDirectory)

  const skills = dirNames
    .filter(dirName => {
      const skillPath = path.join(skillsDirectory, dirName, 'SKILL.md')
      return fs.existsSync(skillPath)
    })
    .map(dirName => {
      const filePath = path.join(skillsDirectory, dirName, 'SKILL.md')
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)

      const category = data.category || 'uncategorized'

      return {
        slug: dirName,
        name: data.name || dirName,
        description: data.description || '',
        category,
        allowedTools: data['allowed-tools'],
        model: data.model,
        license: data.license,
        content
      }
    })

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

function getSkillBySlugFromFiles(slug: string): Skill | null {
  const skillsDirectory = path.join(process.cwd(), '../plugins/all-skills/skills')
  const filePath = path.join(skillsDirectory, slug, 'SKILL.md')

  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const category = data.category || 'uncategorized'

  return {
    slug,
    name: data.name || slug,
    description: data.description || '',
    category,
    allowedTools: data['allowed-tools'],
    model: data.model,
    license: data.license,
    content
  }
}

export async function getAllSkills(): Promise<Skill[]> {
  const dbItems = await getSkillItemsByType('skill')
  if (dbItems.length > 0) {
    return dbItems.map(item => {
      const meta = (() => { try { return JSON.parse(item.metadata || '{}') } catch { return {} } })()
      return {
        slug: item.slug,
        name: item.name,
        description: item.description || '',
        category: item.category || 'uncategorized',
        content: item.content,
        allowedTools: meta.allowedTools,
        model: meta.model,
        license: meta.license,
      } as Skill
    })
  }
  return getAllSkillsFromFiles()
}

export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  const dbItem = await getSkillItemBySlug('skill', slug)
  if (dbItem) {
    const meta = (() => { try { return JSON.parse(dbItem.metadata || '{}') } catch { return {} } })()
    return {
      slug: dbItem.slug,
      name: dbItem.name,
      description: dbItem.description || '',
      category: dbItem.category || 'uncategorized',
      content: dbItem.content,
      allowedTools: meta.allowedTools,
      model: meta.model,
      license: meta.license,
    } as Skill
  }
  return getSkillBySlugFromFiles(slug)
}

export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const skills = await getAllSkills()
  return skills.filter(skill => skill.category === category)
}

export async function searchSkills(query: string): Promise<Skill[]> {
  const normalizedQuery = query.toLowerCase()
  const skills = await getAllSkills()
  return skills.filter(skill =>
    skill.name.toLowerCase().includes(normalizedQuery) ||
    skill.description.toLowerCase().includes(normalizedQuery) ||
    skill.content.toLowerCase().includes(normalizedQuery)
  )
}

export async function getAllSkillCategories(): Promise<CategoryMetadata[]> {
  const skills = await getAllSkills()
  const categoryCounts: Record<string, number> = {}

  skills.forEach(skill => {
    const category = skill.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return generateCategoryMetadata(categoryCounts)
}

export async function getAllSkillCategoryIds(): Promise<string[]> {
  const skills = await getAllSkills()
  const categories = new Set(skills.map(s => s.category))
  return Array.from(categories).sort()
}
