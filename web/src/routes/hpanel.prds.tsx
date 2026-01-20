import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '../components/DataTable'
import { RightDrawer } from '../components/RightDrawer'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { EditorModal } from '../components/MarkdownEditorModal'
import { getApiUrl } from '../lib/api-config'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'

export const Route = createFileRoute('/hpanel/prds')({
  component: PrdsPage,
})

interface Prd {
  id: string
  slug: string
  name: string
  description: string
  category: string
  author: string
  version: string
  file_path: string
  view_count: number
  download_count: number
  like_count: number
  status: 'published' | 'draft' | 'archived'
  tags: string
  created_at: string
  updated_at: string
}

const CATEGORIES = ['business', 'health', 'education', 'productivity', 'developer', 'creative', 'operations', 'consumer', 'other']

function PrdsPage() {
  const queryClient = useQueryClient()
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
  const [selectedPrd, setSelectedPrd] = useState<Prd | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sortBy, setSortBy] = useState('views')
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

  // Editor Modal State
  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean;
    filePath: string;
    prdId: string;
  }>({
    isOpen: false,
    filePath: '',
    prdId: '',
  })


  const handleSaveContent = async (content: string) => {
    if (!editorModal.prdId) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/prds/${editorModal.prdId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ralphy-default-admin-token'
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        toast.success('Content saved to database!');
        queryClient.invalidateQueries({ queryKey: ['admin-prds'] });
        return Promise.resolve();
      } else {
        toast.error('Failed to save content');
        return Promise.reject();
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Network error while saving content');
      return Promise.reject();
    }
  }

  // Fetch PRDs with server-side pagination and filtering
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['admin-prds', pagination, searchQuery, categoryFilter, statusFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pagination.pageSize.toString(),
        page: (pagination.pageIndex + 1).toString(),
        q: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        sort: sortBy,
      })
      const res = await fetch(`${getApiUrl()}/api/admin/prds?${params.toString()}`, {
        headers: { 'Authorization': 'Bearer ralphy-default-admin-token' }
      })
      return res.json()
    }
  })

  const prds: Prd[] = searchData?.prds || []
  const totalCount = searchData?.pagination?.total || 0

  // Event listener for editor trigger from form
  useEffect(() => {
    const handler = (e: any) => {
      const { prdId } = e.detail;
      const prd = prds.find(p => p.id === prdId);
      if (prd) {
        setEditorModal({
          isOpen: true,
          filePath: prd.file_path,
          prdId: prd.id
        });
      }
    };
    window.addEventListener('open-prd-editor', handler);
    return () => window.removeEventListener('open-prd-editor', handler);
  }, [prds]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiUrl()}/api/admin/prds/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ralphy-default-admin-token' }
      })
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('PRD deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prds'] });
    },
    onError: () => {
      toast.error('Failed to delete PRD');
    }
  })

  // Bulk Delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch(`${getApiUrl()}/api/admin/prds/bulk-delete`, {
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
      toast.success(data.message || 'PRDs deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prds'] });
      setSelectedRowIds({});
    },
    onError: () => {
      toast.error('Failed to delete PRDs');
    }
  })

  const openEdit = (prd: Prd) => {
    setSelectedPrd(prd)
    setDrawerMode('edit')
  }

  const columns: ColumnDef<Prd>[] = [
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
          <p className="font-medium text-white">{row.original.name}</p>
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
      accessorKey: 'author',
      header: 'Author',
      cell: ({ row }) => <span className="text-gray-300">{row.original.author}</span>
    },
    {
      accessorKey: 'view_count',
      header: 'Views',
      cell: ({ row }) => <span className="text-blue-400">👁️ {row.original.view_count || 0}</span>
    },
    {
      accessorKey: 'like_count',
      header: 'Likes',
      cell: ({ row }) => <span className="text-red-400">❤️ {row.original.like_count || 0}</span>
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'published';
        let statusColor = 'bg-gray-700 text-gray-300';
        if (status === 'published') statusColor = 'bg-green-500/20 text-green-400';
        if (status === 'draft') statusColor = 'bg-yellow-500/20 text-yellow-400';
        if (status === 'archived') statusColor = 'bg-red-500/20 text-red-400';

        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>
            {status}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            onClick={() => openEdit(row.original)}
            className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-sm"
            title="Edit PRD"
          >
            🎨
          </button>
          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Delete PRD',
                message: `Are you sure you want to permanently delete "${row.original.name}"? This action cannot be undone.`,
                onConfirm: () => {
                  deleteMutation.mutate(row.original.id);
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
              })
            }}
            className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
            title="Delete PRD"
          >
            🗑️
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
      title: 'Bulk Delete PRDs',
      message: `Are you sure you want to permanently delete ${selectedIds.length} PRDs? This action cannot be undone.`,
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
          <h1 className="text-3xl font-bold text-white">PRDs</h1>
          <p className="text-gray-400">Manage all PRDs and specifications ({totalCount} total)</p>
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
          <button onClick={() => { setSelectedPrd(null); setDrawerMode('add') }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            ➕ Add PRD
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
          <option value="views">Most Viewed</option>
          <option value="likes">Most Liked</option>
          <option value="recent">Recently Added</option>
          <option value="name">Name</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <DataTable
        data={prds}
        columns={columns}
        searchPlaceholder="Search PRDs..."
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

      {/* Add/Edit Drawer */}
      <RightDrawer
        isOpen={drawerMode === 'add' || drawerMode === 'edit'}
        onClose={() => { setDrawerMode(null); setSelectedPrd(null) }}
        title={drawerMode === 'edit' ? 'Edit PRD' : 'Add PRD'}
      >
        <PrdForm
          prd={selectedPrd}
          onSuccess={() => { setDrawerMode(null); setSelectedPrd(null); queryClient.invalidateQueries({ queryKey: ['admin-prds'] }) }}
        />
      </RightDrawer>

      {/* Editor Modal for PRD Content */}
      <EditorModal
        isOpen={editorModal.isOpen}
        onClose={() => setEditorModal({ isOpen: false, filePath: '', prdId: '' })}
        prdId={editorModal.prdId}
        onSave={handleSaveContent}
        apiUrl={`${getApiUrl()}/api/admin/prds`}
      />
    </div>
  )
}

