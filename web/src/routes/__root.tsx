import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Footer } from '../components/Footer'
import { useState } from 'react'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const [docsOpen, setDocsOpen] = useState(false)
    const location = useLocation()

    // Skip header/footer for admin panel
    if (location.pathname.startsWith('/hpanel')) {
        return <Outlet />
    }

    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                Ralphy Skills
                            </Link>
                        </div>
                        <div className="flex gap-6 items-center">
                            <Link
                                to="/"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors [&.active]:text-blue-600"
                            >
                                Home
                            </Link>

                            {/* Docs Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setDocsOpen(!docsOpen)}
                                    onBlur={() => setTimeout(() => setDocsOpen(false), 150)}
                                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                                >
                                    Docs
                                    <svg className={`w-4 h-4 transition-transform ${docsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {docsOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                                        <Link
                                            to="/docs"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            📚 Overview
                                        </Link>
                                        <Link
                                            to="/docs/what-are-skills"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            ❓ What are Skills?
                                        </Link>
                                        <Link
                                            to="/docs/specification"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            📋 Specification
                                        </Link>
                                        <Link
                                            to="/docs/integrate"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            🔌 Integrate Skills
                                        </Link>
                                        <Link
                                            to="/docs/create"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            🛠️ Create Skills
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link
                                to="/skills"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors [&.active]:text-blue-600"
                            >
                                Skills Directory
                            </Link>
                            <Link
                                to="/submit"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors [&.active]:text-blue-600"
                            >
                                Submit Skill
                            </Link>
                            <a
                                href="https://www.npmjs.com/package/ralphy-skills"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                NPM ↗
                            </a>
                            <a
                                href="https://open-vsx.org/extension/Ralphysh/ralphy-sh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Antigravity Kit
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
            <main>
                <Outlet />
            </main>
            <Footer />
            {import.meta.env.DEV && <TanStackRouterDevtools />}
        </div>
    )
}
