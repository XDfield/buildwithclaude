const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export interface Organization {
  id: string
  name: string
  displayName: string
  description: string
  visibility: 'public' | 'private'
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface OrgMember {
  id: string
  orgId: string
  userId: string
  username: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

export interface SkillRegistry {
  id: string
  name: string
  description: string
  sourceType: string
  visibility: string
  orgId: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface SkillArtifact {
  id: string
  itemId: string
  version: string
  filename: string
  storageKey: string
  fileSize: number
  checksum: string
  isLatest: boolean
  downloadCount: number
  uploadedBy: string
  createdAt: string
}

export interface SkillVersion {
  id: string
  itemId: string
  version: string
  commitMsg: string
  createdBy: string
  createdAt: string
}

export interface SkillItem {
  id: string
  registryId: string
  slug: string
  itemType: string
  name: string
  description: string
  category: string
  version: string
  content: string
  visibility: string
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  registry?: SkillRegistry
  versions?: SkillVersion[]
  artifacts?: SkillArtifact[]
}

export const orgApi = {
  listMy: (userId: string) =>
    apiFetch<{ organizations: Organization[] }>(`/api/organizations/my?userId=${encodeURIComponent(userId)}`),

  create: (data: { name: string; displayName?: string; description?: string; visibility?: string; ownerId: string }) =>
    apiFetch<Organization>('/api/organizations', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: { name?: string; displayName?: string; description?: string; visibility?: string }) =>
    apiFetch<Organization>(`/api/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/organizations/${id}`, { method: 'DELETE' }),

  listMembers: (orgId: string) =>
    apiFetch<{ members: OrgMember[] }>(`/api/organizations/${orgId}/members`),

  addMember: (orgId: string, data: { userId: string; username?: string; role?: string }) =>
    apiFetch<OrgMember>(`/api/organizations/${orgId}/members`, { method: 'POST', body: JSON.stringify(data) }),

  removeMember: (orgId: string, userId: string) =>
    apiFetch<{ message: string }>(`/api/organizations/${orgId}/members/${userId}`, { method: 'DELETE' }),
}

export const registryApi = {
  listMy: (ownerId: string) =>
    apiFetch<{ registries: SkillRegistry[] }>(`/api/registries/my?ownerId=${encodeURIComponent(ownerId)}`),

  ensurePersonal: (ownerId: string, username?: string) =>
    apiFetch<SkillRegistry>('/api/registries/ensure-personal', {
      method: 'POST',
      body: JSON.stringify({ ownerId, username }),
    }),

  create: (data: { name: string; description?: string; visibility?: string; orgId?: string; ownerId: string }) =>
    apiFetch<SkillRegistry>('/api/registries', { method: 'POST', body: JSON.stringify({ ...data, sourceType: 'internal' }) }),
}

export const itemApi = {
  listMy: (ownerId: string, type?: string) =>
    apiFetch<{ items: SkillItem[] }>(
      `/api/items/my?ownerId=${encodeURIComponent(ownerId)}${type ? `&type=${type}` : ''}`
    ),

  list: (params?: {
    type?: string
    search?: string
    category?: string
    registryId?: string
    limit?: number
    offset?: number
    status?: string
  }) => {
    const p = new URLSearchParams()
    if (params?.type) p.set('type', params.type)
    if (params?.search) p.set('search', params.search)
    if (params?.category) p.set('category', params.category)
    if (params?.registryId) p.set('registryId', params.registryId)
    if (params?.limit) p.set('limit', String(params.limit))
    if (params?.offset) p.set('offset', String(params.offset))
    if (params?.status) p.set('status', params.status)
    return apiFetch<{ items: SkillItem[]; total: number; hasMore: boolean }>(
      `/api/items?${p.toString()}`
    )
  },

  createDirect: (data: {
    itemType: string
    name: string
    description?: string
    category?: string
    version?: string
    content?: string
    visibility?: string
    registryId?: string
    slug?: string
    createdBy?: string
  }) =>
    apiFetch<SkillItem>('/api/items', { method: 'POST', body: JSON.stringify(data) }),

  create: (registryId: string, data: {
    slug: string
    itemType: string
    name: string
    description?: string
    category?: string
    version?: string
    content?: string
    visibility?: string
    createdBy: string
  }) =>
    apiFetch<SkillItem>(`/api/registries/${registryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<SkillItem> & { commitMsg?: string }) =>
    apiFetch<SkillItem>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/items/${id}`, { method: 'DELETE' }),

  get: (id: string) =>
    apiFetch<SkillItem>(`/api/items/${id}`),
}

export const registryApi2 = {
  getPublic: () =>
    apiFetch<SkillRegistry>('/api/registries/public'),
}

export const artifactApi = {
  list: (itemId: string) =>
    apiFetch<{ artifacts: SkillArtifact[] }>(`/api/items/${itemId}/artifacts`),

  downloadUrl: (artifactId: string) =>
    `${API_BASE}/api/artifacts/${artifactId}/download`,

  delete: (artifactId: string) =>
    apiFetch<{ message: string }>(`/api/artifacts/${artifactId}`, { method: 'DELETE' }),
}
