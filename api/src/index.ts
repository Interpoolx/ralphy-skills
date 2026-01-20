import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { drizzle } from 'drizzle-orm/d1'
import { skills, installs, categories } from './db/schema'
import { eq, like, desc, asc, sql, or } from 'drizzle-orm'

// Types
interface Env {
    DB: D1Database
    GITHUB_TOKEN?: string
    RALPHY_ADMIN_TOKEN?: string
    ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())

// Admin logic hardening
app.use('/api/admin/*', async (c, next) => {
    // Skip hardening if token is not set (during initial dev)
    const adminToken = c.env.RALPHY_ADMIN_TOKEN || 'ralphy-default-admin-token'
    const authHeader = c.req.header('Authorization')

    if (authHeader !== `Bearer ${adminToken}`) {
        return c.json({ error: 'Unauthorized. Valid RALPHY_ADMIN_TOKEN required.' }, 401)
    }
    await next()
})

// Health check
app.get('/', (c) => {
    return c.json({
        name: 'Ralphy Skills Registry API',
        version: '1.0.0',
        status: 'ok',
        endpoints: {
            search: 'GET /api/search?q=query&category=frontend&limit=20',
            skill: 'GET /api/skills/:id',
            resolve: 'GET /api/skills/:owner/:repo/:skill',
            install: 'POST /api/skills/:id/install',
            categories: 'GET /api/categories',
            stats: 'GET /api/stats',
        }
    })
})

// ================== SEARCH ==================
app.get('/api/search', async (c) => {
    const db = drizzle(c.env.DB)
    const query = c.req.query('q') || ''
    const category = c.req.query('category')
    const platform = c.req.query('platform')
    const source = c.req.query('source')
    const namespace = c.req.query('namespace')
    const author = c.req.query('author')
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 20000)
    const page = parseInt(c.req.query('page') || '1')
    const offset = (page - 1) * limit
    const sortBy = c.req.query('sort') || 'relevance'

    try {
        let results
        let whereClause = []
        let params = []

        if (category) {
            whereClause.push("category = ?")
            params.push(category)
        }
        if (platform) {
            whereClause.push("platform = ?")
            params.push(platform)
        }
        if (source) {
            whereClause.push("import_source = ?")
            params.push(source)
        }
        if (namespace) {
            whereClause.push("namespace = ?")
            params.push(namespace)
        }
        if (author) {
            whereClause.push("author = ?")
            params.push(author)
        }

        const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''

        if (query) {
            const searchWhere = whereClause.length > 0 ? `AND ${whereClause.join(' AND ')}` : ''
            const searchResults = await c.env.DB.prepare(`
                SELECT skills.* FROM skills 
                JOIN skills_fts ON skills.rowid = skills_fts.rowid
                WHERE skills_fts MATCH ?
                ${searchWhere}
                ORDER BY ${sortBy === 'stars' ? 'github_stars DESC' :
                    sortBy === 'installs' ? 'install_count DESC' :
                        sortBy === 'name' ? 'name ASC' : 'rank'}
                LIMIT ? OFFSET ?
            `).bind(
                            query + '*',
                            ...params,
                            limit,
                            offset
                        ).all()

            results = searchResults.results
        } else {
            const allResults = await c.env.DB.prepare(`
                SELECT * FROM skills
                ${whereSql}
                ORDER BY ${sortBy === 'stars' ? 'github_stars DESC' :
                    sortBy === 'installs' ? 'install_count DESC' :
                        sortBy === 'name' ? 'name ASC' : 'install_count DESC'}
                LIMIT ? OFFSET ?
            `).bind(
                            ...params,
                            limit,
                            offset
                        ).all()

            results = allResults.results
        }

        // Get total count for metadata
        const countQuery = query ?
            `SELECT COUNT(*) as total FROM skills JOIN skills_fts ON skills.rowid = skills_fts.rowid WHERE skills_fts MATCH ? ${whereClause.length > 0 ? `AND ${whereClause.join(' AND ')}` : ''}` :
            `SELECT COUNT(*) as total FROM skills ${whereSql}`

        const countParams = query ? [query + '*', ...params] : params
        const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()

        return c.json({
            skills: results,
            pagination: {
                page,
                limit,
                total: countResult?.total || 0,
                hasMore: offset + limit < (countResult?.total || 0)
            }
        })
    } catch (error) {
        console.error('Search error:', error)
        return c.json({ error: 'Search failed', skills: [], pagination: { page: 1, limit, total: 0, hasMore: false } }, 500)
    }
})

// ================== GET SKILL BY ID ==================
app.get('/api/skills/:id', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')

    try {
        const skill = await db.select().from(skills).where(eq(skills.id, id)).get()

        if (!skill) {
            return c.json({ error: 'Skill not found' }, 404)
        }

        return c.json(skill)
    } catch (error) {
        console.error('Get skill error:', error)
        return c.json({ error: 'Failed to get skill' }, 500)
    }
})

