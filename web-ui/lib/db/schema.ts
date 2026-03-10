import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

// Marketplaces table - stores plugin marketplace registries
export const marketplaces = pgTable(
  'marketplaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core identification
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    namespace: varchar('namespace', { length: 255 }).notNull().unique(), // e.g., "@owner/repo"

    // URLs
    url: varchar('url', { length: 512 }),
    repository: varchar('repository', { length: 512 }).notNull(),
    installCommand: varchar('install_command', { length: 512 }),

    // Counts
    pluginCount: integer('plugin_count').notNull().default(0),
    skillCount: integer('skill_count').notNull().default(0),

    // Metadata
    description: text('description'),
    categories: text('categories').array(),
    badges: text('badges').array(),

    // Maintainer
    maintainerName: varchar('maintainer_name', { length: 255 }),
    maintainerGithub: varchar('maintainer_github', { length: 255 }),

    // GitHub signals
    stars: integer('stars').notNull().default(0),

    // Usage tracking
    installs: integer('installs').notNull().default(0),

    // Status
    verified: boolean('verified').notNull().default(false),
    active: boolean('active').notNull().default(true),

    // Timestamps
    lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_marketplaces_name').on(table.name),
    index('idx_marketplaces_namespace').on(table.namespace),
    index('idx_marketplaces_stars').on(table.stars),
    index('idx_marketplaces_installs').on(table.installs),
    index('idx_marketplaces_active').on(table.active),
  ]
)

// Marketplace stats table - tracks historical data
export const marketplaceStats = pgTable(
  'marketplace_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    marketplaceId: uuid('marketplace_id')
      .notNull()
      .references(() => marketplaces.id, { onDelete: 'cascade' }),

    // Snapshot data
    pluginCount: integer('plugin_count').notNull().default(0),
    skillCount: integer('skill_count').notNull().default(0),
    stars: integer('stars').notNull().default(0),

    // Timestamp
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_marketplace_stats_marketplace').on(table.marketplaceId),
    index('idx_marketplace_stats_recorded_at').on(table.recordedAt),
  ]
)

// Marketplace install stats table - tracks install/usage metrics over time
export const marketplaceInstallStats = pgTable(
  'marketplace_install_stats',
  {
    marketplaceId: uuid('marketplace_id')
      .primaryKey()
      .references(() => marketplaces.id, { onDelete: 'cascade' }),

    // Time-windowed install counts
    installsTotal: integer('installs_total').notNull().default(0),
    installsWeek: integer('installs_week').notNull().default(0),
    installsMonth: integer('installs_month').notNull().default(0),

    // Timestamp
    lastInstalledAt: timestamp('last_installed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_marketplace_install_stats_total').on(table.installsTotal),
  ]
)

// Plugins table - stores individual plugins from marketplaces
export const plugins = pgTable(
  'plugins',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core identification
    name: varchar('name', { length: 255 }).notNull(),
    namespace: varchar('namespace', { length: 255 }).notNull().unique(), // e.g., "@owner/plugin-name"
    slug: varchar('slug', { length: 255 }).notNull(), // URL-safe identifier

    // Source tracking
    marketplaceId: uuid('marketplace_id').references(() => marketplaces.id, { onDelete: 'cascade' }),
    marketplaceName: varchar('marketplace_name', { length: 255 }), // Denormalized for quick access
    repository: varchar('repository', { length: 512 }),

    // Content
    description: text('description'),
    version: varchar('version', { length: 64 }),
    author: varchar('author', { length: 255 }),

    // Classification
    type: varchar('type', { length: 64 }).notNull(), // 'plugin', 'command', 'hook', 'subagent', 'skill'
    categories: text('categories').array(),
    keywords: text('keywords').array(),

    // Installation
    installCommand: varchar('install_command', { length: 512 }),

    // GitHub signals
    stars: integer('stars').notNull().default(0),

    // Status
    active: boolean('active').notNull().default(true),

    // Timestamps
    lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_plugins_name').on(table.name),
    index('idx_plugins_namespace').on(table.namespace),
    index('idx_plugins_marketplace').on(table.marketplaceId),
    index('idx_plugins_type').on(table.type),
    index('idx_plugins_stars').on(table.stars),
    index('idx_plugins_active').on(table.active),
  ]
)

