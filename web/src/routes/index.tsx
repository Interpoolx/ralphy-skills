import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SkillsList } from '../components/SkillsList'
import type { MarketplaceData } from '../types'
import { API_URL } from '../constants'

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    const [data, setData] = useState<MarketplaceData | null>(null)

    useEffect(() => {
        // Fetch from D1 API - Top 25 most installed
        fetch(`${API_URL}/api/search?limit=25&sort=installs`)
            .then((res) => res.json())
            .then((apiData) => {
                // Transform API response to MarketplaceData format
                const skills = (apiData.skills || []).map((s: any) => ({
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

                // Get unique categories
                const categories = [...new Set(skills.map((s: any) => s.category).filter(Boolean))]

                setData({ skills, categories } as MarketplaceData)
            })
            .catch((err) => console.error('Failed to load skills from API:', err))
    }, [])

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative isolate overflow-hidden pt-14">
                <div
                    className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-20"
                    aria-hidden="true"
                >
                    <div
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
                        }}
                    ></div>
                </div>

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Supercharge your AI Agent
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Discover, deploy, and share high-quality agentic skills. <br />
                            The official marketplace for Ralphy and modern coding assistants.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <a href="#skills" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
                                Browse Library
                            </a>
                            <div className="text-sm font-semibold leading-6 text-gray-900">
                                npx ralphy-skills <span aria-hidden="true">→</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flow-root sm:mt-24">
                        <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                            <img
                                src="/hero-screenshot.png"
                                alt="Ralphy Skills Dashboard Screenshot"
                                width={2432}
                                height={1442}
                                className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Built for Agents</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Everything your agent needs to succeed
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Ralphy Skills provides a standardized way to package, distribute, and consume context and capabilities for AI agents.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                                Verified Quality
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                <p className="flex-auto">All skills are reviewed for quality, clarity, and safety to ensure your agent gets the best context.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                                Seamless Integration
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                <p className="flex-auto">Install skills directly via CLI or the VS Code extension with a single command.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                                Open Source
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                <p className="flex-auto">Powered by the community. Contribute your own skills and help build the ecosystem.</p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* CLI Deep Dive Section */}
            <div className="py-24 sm:py-32 bg-gray-900 text-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Master the CLI</h2>
                        <p className="mt-6 text-lg leading-8 text-gray-300">
                            The <code className="text-indigo-400">ralphy-skills</code> CLI is the fastest way to equip your AI agent with new capabilities.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl lg:mx-0 lg:max-w-none">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
                            <div>
                                <div className="bg-white/5 rounded-xl p-6 ring-1 ring-white/10">
                                    <h3 className="text-sm font-semibold leading-7 text-indigo-400">Quick Start</h3>
                                    <div className="mt-4 flex flex-col gap-4">
                                        <div className="group relative rounded-md bg-black/30 p-4 ring-1 ring-white/10">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-mono text-gray-500">Run without installing</span>
                                            </div>
                                            <code className="text-sm font-mono text-white">npx ralphy-skills</code>
                                        </div>
                                        <div className="group relative rounded-md bg-black/30 p-4 ring-1 ring-white/10">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-mono text-gray-500">Show help & commands</span>
                                            </div>
                                            <code className="text-sm font-mono text-white">npx ralphy-skills --help</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold leading-8 text-white">Key Features</h3>
                                <ul role="list" className="mt-4 space-y-4 text-base leading-7 text-gray-300">
                                    <li className="flex gap-x-3">
                                        <svg className="h-7 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                        <span><strong className="font-semibold text-white">Interactive Menu:</strong> Browse and select skills with a simple CLI interface.</span>
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-7 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                        <span><strong className="font-semibold text-white">Direct Install:</strong> Install specific skills by ID (`npx ralphy-skills install [id]`).</span>
                                    </li>
                                    <li className="flex gap-x-3">
                                        <svg className="h-7 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                        <span><strong className="font-semibold text-white">Zero Config:</strong> Works instantly with no setup required.</span>
                                    </li>
                                </ul>
                                <div className="mt-8">
                                    <a href="https://www.npmjs.com/package/ralphy-skills" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold leading-6 text-indigo-400 hover:text-indigo-300">
                                        View on NPM <span aria-hidden="true">→</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skills Preview Section */}
            <div id="skills" className="bg-gray-50/50 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Popular Skills
                        </h2>
                        <p className="mt-2 text-lg leading-8 text-gray-600">
                            Check out the most used skills by the community.
                        </p>
                    </div>
                    {data ? (
                        <SkillsList data={data} />
                    ) : (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}
                    <div className="mt-16 text-center">
                        <Link to="/skills" className="text-sm font-semibold leading-6 text-indigo-600">
                            View all skills <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