// ================== RESOLVE SKILL (skills-installer format) ==================
app.get('/api/skills/:owner/:repo/:skill', async (c) => {
    const owner = c.req.param('owner')
    const repo = c.req.param('repo')
    const skillName = c.req.param('skill')

    try {
        // First try to find in our database
        const result = await c.env.DB.prepare(`
            SELECT * FROM skills 
            WHERE github_owner = ? AND github_repo = ? AND id = ?
            OR id = ?
        `).bind(owner, repo, skillName, `${owner}/${repo}/${skillName}`).first()

        if (result) {
            return c.json({
                name: result.name,
                namespace: `${owner}/${repo}`,
                sourceUrl: result.github_url,
                description: result.description,
                version: result.version,
                author: result.author,
            })
        }

        // If not found, try to construct GitHub URL
        const sourceUrl = `https://github.com/${owner}/${repo}/tree/main/skills/${skillName}`

        return c.json({
            name: skillName,
            namespace: `${owner}/${repo}`,
            sourceUrl,
            description: 'Skill resolved from GitHub',
            author: owner,
        })
    } catch (error) {
        console.error('Resolve error:', error)
        return c.json({ error: 'Failed to resolve skill' }, 500)
    }
})

// ================== TRACK INSTALL ==================
app.post('/api/skills/:id/install', async (c) => {
    const db = drizzle(c.env.DB)
    const skillId = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const client = body.client || 'unknown'

    try {
        // Record install
        await db.insert(installs).values({
            skillId,
            client,
            installedAt: new Date().toISOString(),
        })

        // Increment install count
        await c.env.DB.prepare(
            'UPDATE skills SET install_count = install_count + 1 WHERE id = ?'
        ).bind(skillId).run()

        return c.json({ success: true, message: 'Install tracked' })
    } catch (error) {
        console.error('Install tracking error:', error)
        return c.json({ error: 'Failed to track install' }, 500)
    }
})

// ================== CATEGORIES ==================
app.get('/api/categories', async (c) => {
    const db = drizzle(c.env.DB)

    try {
        const result = await db.select().from(categories).all()
        return c.json(result)
    } catch (error) {
        console.error('Categories error:', error)
        return c.json({ error: 'Failed to get categories' }, 500)
    }
})

// ================== STATS ==================
app.get('/api/stats', async (c) => {
    try {
        const skillCount = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM skills'
        ).first<{ count: number }>()

        const installCount = await c.env.DB.prepare(
            'SELECT SUM(install_count) as count FROM skills'
        ).first<{ count: number }>()

        const categoryCount = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM categories'
        ).first<{ count: number }>()

        return c.json({
            skills: skillCount?.count || 0,
            totalInstalls: installCount?.count || 0,
            categories: categoryCount?.count || 0,
            lastUpdated: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Stats error:', error)
        return c.json({ error: 'Failed to get stats' }, 500)
    }
})

app.get('/api/stats/filter-options', async (c) => {
    try {
        const authors = await c.env.DB.prepare(
            'SELECT DISTINCT author FROM skills WHERE author IS NOT NULL AND author != "" ORDER BY author'
        ).all<{ author: string }>()

        const platforms = await c.env.DB.prepare(
            'SELECT DISTINCT platform FROM skills WHERE platform IS NOT NULL AND platform != "" ORDER BY platform'
        ).all<{ platform: string }>()

        const sources = await c.env.DB.prepare(
            'SELECT DISTINCT import_source FROM skills WHERE import_source IS NOT NULL AND import_source != "" ORDER BY import_source'
        ).all<{ import_source: string }>()

        const namespaces = await c.env.DB.prepare(
            'SELECT DISTINCT namespace FROM skills WHERE namespace IS NOT NULL AND namespace != "" ORDER BY namespace'
        ).all<{ namespace: string }>()

        return c.json({
            authors: authors.results.map(r => r.author),
            platforms: platforms.results.map(r => r.platform),
            sources: sources.results.map(r => r.import_source),
            namespaces: namespaces.results.map(r => r.namespace)
        })
    } catch (error) {
        console.error('Filter options error:', error)
        return c.json({ error: 'Failed to get filter options' }, 500)
    }
})

// ================== FEATURED SKILLS ==================
app.get('/api/featured', async (c) => {
    try {
        const featured = await c.env.DB.prepare(`
            SELECT * FROM skills WHERE is_featured = 1 ORDER BY install_count DESC LIMIT 10
        `).all()

        return c.json(featured.results)
    } catch (error) {
        console.error('Featured error:', error)
        return c.json({ error: 'Failed to get featured skills' }, 500)
    }
})

