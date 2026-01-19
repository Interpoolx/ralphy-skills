import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { MarketplaceData, Skill } from '../types'

function normalizeText(value: string | undefined): string {
    return String(value ?? '').toLowerCase()
}

function matchesQuery(skill: Skill, query: string): boolean {
    if (!query) return true

    const haystack = [
        skill.id,
        skill.name,
        skill.description,
        ...(skill.tags || []),
        ...(skill.keywords || []),
        skill.category,
        skill.author?.name,
        skill.author?.github,
    ]
        .map(normalizeText)
        .join(' ')

    return haystack.includes(query)
}

export function SkillsList({ data }: { data: MarketplaceData }) {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<string | null>(null)
    const [provider, setProvider] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<'installed' | 'recent' | 'name'>('installed')

    const filteredSkills = useMemo(() => {
        const query = normalizeText(search).trim()
        let result = data.skills.filter((skill) => {
            const categoryOk = !category || skill.category === category
            const providerOk = !provider || skill.author?.name === provider
            const queryOk = matchesQuery(skill, query)
            return categoryOk && queryOk && providerOk
        })

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'installed') {
                return (b.downloads || 0) - (a.downloads || 0)
            } else if (sortBy === 'recent') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                return dateB - dateA
            } else {
                return a.name.localeCompare(b.name)
            }
        })

        return result
    }, [data.skills, search, category, provider, sortBy])

    const categories = useMemo(() => {
        if (data.categories && data.categories.length > 0) return data.categories
        return [...new Set(data.skills.map((s) => s.category).filter(Boolean))]
    }, [data])

    const providers = useMemo(() => {
        return [...new Set(data.skills.map((s) => s.author?.name).filter(Boolean))]
    }, [data])

    return (
        <div className="space-y-8">
            {/* Filters & Search */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:w-96">
                        <input
                            type="text"
                            placeholder="Search skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border-0 py-2.5 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>

                    <div className="flex gap-4 w-full sm:w-auto">
                        <select
                            value={provider || ''}
                            onChange={(e) => setProvider(e.target.value || null)}
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                            <option value="">All Providers</option>
                            {providers.map((p) => (
                                <option key={p} value={p as string}>{p}</option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
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
                            onClick={() => setCategory(null)}
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
                                onClick={() => setCategory(cat)}
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
                        {filteredSkills.length} skills found
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
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

                                <p className="mt-2 text-sm leading-6 text-gray-600 flex-1">
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
                                        {skill.downloads.toLocaleString()} installs
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
        </div>
    )
}
