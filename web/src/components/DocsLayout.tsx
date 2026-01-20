import { Link, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface TOCItem {
    id: string
    title: string
    level: number
}

interface DocsLayoutProps {
    children: ReactNode
    title: string
    description: string
    toc: TOCItem[]
}

const docNav = [
    {
        title: 'Getting Started',
        items: [
            { title: 'Overview', href: '/docs' },
            { title: 'What are Skills?', href: '/docs/what-are-skills' },
        ]
    },
    {
        title: 'Core Concepts',
        items: [
            { title: 'Specification', href: '/docs/specification' },
            { title: 'Integrate Skills', href: '/docs/integrate' },
            { title: 'Create Skills', href: '/docs/create' },
        ]
    },
    {
        title: 'CLI Reference',
        items: [
            { title: 'Installation', href: '/docs/cli-install' },
            { title: 'Commands', href: '/docs/cli-commands' },
        ]
    },
    {
        title: 'Resources',
        items: [
            { title: 'Skills Directory', href: '/skills' },
            { title: 'Submit a Skill', href: '/submit' },
        ]
    }
]

export function DocsLayout({ children, title, description, toc }: DocsLayoutProps) {
    const location = useLocation()
    const currentPath = location.pathname

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex">
                    {/* Left Sidebar - Navigation */}
                    <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-100">
                        <nav className="sticky top-20 py-8 pr-8 max-h-[calc(100vh-5rem)] overflow-y-auto">
                            {docNav.map((section) => (
                                <div key={section.title} className="mb-6">
                                    <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                        {section.title}
                                    </h5>
                                    <ul className="space-y-1">
                                        {section.items.map((item) => (
                                            <li key={item.href}>
                                                <Link
                                                    to={item.href}
                                                    className={`block py-1.5 px-3 rounded-md text-sm transition-colors ${currentPath === item.href
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {item.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0 py-8 lg:px-8">
                        <article className="max-w-3xl">
                            <header className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                                <p className="text-lg text-gray-600">{description}</p>
                            </header>
                            <div className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900">
                                {children}
                            </div>
                        </article>
                    </main>

                    {/* Right Sidebar - Table of Contents */}
                    <aside className="hidden xl:block w-64 shrink-0">
                        <div className="sticky top-20 py-8 pl-8 max-h-[calc(100vh-5rem)] overflow-y-auto">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                On this page
                            </h5>
                            <nav>
                                <ul className="space-y-2">
                                    {toc.map((item) => (
                                        <li
                                            key={item.id}
                                            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                                        >
                                            <a
                                                href={`#${item.id}`}
                                                className="block text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                            >
                                                {item.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export function CodeBlock({ children, language = 'bash', filename }: { children: string; language?: string; filename?: string }) {
    return (
        <div className="relative group not-prose">
            {filename && (
                <div className="bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-t-lg border-b border-gray-700">
                    {filename}
                </div>
            )}
            <pre className={`bg-gray-900 text-gray-100 p-4 ${filename ? 'rounded-b-lg' : 'rounded-lg'} overflow-x-auto`}>
                <code className={`language-${language}`}>{children}</code>
            </pre>
            <button
                onClick={() => navigator.clipboard.writeText(children)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
            >
                Copy
            </button>
        </div>
    )
}

export function InfoBox({ type = 'note', title, children }: { type?: 'note' | 'tip' | 'warning'; title?: string; children: ReactNode }) {
    const styles = {
        note: 'bg-blue-50 border-blue-500 text-blue-800',
        tip: 'bg-green-50 border-green-500 text-green-800',
        warning: 'bg-amber-50 border-amber-500 text-amber-800',
    }
    const icons = {
        note: 'ℹ️',
        tip: '💡',
        warning: '⚠️',
    }

    return (
        <div className={`border-l-4 p-4 rounded-r-lg ${styles[type]}`}>
            {title && (
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <span>{icons[type]}</span>
                    {title}
                </h5>
            )}
            <div className="text-sm">{children}</div>
        </div>
    )
}

export function FieldTable({ fields }: { fields: { name: string; type: string; required?: boolean; description: string }[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-900">Field</th>
                        <th className="text-left py-3 pr-4 font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 font-semibold text-gray-900">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field) => (
                        <tr key={field.name} className="border-b border-gray-100">
                            <td className="py-3 pr-4">
                                <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded font-mono">{field.name}</code>
                                {field.required && <span className="ml-2 text-xs text-red-500">required</span>}
                            </td>
                            <td className="py-3 pr-4 text-gray-600">{field.type}</td>
                            <td className="py-3 text-gray-600">{field.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
