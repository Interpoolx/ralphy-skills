import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { getInstalledSkillsMetadata, getRegistry } from '../utils/registry';

interface SkillData {
    id: string;
    name: string;
    description: string;
    category?: string;
    tags?: string[];
    author?: any;
    location?: string;
    version?: string;
}

export async function startApiServer(port: number = 3000) {
    const server = http.createServer(async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const url = new URL(req.url || '/', `http://localhost:${port}`);
        const pathname = url.pathname;

        try {
            if (pathname === '/api/skills') {
                const skills = await getApiSkills();
                res.writeHead(200);
                res.end(JSON.stringify({ skills, total: skills.length }));
            } else if (pathname.startsWith('/api/skills/')) {
                const skillId = pathname.split('/')[3];
                const skill = await getSkillById(skillId);
                if (skill) {
                    res.writeHead(200);
                    res.end(JSON.stringify(skill));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Skill not found' }));
                }
            } else if (pathname === '/api/registry') {
                const registry = await getRegistrySkills();
                res.writeHead(200);
                res.end(JSON.stringify(registry));
            } else if (pathname === '/api/search') {
                const query = url.searchParams.get('q') || '';
                const category = url.searchParams.get('category');
                const results = await searchSkillsApi(query, category);
                res.writeHead(200);
                res.end(JSON.stringify({ results, total: results.length }));
            } else if (pathname === '/api/stats') {
                const stats = await getStats();
                res.writeHead(200);
                res.end(JSON.stringify(stats));
            } else if (pathname === '/' || pathname === '/skills') {
                const html = getWebInterface();
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end(html);
            } else if (pathname.startsWith('/skill/')) {
                const slug = pathname.split('/')[2];
                const html = await getSkillDetailPage(slug);
                if (html) {
                    res.setHeader('Content-Type', 'text/html');
                    res.writeHead(200);
                    res.end(html);
                } else {
                    res.writeHead(404);
                    res.setHeader('Content-Type', 'text/html');
                    res.end(get404Page());
                }
            } else {
                res.writeHead(404);
                res.setHeader('Content-Type', 'text/html');
                res.end(get404Page());
            }
        } catch (error) {
            console.error('API Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });

    server.listen(port, () => {
        console.log(`\n🌐 Ralphy Skills API Server running at http://localhost:${port}`);
        console.log(`📊 API Endpoints:`);
        console.log(`   GET  /api/skills         - List all installed skills`);
        console.log(`   GET  /api/skills/:id     - Get skill details`);
        console.log(`   GET  /api/registry       - List registry skills`);
        console.log(`   GET  /api/search?q=...   - Search skills`);
        console.log(`   GET  /api/stats          - Get statistics`);
        console.log(`\n🎨 Web Interface:`);
        console.log(`   GET  /skills             - Browse all skills`);
        console.log(`   GET  /skill/:slug        - View skill details (SEO-friendly URLs)`);
        console.log(`   GET  /                   - Redirect to /skills\n`);
    });

    return server;
}

async function getApiSkills(): Promise<SkillData[]> {
    const installedSkills = getInstalledSkillsMetadata();
    return installedSkills.map((skill: any) => ({
        id: skill.id || skill.name,
        name: skill.name,
        description: skill.description || '',
        category: skill.category,
        tags: skill.tags || [],
        author: skill.author,
        location: skill.source,
        version: skill.version
    }));
}

async function getSkillById(id: string): Promise<SkillData | null> {
    const skills = await getApiSkills();
    return skills.find(s => s.id === id) || null;
}

async function getRegistrySkills(): Promise<any> {
    const marketplacePath = path.join(__dirname, '../../marketplace.json');
    if (fs.existsSync(marketplacePath)) {
        const content = fs.readFileSync(marketplacePath, 'utf-8');
        return JSON.parse(content);
    }
    return { skills: [] };
}

async function searchSkillsApi(query: string, category: string | null): Promise<SkillData[]> {
    const skills = await getApiSkills();
    return skills.filter(skill => {
        const matchesQuery = !query || 
            skill.name.toLowerCase().includes(query.toLowerCase()) ||
            skill.description.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = !category || skill.category === category;
        return matchesQuery && matchesCategory;
    });
}

async function getStats(): Promise<any> {
    const skills = await getApiSkills();
    const registry = await getRegistrySkills();

    const categories = skills.reduce((acc: any, skill) => {
        const cat = skill.category || 'uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    return {
        installed: skills.length,
        registry_total: registry.skills?.length || 0,
        categories,
        last_updated: new Date().toISOString()
    };
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function findSkillBySlug(slug: string): SkillData | null {
    const skills = getInstalledSkillsMetadata();
    return skills.find((skill: any) => {
        const skillSlug = generateSlug(skill.name || skill.id || '');
        return skillSlug === slug;
    }) || null;
}

async function getSkillDetailPage(slug: string): Promise<string | null> {
    const skill = findSkillBySlug(slug);
    if (!skill) return null;

    const skillSlug = generateSlug(skill.name || skill.id || '');
    const installCommand = `npx ralphy-skills install ${skill.id || skill.name}`;
    const lastUpdated = new Date().toISOString().split('T')[0];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${skill.name} - Ralphy Skills</title>
    <meta name="description" content="${skill.description || ''}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .breadcrumbs {
            background: rgba(255, 255, 255, 0.95);
            padding: 12px 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.95em;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .breadcrumbs a {
            color: #667eea;
            text-decoration: none;
            transition: color 0.3s;
        }
        .breadcrumbs a:hover {
            color: #764ba2;
        }
        .breadcrumbs .separator {
            color: #999;
        }
        .breadcrumbs .current {
            color: #333;
            font-weight: 500;
        }
        .skill-detail {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        .skill-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .skill-name {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
        }
        .skill-description {
            font-size: 1.15em;
            line-height: 1.7;
            color: #555;
            margin-bottom: 20px;
        }
        .skill-meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .meta-item {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 10px;
        }
        .meta-label {
            font-size: 0.85em;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .meta-value {
            font-size: 1.1em;
            color: #333;
            font-weight: 500;
        }
        .tags-section {
            margin-bottom: 30px;
        }
        .tags-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
        }
        .tags {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .tag {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        .category-tag {
            background: #764ba2;
        }
        .install-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px;
            border-radius: 15px;
            color: white;
        }
        .install-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .install-command {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
        }
        .copy-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.9em;
            transition: all 0.3s;
        }
        .copy-btn:hover {
            background: #f0f0f0;
            transform: translateY(-2px);
        }
        .back-link {
            display: inline-block;
            margin-top: 30px;
            color: white;
            text-decoration: none;
            font-size: 1.1em;
            padding: 12px 25px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            transition: all 0.3s;
        }
        .back-link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .github-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #667eea;
            text-decoration: none;
            font-size: 1em;
            margin-top: 10px;
        }
        .github-link:hover {
            color: #764ba2;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumbs">
            <a href="/">Home</a>
            <span class="separator">/</span>
            <a href="/skills">Skills</a>
            <span class="separator">/</span>
            <span class="current">${skill.name}</span>
        </nav>

        <div class="skill-detail">
            <div class="skill-header">
                <h1 class="skill-name">${skill.name}</h1>
                <p class="skill-description">${skill.description || 'No description available'}</p>
            </div>

            <div class="skill-meta-grid">
                <div class="meta-item">
                    <div class="meta-label">Version</div>
                    <div class="meta-value">${skill.version || 'N/A'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Author</div>
                    <div class="meta-value">${skill.author || 'Unknown'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Last Updated</div>
                    <div class="meta-value">${lastUpdated}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Location</div>
                    <div class="meta-value">${skill.location || 'Local'}</div>
                </div>
            </div>

            ${skill.tags && skill.tags.length > 0 ? `
            <div class="tags-section">
                <div class="tags-label">Tags & Categories</div>
                <div class="tags">
                    ${skill.category ? `<span class="tag category-tag">${skill.category}</span>` : ''}
                    ${(skill.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            ${skill.location ? `
            <div style="margin-bottom: 30px;">
                <div class="meta-label">Source</div>
                <a href="${skill.location}" target="_blank" class="github-link">
                    🔗 ${skill.location}
                </a>
            </div>
            ` : ''}

            <div class="install-section">
                <div class="install-title">🚀 Install this Skill</div>
                <div class="install-command">
                    <code>${installCommand}</code>
                    <button class="copy-btn" onclick="copyCommand('${installCommand}')">Copy</button>
                </div>
            </div>
        </div>

        <a href="/skills" class="back-link">← Back to All Skills</a>
    </div>

    <script>
        function copyCommand(command) {
            navigator.clipboard.writeText(command).then(() => {
                const btn = event.target;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }
    </script>
</body>
</html>`;
}

function get404Page(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | Ralphy Skills</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            color: white;
        }
        h1 {
            font-size: 8em;
            margin-bottom: 20px;
            text-shadow: 4px 4px 8px rgba(0,0,0,0.2);
        }
        h2 {
            font-size: 2em;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.2em;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        a {
            display: inline-block;
            color: white;
            text-decoration: none;
            font-size: 1.1em;
            padding: 15px 30px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 30px;
            transition: all 0.3s;
        }
        a:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The skill you're looking for doesn't exist or has been removed.</p>
        <a href="/skills">← Back to Skills</a>
    </div>
</body>
</html>`;
}

function getWebInterface(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ralphy Skills - Universal AI Skills Marketplace</title>
    <meta name="description" content="Browse and discover AI skills for coding agents. Install skills to enhance your AI development workflow.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .search-box {
            background: white;
            border-radius: 50px;
            padding: 15px 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
        }
        .search-box input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 1.1em;
            padding: 5px;
        }
        .search-box button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            margin-left: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .skill-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
            cursor: pointer;
        }
        .skill-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .skill-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .skill-description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .skill-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .tag {
            background: #f0f0f0;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            color: #555;
        }
        .category-tag {
            background: #667eea;
            color: white;
        }
        .loading {
            text-align: center;
            color: white;
            font-size: 1.5em;
            padding: 50px;
        }
        .empty {
            text-align: center;
            color: white;
            padding: 50px;
            font-size: 1.2em;
        }
        .filters {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .filter-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 8px 16px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .filter-btn.active {
            background: #667eea;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Ralphy Skills</h1>
            <p class="subtitle">Universal Skills Marketplace for AI Coding Agents</p>
        </header>

        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search skills..." />
            <button onclick="searchSkills()">Search</button>
        </div>

        <div class="stats" id="stats">
            <div class="stat-card">
                <div class="stat-number" id="installedCount">-</div>
                <div class="stat-label">Installed Skills</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="registryCount">-</div>
                <div class="stat-label">Registry Skills</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="categoryCount">-</div>
                <div class="stat-label">Categories</div>
            </div>
        </div>

        <div class="filters">
            <div class="filter-group" id="categoryFilters"></div>
        </div>

        <div class="skills-grid" id="skillsGrid">
            <div class="loading">Loading skills...</div>
        </div>
    </div>

    <script>
        let allSkills = [];
        let currentCategory = null;

        async function loadSkills() {
            try {
                const response = await fetch('/api/skills');
                const data = await response.json();
                allSkills = data.skills;
                displaySkills(allSkills);
                loadStats();
                setupFilters();
            } catch (error) {
                document.getElementById('skillsGrid').innerHTML = 
                    '<div class="empty">Failed to load skills</div>';
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                document.getElementById('installedCount').textContent = stats.installed;
                document.getElementById('registryCount').textContent = stats.registry_total;
                document.getElementById('categoryCount').textContent = 
                    Object.keys(stats.categories).length;
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        function setupFilters() {
            const categories = [...new Set(allSkills.map(s => s.category).filter(Boolean))];
            const filtersDiv = document.getElementById('categoryFilters');
            filtersDiv.innerHTML = '<button class="filter-btn active" onclick="filterByCategory(null)">All</button>';
            categories.forEach(cat => {
                filtersDiv.innerHTML += \`<button class="filter-btn" onclick="filterByCategory('\${cat}')">\${cat}</button>\`;
            });
        }

        function filterByCategory(category) {
            currentCategory = category;
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const filtered = category ? 
                allSkills.filter(s => s.category === category) : 
                allSkills;
            displaySkills(filtered);
        }

        function displaySkills(skills) {
            const grid = document.getElementById('skillsGrid');
            if (skills.length === 0) {
                grid.innerHTML = '<div class="empty">No skills found</div>';
                return;
            }

            grid.innerHTML = skills.map(skill => \`
                <div class="skill-card" onclick="viewSkill('\${skill.id}')">
                    <div class="skill-name">\${skill.name}</div>
                    <div class="skill-description">\${skill.description || 'No description'}</div>
                    <div class="skill-meta">
                        \${skill.category ? \`<span class="tag category-tag">\${skill.category}</span>\` : ''}
                        \${(skill.tags || []).slice(0, 3).map(tag => 
                            \`<span class="tag">\${tag}</span>\`
                        ).join('')}
                    </div>
                </div>
            \`).join('');
        }

        async function searchSkills() {
            const query = document.getElementById('searchInput').value;
            try {
                const url = \`/api/search?q=\${encodeURIComponent(query)}\${
                    currentCategory ? \`&category=\${currentCategory}\` : ''
                }\`;
                const response = await fetch(url);
                const data = await response.json();
                displaySkills(data.results);
            } catch (error) {
                console.error('Search failed:', error);
            }
        }

        function viewSkill(id) {
            const skill = allSkills.find(s => s.id === id);
            if (skill) {
                const slug = generateSlug(skill.name);
                window.location.href = '/skill/' + slug;
            }
        }

        function generateSlug(name) {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9\\s-]/g, '')
                .trim()
                .replace(/\\s+/g, '-')
                .replace(/-+/g, '-');
        }

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchSkills();
        });

        loadSkills();
    </script>
</body>
</html>`;
}
