import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '../components/DataTable'
import { RightDrawer } from '../components/RightDrawer'
import { getApiUrl } from '../lib/api-config'
import type { ColumnDef } from '@tanstack/react-table'

export const Route = createFileRoute('/hpanel/categories')({
    component: CategoriesPage,
})

interface CategoryData {
    category: string
    count: number
    installs: number
}

const categoryIcons: Record<string, string> = {
    development: '💻', workflow: '🔄', testing: '🧪', deployment: '🚀',
    security: '🔒', integration: '🔌', tools: '🛠️', productivity: '⚡',
    automation: '🤖', documentation: '📝', utilities: '🔧', general: '📦'
}

function CategoriesPage() {
    const queryClient = useQueryClient()
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const { data: skillsData, isLoading } = useQuery({
        queryKey: ['skills'],
        queryFn: async () => {
            const res = await fetch(`${getApiUrl()}/api/search?limit=1000`)
            const data = await res.json()
            return data.skills || []
        }
    })

    const categories: CategoryData[] = useMemo(() => {
        if (!skillsData) return []
        const counts: Record<string, { count: number; installs: number }> = {}
        for (const skill of skillsData) {
            const cat = skill.category || 'general'
            if (!counts[cat]) counts[cat] = { count: 0, installs: 0 }
            counts[cat].count++
            counts[cat].installs += skill.install_count || 0
        }
        return Object.entries(counts)
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.count - a.count)
    }, [skillsData])

    // Update all skills in a category
    const updateCategoryMutation = useMutation({
        mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
            const skillsInCategory = skillsData?.filter((s: any) => s.category === oldName) || []
            for (const skill of skillsInCategory) {
                await fetch(`${getApiUrl()}/api/admin/skills/${skill.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category: newName })
                })
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] })
    })

    // Delete all skills in a category
    const deleteCategoryMutation = useMutation({
        mutationFn: async (categoryName: string) => {
            const skillsInCategory = skillsData?.filter((s: any) => s.category === categoryName) || []
            for (const skill of skillsInCategory) {
                await fetch(`${getApiUrl()}/api/admin/skills/${skill.id}`, { method: 'DELETE' })
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] })
    })

    const openEdit = (category: string) => {
        setSelectedCategory(category)
        setDrawerMode('edit')
    }

    const columns: ColumnDef<CategoryData>[] = [
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryIcons[row.original.category] || '📁'}</span>
                    <span className="font-medium text-white capitalize">{row.original.category.replace(/-/g, ' ')}</span>
                </div>
            )
        },
        {
            accessorKey: 'count',
            header: 'Skills',
            cell: ({ row }) => (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {row.original.count} skill{row.original.count !== 1 ? 's' : ''}
                </span>
            )
        },
        {
            accessorKey: 'installs',
            header: 'Total Installs',
            cell: ({ row }) => (
                <span className="text-gray-400">{row.original.installs.toLocaleString()}</span>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <button onClick={() => openEdit(row.original.category)} className="text-blue-400 hover:text-blue-300 text-sm">
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            if (confirm(`Delete category "${row.original.category}" and all ${row.original.count} skills in it?`)) {
                                deleteCategoryMutation.mutate(row.original.category)
                            }
                        }}
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
                    <h1 className="text-3xl font-bold text-white">Categories</h1>
                    <p className="text-gray-400">Skill categories overview ({categories.length} categories)</p>
                </div>
                <button
                    onClick={() => { setSelectedCategory(null); setDrawerMode('add') }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    ➕ Add Category
                </button>
            </div>

            <DataTable
                data={categories}
                columns={columns}
                searchPlaceholder="Search categories..."
                isLoading={isLoading}
                pageSize={25}
            />

            {/* Add/Edit Drawer */}
            <RightDrawer
                isOpen={drawerMode === 'add' || drawerMode === 'edit'}
                onClose={() => { setDrawerMode(null); setSelectedCategory(null) }}
                title={drawerMode === 'edit' ? 'Edit Category' : 'Add Category'}
            >
                <CategoryForm
                    category={selectedCategory}
                    existingCategories={categories.map(c => c.category)}
                    onSuccess={() => {
                        setDrawerMode(null)
                        setSelectedCategory(null)
                        queryClient.invalidateQueries({ queryKey: ['skills'] })
                    }}
                    onRename={(oldName, newName) => updateCategoryMutation.mutate({ oldName, newName })}
                />
            </RightDrawer>
        </div>
    )
}

function CategoryForm({
    category,
    existingCategories,
    onSuccess,
    onRename
}: {
    category: string | null
    existingCategories: string[]
    onSuccess: () => void
    onRename: (oldName: string, newName: string) => void
}) {
    const [name, setName] = useState(category || '')
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setMessage(null)

        const newName = name.toLowerCase().replace(/\s+/g, '-')

        if (category) {
            // Editing - rename all skills in this category
            onRename(category, newName)
            setMessage({ type: 'success', text: 'Category renamed!' })
            setTimeout(onSuccess, 1000)
        } else {
            // Adding new category is implicit - categories are created when skills use them
            if (existingCategories.includes(newName)) {
                setMessage({ type: 'error', text: 'Category already exists' })
            } else {
                setMessage({ type: 'success', text: 'Category will be available when you add skills to it!' })
                setTimeout(onSuccess, 1500)
            }
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., testing, deployment, security"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Will be converted to lowercase with hyphens</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon (optional)</label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(categoryIcons).map(([key, icon]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setName(key)}
                            className={`p-2 rounded-lg text-xl ${name === key ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
                {submitting ? 'Saving...' : (category ? 'Rename Category' : 'Add Category')}
            </button>

            {category && (
                <p className="text-xs text-gray-500 text-center">
                    Renaming will update all {existingCategories.length} skills in this category
                </p>
            )}
        </form>
    )
}
