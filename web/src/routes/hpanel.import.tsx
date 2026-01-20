import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/hpanel/import')({
    component: ImportPage,
})

const API_URL = 'http://localhost:8787'

function ImportPage() {
    const [importing, setImporting] = useState<string | null>(null)
    const [result, setResult] = useState<{ source: string; imported: number; errors: number } | null>(null)

    async function importFromSource(source: 'marketplace' | 'claude-plugins') {
        setImporting(source)
        setResult(null)

        try {
            let skills = []

            if (source === 'marketplace') {
                const res = await fetch('https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/marketplace.json')
                const data = await res.json()
                skills = data.skills || []
            } else if (source === 'claude-plugins') {
                const res = await fetch('https://api.claude-plugins.dev/api/skills?limit=500')
                const data = await res.json()
                skills = data.skills || []
            }

            const importRes = await fetch(`${API_URL}/api/admin/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills })
            })

            if (importRes.ok) {
                const data = await importRes.json()
                setResult({ source, imported: data.imported, errors: data.errors })
            }
        } catch (error) {
            console.error('Import failed:', error)
        }

        setImporting(null)
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Import Skills</h1>
                <p className="text-gray-400">Bulk import skills from external sources</p>
            </div>

            <div className="max-w-2xl space-y-6">
                {result && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                        ✅ Import from {result.source} complete: {result.imported} imported, {result.errors} errors
                    </div>
                )}

                {/* Marketplace.json */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">📦</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">Import from marketplace.json</h3>
                            <p className="text-gray-400 text-sm mt-1">Import skills from our GitHub repository registry</p>
                            <p className="text-gray-500 text-xs mt-2">Source: github.com/Interpoolx/ralphy-skills/marketplace.json</p>
                        </div>
                        <button
                            onClick={() => importFromSource('marketplace')}
                            disabled={importing !== null}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {importing === 'marketplace' ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </div>

                {/* Claude Plugins API */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl">🔌</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">Import from claude-plugins.dev</h3>
                            <p className="text-gray-400 text-sm mt-1">Import 2000+ skills from their registry API</p>
                            <p className="text-gray-500 text-xs mt-2">Source: api.claude-plugins.dev</p>
                        </div>
                        <button
                            onClick={() => importFromSource('claude-plugins')}
                            disabled={importing !== null}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {importing === 'claude-plugins' ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </div>

                {/* Manual JSON */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 opacity-50">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">📄</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">Import from JSON file</h3>
                            <p className="text-gray-400 text-sm mt-1">Upload a JSON file with skills data</p>
                            <p className="text-gray-500 text-xs mt-2">Coming soon...</p>
                        </div>
                        <button disabled className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed">
                            Upload
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
