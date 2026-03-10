import { Suspense } from 'react'
import { getAllHooks, getAllHookCategories, getAllEventTypes } from '@/lib/hooks-server'
import HooksPageClient from './hooks-client'

export default async function HooksPage() {
  const [allHooks, categories, eventTypes] = await Promise.all([
    getAllHooks(),
    getAllHookCategories(),
    getAllEventTypes(),
  ])

  return (
    <Suspense fallback={null}>
      <HooksPageClient allHooks={allHooks} categories={categories} eventTypes={eventTypes} />
    </Suspense>
  )
}
