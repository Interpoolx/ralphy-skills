import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { MarketplaceData } from '../types'

export function SkillsList({
    data,
    isLoading,
    totalCount,
    currentPage,
    limit,
    onPageChange,
    searchQuery,
    onSearchChange,
    category,
    onCategoryChange,
    provider,
    onProviderChange,
    sort,
    onSortChange,
    hideControls = false
}: {
    data: MarketplaceData
    isLoading: boolean
    totalCount: number
    currentPage: number
    limit: number
    onPageChange: (page: number) => void
    searchQuery: string
    onSearchChange: (q: string) => void
    category: string | null
    onCategoryChange: (c: string | null) => void
    provider: string | null
    onProviderChange: (p: string | null) => void
    sort: string
    onSortChange: (s: string) => void
    hideControls?: boolean
}) {
    // Unique values from current page data is insufficient for global filters,
    // but without a global stats prop passed down, we rely on what we have or external props.
    // Ideally parent should pass unique options. For now, let's keep deriving from data (which is just one page)
    // OR arguably we should just show common categories.
    // The previous implementation derived from data. Let's keep that for now but acknowledge limitation.
    // Actually, parent (SkillsPage) fetches top level stats/filters if we want robust filters.
    // For simplicity given the request, let's rely on data and maybe assume Parent passes allCategories/allProviders if needed.
    // Let's stick to simple deriving for valid display, but acknowledging specific filter request might need global options.

    // We'll use the derived lists from the current data chunk for now to avoid huge refactor, 
    // unless data includes metadata about global categories.
    // A better approach for 12k items: The API should return available facets.
    // For this step, I will trust the parent `SkillsPage` to handle data fetching and just render what I get.

    const categories = useMemo(() => {
        if (data.categories?.length) return data.categories
        return [...new Set(data.skills.map((s) => s.category).filter(Boolean))]
    }, [data])

    const providers = useMemo(() => {
        return [...new Set(data.skills.map((s) => s.author?.name).filter(Boolean))]
    }, [data])

    const totalPages = Math.ceil(totalCount / limit)

    return (
        <div className="space-y-8">
            {/* Filters & Search */}
            {!hideControls && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="relative w-full sm:w-96">
                            <input
                                type="text"
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full rounded-lg border-0 py-2.5 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>

                        <div className="flex gap-4 w-full sm:w-auto">
                            <select
                                value={provider || ''}
                                onChange={(e) => onProviderChange(e.target.value || null)}
                                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                <option value="">All Providers</option>
                                {providers.map((p) => (
                                    <option key={p} value={p as string}>{p}</option>
                                ))}
                            </select>

                            <select
                                value={sort}
                                onChange={(e) => onSortChange(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                <option value="installed">Most Installed</option>
                                <option value="recent">Recently Added</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => onCategoryChange(null)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === null
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300'
                                    }`}
                            >
                                All
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onCategoryChange(cat)}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === cat
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300'
                                        }`}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="text-sm text-gray-500 hidden sm:block">
                            {totalCount} skills found
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    // Skeleton Loading
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="flex gap-2 pt-2">
                                <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                                <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                            </div>
                        </div>
                    ))
                ) : data.skills.length > 0 ? (
                    data.skills.map((skill) => (
                        <div
                            key={skill.id}
                            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 transition-all hover:shadow-lg hover:ring-indigo-600/20"
                        >
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        {skill.category}
                                    </div>
                                    {skill.verified && (
                                        <div className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                            Verified
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-semibold leading-6 text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    <Link to="/skill/$skillId" params={{ skillId: skill.id }} className="focus:outline-none">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        {skill.name}
                                    </Link>
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-600 flex-1 line-clamp-3">
                                    {skill.description}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {skill.tags?.slice(0, 3).map(tag => (
                                        <span key={tag} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                                <div>
                                    by <span className="font-medium text-gray-900">{skill.author?.name || 'Unknown'}</span>
                                </div>
                                {skill.downloads && (
                                    <div>
                                        {(skill.downloads || 0).toLocaleString()} installs
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No skills found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => onPageChange(0)}
                        disabled={currentPage === 0}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        First
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Last
                    </button>
                </div>
            )}
        </div>
    )
}
