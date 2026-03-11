'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Organization } from '@/lib/api-client'

interface OrgFilterContextValue {
  selectedOrg: Organization | null
  setSelectedOrg: (org: Organization | null) => void
}

const OrgFilterContext = createContext<OrgFilterContextValue>({
  selectedOrg: null,
  setSelectedOrg: () => {},
})

export function OrgFilterProvider({ children }: { children: ReactNode }) {
  const [selectedOrg, setSelectedOrgState] = useState<Organization | null>(null)

  const setSelectedOrg = useCallback((org: Organization | null) => {
    setSelectedOrgState(org)
  }, [])

  return (
    <OrgFilterContext.Provider value={{ selectedOrg, setSelectedOrg }}>
      {children}
    </OrgFilterContext.Provider>
  )
}

export function useOrgFilter() {
  return useContext(OrgFilterContext)
}
