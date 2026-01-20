import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { API_CONFIGS, getApiUrl, setApiUrl } from '../lib/api-config'

export const Route = createFileRoute('/hpanel/settings')({
    component: SettingsPage,
})

// Project links storage
function getProjectLinks() {
    if (typeof window === 'undefined') return { npm: '', vscode: '', github: '' }
    return {
        npm: localStorage.getItem('project_npm_url') || 'https://www.npmjs.com/package/ralphy-skills',
        vscode: localStorage.getItem('project_vscode_url') || 'https://open-vsx.org/extension/Ralphysh/ralphy-sh',
        github: localStorage.getItem('project_github_url') || 'https://github.com/Interpoolx/ralphy-skills',
    }
}

function setProjectLinks(links: { npm: string; vscode: string; github: string }) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('project_npm_url', links.npm)
        localStorage.setItem('project_vscode_url', links.vscode)
        localStorage.setItem('project_github_url', links.github)
    }
}

function SettingsPage() {
    const [currentUrl, setCurrentUrl] = useState(getApiUrl())
    const [customUrl, setCustomUrl] = useState('')
    const [saved, setSaved] = useState(false)
    const [linksSaved, setLinksSaved] = useState(false)
    const [projectLinks, setProjectLinksState] = useState(getProjectLinks())

    useEffect(() => {
        setCurrentUrl(getApiUrl())
        setProjectLinksState(getProjectLinks())
        const isPreset = Object.values(API_CONFIGS).some(c => c.url === currentUrl)
        if (!isPreset) setCustomUrl(currentUrl)
    }, [])

    function handleSaveApi(url: string) {
        setApiUrl(url)
        setCurrentUrl(url)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    function handleSaveLinks() {
        setProjectLinks(projectLinks)
        setLinksSaved(true)
        setTimeout(() => setLinksSaved(false), 2000)
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400">Configure admin panel settings</p>
            </div>

            <div className="max-w-2xl space-y-6">
                {saved && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        ✅ API settings saved! Refresh the page to apply changes.
                    </div>
                )}

                {/* API Configuration */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">🔌 API Configuration</h2>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-400 mb-4">
                            Current API: <code className="text-blue-400">{currentUrl}</code>
                        </p>

                        <div className="grid gap-3">
                            {Object.entries(API_CONFIGS).map(([key, config]) => (
                                <div
                                    key={key}
                                    onClick={() => handleSaveApi(config.url)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${currentUrl === config.url
                                            ? 'bg-blue-600/20 border-blue-500'
                                            : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-white">{config.label}</p>
                                            <p className="text-sm text-gray-400">{config.description}</p>
                                            <code className="text-xs text-gray-500 mt-1 block">{config.url}</code>
                                        </div>
                                        {currentUrl === config.url && (
                                            <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Active</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Custom API URL</label>
                            <div className="flex gap-3">
                                <input
                                    type="url"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="https://your-worker.workers.dev"
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => customUrl && handleSaveApi(customUrl)}
                                    disabled={!customUrl}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Links */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">🔗 Project Links</h2>

                    {linksSaved && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                            ✅ Links saved!
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">📦 NPM Package URL</label>
                            <input
                                type="url"
                                value={projectLinks.npm}
                                onChange={(e) => setProjectLinksState({ ...projectLinks, npm: e.target.value })}
                                placeholder="https://www.npmjs.com/package/your-package"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">🧩 VS Code Extension URL</label>
                            <input
                                type="url"
                                value={projectLinks.vscode}
                                onChange={(e) => setProjectLinksState({ ...projectLinks, vscode: e.target.value })}
                                placeholder="https://open-vsx.org/extension/..."
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">🐙 GitHub Repository URL</label>
                            <input
                                type="url"
                                value={projectLinks.github}
                                onChange={(e) => setProjectLinksState({ ...projectLinks, github: e.target.value })}
                                placeholder="https://github.com/user/repo"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={handleSaveLinks}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save Project Links
                        </button>
                    </div>
                </div>

                {/* Quick Links Preview */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">🔗 Quick Links Preview</h2>
                    <div className="grid gap-3">
                        {projectLinks.npm && (
                            <a href={projectLinks.npm} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <span className="text-xl">📦</span>
                                <div className="flex-1 truncate">
                                    <p className="text-white text-sm font-medium">NPM Package</p>
                                    <p className="text-gray-400 text-xs truncate">{projectLinks.npm}</p>
                                </div>
                                <span className="text-gray-400">↗</span>
                            </a>
                        )}
                        {projectLinks.vscode && (
                            <a href={projectLinks.vscode} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <span className="text-xl">🧩</span>
                                <div className="flex-1 truncate">
                                    <p className="text-white text-sm font-medium">VS Code Extension</p>
                                    <p className="text-gray-400 text-xs truncate">{projectLinks.vscode}</p>
                                </div>
                                <span className="text-gray-400">↗</span>
                            </a>
                        )}
                        {projectLinks.github && (
                            <a href={projectLinks.github} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <span className="text-xl">🐙</span>
                                <div className="flex-1 truncate">
                                    <p className="text-white text-sm font-medium">GitHub Repository</p>
                                    <p className="text-gray-400 text-xs truncate">{projectLinks.github}</p>
                                </div>
                                <span className="text-gray-400">↗</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Account */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">👤 Account</h2>
                    <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-xl">👤</div>
                        <div>
                            <p className="font-medium text-white">Admin</p>
                            <p className="text-sm text-gray-400">admin@ralphy.sh</p>
                        </div>
                    </div>
                </div>

                {/* Database Info */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">🗄️ Database</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-700">
                            <span className="text-gray-400">Provider</span>
                            <span className="text-white">Cloudflare D1</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-700">
                            <span className="text-gray-400">Database Name</span>
                            <span className="text-white">ralphy-skills-db</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-400">Status</span>
                            <span className="text-green-400">● Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
