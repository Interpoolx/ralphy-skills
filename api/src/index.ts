import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { drizzle } from 'drizzle-orm/d1'
import { skills, installs, categories, skillSubmissions, NewSkillSubmission, prds, prdCategories } from './db/schema'
import { eq, like, desc, asc, sql, or } from 'drizzle-orm'
import { z } from 'zod'
import { extractSkillFromGithub } from './utils/github'

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
    const status = c.req.query('status')
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
        if (status) {
            whereClause.push("status = ?")
            params.push(status)
        } else {
            whereClause.push("status = 'published'")
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
                WHERE ${whereClause.join(' AND ')}
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
        const skill = await db.select().from(skills)
            .where(sql`${skills.id} = ${id} AND ${skills.status} = 'published'`)
            .get()

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
            SELECT * FROM skills WHERE is_featured = 1 AND status = 'published' ORDER BY install_count DESC LIMIT 10
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

// ================== SKILL SUBMISSIONS ==================

// SUBMIT// CREATE SUBMISSION
app.post('/api/submissions', async (c) => {
    const db = drizzle(c.env.DB)
    const body = await c.req.json<NewSkillSubmission>()

    // Simple validation
    const submissionSchema = z.object({
        githubUrl: z.string().url().refine(url => url.includes('github.com'), "Must be a GitHub URL"),
        submitterName: z.string().optional(),
        submitterEmail: z.string().email().optional().or(z.literal('')),
    })

    const result = submissionSchema.safeParse(body)
    if (!result.success) {
        return c.json({ error: result.error.flatten() }, 400)
    }

    // Capture IP and User Agent
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'unknown'
    const ua = c.req.header('User-Agent') || 'unknown'

    try {
        // 1. Check for duplicates (by URL)
        const existingSkill = await db.select().from(skills)
            .where(eq(skills.githubUrl, result.data.githubUrl))
            .get();

        if (existingSkill) {
            return c.json({
                error: 'This skill repository has already been submitted or is already in our directory.'
            }, 400);
        }

        // 2. Extract metadata from GitHub - now strictly validates existence
        let extracted;
        try {
            extracted = await extractSkillFromGithub(result.data.githubUrl, c.env.GITHUB_TOKEN);
        } catch (err) {
            return c.json({
                error: err instanceof Error ? err.message : 'Invalid GitHub URL or repository not found'
            }, 400);
        }

        const skillId = extracted.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || crypto.randomUUID();

        // 3. Check for duplicates (by ID - secondary check)
        const existingById = await db.select().from(skills).where(eq(skills.id, skillId)).get();
        if (existingById) {
            return c.json({
                error: `A skill with the name "${extracted.name}" already exists. If this is a different skill, please ensure the name in SKILL.md is unique.`
            }, 400);
        }

        const skillData = {
            id: skillId,
            name: extracted.name || 'New Skill',
            description: extracted.description || 'Description pending...',
            githubUrl: result.data.githubUrl,
            githubOwner: extracted.githubOwner || null,
            githubRepo: extracted.githubRepo || null,
            author: extracted.author || result.data.submitterName || 'Community',
            version: extracted.version || '1.0.0',
            license: extracted.license || null,
            tags: JSON.stringify(extracted.tags || []),
            status: 'pending',
            submitterName: result.data.submitterName,
            submitterEmail: result.data.submitterEmail,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // We still save to skillSubmissions for backward compat if needed, 
        // but now we also create a 'pending' skill record
        const submission = {
            id: crypto.randomUUID(),
            githubUrl: result.data.githubUrl,
            submitterName: result.data.submitterName,
            submitterEmail: result.data.submitterEmail,
            submittedAt: new Date().toISOString(),
            status: 'pending',
            submitterIp: ip,
            userAgent: ua
        }

        await db.batch([
            db.insert(skills).values(skillData as any).onConflictDoNothing(),
            db.insert(skillSubmissions).values(submission)
        ]);

        return c.json({ success: true, id: submission.id, skillId })
    } catch (error) {
        console.error('Submission error:', error);
        return c.json({ error: 'Failed to create submission' }, 500)
    }
})

// ADMIN: GET SUBMISSIONS
app.get('/api/admin/submissions', async (c) => {
    const db = drizzle(c.env.DB)
    // sort by submittedAt desc
    const results = await db.select().from(skillSubmissions).orderBy(desc(skillSubmissions.submittedAt)).all()
    return c.json(results)
})

// ADMIN: DELETE SUBMISSION
app.delete('/api/admin/submissions/:id', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')

    try {
        await db.delete(skillSubmissions).where(eq(skillSubmissions.id, id))
        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to delete submission' }, 500)
    }
})
// REJECT SUBMISSION (Admin)
app.post('/api/admin/submissions/:id/reject', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const notes = body.notes || ''

    try {
        await db.update(skillSubmissions)
            .set({ status: 'rejected', reviewNotes: notes })
            .where(eq(skillSubmissions.id, id))

        return c.json({ success: true, message: 'Submission rejected' })
    } catch (error) {
        return c.json({ error: 'Failed to reject submission' }, 500)
    }
})