function PrdForm({ prd, onSuccess }: { prd: Prd | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: prd?.name || '',
    slug: prd?.slug || '',
    description: prd?.description || '',
    category: prd?.category || 'developer',
    author: prd?.author || '',
    version: prd?.version || '1.0.0',
    file_path: prd?.file_path || '',
    tags: prd?.tags ? (typeof prd.tags === 'string' ? JSON.parse(prd.tags).join(', ') : prd.tags) : '',
    status: prd?.status || 'published',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

      if (prd) {
        // Update existing PRD
        const res = await fetch(`${getApiUrl()}/api/admin/prds/${prd.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ralphy-default-admin-token'
          },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            category: form.category,
            author: form.author,
            version: form.version,
            file_path: form.file_path,
            tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            status: form.status,
          })
        })

        if (res.ok) {
          setMessage({ type: 'success', text: 'PRD updated!' })
          setTimeout(onSuccess, 1000)
        } else {
          setMessage({ type: 'error', text: 'Failed to update PRD' })
        }
      } else {
        // Create new PRD via import endpoint
        const res = await fetch(`${getApiUrl()}/api/admin/prds/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ralphy-default-admin-token'
          },
          body: JSON.stringify({
            prds: [{
              name: form.name,
              slug: slug,
              description: form.description,
              category: form.category,
              author: form.author,
              version: form.version,
              filePath: form.file_path,
              tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            }]
          })
        })

        if (res.ok) {
          setMessage({ type: 'success', text: 'PRD added!' })
          setTimeout(onSuccess, 1000)
        } else {
          setMessage({ type: 'error', text: 'Failed to add PRD' })
        }
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
        <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Author</label>
          <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Version</label>
          <input type="text" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1.0.0" />
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-blue-400">Content Management</h4>
            <p className="text-xs text-gray-400 font-normal">Edit raw markdown directly in the database.</p>
          </div>
          {prd?.id && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-prd-editor', { detail: { prdId: prd.id } }))}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              📝 Open Editor
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
        <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="api, backend, microservices" />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Saving...' : (prd ? 'Update PRD' : 'Add PRD')}
      </button>
    </form>
  )
}
