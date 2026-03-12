'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Repository } from '@/lib/api-client'

interface RepoFilterContextValue {
  selectedRepo: Repository | null
  setSelectedRepo: (repo: Repository | null) => void
}

const RepoFilterContext = createContext<RepoFilterContextValue>({
  selectedRepo: null,
  setSelectedRepo: () => {},
})

export function RepoFilterProvider({ children }: { children: ReactNode }) {
  const [selectedRepo, setSelectedRepoState] = useState<Repository | null>(null)

  const setSelectedRepo = useCallback((repo: Repository | null) => {
    setSelectedRepoState(repo)
  }, [])

  return (
    <RepoFilterContext.Provider value={{ selectedRepo, setSelectedRepo }}>
      {children}
    </RepoFilterContext.Provider>
  )
}

export function useRepoFilter() {
  return useContext(RepoFilterContext)
}