// Skills table - stores individual skills from marketplaces
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core identification
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),

    // Source tracking
    marketplaceId: uuid('marketplace_id').references(() => marketplaces.id, { onDelete: 'cascade' }),
    marketplaceName: varchar('marketplace_name', { length: 255 }),
    pluginId: uuid('plugin_id').references(() => plugins.id, { onDelete: 'cascade' }), // Skills can belong to plugins
    repository: varchar('repository', { length: 512 }),

    // Content
    description: text('description'),
    category: varchar('category', { length: 128 }),

    // Metadata
    allowedTools: text('allowed_tools').array(),
    model: varchar('model', { length: 64 }),

    // Status
    active: boolean('active').notNull().default(true),

    // Timestamps
    lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_skills_name').on(table.name),
    index('idx_skills_slug').on(table.slug),
    index('idx_skills_marketplace').on(table.marketplaceId),
    index('idx_skills_plugin').on(table.pluginId),
    index('idx_skills_category').on(table.category),
    index('idx_skills_active').on(table.active),
  ]
)

// MCP Servers table - stores indexed MCP servers from various sources
export const mcpServers = pgTable(
  'mcp_servers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Identification
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),

    // Content
    description: text('description'),
    version: varchar('version', { length: 64 }),
    category: varchar('category', { length: 128 }).notNull(),
    tags: text('tags').array(),

    // Server type
    serverType: varchar('server_type', { length: 32 }), // stdio, http, sse, websocket
    vendor: varchar('vendor', { length: 255 }),
    logoUrl: varchar('logo_url', { length: 512 }),

    // Source (simpler model than marketplace)
    sourceRegistry: varchar('source_registry', { length: 64 }).notNull(), // official-mcp, docker, github, community
    sourceUrl: varchar('source_url', { length: 512 }),

    // Links
    githubUrl: varchar('github_url', { length: 512 }),
    dockerUrl: varchar('docker_url', { length: 512 }),
    npmUrl: varchar('npm_url', { length: 512 }),
    documentationUrl: varchar('documentation_url', { length: 512 }),

    // Stats (synced from sources)
    githubStars: integer('github_stars').default(0),
    dockerPulls: integer('docker_pulls').default(0),
    npmDownloads: integer('npm_downloads').default(0),

    // Installation (JSON strings for complex data)
    packages: text('packages'), // JSON array of MCPPackage
    remotes: text('remotes'), // JSON array of MCPRemote
    environmentVariables: text('environment_variables'), // JSON array
    installationMethods: text('installation_methods'), // JSON array

    // Status
    verificationStatus: varchar('verification_status', { length: 32 }).default('community'), // verified, community, experimental
    active: boolean('active').notNull().default(true),

    // Timestamps
    lastStatsSync: timestamp('last_stats_sync', { withTimezone: true }),
    lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_mcp_servers_name').on(table.name),
    index('idx_mcp_servers_slug').on(table.slug),
    index('idx_mcp_servers_category').on(table.category),
    index('idx_mcp_servers_source_registry').on(table.sourceRegistry),
    index('idx_mcp_servers_github_stars').on(table.githubStars),
    index('idx_mcp_servers_docker_pulls').on(table.dockerPulls),
    index('idx_mcp_servers_active').on(table.active),
  ]
)

// MCP Server stats table - tracks historical data for trending
export const mcpServerStats = pgTable(
  'mcp_server_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mcpServerId: uuid('mcp_server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),

    // Snapshot data
    githubStars: integer('github_stars').default(0),
    dockerPulls: integer('docker_pulls').default(0),
    npmDownloads: integer('npm_downloads').default(0),

    // Timestamp
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_mcp_server_stats_server').on(table.mcpServerId),
    index('idx_mcp_server_stats_recorded_at').on(table.recordedAt),
  ]
)

