import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '../components/DataTable'
import { RightDrawer } from '../components/RightDrawer'
import { getApiUrl } from '../lib/api-config'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'

export const Route = createFileRoute('/hpanel/prd-categories')({
    component: PrdCategoriesPage,
})

interface PrdCategory {
    id: string
    name: string
    description: string
    icon: string
    prdCount: number
}

function PrdCategoriesPage() {
    const queryClient = useQueryClient()
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<PrdCategory | null>(null)

    const { data: categories = [], isLoading } = useQuery<PrdCategory[]>({
        queryKey: ['admin-prd-categories'],
        queryFn: async () => {
            const res = await fetch(`${getApiUrl()}/api/admin/prds/categories`, {
                headers: { 'Authorization': 'Bearer ralphy-default-admin-token' }
            })
            return res.json()
        }
    })

    const createMutation = useMutation({
        mutationFn: async (data: Partial<PrdCategory>) => {
            await fetch(`${getApiUrl()}/api/admin/prds/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ralphy-default-admin-token'
                },
                body: JSON.stringify(data)
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-prd-categories'] })
            setDrawerMode(null)
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<PrdCategory>) => {
            await fetch(`${getApiUrl()}/api/admin/prds/categories/${data.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ralphy-default-admin-token'
                },
                body: JSON.stringify(data)
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-prd-categories'] })
            setDrawerMode(null)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`${getApiUrl()}/api/admin/prds/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ralphy-default-admin-token' }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-prd-categories'] })
        }
    })

    const columns: ColumnDef<PrdCategory>[] = [
        {
            accessorKey: 'name',
            header: 'Category',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{row.original.icon || '📂'}</span>
                    <div>
                        <div className="font-medium text-white">{row.original.name}</div>
                        <div className="text-xs text-gray-500">{row.original.id}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <span className="text-gray-400 text-sm line-clamp-1">{row.original.description || '-'}</span>
            )
        },
        {
            accessorKey: 'prdCount',
            header: 'PRDs',
            cell: ({ row }) => (
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
                    {row.original.prdCount} specs
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectedCategory(row.original); setDrawerMode('edit') }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            if (confirm(`Delete PRD category "${row.original.name}"?`)) {
                                deleteMutation.mutate(row.original.id)
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

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const content = event.target?.result as string
            let importedData: any[] = []

            try {
                if (file.name.endsWith('.json')) {
                    importedData = JSON.parse(content)
                } else if (file.name.endsWith('.csv')) {
                    const lines = content.split('\n')
                    const headers = lines[0].split(',')
                    importedData = lines.slice(1).map(line => {
                        const values = line.split(',')
                        return headers.reduce((obj: any, header, i) => {
                            obj[header.trim()] = values[i]?.trim()
                            return obj
                        }, {})
                    }).filter(item => item.name)
                } else {
                    toast.error('Unsupported file format. Please use .json or .csv')
                    return
                }

                if (!Array.isArray(importedData)) {
                    toast.error('Invalid data format. Expected an array of categories.')
                    return
                }

                toast.info(`Importing ${importedData.length} categories...`)
                let successCount = 0
                let failCount = 0

                for (const cat of importedData) {
                    try {
                        await createMutation.mutateAsync({
                            name: cat.name,
                            description: cat.description || '',
                            icon: cat.icon || '📂'
                        })
                        successCount++
                    } catch (err) {
                        console.error('Failed to import:', cat.name, err)
                        failCount++
                        toast.error(`Failed to import ${cat.name}`)
                    }
                }

                if (successCount > 0) {
                    toast.success(`Successfully imported ${successCount} categories.`)
                }
                if (failCount > 0) {
                    toast.warning(`Failed to import ${failCount} categories. Check console for details.`)
                }
            } catch (err) {
                toast.error('Failed to parse file. Please check the format.')
            }
        }
        reader.readAsText(file)
        e.target.value = '' // Reset input
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">PRD Categories</h1>
                    <p className="text-gray-400">Manage categories for Product Requirement Documents ({categories.length} total)</p>
                </div>
                <div className="flex gap-3">
                    <label className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 flex items-center gap-2 cursor-pointer transition-colors border border-gray-600">
                        📥 Import
                        <input
                            type="file"
                            accept=".json,.csv"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={() => { setSelectedCategory(null); setDrawerMode('add') }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        ➕ Add Category
                    </button>
                </div>
            </div>

            <DataTable
                data={categories}
                columns={columns}
                searchPlaceholder="Search categories..."
                isLoading={isLoading}
                pageSize={25}
            />

            <RightDrawer
                isOpen={drawerMode === 'add' || drawerMode === 'edit'}
                onClose={() => { setDrawerMode(null); setSelectedCategory(null) }}
                title={drawerMode === 'edit' ? 'Edit PRD Category' : 'Add PRD Category'}
            >
                <CategoryForm
                    category={selectedCategory}
                    onSave={(data) => {
                        if (drawerMode === 'edit') updateMutation.mutate(data)
                        else createMutation.mutate(data)
                    }}
                    submitting={createMutation.isPending || updateMutation.isPending}
                />
            </RightDrawer>
        </div>
    )
}

function CategoryForm({
    category,
    onSave,
    submitting
}: {
    category: PrdCategory | null
    onSave: (data: Partial<PrdCategory>) => void
    submitting: boolean
}) {
    const [name, setName] = useState(category?.name || '')
    const [description, setDescription] = useState(category?.description || '')
    const [icon, setIcon] = useState(category?.icon || '📂')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        onSave({ id: category?.id, name, description, icon })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Business, Consumer, Developer"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this category..."
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon (Emoji)</label>
                <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="📂"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
                {submitting ? 'Saving...' : (category ? 'Update Category' : 'Add Category')}
            </button>
        </form>
    )
}
