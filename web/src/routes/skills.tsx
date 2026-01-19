import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SkillsList } from '../components/SkillsList'
import type { MarketplaceData } from '../types'
import { MARKETPLACE_URL } from '../constants'

export const Route = createFileRoute('/skills')({
    component: SkillsPage,
})

function SkillsPage() {
    const [data, setData] = useState<MarketplaceData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(MARKETPLACE_URL)
            .then((res) => res.json())
            .then((data) => {
                setData(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Failed to load marketplace data:', err)
                setLoading(false)
            })
    }, [])

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
                <div className="border-b border-gray-200 pb-5 mb-8">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Skills Directory
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Browse and search the official collection of Ralphy skills.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : data ? (
                    <SkillsList data={data} />
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        Failed to load skills directory.
                    </div>
                )}
            </div>
        </div>
    )
}
