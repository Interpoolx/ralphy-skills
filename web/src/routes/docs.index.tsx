import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/')({
    component: DocsOverview,
})

function DocsOverview() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <span>🚀</span>
                        <span>Agent Skills Specification v1.0</span>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Universal Skills for AI Coding Agents
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Ralphy Skills brings structured, reusable capabilities to AI coding assistants.
                        One skill format, works with 15+ AI tools.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/docs/what-are-skills"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Learn About Skills
                        </Link>
                        <a
                            href="https://www.npmjs.com/package/ralphy-skills"
                            target="_blank"
                            rel="noopener"
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Get Started →
                        </a>
                    </div>
                </div>
            </section>

            {/* Quick Navigation */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Documentation</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DocCard
                            icon="📚"
                            title="What are Skills?"
                            description="Understand the concept of AI agent skills and how they enhance coding assistants."
                            href="/docs/what-are-skills"
                        />
                        <DocCard
                            icon="📋"
                            title="Specification"
                            description="Technical specification for creating skills that work across all AI tools."
                            href="/docs/specification"
                        />
                        <DocCard
                            icon="🔌"
                            title="Integrate Skills"
                            description="Learn how to integrate skills into your AI coding workflow."
                            href="/docs/integrate"
                        />
                        <DocCard
                            icon="🛠️"
                            title="Create Skills"
                            description="Build your own custom skills for specific use cases."
                            href="/docs/create"
                        />
                    </div>
                </div>
            </section>

            {/* Supported Clients */}
            <section className="py-16 px-4 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Supported AI Clients</h2>
                    <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                        Ralphy Skills works seamlessly with 15+ AI coding tools. One skill format, universal compatibility.
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {clients.map(client => (
                            <div key={client.id} className="bg-white p-4 rounded-lg border border-gray-100 text-center hover:border-blue-200 transition-colors">
                                <span className="text-2xl mb-2 block">{client.icon}</span>
                                <span className="text-sm font-medium text-gray-700">{client.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Ralphy Skills?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="🌐"
                            title="Universal Format"
                            description="One skill format works with Cursor, Copilot, Claude Code, Windsurf, and 11 more AI tools."
                        />
                        <FeatureCard
                            icon="📦"
                            title="Easy Installation"
                            description="Install skills with a single command: npx ralphy-skills install <skill-name>"
                        />
                        <FeatureCard
                            icon="🔄"
                            title="Auto Sync"
                            description="Automatically sync skills to AGENTS.md for AI agent consumption."
                        />
                        <FeatureCard
                            icon="🔒"
                            title="Lock Files"
                            description="Reproducible installations with skills-lock.json for teams."
                        />
                        <FeatureCard
                            icon="🩺"
                            title="Diagnostics"
                            description="Built-in doctor command to detect AI tools and troubleshoot."
                        />
                        <FeatureCard
                            icon="🚀"
                            title="Multi-Export"
                            description="Export skills to all detected AI tools simultaneously."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
                    <p className="text-blue-100 mb-8 text-lg">
                        Install the CLI and browse the skills directory.
                    </p>
                    <div className="bg-black/20 rounded-lg p-4 inline-block mb-6">
                        <code className="text-white font-mono">npx ralphy-skills search</code>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/skills"
                            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                        >
                            Browse Skills
                        </Link>
                        <Link
                            to="/docs/integrate"
                            className="border border-white/50 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                        >
                            Integration Guide
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

function DocCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
    return (
        <Link
            to={href}
            className="bg-white p-6 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group"
        >
            <span className="text-3xl mb-4 block">{icon}</span>
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </Link>
    )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="text-center p-6">
            <span className="text-4xl mb-4 block">{icon}</span>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    )
}

const clients = [
    { id: 'cursor', name: 'Cursor', icon: '🖱️' },
    { id: 'copilot', name: 'Copilot', icon: '🤖' },
    { id: 'claude', name: 'Claude Code', icon: '🧠' },
    { id: 'windsurf', name: 'Windsurf', icon: '🏄' },
    { id: 'gemini', name: 'Gemini CLI', icon: '💎' },
    { id: 'aider', name: 'Aider', icon: '🔧' },
    { id: 'opencode', name: 'OpenCode', icon: '📂' },
    { id: 'codex', name: 'Codex CLI', icon: '🤯' },
    { id: 'amp', name: 'Amp', icon: '⚡' },
    { id: 'goose', name: 'Goose', icon: '🪿' },
    { id: 'letta', name: 'Letta', icon: '🧠' },
    { id: 'trae', name: 'Trae', icon: '🎯' },
    { id: 'qoder', name: 'Qoder', icon: '🔷' },
    { id: 'codebuddy', name: 'CodeBuddy', icon: '👯' },
    { id: 'antigravity', name: 'Antigravity', icon: '🚀' },
]