// ================== IMPORT/SEED SKILLS ==================
app.post('/api/admin/import', async (c) => {
    const body = await c.req.json()
    const skillsToImport = body.skills || []
    const importSource = body.import_source || 'manual' // marketplace, claude-plugins, manual
    const defaultPlatform = body.platform || 'global' // global, claude, cursor, codex, copilot

    if (!Array.isArray(skillsToImport)) {
        return c.json({ error: 'Invalid skills array' }, 400)
    }

    let imported = 0
    let errors = 0

    for (const skill of skillsToImport) {
        try {
            // Handle author as string or object
            let authorName = ''
            let authorGithub = ''
            if (typeof skill.author === 'string') {
                authorName = skill.author
            } else if (skill.author && typeof skill.author === 'object') {
                authorName = skill.author.name || skill.author.github || ''
                authorGithub = skill.author.github || ''
            }

            // Handle github_url from multiple possible fields
            const githubUrl = skill.gitUrl || skill.source || skill.url || skill.github_url || skill.githubUrl || skill.repository || ''

            // Skip if no valid github URL
            if (!githubUrl) {
                console.log('Skipping skill without URL:', skill.id || skill.name)
                errors++
                continue
            }

            // Parse GitHub owner/repo from URL
            const githubMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
            const githubOwner = githubMatch?.[1] || authorGithub || ''
            const githubRepo = githubMatch?.[2]?.replace(/\.git$/, '') || ''

            // Determine platform from skill data or use default
            const platform = skill.platform || skill.agent || defaultPlatform

            // Generate ID if not provided
            // Trust the ID if it comes from the source, otherwise generate slug
            const skillId = skill.id || skill.name?.toLowerCase().trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || ''

            if (!skillId || !skill.name) {
                console.log('Skipping skill without ID or name')
                errors++
                continue
            }

            // Insert using raw SQL to avoid Drizzle type issues
            await c.env.DB.prepare(`
                INSERT INTO skills (id, name, namespace, description, category, tags, author, version, license, github_url, github_owner, github_repo, github_stars, install_count, import_source, platform, stars, downloads, metadata, created_at, updated_at, indexed_at, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    namespace = excluded.namespace,
                    description = excluded.description,
                    import_source = excluded.import_source,
                    platform = excluded.platform,
                    stars = excluded.stars,
                    downloads = excluded.downloads,
                    metadata = excluded.metadata,
                    updated_at = excluded.updated_at
            `).bind(
                skillId,
                skill.name,
                skill.namespace || null,
                skill.description || '',
                skill.category || 'general',
                (() => {
                    const allTags = [
                        ...(Array.isArray(skill.tags) ? skill.tags : []),
                        ...(Array.isArray(skill.keywords) ? skill.keywords : []),
                        ...(Array.isArray(skill.skills) ? skill.skills : [])
                    ];
                    // Defensive map to handle if items are strings or objects with names
                    const cleanTags = allTags.map(t => {
                        if (typeof t === 'string') return t;
                        if (typeof t === 'object' && t !== null && 'name' in t) return t.name;
                        return null;
                    }).filter((start) => start && typeof start === 'string');
                    return JSON.stringify([...new Set(cleanTags)]);
                })(),
                authorName,
                skill.version || '1.0.0',
                skill.license || null,
                githubUrl,
                githubOwner,
                githubRepo,
                skill.github_stars || skill.stars || 0,
                skill.downloads || skill.install_count || skill.installs || 0,
                importSource,
                platform,
                skill.stars || 0,
                skill.downloads || 0,
                JSON.stringify(skill.metadata || {}),
                skill.createdAt || skill.created_at || new Date().toISOString(),
                skill.updatedAt || skill.updated_at || new Date().toISOString(),
                skill.verified ? 1 : 0
            ).run()

            imported++
        } catch (error) {
            console.error('Import error for skill:', skill.id, error)
            errors++
        }
    }

    return c.json({ imported, errors, total: skillsToImport.length })
})

// ================== EXPORT SKILLS (ADMIN) ==================
app.get('/api/admin/export', async (c) => {
    try {
        const db = drizzle(c.env.DB)
        const allSkills = await db.select().from(skills).all()
        return c.json(allSkills)
    } catch (error) {
        console.error('Export error:', error)
        return c.json({ error: 'Failed to export skills' }, 500)
    }
})

// ================== DELETE SKILL ==================
app.delete('/api/admin/skills/:id', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')

    try {
        await db.delete(skills).where(eq(skills.id, id))
        return c.json({ success: true, message: 'Skill deleted' })
    } catch (error) {
        console.error('Delete error:', error)
        return c.json({ error: 'Failed to delete skill' }, 500)
    }
})

// ================== UPDATE SKILL ==================
app.patch('/api/admin/skills/:id', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')
    const body = await c.req.json()

    try {
        await c.env.DB.prepare(`
            UPDATE skills SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                is_featured = COALESCE(?, is_featured),
                updated_at = datetime('now')
            WHERE id = ?
        `).bind(
            body.name || null,
            body.description || null,
            body.category || null,
            body.is_featured !== undefined ? body.is_featured : null,
            id
        ).run()

        return c.json({ success: true, message: 'Skill updated' })
    } catch (error) {
        console.error('Update error:', error)
        return c.json({ error: 'Failed to update skill' }, 500)
    }
})

export default app