// APPROVE SUBMISSION (Admin)
app.post('/api/admin/submissions/:id/approve', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')

    try {
        // 1. Get submission
        const submission = await db.select().from(skillSubmissions).where(eq(skillSubmissions.id, id)).get()
        if (!submission) return c.json({ error: 'Submission not found' }, 404)

        if (submission.status === 'approved') {
            return c.json({ success: true, message: 'Already approved' })
        }

        // 2. Parse GitHub URL for basic info (or use Overrides)
        const body = await c.req.json().catch(() => ({}))
        const githubUrl = submission.githubUrl

        let repo = 'unknown'
        let owner = 'unknown'

        // Use overrides if provided, otherwise parse
        if (body.name) {
            repo = body.name
        } else {
            const githubMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
            owner = githubMatch?.[1] || 'unknown'
            repo = githubMatch?.[2]?.replace(/\.git$/, '') || 'unknown'
        }

        if (!owner || owner === 'unknown') {
            const githubMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
            owner = githubMatch?.[1] || 'unknown'
        }

        const skillId = body.id || repo.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const namespace = body.namespace || `${owner}/${repo}`
        const category = body.category || 'general'

        // 3. Insert into Skills table (Best effort, Admin overrides applied)
        // We use raw SQL for simplicity with D1
        await c.env.DB.prepare(`
            INSERT INTO skills (id, name, namespace, description, category, tags, author, version, github_url, github_owner, github_repo, import_source, platform, created_at, updated_at, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                github_url = excluded.github_url,
                updated_at = datetime('now')
        `).bind(
            skillId,
            body.name || repo,
            namespace,
            `Submitted by ${submission.submitterName || 'community'}. Description pending.`,
            category,
            '[]', // Default tags
            submission.submitterName || owner, // Author
            '1.0.0',
            githubUrl,
            owner,
            repo,
            'submission',
            'global',
            new Date().toISOString(),
            new Date().toISOString(),
            0 // Verified? No
        ).run()

        // 4. Update Submission Status
        await db.update(skillSubmissions)
            .set({ status: 'approved' })
            .where(eq(skillSubmissions.id, id))

        return c.json({ success: true, message: 'Submission approved and added to Skills database.' })
    } catch (error) {
        console.error('Approve error:', error)
        return c.json({ error: 'Failed to approve submission' }, 500)
    }
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

// ================== BULK DELETE SKILLS ==================
app.post('/api/admin/skills/bulk-delete', async (c) => {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const ids = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: 'No IDs provided' }, 400)
    }

    try {
        await c.env.DB.prepare(`
            DELETE FROM skills WHERE id IN (${ids.map(() => '?').join(',')})
        `).bind(...ids).run()

        return c.json({ success: true, message: `${ids.length} skills deleted` })
    } catch (error) {
        console.error('Bulk delete error:', error)
        return c.json({ error: 'Failed to bulk delete skills' }, 500)
    }
})

// ================== GET ALL SKILL IDS ==================
app.get('/api/admin/skills/ids', async (c) => {
    const db = drizzle(c.env.DB)
    const allIds = await db.select({ id: skills.id }).from(skills).all()
    return c.json({ ids: allIds.map(s => s.id) })
})

