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

export interface Repository {
  id: string
  name: string
  displayName: string
  description: string
  visibility: 'public' | 'private'
  repoType: 'normal' | 'sync'
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface SyncJob {
  id: string
  registryId: string
  triggerType: 'scheduled' | 'manual' | 'webhook'
  triggerUser: string
  priority: number
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  retryCount: number
  maxAttempts: number
  lastError: string
  scheduledAt: string
  startedAt?: string
  finishedAt?: string
  syncLogId?: string
  createdAt: string
}

export interface SyncLog {
  id: string
  registryId: string
  triggerType: 'scheduled' | 'manual' | 'webhook'
  triggerUser: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  commitSha: string
  previousSha: string
  totalItems: number
  addedItems: number
  updatedItems: number
  deletedItems: number
  skippedItems: number
  failedItems: number
  errorMessage: string
  durationMs: number
  startedAt: string
  finishedAt?: string
  createdAt: string
}

export interface SyncStatus {
  syncStatus: string
  lastSyncedAt?: string
  lastSyncSha: string
  pendingJobs: number
  lastLog?: SyncLog
}

export interface CreateSyncRegistryInput {
  name?: string
  description?: string
  externalUrl: string
  externalBranch?: string
  syncInterval?: number
  syncEnabled?: boolean
  includePatterns?: string[]
  excludePatterns?: string[]
  conflictStrategy?: string
  webhookSecret?: string
}

export interface RepoMember {
  id: string
  repoId: string
  userId: string
  username: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

export interface CapabilityRegistry {
  id: string
  name: string
  description: string
  sourceType: string
  externalUrl: string
  externalBranch: string
  syncEnabled: boolean
  syncInterval: number
  lastSyncedAt?: string
  lastSyncSha: string
  syncStatus: string
  syncConfig?: Record<string, unknown>
  lastSyncLogId?: string
  visibility: string
  repoId: string
  ownerId: string
  orgId?: string
  createdAt: string
  updatedAt: string
}

export interface CapabilityArtifact {
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

export interface CapabilityVersion {
  id: string
  itemId: string
  version: string
  commitMsg: string
  createdBy: string
  createdAt: string
}

export type ScanStatus = 'pending' | 'scanning' | 'clean' | 'low' | 'medium' | 'high' | 'extreme' | 'error' | 'skipped' | 'unscanned'

export interface ScanPermissions {
  files: string[]
  network: string[]
  commands: string[]
}

export interface SecurityScan {
  id: string
  itemId: string
  itemRevision: number
  triggerType: string
  scanModel: string
  riskLevel: string
  verdict: string
  redFlags: string[]
  permissions: ScanPermissions
  summary: string
  recommendations: string[]
  durationMs: number
  createdAt: string
  finishedAt?: string
}

export interface ScanStatusResponse {
  scanStatus: ScanStatus
  lastScannedAt?: string
  latestResult?: {
    id: string
    riskLevel: string
    verdict: string
    summary: string
    scanModel: string
  }
}

export interface CapabilityItem {
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
  securityStatus?: ScanStatus
  lastScanId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  registry?: CapabilityRegistry
  versions?: CapabilityVersion[]
  artifacts?: CapabilityArtifact[]
}

export interface RepoRegistryStatus {
  registryId: string
  name: string
  externalUrl: string
  syncStatus: string
  lastSyncedAt?: string
  lastSyncSha: string
  pendingJobs: number
}

export const repoRegistryApi = {
  list: (repoId: string) =>
    apiFetch<{ registries: CapabilityRegistry[] }>(`/api/repositories/${repoId}/registries`),

  add: (repoId: string, data: CreateSyncRegistryInput) =>
    apiFetch<CapabilityRegistry>(`/api/repositories/${repoId}/registries`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (repoId: string, regId: string, data: Partial<CreateSyncRegistryInput> & { syncEnabled?: boolean }) =>
    apiFetch<CapabilityRegistry>(`/api/repositories/${repoId}/registries/${regId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (repoId: string, regId: string) =>
    apiFetch<{ message: string }>(`/api/repositories/${repoId}/registries/${regId}`, { method: 'DELETE' }),
}

export const repoApi = {
  listMy: (userId: string) =>
    apiFetch<{ repositories: Repository[] }>(`/api/repositories/my?userId=${encodeURIComponent(userId)}`),

  create: (data: {
    name: string
    displayName?: string
    description?: string
    visibility?: string
    ownerId: string
    repoType?: 'normal' | 'sync'
    syncRegistry?: CreateSyncRegistryInput
    syncRegistries?: CreateSyncRegistryInput[]
  }) =>
    apiFetch<Repository | { repository: Repository; registries: CapabilityRegistry[] }>(
      '/api/repositories',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  update: (id: string, data: { name?: string; displayName?: string; description?: string; visibility?: string }) =>
    apiFetch<Repository>(`/api/repositories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/repositories/${id}`, { method: 'DELETE' }),

  listMembers: (repoId: string) =>
    apiFetch<{ members: RepoMember[] }>(`/api/repositories/${repoId}/members`),

  addMember: (repoId: string, data: { userId: string; username?: string; role?: string }) =>
    apiFetch<RepoMember>(`/api/repositories/${repoId}/members`, { method: 'POST', body: JSON.stringify(data) }),

  removeMember: (repoId: string, userId: string) =>
    apiFetch<{ message: string }>(`/api/repositories/${repoId}/members/${userId}`, { method: 'DELETE' }),
}

export const syncApi = {
  triggerRepoSync: (repoId: string, dryRun?: boolean, registryId?: string) => {
    const params = new URLSearchParams()
    if (dryRun) params.set('dryRun', 'true')
    if (registryId) params.set('registryId', registryId)
    const qs = params.toString()
    return apiFetch<{ jobId?: string; status?: string; jobs?: { jobId: string; registryId: string; status: string }[] }>(
      `/api/repositories/${repoId}/sync${qs ? '?' + qs : ''}`,
      { method: 'POST' }
    )
  },

  cancelRepoSync: (repoId: string, registryId?: string) => {
    const qs = registryId ? `?registryId=${registryId}` : ''
    return apiFetch<{ message: string }>(`/api/repositories/${repoId}/sync/cancel${qs}`, { method: 'POST' })
  },

  getRepoSyncStatus: (repoId: string, registryId?: string) => {
    const qs = registryId ? `?registryId=${registryId}` : ''
    return apiFetch<SyncStatus | { registries: RepoRegistryStatus[] }>(`/api/repositories/${repoId}/sync-status${qs}`)
  },

  listRepoSyncLogs: (repoId: string, page = 1, pageSize = 20, registryId?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (registryId) params.set('registryId', registryId)
    return apiFetch<{ logs: SyncLog[]; total: number }>(
      `/api/repositories/${repoId}/sync-logs?${params.toString()}`
    )
  },

  listRepoSyncJobs: (repoId: string, page = 1, pageSize = 20, registryId?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (registryId) params.set('registryId', registryId)
    return apiFetch<{ jobs: SyncJob[]; total: number }>(
      `/api/repositories/${repoId}/sync-jobs?${params.toString()}`
    )
  },

  triggerRegistrySync: (registryId: string, dryRun?: boolean) =>
    apiFetch<{ jobId: string; status: string }>(
      `/api/registries/${registryId}/sync${dryRun ? '?dryRun=true' : ''}`,
      { method: 'POST' }
    ),

  getRegistrySyncStatus: (registryId: string) =>
    apiFetch<SyncStatus>(`/api/registries/${registryId}/sync-status`),

  listRegistrySyncLogs: (registryId: string, page = 1, pageSize = 20) =>
    apiFetch<{ logs: SyncLog[]; total: number }>(
      `/api/registries/${registryId}/sync-logs?page=${page}&pageSize=${pageSize}`
    ),
}

export const registryApi = {
  listMy: (ownerId: string) =>
    apiFetch<{ registries: CapabilityRegistry[] }>(`/api/registries/my?ownerId=${encodeURIComponent(ownerId)}`),

  ensurePersonal: (ownerId: string, username?: string) =>
    apiFetch<CapabilityRegistry>('/api/registries/ensure-personal', {
      method: 'POST',
      body: JSON.stringify({ ownerId, username }),
    }),

  create: (data: { name: string; description?: string; visibility?: string; repoId?: string; ownerId: string }) =>
    apiFetch<CapabilityRegistry>('/api/registries', { method: 'POST', body: JSON.stringify({ ...data, sourceType: 'internal' }) }),
}

export const itemApi = {
  listMy: (ownerId: string, type?: string) =>
    apiFetch<{ items: CapabilityItem[] }>(
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
    return apiFetch<{ items: CapabilityItem[]; total: number; hasMore: boolean }>(
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
    apiFetch<CapabilityItem>('/api/items', { method: 'POST', body: JSON.stringify(data) }),

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
    apiFetch<CapabilityItem>(`/api/registries/${registryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CapabilityItem> & { commitMsg?: string }) =>
    apiFetch<CapabilityItem>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/items/${id}`, { method: 'DELETE' }),

  get: (id: string) =>
    apiFetch<CapabilityItem>(`/api/items/${id}`),
}

export const registryApi2 = {
  getPublic: () =>
    apiFetch<CapabilityRegistry>('/api/registries/public'),
}

export const scanApi = {
  trigger: (itemId: string) =>
    apiFetch<{ jobId: string; status: string }>(`/api/items/${itemId}/scan`, { method: 'POST' }),

  getStatus: (itemId: string) =>
    apiFetch<ScanStatusResponse>(`/api/items/${itemId}/scan-status`),

  listResults: (itemId: string, page = 1, size = 10) =>
    apiFetch<{ results: SecurityScan[]; total: number }>(
      `/api/items/${itemId}/scan-results?page=${page}&size=${size}`
    ),

  getResult: (scanId: string) =>
    apiFetch<SecurityScan>(`/api/scan-results/${scanId}`),

  cancelJob: (jobId: string) =>
    apiFetch<{ message: string }>(`/api/scan-jobs/${jobId}/cancel`, { method: 'POST' }),
}

export const artifactApi = {
  list: (itemId: string) =>
    apiFetch<{ artifacts: CapabilityArtifact[] }>(`/api/items/${itemId}/artifacts`),

  downloadUrl: (artifactId: string) =>
    `${API_BASE}/api/artifacts/${artifactId}/download`,

  delete: (artifactId: string) =>
    apiFetch<{ message: string }>(`/api/artifacts/${artifactId}`, { method: 'DELETE' }),
}
