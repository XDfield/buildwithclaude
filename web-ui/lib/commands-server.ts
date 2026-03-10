import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Command } from './commands-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'
import { getSkillItemsByType, getSkillItemBySlug } from './skill-items-db'

function getAllCommandsFromFiles(): Command[] {
  const commandsDirectory = path.join(process.cwd(), '../plugins/all-commands/commands')

  if (!fs.existsSync(commandsDirectory)) {
    console.warn('Commands directory not found:', commandsDirectory)
    return []
  }

  const fileNames = fs.readdirSync(commandsDirectory)
  
  const commands = fileNames
    .filter(fileName => fileName.endsWith('.md') && fileName !== 'README.md' && fileName !== 'INDEX.md')
    .map(fileName => {
      const filePath = path.join(commandsDirectory, fileName)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      
      const slug = fileName.replace(/\.md$/, '')
      const category = data.category || 'miscellaneous'
      
      return {
        slug,
        description: data.description || '',
        category,
        argumentHint: data['argument-hint'] || undefined,
        allowedTools: data['allowed-tools'] || undefined,
        model: data.model || undefined,
        content
      }
    })
  
  return commands.sort((a, b) => a.slug.localeCompare(b.slug))
}

function getCommandBySlugFromFiles(slug: string): Command | null {
  const commandsDirectory = path.join(process.cwd(), '../plugins/all-commands/commands')
  const filePath = path.join(commandsDirectory, `${slug}.md`)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const category = data.category || 'miscellaneous'
  
  return {
    slug,
    description: data.description || '',
    category,
    argumentHint: data['argument-hint'] || undefined,
    allowedTools: data['allowed-tools'] || undefined,
    model: data.model || undefined,
    content
  }
}

export async function getAllCommands(): Promise<Command[]> {
  const dbItems = await getSkillItemsByType('command')
  if (dbItems.length > 0) {
    return dbItems.map(item => {
      const meta = (() => { try { return JSON.parse(item.metadata || '{}') } catch { return {} } })()
      return {
        slug: item.slug,
        description: item.description || '',
        category: item.category || 'miscellaneous',
        argumentHint: meta.argumentHint,
        allowedTools: meta.allowedTools,
        model: meta.model,
        content: item.content,
      } as Command
    })
  }
  return getAllCommandsFromFiles()
}

export async function getCommandBySlug(slug: string): Promise<Command | null> {
  const dbItem = await getSkillItemBySlug('command', slug)
  if (dbItem) {
    const meta = (() => { try { return JSON.parse(dbItem.metadata || '{}') } catch { return {} } })()
    return {
      slug: dbItem.slug,
      description: dbItem.description || '',
      category: dbItem.category || 'miscellaneous',
      argumentHint: meta.argumentHint,
      allowedTools: meta.allowedTools,
      model: meta.model,
      content: dbItem.content,
    } as Command
  }
  return getCommandBySlugFromFiles(slug)
}

export async function getCommandsByCategory(category: string): Promise<Command[]> {
  const commands = await getAllCommands()
  return commands.filter(command => command.category === category)
}

export async function searchCommands(query: string): Promise<Command[]> {
  const normalizedQuery = query.toLowerCase()
  const commands = await getAllCommands()
  return commands.filter(command => 
    command.slug.toLowerCase().includes(normalizedQuery) ||
    command.description.toLowerCase().includes(normalizedQuery) ||
    command.content.toLowerCase().includes(normalizedQuery)
  )
}

export async function getAllCommandCategories(): Promise<CategoryMetadata[]> {
  const commands = await getAllCommands()
  const categoryCounts: Record<string, number> = {}
  
  commands.forEach(command => {
    const category = command.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })
  
  return generateCategoryMetadata(categoryCounts)
}

export async function getAllCommandCategoryIds(): Promise<string[]> {
  const commands = await getAllCommands()
  const categories = new Set(commands.map(c => c.category))
  return Array.from(categories).sort()
}