// ================== VALIDATE SKILL URLS (CHUNKED) ==================
app.post('/api/admin/skills/validate', async (c) => {
    const db = drizzle(c.env.DB)
    const body = await c.req.json()
    const ids = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: 'No IDs provided' }, 400)
    }

    // Fetch only the requested skills
    const targets = await c.env.DB.prepare(`
        SELECT id, github_url, status FROM skills WHERE id IN (${ids.map(() => '?').join(',')})
    `).bind(...ids).all()

    let validCount = 0
    let invalidCount = 0

    for (const skill of targets.results as any[]) {
        try {
            const res = await fetch(skill.github_url, { method: 'HEAD' })
            const status = res.ok ? 'published' : 'invalid'

            if (status !== skill.status) {
                await db.update(skills).set({ status }).where(eq(skills.id, skill.id))
                if (status === 'invalid') invalidCount++
                else validCount++
            } else {
                if (status === 'published') validCount++
                else invalidCount++
            }
        } catch (error) {
            await db.update(skills).set({ status: 'invalid' }).where(eq(skills.id, skill.id))
            invalidCount++
        }
    }

    return c.json({ success: true, validCount, invalidCount })
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

// ================== PRD ENDPOINTS ==================

// LIST PRDs
app.get('/api/prds', async (c) => {
    const category = c.req.query('category')
    const search = c.req.query('q') || ''
    const sortBy = c.req.query('sort') || 'views'
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
    const page = parseInt(c.req.query('page') || '1')
    const offset = (page - 1) * limit

    try {
        let whereClause = [`status = 'published'`]
        let params: (string | number)[] = []

        if (category) {
            whereClause.push('category = ?')
            params.push(category)
        }

        if (search) {
            whereClause.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)')
            params.push(`%${search}%`, `%${search}%`, `%${search}%`)
        }

        const orderBy = sortBy === 'views' ? 'view_count DESC' :
            sortBy === 'likes' ? 'like_count DESC' :
                sortBy === 'recent' ? 'created_at DESC' :
                    sortBy === 'name' ? 'name ASC' : 'view_count DESC'

        const results = await c.env.DB.prepare(`
            SELECT * FROM prds WHERE ${whereClause.join(' AND ')}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `).bind(...params, limit, offset).all()

        const countResult = await c.env.DB.prepare(`
            SELECT COUNT(*) as total FROM prds WHERE ${whereClause.join(' AND ')}
        `).bind(...params).first<{ total: number }>()

        return c.json({
            prds: results.results,
            pagination: {
                page,
                limit,
                total: countResult?.total || 0,
                hasMore: offset + limit < (countResult?.total || 0)
            }
        })
    } catch (error) {
        console.error('PRDs list error:', error)
        return c.json({ error: 'Failed to list PRDs', prds: [] }, 500)
    }
})

// GET PRD CATEGORIES - MUST BE BEFORE :identifier route
app.get('/api/prds/categories', async (c) => {
    try {
        const categories = await c.env.DB.prepare(`
            SELECT pc.*, COUNT(p.id) as prd_count 
            FROM prd_categories pc
            LEFT JOIN prds p ON pc.id = p.category AND p.status = 'published'
            GROUP BY pc.id
            ORDER BY pc.name
        `).all()

        return c.json(categories.results)
    } catch (error) {
        console.error('PRD categories error:', error)
        return c.json({ error: 'Failed to get categories' }, 500)
    }
})

// GET PRD BY SLUG OR ID
app.get('/api/prds/:identifier', async (c) => {
    const identifier = c.req.param('identifier')

    try {
        const prd = await c.env.DB.prepare(`
            SELECT * FROM prds WHERE (slug = ? OR id = ?) AND status = 'published'
        `).bind(identifier, identifier).first()

        if (!prd) {
            return c.json({ error: 'PRD not found' }, 404)
        }

        return c.json(prd)
    } catch (error) {
        console.error('Get PRD error:', error)
        return c.json({ error: 'Failed to get PRD' }, 500)
    }
})

// INCREMENT VIEW COUNT
app.post('/api/prds/:identifier/view', async (c) => {
    const identifier = c.req.param('identifier')

    try {
        await c.env.DB.prepare(`
            UPDATE prds SET view_count = view_count + 1 WHERE slug = ? OR id = ?
        `).bind(identifier, identifier).run()

        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to track view' }, 500)
    }
})

// INCREMENT LIKE COUNT
app.post('/api/prds/:identifier/like', async (c) => {
    const identifier = c.req.param('identifier')

    try {
        await c.env.DB.prepare(`
            UPDATE prds SET like_count = like_count + 1 WHERE slug = ? OR id = ?
        `).bind(identifier, identifier).run()

        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to track like' }, 500)
    }
})

