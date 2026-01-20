import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/hpanel/docs')({
  component: DocsPage,
})

function DocsPage() {
  const [activeTab, setActiveTab] = useState<'deploy' | 'api' | 'tech'>('deploy')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Documentation</h1>
        <p className="text-gray-400">Learn how to deploy and use the Ralphy Skills API</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
        {[
          { id: 'deploy', label: '🚀 Deployment' },
          { id: 'api', label: '🔌 API Reference' },
          { id: 'tech', label: '🛠️ Tech Stack' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        {activeTab === 'deploy' && <DeploymentDocs />}
        {activeTab === 'api' && <ApiDocs />}
        {activeTab === 'tech' && <TechStackDocs />}
      </div>
    </div>
  )
}

function DeploymentDocs() {
  return (
    <div className="space-y-6">
      <Section title="Prerequisites">
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Cloudflare account with Workers enabled</li>
          <li>Wrangler CLI installed (<code className="text-blue-400">npm install -g wrangler</code>)</li>
          <li>Node.js 18+ installed</li>
        </ul>
      </Section>

      <Section title="1. Create D1 Database">
        <CodeBlock code={`# Create the database
wrangler d1 create ralphy-skills-db

# Copy the database_id to wrangler.toml`} />
      </Section>

      <Section title="2. Update wrangler.toml">
        <CodeBlock code={`name = "ralphy-skills-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "ralphy-skills-db"
database_id = "YOUR_DATABASE_ID"`} />
      </Section>

      <Section title="3. Apply Database Schema">
        <CodeBlock code={`# Apply schema to remote database
wrangler d1 execute ralphy-skills-db --remote --file=./schema.sql`} />
      </Section>

      <Section title="4. Deploy to Cloudflare">
        <CodeBlock code={`# Deploy the worker
wrangler deploy

# Your API will be available at:
# https://ralphy-skills-api.YOUR_SUBDOMAIN.workers.dev`} />
      </Section>

      <Section title="5. Update Admin Panel">
        <p className="text-gray-300 mb-2">
          Go to <strong className="text-white">Settings</strong> and update the API URL to your deployed worker URL.
        </p>
      </Section>
    </div>
  )
}

function ApiDocs() {
  return (
    <div className="space-y-6">
      <Section title="Base URL">
        <CodeBlock code={`Development: http://localhost:8787
Production: https://ralphy-skills-api.YOUR_SUBDOMAIN.workers.dev`} />
      </Section>

      <Section title="Search Skills">
        <CodeBlock code={`GET /api/search?q=react&category=frontend&limit=20&page=1&sort=installs

Response:
{
  "skills": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "hasMore": true }
}`} />
      </Section>

      <Section title="Get Skill by ID">
        <CodeBlock code={`GET /api/skills/:id

Response: { "id": "...", "name": "...", "description": "...", ... }`} />
      </Section>

      <Section title="Track Install">
        <CodeBlock code={`POST /api/skills/:id/install
Body: { "client": "cursor" }

Response: { "success": true }`} />
      </Section>

      <Section title="Get Categories">
        <CodeBlock code={`GET /api/categories

Response: [{ "id": "...", "name": "...", "skill_count": 10 }, ...]`} />
      </Section>

      <Section title="Get Stats">
        <CodeBlock code={`GET /api/stats

Response: { "skills": 100, "totalInstalls": 50000, "categories": 10 }`} />
      </Section>

      <Section title="Admin: Import Skills">
        <CodeBlock code={`POST /api/admin/import
Body: { "skills": [{ "id": "...", "name": "...", ... }] }

Response: { "imported": 10, "errors": 0, "total": 10 }`} />
      </Section>

      <Section title="Admin: Delete Skill">
        <CodeBlock code={`DELETE /api/admin/skills/:id

Response: { "success": true }`} />
      </Section>

      <Section title="Admin: Update Skill">
        <CodeBlock code={`PATCH /api/admin/skills/:id
Body: { "name": "...", "is_featured": 1 }

Response: { "success": true }`} />
      </Section>
    </div>
  )
}

function TechStackDocs() {
  const stack = [
    { name: 'Cloudflare Workers', desc: 'Serverless edge runtime', icon: '☁️' },
    { name: 'Cloudflare D1', desc: 'SQLite-compatible edge database', icon: '🗄️' },
    { name: 'Hono', desc: 'Ultra-fast web framework for edge', icon: '🔥' },
    { name: 'Drizzle ORM', desc: 'TypeScript ORM with D1 support', icon: '💧' },
    { name: 'React', desc: 'UI library for the admin panel', icon: '⚛️' },
    { name: 'TanStack Router', desc: 'Type-safe file-based routing', icon: '🛣️' },
    { name: 'TanStack Table', desc: 'Headless table with sorting/pagination', icon: '📊' },
    { name: 'TanStack Query', desc: 'Data fetching and caching', icon: '🔄' },
    { name: 'Vite', desc: 'Fast build tool and dev server', icon: '⚡' },
    { name: 'TypeScript', desc: 'Type-safe JavaScript', icon: '📘' },
  ]

  return (
    <div className="space-y-6">
      <Section title="API Tech Stack">
        <div className="grid gap-4 sm:grid-cols-2">
          {stack.slice(0, 4).map((tech) => (
            <TechCard key={tech.name} {...tech} />
          ))}
        </div>
      </Section>

      <Section title="Admin Panel Tech Stack">
        <div className="grid gap-4 sm:grid-cols-2">
          {stack.slice(4).map((tech) => (
            <TechCard key={tech.name} {...tech} />
          ))}
        </div>
      </Section>

      <Section title="Project Structure">
        <CodeBlock code={`ralphy-skills/
├── api/                    # Cloudflare Worker API
│   ├── src/
│   │   ├── index.ts       # Main API routes (Hono)
│   │   ├── db/schema.ts   # Drizzle ORM schema
│   │   └── importer.ts    # Skill import logic
│   ├── schema.sql         # D1 database schema
│   └── wrangler.toml      # Cloudflare config
├── web/                    # Admin Panel (React + Vite)
│   ├── src/
│   │   ├── routes/        # TanStack Router pages
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Utilities
└── marketplace.json       # Skills registry data`} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <code className="text-sm text-gray-300 whitespace-pre">{code}</code>
    </pre>
  )
}

function TechCard({ name, desc, icon }: { name: string; desc: string; icon: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-4 flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-white">{name}</p>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
    </div>
  )
}
