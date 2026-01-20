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
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
    indexedAt: text('indexed_at'),
    isVerified: integer('is_verified').default(0),
    isFeatured: integer('is_featured').default(0),
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

// Types
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type Install = typeof installs.$inferSelect
export type Category = typeof categories.$inferSelect
