export interface ExtractedSkill {
    name: string;
    description: string;
    author: string;
    version: string;
    license: string;
    tags: string[];
    githubOwner: string;
    githubRepo: string;
    githubUrl: string;
}

export async function extractSkillFromGithub(url: string, githubToken?: string): Promise<Partial<ExtractedSkill>> {
    try {
        const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)\/(.*))?/);
        if (!githubMatch) {
            throw new Error('Invalid GitHub URL');
        }

        const owner = githubMatch[1];
        const repo = githubMatch[2].replace(/\.git$/, '');
        const branch = githubMatch[3] || 'main';
        const path = githubMatch[4] || '';

        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Ralphy-Skills-Extractor'
        };

        if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`;
        }

        const baseRawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path ? path + '/' : ''}`;

        // 1. Try SKILL.md (our standard)
        const skillMdResponse = await fetch(`${baseRawUrl}SKILL.md`);
        if (skillMdResponse.ok) {
            const content = await skillMdResponse.text();
            return parseSkillMd(content, owner, repo, url);
        }

        // 2. Try package.json
        const pkgJsonResponse = await fetch(`${baseRawUrl}package.json`);
        if (pkgJsonResponse.ok) {
            const pkg = await pkgJsonResponse.json() as any;
            return {
                name: pkg.name || repo,
                description: pkg.description || '',
                author: typeof pkg.author === 'string' ? pkg.author : pkg.author?.name || owner,
                version: pkg.version || '1.0.0',
                license: pkg.license || '',
                tags: pkg.keywords || [],
                githubOwner: owner,
                githubRepo: repo,
                githubUrl: url
            };
        }

        // 3. Fallback to Repo Info via API
        const apiResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (apiResponse.ok) {
            const repoInfo = await apiResponse.json() as any;
            return {
                name: repo,
                description: repoInfo.description || '',
                author: owner,
                githubOwner: owner,
                githubRepo: repo,
                githubUrl: url
            };
        } else if (apiResponse.status === 404) {
            throw new Error(`GitHub repository not found: ${owner}/${repo}`);
        }

        throw new Error(`Failed to validate GitHub URL: ${apiResponse.statusText}`);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            throw error;
        }
        console.error('Extraction error:', error);
        throw new Error('Could not validate GitHub repository. Please check the URL.');
    }
}

function parseSkillMd(content: string, owner: string, repo: string, url: string): Partial<ExtractedSkill> {
    const result: Partial<ExtractedSkill> = {
        githubOwner: owner,
        githubRepo: repo,
        githubUrl: url,
        tags: []
    };

    // Very basic regex-based parser for SKILL.md
    // In a real scenario, we might use a markdown parser + frontmatter parser
    const nameMatch = content.match(/^#\s+(.+)$/m);
    if (nameMatch) result.name = nameMatch[1].trim();

    const descMatch = content.match(/^#\s+.+\n+([\s\S]+?)(?:\n\n|\n#|$)/);
    if (descMatch) result.description = descMatch[1].trim().split('\n')[0];

    return result;
}