// INCREMENT DOWNLOAD COUNT
app.post('/api/prds/:identifier/download', async (c) => {
    const identifier = c.req.param('identifier')

    try {
        const prd = await c.env.DB.prepare(`
            SELECT file_path FROM prds WHERE slug = ? OR id = ?
        `).bind(identifier, identifier).first<{ file_path: string }>()

        if (!prd) {
            return c.json({ error: 'PRD not found' }, 404)
        }

        await c.env.DB.prepare(`
            UPDATE prds SET download_count = download_count + 1 WHERE slug = ? OR id = ?
        `).bind(identifier, identifier).run()

        return c.json({ success: true, filePath: prd.file_path })
    } catch (error) {
        return c.json({ error: 'Failed to track download' }, 500)
    }
})

// ADMIN: IMPORT PRDs
app.post('/api/admin/prds/import', async (c) => {
    const body = await c.req.json()
    const prdsToImport = body.prds || []

    if (!Array.isArray(prdsToImport)) {
        return c.json({ error: 'Invalid prds array' }, 400)
    }

    let imported = 0
    let errors = 0

    for (const prd of prdsToImport) {
        try {
            const slug = prd.slug || prd.name?.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || ''

            if (!slug || !prd.name || !prd.filePath) {
                console.log('Skipping PRD without required fields:', prd.name)
                errors++
                continue
            }

            await c.env.DB.prepare(`
                INSERT INTO prds (id, slug, name, description, category, tags, author, version, file_path, content, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    file_path = excluded.file_path,
                    content = excluded.content,
                    updated_at = datetime('now')
            `).bind(
                prd.id || crypto.randomUUID(),
                slug,
                prd.name,
                prd.description || '',
                prd.category || 'other',
                JSON.stringify(prd.tags || []),
                prd.author || 'Community',
                prd.version || '1.0.0',
                prd.filePath,
                prd.content || '', // New content field
                prd.createdAt || new Date().toISOString(),
                new Date().toISOString()
            ).run()

            imported++
        } catch (error) {
            console.error('Import PRD error:', prd.name, error)
            errors++
        }
    }

    return c.json({ imported, errors, total: prdsToImport.length })
})

// ADMIN: DELETE PRD
app.delete('/api/admin/prds/:id', async (c) => {
    const id = c.req.param('id')

    try {
        await c.env.DB.prepare('DELETE FROM prds WHERE id = ?').bind(id).run()
        return c.json({ success: true, message: 'PRD deleted' })
    } catch (error) {
        console.error('Delete PRD error:', error)
        return c.json({ error: 'Failed to delete PRD' }, 500)
    }
})

// ADMIN: BULK DELETE PRDs
app.post('/api/admin/prds/bulk-delete', async (c) => {
    const body = await c.req.json()
    const ids = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: 'No IDs provided' }, 400)
    }

    try {
        await c.env.DB.prepare(`
            DELETE FROM prds WHERE id IN (${ids.map(() => '?').join(',')})
        `).bind(...ids).run()

        return c.json({ success: true, message: `${ids.length} PRDs deleted` })
    } catch (error) {
        console.error('Bulk delete PRDs error:', error)
        return c.json({ error: 'Failed to bulk delete PRDs' }, 500)
    }
})

// ADMIN: GET PRD BY ID (for editor)
app.get('/api/admin/prds/:id', async (c) => {
    const id = c.req.param('id')
    try {
        const result = await c.env.DB.prepare('SELECT * FROM prds WHERE id = ?').bind(id).first()
        if (!result) return c.json({ error: 'PRD not found' }, 404)
        return c.json(result)
    } catch (error) {
        return c.json({ error: 'Failed to fetch PRD' }, 500)
    }
})

// ADMIN: UPDATE PRD
app.patch('/api/admin/prds/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()

    try {
        const results = await c.env.DB.prepare(`
            UPDATE prds SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                author = COALESCE(?, author),
                version = COALESCE(?, version),
                tags = COALESCE(?, tags),
                file_path = COALESCE(?, file_path),
                content = ?,
                status = COALESCE(?, status),
                updated_at = datetime('now')
            WHERE id = ? OR slug = ?
        `).bind(
            body.name || null,
            body.description || null,
            body.category || null,
            body.author || null,
            body.version || null,
            body.tags ? JSON.stringify(body.tags) : null,
            body.file_path || null,
            body.content !== undefined ? body.content : null, // Allow empty string update
            body.status || null,
            id,
            id // Bind id to both id and slug check
        ).run()

        if (results.meta.changes === 0) {
            // If it was a content-only update where content didn't change, changes implies 0
            // But we can check if the row exists
            const exists = await c.env.DB.prepare('SELECT 1 FROM prds WHERE id = ? OR slug = ?').bind(id, id).first()
            if (!exists) {
                return c.json({ error: 'PRD not found' }, 404)
            }
        }

        return c.json({ success: true, message: 'PRD updated' })
    } catch (error) {
        console.error('Update PRD error:', error)
        return c.json({ error: 'Failed to update PRD' }, 500)
    }
})

