import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Skills table
export const skills = sqliteTable('skills', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').default('general'),
    tags: text('tags'), // JSON array
    author: text('author'),
    version: text('version').default('1.0.0'),
    license: text('license'),
    githubUrl: text('github_url').notNull(),
    githubOwner: text('github_owner'),
    githubRepo: text('github_repo'),
    githubStars: integer('github_stars').default(0),
    githubForks: integer('github_forks').default(0),
    installCount: integer('install_count').default(0),
    compatibility: text('compatibility'),
    namespace: text('namespace'),
    importSource: text('import_source'),
    platform: text('platform'),
    stars: integer('stars').default(0),
    downloads: integer('downloads').default(0),
    metadata: text('metadata'), // JSON object
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
    indexedAt: text('indexed_at'),
    isVerified: integer('is_verified').default(0),
    isFeatured: integer('is_featured').default(0),
    status: text('status').default('published'),
    submitterName: text('submitter_name'),
    submitterEmail: text('submitter_email'),
})

// Install tracking
export const installs = sqliteTable('installs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    skillId: text('skill_id').notNull().references(() => skills.id),
    client: text('client').default('unknown'),
    installedAt: text('installed_at'),
})

// Categories
export const categories = sqliteTable('categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    skillCount: integer('skill_count').default(0),
})

// Skill Submissions
export const skillSubmissions = sqliteTable('skill_submissions', {
    id: text('id').primaryKey(), // UUID
    githubUrl: text('github_url').notNull(),
    submitterName: text('submitter_name'),
    submitterEmail: text('submitter_email'),
    status: text('status').default('pending'), // pending, approved, rejected
    submittedAt: text('submitted_at'),
    reviewNotes: text('review_notes'),
    submitterIp: text('submitter_ip'),
    userAgent: text('user_agent'),
})

// PRDs table
export const prds = sqliteTable('prds', {
    id: text('id').primaryKey(), // UUID
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').default('other'),
    tags: text('tags'), // JSON array
    author: text('author'),
    version: text('version').default('1.0.0'),
    filePath: text('file_path'), // Optional - for legacy file-based storage
    content: text('content'), // Full markdown content stored in DB
    viewCount: integer('view_count').default(0),
    downloadCount: integer('download_count').default(0),
    likeCount: integer('like_count').default(0),
    reviewCount: integer('review_count').default(0),
    shareCount: integer('share_count').default(0),
    issueCount: integer('issue_count').default(0),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
    status: text('status').default('published'),
})

// PRD Categories
export const prdCategories = sqliteTable('prd_categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    prdCount: integer('prd_count').default(0),
})

// Types
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type Install = typeof installs.$inferSelect
export type Category = typeof categories.$inferSelect
export type SkillSubmission = typeof skillSubmissions.$inferSelect
export type NewSkillSubmission = typeof skillSubmissions.$inferInsert
export type Prd = typeof prds.$inferSelect
export type NewPrd = typeof prds.$inferInsert
export type PrdCategory = typeof prdCategories.$inferSelect
