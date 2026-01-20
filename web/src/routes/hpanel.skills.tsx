import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '../components/DataTable'
import { RightDrawer } from '../components/RightDrawer'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { ValidationModal } from '../components/ValidationModal'
import { getApiUrl } from '../lib/api-config'
import { toast } from 'sonner'
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
  status: 'published' | 'pending' | 'invalid'
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
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sortBy, setSortBy] = useState('relevance')
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  })

  // Fetch skills with server-side pagination and filtering
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['skills', pagination, searchQuery, providerFilter, platformFilter, sourceFilter, namespaceFilter, statusFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pagination.pageSize.toString(),
        page: (pagination.pageIndex + 1).toString(),
        q: searchQuery,
        author: providerFilter,
        platform: platformFilter,
        source: sourceFilter,
        namespace: namespaceFilter,
        status: statusFilter,
        sort: sortBy,
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
      const res = await fetch(`${getApiUrl()}/api/admin/skills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ralphy-default-admin-token' }
      })
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Skill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: () => {
      toast.error('Failed to delete skill');
    }
  })

  // Bulk Delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch(`${getApiUrl()}/api/admin/skills/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ralphy-default-admin-token'
        },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) throw new Error('Bulk delete failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Skills deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setSelectedRowIds({});
    },
    onError: () => {
      toast.error('Failed to delete skills');
    }
  })

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const res = await fetch(`${getApiUrl()}/api/admin/skills/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ralphy-default-admin-token'
        },
        body: JSON.stringify({ is_featured: featured ? 1 : 0 })
      })
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Skill updated');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    }
  })

  const openEdit = (skill: Skill) => {
    setSelectedSkill(skill)
    setDrawerMode('edit')
  }

  // Validation Progress State
  const [validationProgress, setValidationProgress] = useState({
    isOpen: false,
    total: 0,
    processed: 0,
    valid: 0,
    invalid: 0,
    isComplete: false
  })

  // Function to start chunked validation
  const startValidation = async () => {
    try {
      const idsRes = await fetch(`${getApiUrl()}/api/admin/skills/ids`, {
        headers: {
          'Authorization': 'Bearer ralphy-default-admin-token'
        }
      });
      const { ids } = await idsRes.json();

      setValidationProgress({
        isOpen: true,
        total: ids.length,
        processed: 0,
        valid: 0,
        invalid: 0,
        isComplete: false
      });

      const chunkSize = 20;
      let processedCount = 0;
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);

        const res = await fetch(`${getApiUrl()}/api/admin/skills/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ralphy-default-admin-token'
          },
          body: JSON.stringify({ ids: chunk })
        });

        const result = await res.json();

        processedCount += chunk.length;
        validCount += result.validCount || 0;
        invalidCount += result.invalidCount || 0;

        setValidationProgress(prev => ({
          ...prev,
          processed: processedCount,
          valid: validCount,
          invalid: invalidCount
        }));
      }

      setValidationProgress(prev => ({ ...prev, isComplete: true }));
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate URLs');
      setValidationProgress(prev => ({ ...prev, isOpen: false }));
    }
  };

  const columns: ColumnDef<Skill>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{row.original.name}</p>
            <a
              href={row.original.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-400 transition-colors"
              title="Open GitHub Repository"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="text-sm text-gray-500 truncate max-w-xs">{row.original.description}</p>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm capitalize">{row.original.category}</span>
      )
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
      cell: ({ row }) => {
        const status = row.original.status || 'published';
        let statusColor = 'bg-gray-700 text-gray-300';
        if (status === 'published') statusColor = 'bg-green-500/20 text-green-400';
        if (status === 'pending') statusColor = 'bg-yellow-500/20 text-yellow-400';
        if (status === 'invalid') statusColor = 'bg-red-500/20 text-red-400';

        return (
          <div className="flex flex-col gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${statusColor}`}>
              {status}
            </span>
            <div className="flex gap-1">
              {row.original.is_verified ? <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs" title="Verified">✓</span> : null}
              <button
                onClick={() => toggleFeaturedMutation.mutate({ id: row.original.id, featured: !row.original.is_featured })}
                className={`px-2 py-1 rounded text-xs ${row.original.is_featured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title={row.original.is_featured ? 'Featured' : 'Mark as Featured'}
              >
                {row.original.is_featured ? '⭐' : '☆'}
              </button>
            </div>
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row.original)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Delete Skill',
                message: `Are you sure you want to permanently delete "${row.original.name}"? This action cannot be undone.`,
                onConfirm: () => {
                  deleteMutation.mutate(row.original.id);
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              })
            }}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Delete
          </button>
        </div>
      )
    }
  ]

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(selectedRowIds);
    if (selectedIds.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Bulk Delete Skills',
      message: `Are you sure you want to permanently delete ${selectedIds.length} skills? This action cannot be undone.`,
      onConfirm: () => {
        bulkDeleteMutation.mutate(selectedIds);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Skills</h1>
          <p className="text-gray-400">Manage all skills in the registry ({totalCount} total)</p>
        </div>
        <div className="flex gap-3">
          {Object.keys(selectedRowIds).length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
            >
              🗑️ Delete {Object.keys(selectedRowIds).length}
            </button>
          )}
          <button
            onClick={startValidation}
            disabled={validationProgress.isOpen && !validationProgress.isComplete}
            className={`px-4 py-2 text-gray-300 border border-gray-600 rounded-lg transition-all flex items-center gap-2 ${validationProgress.isOpen && !validationProgress.isComplete
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
              : 'bg-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
            title="Check if all GitHub URLs are still valid"
          >
            {validationProgress.isOpen && !validationProgress.isComplete ? '⌛ Validating...' : '🔍 Validate URLs'}
          </button>
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="relevance">Relevance</option>
          <option value="stars">Most Stars</option>
          <option value="installs">Most Installed</option>
          <option value="newest">Recently Added</option>
          <option value="name">Name</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="invalid">Invalid</option>
        </select>
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
        rowSelection={selectedRowIds}
        onRowSelectionChange={setSelectedRowIds}
        getRowId={(row) => row.id}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText="Permanently Delete"
      />

      <ValidationModal
        isOpen={validationProgress.isOpen}
        total={validationProgress.total}
        processed={validationProgress.processed}
        valid={validationProgress.valid}
        invalid={validationProgress.invalid}
        isComplete={validationProgress.isComplete}
        onClose={() => setValidationProgress(prev => ({ ...prev, isOpen: false }))}
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
    status: skill?.status || 'published',
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
        status: form.status,
        stars: Number(form.stars),
        downloads: Number(form.downloads),
        metadata: JSON.parse(form.metadata || '{}'),
        verified: false
      }

      const res = await fetch(`${getApiUrl()}/api/admin/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ralphy-default-admin-token'
        },
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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="invalid">Invalid</option>
        </select>
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ralphy-default-admin-token'
        },
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