// Type exports for use in other modules
export type Marketplace = typeof marketplaces.$inferSelect
export type NewMarketplace = typeof marketplaces.$inferInsert
export type MarketplaceStats = typeof marketplaceStats.$inferSelect
export type NewMarketplaceStats = typeof marketplaceStats.$inferInsert
export type MarketplaceInstallStats = typeof marketplaceInstallStats.$inferSelect
export type NewMarketplaceInstallStats = typeof marketplaceInstallStats.$inferInsert
export type Plugin = typeof plugins.$inferSelect
export type NewPlugin = typeof plugins.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type MCPServerDB = typeof mcpServers.$inferSelect
export type NewMCPServerDB = typeof mcpServers.$inferInsert
export type MCPServerStatsDB = typeof mcpServerStats.$inferSelect
export type NewMCPServerStatsDB = typeof mcpServerStats.$inferInsert

export const skillRegistries = pgTable('skill_registries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sourceType: varchar('source_type', { length: 32 }).notNull().default('internal'),
  externalUrl: varchar('external_url', { length: 512 }),
  externalBranch: varchar('external_branch', { length: 128 }).default('main'),
  syncEnabled: boolean('sync_enabled').default(false),
  syncInterval: integer('sync_interval').default(3600),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastSyncSha: varchar('last_sync_sha', { length: 64 }),
  visibility: varchar('visibility', { length: 32 }).default('org'),
  orgId: varchar('org_id', { length: 191 }),
  ownerId: varchar('owner_id', { length: 191 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_skill_registries_owner').on(table.ownerId),
  index('idx_skill_registries_org').on(table.orgId),
  index('idx_skill_registries_source_type').on(table.sourceType),
])

export const skillItems = pgTable('skill_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  registryId: uuid('registry_id').references(() => skillRegistries.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull(),
  itemType: varchar('item_type', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 128 }),
  version: varchar('version', { length: 64 }).default('1.0.0'),
  content: text('content').notNull().default(''),
  metadata: text('metadata').default('{}'),
  sourcePath: varchar('source_path', { length: 512 }),
  sourceSha: varchar('source_sha', { length: 64 }),
  visibility: varchar('visibility', { length: 32 }),
  installCount: integer('install_count').default(0),
  status: varchar('status', { length: 32 }).default('active'),
  createdBy: varchar('created_by', { length: 191 }).notNull().default('system'),
  updatedBy: varchar('updated_by', { length: 191 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_skill_items_registry').on(table.registryId),
  index('idx_skill_items_type').on(table.itemType),
  index('idx_skill_items_slug').on(table.slug),
  index('idx_skill_items_status').on(table.status),
  index('idx_skill_items_category').on(table.category),
])

export const skillVersions = pgTable('skill_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => skillItems.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata').default('{}'),
  commitMsg: varchar('commit_msg', { length: 500 }),
  createdBy: varchar('created_by', { length: 191 }).notNull().default('system'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_skill_versions_item').on(table.itemId),
])

export const skillArtifacts = pgTable('skill_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => skillItems.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  checksumSha256: varchar('checksum_sha256', { length: 64 }).notNull(),
  mimeType: varchar('mime_type', { length: 128 }),
  storageBackend: varchar('storage_backend', { length: 32 }).default('local'),
  storageKey: varchar('storage_key', { length: 512 }).notNull(),
  artifactVersion: varchar('artifact_version', { length: 64 }).notNull(),
  isLatest: boolean('is_latest').default(false),
  downloadCount: integer('download_count').default(0),
  uploadedBy: varchar('uploaded_by', { length: 191 }).notNull().default('system'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_skill_artifacts_item').on(table.itemId),
  index('idx_skill_artifacts_latest').on(table.isLatest),
])

export type SkillRegistry = typeof skillRegistries.$inferSelect
export type NewSkillRegistry = typeof skillRegistries.$inferInsert
export type SkillItem = typeof skillItems.$inferSelect
export type NewSkillItem = typeof skillItems.$inferInsert
export type SkillVersion = typeof skillVersions.$inferSelect
export type NewSkillVersion = typeof skillVersions.$inferInsert
export type SkillArtifact = typeof skillArtifacts.$inferSelect
export type NewSkillArtifact = typeof skillArtifacts.$inferInsert
