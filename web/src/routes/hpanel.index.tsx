import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/hpanel/')({
    component: Dashboard,
})

interface Skill { id: string; name: string; description: string; category: string; author: string; install_count: number }
interface Stats { skills: number; totalInstalls: number; categories: number }
const API_URL = 'http://localhost:8787'

function Dashboard() {
    const [stats, setStats] = useState<Stats>({ skills: 0, totalInstalls: 0, categories: 0 })
    const [recentSkills, setRecentSkills] = useState<Skill[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, skillsRes] = await Promise.all([
                    fetch(`${API_URL}/api/stats`).catch(() => null),
                    fetch(`${API_URL}/api/search?limit=5`).catch(() => null)
                ])
                if (statsRes?.ok) setStats(await statsRes.json())
                if (skillsRes?.ok) setRecentSkills((await skillsRes.json()).skills || [])
            } catch { }
            setLoading(false)
        }
        fetchData()
    }, [])

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">Welcome to the Ralphy Skills admin panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon="📦" label="Total Skills" value={stats.skills} color="blue" />
                <StatCard icon="⬇️" label="Total Installs" value={stats.totalInstalls} color="green" />
                <StatCard icon="📁" label="Categories" value={stats.categories} color="purple" />
            </div>

            {/* Recent Skills */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Skills</h2>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : recentSkills.length > 0 ? (
                    <div className="space-y-3">
                        {recentSkills.map((skill) => (
                            <div key={skill.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-white">{skill.name}</p>
                                    <p className="text-sm text-gray-400">{skill.category} • {skill.author || 'Unknown'}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                    {skill.install_count || 0} installs
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">No skills yet. Import some to get started!</p>
                        <a href="/hpanel/import" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            📥 Import Skills
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
    }
    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color as keyof typeof colors]} flex items-center justify-center text-xl`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
                </div>
            </div>
        </div>
    )
}
