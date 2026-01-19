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
            } else if (pathname === '/' || pathname === '/index.html') {
                const html = getWebInterface();
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end(html);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
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
        console.log(`\n🎨 Web Interface: http://localhost:${port}\n`);
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

function getWebInterface(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ralphy Skills Browser</title>
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
            alert(\`Skill: \${id}\\n\\nTo install:\\nnpx ralphy-skills install \${id}\`);
        }

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchSkills();
        });

        loadSkills();
    </script>
</body>
</html>`;
}
