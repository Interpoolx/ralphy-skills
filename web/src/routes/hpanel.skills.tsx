import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '../components/DataTable'
import { RightDrawer } from '../components/RightDrawer'
import { getApiUrl } from '../lib/api-config'
import type { ColumnDef } from '@tanstack/react-table'

export const Route = createFileRoute('/hpanel/skills')({
  component: SkillsPage,
})

interface Skill {
  id: string
  name: string
  namespace: string
  description: string
  category: string
  author: string
  github_url: string
  stars: number
  downloads: number
  install_count: number
  is_featured: number
  is_verified: number
  tags: string
  version: string
  created_at: string
  import_source: string
  platform: string
  metadata: any
}
const PLATFORMS = ['global', 'claude', 'cursor', 'codex', 'copilot', 'windsurf']

function SkillsPage() {
  const queryClient = useQueryClient()
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'import' | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [providerFilter, setProviderFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [namespaceFilter, setNamespaceFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  // Fetch skills with server-side pagination and filtering
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['skills', pagination, searchQuery, providerFilter, platformFilter, sourceFilter, namespaceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pagination.pageSize.toString(),
        page: (pagination.pageIndex + 1).toString(),
        q: searchQuery,
        author: providerFilter,
        platform: platformFilter,
        source: sourceFilter,
        namespace: namespaceFilter,
      })
      const res = await fetch(`${getApiUrl()}/api/search?${params.toString()}`)
      return res.json()
    }
  })

  // Fetch all filter options (unique values) for dropdowns
  const { data: filterOptionsData } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/stats/filter-options`)
      return res.json()
    }
  })

  const filterOptions = filterOptionsData || { authors: [], platforms: [], sources: [], namespaces: [] }
  const skills: Skill[] = searchData?.skills || []
  const totalCount = searchData?.pagination?.total || 0

  const providers = filterOptions.authors
  const sources = filterOptions.sources
  const platforms = filterOptions.platforms
  const namespaces = filterOptions.namespaces

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${getApiUrl()}/api/admin/skills/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] })
  })

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      await fetch(`${getApiUrl()}/api/admin/skills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: featured ? 1 : 0 })
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] })
  })

  const openEdit = (skill: Skill) => {
    setSelectedSkill(skill)
    setDrawerMode('edit')
  }

  const columns: ColumnDef<Skill>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">{row.original.name}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">{row.original.description}</p>
        </div>
      )
    },
    {
      accessorKey: 'namespace',
      header: 'Namespace',
      cell: ({ row }) => <span className="text-gray-500 text-xs font-mono">{row.original.namespace || '-'}</span>
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm capitalize">{row.original.category}</span>
      )
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      cell: ({ row }) => {
        const platformColors: Record<string, string> = {
          global: 'bg-green-500/20 text-green-400',
          claude: 'bg-orange-500/20 text-orange-400',
          cursor: 'bg-purple-500/20 text-purple-400',
          codex: 'bg-blue-500/20 text-blue-400',
          copilot: 'bg-sky-500/20 text-sky-400',
          windsurf: 'bg-teal-500/20 text-teal-400',
        }
        const p = row.original.platform || 'global'
        return <span className={`px-2 py-1 rounded text-xs capitalize ${platformColors[p] || 'bg-gray-700 text-gray-400'}`}>{p}</span>
      }
    },
    {
      accessorKey: 'import_source',
      header: 'Source',
      cell: ({ row }) => {
        const sourceIcons: Record<string, string> = { marketplace: '📦', 'claude-plugins': '🔌', manual: '✏️' }
        const s = row.original.import_source || 'manual'
        return <span className="text-gray-400 text-sm">{sourceIcons[s] || '📁'} {s}</span>
      }
    },
    {
      accessorKey: 'stars',
      header: 'Stars',
      cell: ({ row }) => <span className="text-yellow-500">⭐ {row.original.stars || 0}</span>
    },
    {
      accessorKey: 'downloads',
      header: 'Downloads',
      cell: ({ row }) => <span className="text-blue-400">📥 {(row.original.downloads || 0).toLocaleString()}</span>
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.is_verified ? <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ Verified</span> : null}
          <button
            onClick={() => toggleFeaturedMutation.mutate({ id: row.original.id, featured: !row.original.is_featured })}
            className={`px-2 py-1 rounded text-xs ${row.original.is_featured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            {row.original.is_featured ? '⭐ Featured' : 'Feature'}
          </button>
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row.original)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
          <button
            onClick={() => { if (confirm(`Delete "${row.original.name}"?`)) deleteMutation.mutate(row.original.id) }}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Delete
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Skills</h1>
          <p className="text-gray-400">Manage all skills in the registry ({totalCount} total)</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDrawerMode('import')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
            📥 Import
          </button>
          <button onClick={() => { setSelectedSkill(null); setDrawerMode('add') }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            ➕ Add Skill
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Providers</option>
          {providers.map((p: string) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Platforms</option>
          {platforms.map((p: string) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          {sources.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={namespaceFilter}
          onChange={(e) => setNamespaceFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Namespaces</option>
          {namespaces.map((n: string) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <DataTable
        data={skills}
        columns={columns}
        searchPlaceholder="Search skills..."
        isLoading={isLoading}
        totalCount={totalCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPageChange={(pageIndex) => setPagination(prev => ({ ...prev, pageIndex }))}
        onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
        globalFilter={searchQuery}
        onGlobalFilterChange={setSearchQuery}
      />

      {/* Add/Edit Drawer */}
      <RightDrawer
        isOpen={drawerMode === 'add' || drawerMode === 'edit'}
        onClose={() => { setDrawerMode(null); setSelectedSkill(null) }}
        title={drawerMode === 'edit' ? 'Edit Skill' : 'Add Skill'}
      >
        <SkillForm
          skill={selectedSkill}
          onSuccess={() => { setDrawerMode(null); setSelectedSkill(null); queryClient.invalidateQueries({ queryKey: ['skills'] }) }}
        />
      </RightDrawer>

      {/* Import Drawer */}
      <RightDrawer
        isOpen={drawerMode === 'import'}
        onClose={() => setDrawerMode(null)}
        title="Import Skills"
        width="max-w-lg"
      >
        <ImportForm onSuccess={() => { setDrawerMode(null); queryClient.invalidateQueries({ queryKey: ['skills'] }) }} />
      </RightDrawer>
    </div>
  )
}

function SkillForm({ skill, onSuccess }: { skill: Skill | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: skill?.name || '',
    namespace: skill?.namespace || '',
    description: skill?.description || '',
    category: skill?.category || 'development',
    author: skill?.author || '',
    github_url: skill?.github_url || '',
    tags: skill?.tags ? (typeof skill.tags === 'string' ? JSON.parse(skill.tags).join(', ') : skill.tags) : '',
    platform: skill?.platform || 'global',
    stars: skill?.stars || 0,
    downloads: skill?.downloads || 0,
    metadata: skill?.metadata ? (typeof skill.metadata === 'string' ? skill.metadata : JSON.stringify(skill.metadata, null, 2)) : '{}'
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const skillData = {
        id: skill?.id || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: form.name,
        namespace: form.namespace,
        description: form.description,
        category: form.category,
        author: { name: form.author, github: form.author },
        source: form.github_url,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        platform: form.platform,
        stars: Number(form.stars),
        downloads: Number(form.downloads),
        metadata: JSON.parse(form.metadata || '{}'),
        verified: false
      }

      const res = await fetch(`${getApiUrl()}/api/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: [skillData], import_source: 'manual', platform: form.platform })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: skill ? 'Skill updated!' : 'Skill added!' })
        setTimeout(onSuccess, 1000)
      } else {
        setMessage({ type: 'error', text: 'Failed to save skill' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
        <textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Namespace</label>
        <input type="text" value={form.namespace} onChange={(e) => setForm({ ...form, namespace: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="@anthropics/claude-code-plugins" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="development">Development</option>
            <option value="workflow">Workflow</option>
            <option value="testing">Testing</option>
            <option value="deployment">Deployment</option>
            <option value="security">Security</option>
            <option value="integration">Integration</option>
            <option value="tools">Tools</option>
            <option value="productivity">Productivity</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Stars</label>
          <input type="number" value={form.stars} onChange={(e) => setForm({ ...form, stars: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Downloads</label>
          <input type="number" value={form.downloads} onChange={(e) => setForm({ ...form, downloads: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
        <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL *</label>
        <input type="url" required value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
        <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="react, typescript, frontend" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Metadata (JSON)</label>
        <textarea rows={4} value={form.metadata} onChange={(e) => setForm({ ...form, metadata: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='{ "homepage": null, "license": "MIT" }' />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Saving...' : (skill ? 'Update Skill' : 'Add Skill')}
      </button>
    </form>
  )
}

function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const [importing, setImporting] = useState<string | null>(null)
  const [result, setResult] = useState<{ source: string; imported: number; errors: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState('claude') // Default to 'claude' for claude-plugins

  async function importFromSource(source: 'marketplace' | 'claude-plugins') {
    setImporting(source)
    setResult(null)
    setError(null)

    try {
      let skills = []
      let platform = 'global'

      if (source === 'marketplace') {
        const res = await fetch('https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/marketplace.json')
        if (!res.ok) throw new Error('Failed to fetch marketplace.json')
        const data = await res.json()
        skills = data.skills || []
        platform = 'global'
      } else {
        // Claude plugins - try the actual registry
        const res = await fetch('https://raw.githubusercontent.com/anthropics/claude-mcp/main/registry.json')
        if (!res.ok) {
          // Fallback to a known working endpoint or show error
          throw new Error('Claude plugins registry not accessible. Try importing manually.')
        }
        const data = await res.json()
        // Handle different data formats
        if (Array.isArray(data)) {
          skills = data
        } else if (data.plugins) {
          skills = data.plugins
        } else if (data.skills) {
          skills = data.skills
        }
        platform = selectedPlatform
      }

      if (skills.length === 0) {
        setResult({ source, imported: 0, errors: 0 })
        setError('No skills found in the source')
        setImporting(null)
        return
      }

      const importRes = await fetch(`${getApiUrl()}/api/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills,
          import_source: source,
          platform: platform
        })
      })

      if (importRes.ok) {
        const data = await importRes.json()
        setResult({ source, imported: data.imported, errors: data.errors })
        if (data.imported > 0) setTimeout(onSuccess, 2000)
      } else {
        throw new Error('Import API call failed')
      }
    } catch (err: any) {
      console.error('Import failed:', err)
      setError(err.message || 'Import failed. Check console for details.')
    }

    setImporting(null)
  }

  return (
    <div className="space-y-6">
      {result && (
        <div className={`p-4 rounded-lg ${result.imported > 0 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
          {result.imported > 0 ? '✅' : '⚠️'} Import complete: {result.imported} imported, {result.errors} errors
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          ❌ {error}
        </div>
      )}

      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-2xl">📦</span>
          <div>
            <h3 className="font-medium text-white">marketplace.json</h3>
            <p className="text-sm text-gray-400">Import from Ralphy Skills registry (Global platform)</p>
          </div>
        </div>
        <button
          onClick={() => importFromSource('marketplace')}
          disabled={importing !== null}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {importing === 'marketplace' ? 'Importing...' : 'Import'}
        </button>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-2xl">🔌</span>
          <div>
            <h3 className="font-medium text-white">Claude MCP Registry</h3>
            <p className="text-sm text-gray-400">Import from Anthropic's MCP registry</p>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Target Platform</label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none"
          >
            {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <button
          onClick={() => importFromSource('claude-plugins')}
          disabled={importing !== null}
          className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {importing === 'claude-plugins' ? 'Importing...' : 'Import'}
        </button>
      </div>
    </div>
  )
}
