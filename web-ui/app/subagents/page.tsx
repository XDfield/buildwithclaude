import { Suspense } from 'react'
import { getAllSubagents, getAllCategories } from '@/lib/subagents-server'
import SubagentsPageClient from './subagents-client'

export default async function SubagentsPage() {
  const [allSubagents, categories] = await Promise.all([
    getAllSubagents(),
    getAllCategories(),
  ])

  return (
    <Suspense fallback={null}>
      <SubagentsPageClient allSubagents={allSubagents} categories={categories} />
    </Suspense>
  )
}