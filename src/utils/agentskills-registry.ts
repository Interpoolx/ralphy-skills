import * as https from 'https';
import * as http from 'http';

/**
 * AgentSkills.io Registry Integration
 * Provides access to 2000+ skills from the agentskills.io ecosystem
 */

export interface AgentSkillStat {
    stars: number;
    installs: number;
    forks?: number;
}

export interface AgentSkillAuthor {
    name: string;
    username: string;
    avatar?: string;
}

export interface AgentSkill {
    id: string;
    name: string;
    slug: string;
    description: string;
    owner: string;
    repository: string;
    path: string;
    stats: AgentSkillStat;
    author: AgentSkillAuthor;
    tags: string[];
    clients: string[];
    createdAt: string;
    updatedAt: string;
}

export interface SearchResult {
    skills: AgentSkill[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// Known agentskills.io compatible registries
const REGISTRIES = [
    'https://agentskills.io/api/skills',
    'https://claude-plugins.dev/api/skills',
    'https://raw.githubusercontent.com/anthropics/agent-skills/main/registry.json'
];

/**
 * Search for skills in the agentskills.io registry
 */
export async function searchAgentSkillsRegistry(
    query: string,
    options: {
        page?: number;
        pageSize?: number;
        sortBy?: 'relevance' | 'stars' | 'installs' | 'updated';
        client?: string;
    } = {}
): Promise<SearchResult> {
    const { page = 1, pageSize = 20, sortBy = 'relevance', client } = options;

    // Try to fetch from agentskills.io API
    try {
        const url = new URL('https://agentskills.io/api/skills/search');
        url.searchParams.set('q', query);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', pageSize.toString());
        url.searchParams.set('sort', sortBy);
        if (client) url.searchParams.set('client', client);

        const response = await fetchJSON<SearchResult>(url.toString());
        return response;
    } catch (err) {
        // Fallback to GitHub-based registry simulation
        return await searchGitHubFallback(query, options);
    }
}

/**
 * Fallback search using GitHub API when agentskills.io is unavailable
 */
async function searchGitHubFallback(
    query: string,
    options: { page?: number; pageSize?: number; sortBy?: string } = {}
): Promise<SearchResult> {
    const { page = 1, pageSize = 20 } = options;

    try {
        // Search GitHub for repos with "agent-skills" or "agentskills" topic
        const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+topic:agent-skills&sort=stars&per_page=${pageSize}&page=${page}`;

        const response = await fetchJSON<{
            total_count: number;
            items: Array<{
                full_name: string;
                name: string;
                description: string;
                owner: { login: string; avatar_url: string };
                stargazers_count: number;
                forks_count: number;
                html_url: string;
                topics: string[];
                updated_at: string;
                created_at: string;
            }>;
        }>(searchUrl);

        const skills: AgentSkill[] = response.items.map(repo => ({
            id: repo.full_name,
            name: repo.name,
            slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: repo.description || '',
            owner: repo.owner.login,
            repository: repo.html_url,
            path: '',
            stats: {
                stars: repo.stargazers_count,
                installs: Math.floor(repo.stargazers_count * 0.3), // Estimate
                forks: repo.forks_count
            },
            author: {
                name: repo.owner.login,
                username: repo.owner.login,
                avatar: repo.owner.avatar_url
            },
            tags: repo.topics || [],
            clients: ['claude-code', 'cursor', 'copilot'], // Default clients
            createdAt: repo.created_at,
            updatedAt: repo.updated_at
        }));

        return {
            skills,
            total: response.total_count,
            page,
            pageSize,
            hasMore: response.total_count > page * pageSize
        };
    } catch (err) {
        // Return empty result on error
        return {
            skills: [],
            total: 0,
            page: 1,
            pageSize: 20,
            hasMore: false
        };
    }
}

/**
 * Get skill details from agentskills.io
 */
export async function getAgentSkillDetails(skillId: string): Promise<AgentSkill | null> {
    try {
        const url = `https://agentskills.io/api/skills/${encodeURIComponent(skillId)}`;
        return await fetchJSON<AgentSkill>(url);
    } catch (err) {
        return null;
    }
}

/**
 * Get popular/featured skills
 */
export async function getFeaturedSkills(limit = 10): Promise<AgentSkill[]> {
    try {
        const result = await searchAgentSkillsRegistry('', {
            pageSize: limit,
            sortBy: 'installs'
        });
        return result.skills;
    } catch (err) {
        return [];
    }
}

/**
 * Parse @owner/repo/path skill format
 */
export function parseSkillReference(ref: string): {
    owner: string;
    repo: string;
    path: string;
    isAgentSkillFormat: boolean;
} | null {
    // Format: @owner/repo/path or owner/repo/path
    const normalized = ref.startsWith('@') ? ref.slice(1) : ref;
    const parts = normalized.split('/');

    if (parts.length >= 2) {
        return {
            owner: parts[0],
            repo: parts[1],
            path: parts.slice(2).join('/'),
            isAgentSkillFormat: ref.startsWith('@')
        };
    }

    return null;
}

/**
 * Convert skill reference to GitHub URL
 */
export function skillRefToGitHubUrl(ref: string): string | null {
    const parsed = parseSkillReference(ref);
    if (!parsed) return null;

    const path = parsed.path ? `/tree/main/${parsed.path}` : '';
    return `https://github.com/${parsed.owner}/${parsed.repo}${path}`;
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

/**
 * Fetch JSON from URL with timeout
 */
async function fetchJSON<T>(url: string, timeout = 10000): Promise<T> {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;

        const req = client.get(url, {
            headers: {
                'User-Agent': 'ralphy-skills/2.2.0',
                'Accept': 'application/json'
            },
            timeout
        }, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}
