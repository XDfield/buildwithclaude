import { itemApi, type CapabilityItem } from './api-client'
import { Command } from './commands-types'
import { CategoryMetadata, generateCategoryMetadata } from './category-utils'

function toCommand(item: CapabilityItem): Command {
  const meta = (() => { try { return JSON.parse((item as unknown as Record<string, string>).metadata || '{}') } catch { return {} } })()
  return {
    slug: item.slug,
    description: item.description || '',
    category: item.category || 'miscellaneous',
    argumentHint: meta.argumentHint,
    allowedTools: meta.allowedTools,
    model: meta.model,
    content: item.content,
  }
}

export async function getAllCommands(): Promise<Command[]> {
  const res = await itemApi.list({ type: 'command', limit: 10000 })
  return res.items.map(toCommand)
}

export async function getCommandBySlug(slug: string): Promise<Command | null> {
  const res = await itemApi.list({ type: 'command', limit: 10000 })
  const item = res.items.find(i => i.slug === slug)
  return item ? toCommand(item) : null
}

export async function getCommandsByCategory(category: string): Promise<Command[]> {
  const res = await itemApi.list({ type: 'command', category, limit: 10000 })
  return res.items.map(toCommand)
}

export async function searchCommands(query: string): Promise<Command[]> {
  const res = await itemApi.list({ type: 'command', search: query, limit: 10000 })
  return res.items.map(toCommand)
}

export async function getAllCommandCategories(): Promise<CategoryMetadata[]> {
  const commands = await getAllCommands()
  const categoryCounts: Record<string, number> = {}
  commands.forEach(c => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1 })
  return generateCategoryMetadata(categoryCounts)
}

export async function getAllCommandCategoryIds(): Promise<string[]> {
  const commands = await getAllCommands()
  return Array.from(new Set(commands.map(c => c.category))).sort()
}
