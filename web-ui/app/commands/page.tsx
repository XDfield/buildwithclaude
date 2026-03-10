import { Suspense } from 'react'
import { getAllCommands, getAllCommandCategories } from '@/lib/commands-server'
import CommandsPageClient from './commands-client'

export default async function CommandsPage() {
  const [allCommands, categories] = await Promise.all([
    getAllCommands(),
    getAllCommandCategories(),
  ])
  
  return (
    <Suspense fallback={null}>
      <CommandsPageClient allCommands={allCommands} categories={categories} />
    </Suspense>
  )
}