// ADMIN: GET ALL PRD IDS
app.get('/api/admin/prds/ids', async (c) => {
    try {
        const result = await c.env.DB.prepare('SELECT id FROM prds').all()
        return c.json({ ids: result.results.map((r: any) => r.id) })
    } catch (error) {
        return c.json({ error: 'Failed to get PRD IDs' }, 500)
    }
})

// ADMIN: SEARCH PRDs (for admin panel)
app.get('/api/admin/prds', async (c) => {
    const category = c.req.query('category') || ''
    const search = c.req.query('q') || ''
    const status = c.req.query('status') || ''
    const sortBy = c.req.query('sort') || 'views'
    const limit = Math.min(parseInt(c.req.query('limit') || '25'), 100)
    const page = parseInt(c.req.query('page') || '1')
    const offset = (page - 1) * limit

    try {
        let whereClause: string[] = []
        let params: (string | number)[] = []

        if (category) {
            whereClause.push('category = ?')
            params.push(category)
        }
        if (status) {
            whereClause.push('status = ?')
            params.push(status)
        }
        if (search) {
            whereClause.push('(name LIKE ? OR description LIKE ?)')
            params.push(`%${search}%`, `%${search}%`)
        }

        const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''
        const orderBy = sortBy === 'views' ? 'view_count DESC' :
            sortBy === 'likes' ? 'like_count DESC' :
                sortBy === 'recent' ? 'created_at DESC' :
                    sortBy === 'name' ? 'name ASC' : 'view_count DESC'

        const results = await c.env.DB.prepare(`
            SELECT * FROM prds ${whereSql}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `).bind(...params, limit, offset).all()

        const countResult = await c.env.DB.prepare(`
            SELECT COUNT(*) as total FROM prds ${whereSql}
        `).bind(...params).first<{ total: number }>()

        return c.json({
            prds: results.results,
            pagination: {
                page,
                limit,
                total: countResult?.total || 0,
                hasMore: offset + limit < (countResult?.total || 0)
            }
        })
    } catch (error) {
        console.error('Admin PRDs list error:', error)
        return c.json({ error: 'Failed to list PRDs', prds: [] }, 500)
    }
})

// ADMIN: GET ALL PRD CATEGORIES
app.get('/api/admin/prds/categories', async (c) => {
    const db = drizzle(c.env.DB)
    try {
        const results = await db.select().from(prdCategories).all()
        return c.json(results)
    } catch (error) {
        return c.json({ error: 'Failed to fetch PRD categories' }, 500)
    }
})

// ADMIN: CREATE PRD CATEGORY
app.post('/api/admin/prds/categories', async (c) => {
    const db = drizzle(c.env.DB)
    try {
        const body = await c.req.json()
        const id = body.id || body.name.toLowerCase().replace(/\s+/g, '-')

        await db.insert(prdCategories).values({
            id,
            name: body.name,
            description: body.description || '',
            icon: body.icon || 'DocumentTextIcon',
            prdCount: 0
        })

        return c.json({ success: true, id })
    } catch (error) {
        return c.json({ error: 'Failed to create PRD category' }, 500)
    }
})

// ADMIN: UPDATE PRD CATEGORY
app.patch('/api/admin/prds/categories/:id', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')
    try {
        const body = await c.req.json()
        await db.update(prdCategories)
            .set({
                name: body.name,
                description: body.description,
                icon: body.icon,
            })
            .where(eq(prdCategories.id, id))

        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to update PRD category' }, 500)
    }
})

// ADMIN: DELETE PRD CATEGORY
app.delete('/api/admin/prds/categories/:id', async (c) => {
    const db = drizzle(c.env.DB)
    const id = c.req.param('id')
    try {
        await db.delete(prdCategories).where(eq(prdCategories.id, id))
        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to delete PRD category' }, 500)
    }
})

export default app
