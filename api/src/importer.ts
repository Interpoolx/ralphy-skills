/**
 * Skill Importer - Fetches skills from external registries and imports to our D1 database
 * Run this as a cron job or manually to sync skills
 */

const EXTERNAL_APIS = {
    claudePlugins: 'https://api.claude-plugins.dev/api/skills',
    marketplace: 'https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/marketplace.json'
}

interface ExternalSkill {
    id?: string
    name: string
    description: string
    category?: string
    tags?: string[]
    author?: string
    version?: string
    url?: string
    sourceUrl?: string
    github_url?: string
}

interface Env {
    DB: D1Database
    GITHUB_TOKEN?: string
}

// Fetch skills from our own marketplace.json
async function fetchMarketplaceSkills(): Promise<ExternalSkill[]> {
    try {
        const response = await fetch(EXTERNAL_APIS.marketplace)
        if (!response.ok) throw new Error('Failed to fetch marketplace')

        const data = await response.json() as { skills: ExternalSkill[] }
        console.log(`Fetched ${data.skills?.length || 0} skills from marketplace.json`)

        return data.skills || []
    } catch (error) {
        console.error('Error fetching marketplace:', error)
        return []
    }
}

// Fetch skills from claude-plugins API
async function fetchClaudePluginsSkills(): Promise<ExternalSkill[]> {
    try {
        // Try to fetch all skills with pagination
        const allSkills: ExternalSkill[] = []
        let page = 1
        const limit = 100

        while (true) {
            const response = await fetch(
                `${EXTERNAL_APIS.claudePlugins}?page=${page}&limit=${limit}`
            )

            if (!response.ok) break

            const data = await response.json() as { skills: ExternalSkill[], pagination: { hasMore: boolean } }

            if (!data.skills || data.skills.length === 0) break

            allSkills.push(...data.skills)

            if (!data.pagination?.hasMore) break

            page++
        }

        console.log(`Fetched ${allSkills.length} skills from claude-plugins API`)
        return allSkills
    } catch (error) {
        console.error('Error fetching claude-plugins:', error)
        return []
    }
}

// Search GitHub for SKILL.md files
async function searchGitHubSkills(token?: string): Promise<ExternalSkill[]> {
    if (!token) {
        console.log('No GitHub token, skipping GitHub search')
        return []
    }

    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Ralphy-Skills-Indexer'
        }

        const skills: ExternalSkill[] = []
        const searchQueries = [
            'path:skills/ filename:SKILL.md',
            'path:.agent/skills/ filename:SKILL.md',
            'filename:SKILL.md extension:md'
        ]

        for (const query of searchQueries) {
            try {
                const response = await fetch(
                    `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=100`,
                    { headers }
                )

                if (!response.ok) continue

                const data = await response.json() as { items: Array<{ repository: { full_name: string, html_url: string, stargazers_count: number, owner: { login: string } }, path: string, name: string }> }

                for (const item of data.items || []) {
                    const skillName = item.path.split('/').slice(-2, -1)[0] || 'unknown'
                    skills.push({
                        id: `${item.repository.full_name}/${skillName}`.replace('/', '-').toLowerCase(),
                        name: skillName,
                        description: `Skill from ${item.repository.full_name}`,
                        author: item.repository.owner.login,
                        url: `${item.repository.html_url}/tree/main/${item.path.replace('/SKILL.md', '')}`,
                    })
                }

                // Rate limit: wait 2 seconds between requests
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
                console.error('GitHub search error for query:', query, error)
            }
        }

        console.log(`Found ${skills.length} skills from GitHub search`)
        return skills
    } catch (error) {
        console.error('Error searching GitHub:', error)
        return []
    }
}

// Merge and dedupe skills
function mergeSkills(skillSets: ExternalSkill[][]): ExternalSkill[] {
    const skillMap = new Map<string, ExternalSkill>()

    for (const skills of skillSets) {
        for (const skill of skills) {
            const id = skill.id || skill.name.toLowerCase().replace(/\s+/g, '-')

            // Prefer skills with more data
            const existing = skillMap.get(id)
            if (!existing || (skill.description?.length || 0) > (existing.description?.length || 0)) {
                skillMap.set(id, {
                    ...skill,
                    id
                })
            }
        }
    }

    return Array.from(skillMap.values())
}

// Import skills to D1 database
async function importToD1(skills: ExternalSkill[], db: D1Database): Promise<{ imported: number, errors: number }> {
    let imported = 0
    let errors = 0

    for (const skill of skills) {
        try {
            const id = skill.id || skill.name.toLowerCase().replace(/\s+/g, '-')
            const githubUrl = skill.url || skill.sourceUrl || skill.github_url || ''

            // Parse GitHub owner/repo from URL
            const githubMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
            const githubOwner = githubMatch?.[1] || null
            const githubRepo = githubMatch?.[2] || null

            await db.prepare(`
                INSERT INTO skills (id, name, description, category, tags, author, version, github_url, github_owner, github_repo, created_at, updated_at, indexed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    updated_at = datetime('now')
            `).bind(
                id,
                skill.name,
                skill.description || '',
                skill.category || 'general',
                JSON.stringify(skill.tags || []),
                skill.author || null,
                skill.version || '1.0.0',
                githubUrl,
                githubOwner,
                githubRepo
            ).run()

            imported++
        } catch (error) {
            console.error('Import error for skill:', skill.name, error)
            errors++
        }
    }

    return { imported, errors }
}

// Main import function (call from scheduled worker or endpoint)
export async function runImport(env: Env): Promise<{ total: number, imported: number, errors: number }> {
    console.log('Starting skill import...')

    // Fetch from all sources
    const [marketplaceSkills, claudePluginsSkills, githubSkills] = await Promise.all([
        fetchMarketplaceSkills(),
        fetchClaudePluginsSkills(),
        searchGitHubSkills(env.GITHUB_TOKEN)
    ])

    // Merge and dedupe
    const allSkills = mergeSkills([marketplaceSkills, claudePluginsSkills, githubSkills])
    console.log(`Total unique skills to import: ${allSkills.length}`)

    // Import to D1
    const { imported, errors } = await importToD1(allSkills, env.DB)

    console.log(`Import complete: ${imported} imported, ${errors} errors`)

    return { total: allSkills.length, imported, errors }
}

// Export for use in scheduled handler
export default {
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        ctx.waitUntil(runImport(env))
    }
}
