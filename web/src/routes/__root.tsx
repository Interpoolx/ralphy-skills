import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Footer } from '../components/Footer'

export const Route = createRootRoute({
    component: () => (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                Ralphy Skills
                            </Link>
                        </div>
                        <div className="flex gap-6">
                            <Link
                                to="/"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors [&.active]:text-blue-600"
                            >
                                Home
                            </Link>
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
                                NPM Package ↗
                            </a>
                            <a
                                href="https://open-vsx.org/extension/Ralphysh/ralphy-sh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                Get Antigravity Kit ↗
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
            <main>
                <Outlet />
            </main>
            <Footer />
            <TanStackRouterDevtools />
        </div>
    ),
})
