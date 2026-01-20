import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_URL } from '../constants'
import { SEO } from '../components/SEO'

export const Route = createFileRoute('/prds')({
  component: PrdsPage,
})

interface Prd {
  id: string
  slug: string
  name: string
  description: string
  category: string
  tags: string
  author: string
  version: string
  file_path: string
  view_count: number
  download_count: number
  like_count: number
  created_at: string
}

function PrdsPage() {
  const [page, setPage] = useState(0)
  const [limit] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<'views' | 'recent' | 'name' | 'likes'>('views')

  // Fetch PRDs
  const { data, isLoading } = useQuery({
    queryKey: ['prds', page, limit, searchQuery, category, sort],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: (page + 1).toString(),
        q: searchQuery,
        sort: sort,
        ...(category ? { category } : {})
      })
      const res = await fetch(`${API_URL}/api/prds?${params.toString()}`)
      return res.json()
    },
    placeholderData: (previousData) => previousData
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['prd-categories'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/prds/categories`)
      return res.json()
    }
  })

  const prds: Prd[] = data?.prds || []
  const categories = categoriesData || []
  const totalCount = data?.pagination?.total || 0

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setPage(0)
  }

  const handleCategoryChange = (c: string | null) => {
    setCategory(c)
    setPage(0)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <SEO
        title="Open Specs Directory"
        description="Browse PRDs and technical specifications. Find proven templates for your next project."
        keywords={['prd', 'specs', 'product requirements', 'technical specification', 'templates']}
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="border-b border-gray-200 pb-5 mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Specs Directory
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Browse PRDs and technical specifications for your projects.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search specs..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2.5"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category || ''}
            onChange={(e) => handleCategoryChange(e.target.value || null)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2.5"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2.5"
          >
            <option value="views">Most Viewed</option>
            <option value="likes">Most Liked</option>
            <option value="recent">Recently Added</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {totalCount} {totalCount === 1 ? 'spec' : 'specs'} found
        </p>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : prds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No specs found. Try adjusting your filters.</p>
          </div>
        ) : (
          /* PRD Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prds.map((prd) => (
              <Link
                key={prd.id}
                to="/prd/$slug"
                params={{ slug: prd.slug }}
                className="group bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md hover:ring-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                    {prd.category}
                  </span>
                  <span className="text-xs text-gray-400">v{prd.version}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {prd.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {prd.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{prd.author}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {prd.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {prd.like_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > limit && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              Page {page + 1} of {Math.ceil(totalCount / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= totalCount}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
