import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SkillsList } from '../components/SkillsList'
import type { MarketplaceData, Skill } from '../types'
import { API_URL } from '../constants'
import { SEO } from '../components/SEO'

export const Route = createFileRoute('/skills')({
    component: SkillsPage,
})

function SkillsPage() {
    const [page, setPage] = useState(0)
    const [limit] = useState(50)
    const [searchQuery, setSearchQuery] = useState('')
    const [category, setCategory] = useState<string | null>(null)
    const [provider, setProvider] = useState<string | null>(null)
    const [sort, setSort] = useState<'installed' | 'recent' | 'name'>('installed')

    // Fetch skills with caching and server-side filtering
    const { data: searchData, isLoading } = useQuery({
        queryKey: ['public-skills', page, limit, searchQuery, category, provider, sort],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                page: (page + 1).toString(),
                q: searchQuery,
                sort: sort,
                ...(category ? { category } : {}),
                ...(provider ? { author: provider } : {})
            })
            const res = await fetch(`${API_URL}/api/search?${params.toString()}`)
            return res.json()
        },
        placeholderData: (previousData) => previousData
    })

    // Transform data
    const skills: Skill[] = (searchData?.skills || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        tags: typeof s.tags === 'string' ? JSON.parse(s.tags || '[]') : (s.tags || []),
        source: s.github_url,
        author: { name: s.author, github: s.github_owner },
        version: s.version,
        downloads: s.install_count,
        verified: s.is_verified === 1,
        created_at: s.created_at,
    }))

    // We can fetch categories/providers once to populate filters globally if needed,
    // but for now passing the current page's derived data to maintain existing structure
    // or ideally fetching distinct lists. 
    // Given the previous pattern, let's just construct the MarketplaceData object.
    const marketplaceData: MarketplaceData = {
        skills: skills,
        categories: [], // explicit categories can be fetched separately if needed for full list
    }

    const handleSearchChange = (q: string) => {
        setSearchQuery(q)
        setPage(0) // Reset to first page on new search
    }

    const handleCategoryChange = (c: string | null) => {
        setCategory(c)
        setPage(0)
    }

    const handleProviderChange = (p: string | null) => {
        setProvider(p)
        setPage(0)
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <SEO
                title="Skills Directory"
                description="Browse and search the official collection of Ralphy skills. Enhance your AI coding assistant with specialized knowledge."
                keywords={['ralphy', 'skills', 'ai', 'coding assistant', 'marketplace', 'registry']}
            />
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
                <div className="border-b border-gray-200 pb-5 mb-8">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Skills Directory
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Browse and search the official collection of Ralphy skills.
                    </p>
                </div>

                <SkillsList
                    data={marketplaceData}
                    isLoading={isLoading}
                    totalCount={searchData?.pagination?.total || 0}
                    currentPage={page}
                    limit={limit}
                    onPageChange={setPage}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    category={category}
                    onCategoryChange={handleCategoryChange}
                    provider={provider}
                    onProviderChange={handleProviderChange}
                    sort={sort}
                    onSortChange={(s) => setSort(s as any)}
                />
            </div>
        </div>
    )
}
