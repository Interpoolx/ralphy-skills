import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useEffect, useCallback } from 'react'

interface MarkdownEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
}

/**
 * Tiptap-based markdown editor with toolbar
 */
export function MarkdownEditor({ content, onChange, placeholder = 'Start writing...' }: MarkdownEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4] },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            // Convert to markdown-like text
            onChange(editor.getText())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
    })

    useEffect(() => {
        if (editor && content !== editor.getText()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) return null

    return (
        <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-800 border-b border-gray-600">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    H3
                </button>
                <div className="w-px bg-gray-600 mx-1" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 text-xs rounded font-bold ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    B
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 text-xs rounded italic ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    I
                </button>
                <div className="w-px bg-gray-600 mx-1" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 text-xs rounded ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    • List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 text-xs rounded ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    1. List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`px-2 py-1 text-xs rounded font-mono ${editor.isActive('codeBlock') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    {'</>'}
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-2 py-1 text-xs rounded ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                    Quote
                </button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} className="bg-gray-800 text-gray-100 min-h-[400px]" />
        </div>
    )
}

interface EditorModalProps {
    isOpen: boolean
    onClose: () => void
    prdId: string
    onSave: (content: string) => Promise<void>
    apiUrl: string
}

/**
 * Modal with markdown editor for PRD content
 */
export function EditorModal({ isOpen, onClose, prdId, onSave, apiUrl }: EditorModalProps) {
    const [rawContent, setRawContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load file content
    // Load file content
    useEffect(() => {
        if (isOpen && prdId) {
            setLoading(true)
            setError(null)

            fetch(`${apiUrl}/${prdId}`, {
                headers: {
                    'Authorization': 'Bearer ralphy-default-admin-token'
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('File not found')
                    return res.json()
                })
                .then(data => {
                    setRawContent(data.content || '')
                    setLoading(false)
                })
                .catch(err => {
                    setError(err.message)
                    setLoading(false)
                })
        }
    }, [isOpen, prdId])

    const handleSave = useCallback(async () => {
        setSaving(true)
        try {
            await onSave(rawContent)
            // Removed onClose() to keep modal open after saving
        } catch (err) {
            setError('Failed to save')
        }
        setSaving(false)
    }, [rawContent, onSave])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8">
            <div className="bg-gray-900 rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">📝</span> Edit Specification Content
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 font-mono">{prdId}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-gray-950">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="text-gray-400 animate-pulse">Loading content...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="max-w-md w-full p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                                <div className="text-3xl mb-4">⚠️</div>
                                <h3 className="text-lg font-bold text-red-400 mb-2">Failed to load content</h3>
                                <p className="text-sm text-red-300/70 mb-6">{error}</p>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    Close Editor
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 relative group">
                            <textarea
                                value={rawContent}
                                onChange={(e) => setRawContent(e.target.value)}
                                className="absolute inset-0 w-full h-full bg-transparent text-gray-100 p-8 font-mono text-base leading-relaxed focus:outline-none resize-none selection:bg-blue-500/30 custom-scrollbar"
                                placeholder="# Start writing your specification..."
                                spellCheck={false}
                                autoFocus
                            />
                            <div className="absolute top-4 right-8 text-[10px] font-mono text-gray-600 uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                Markdown Mode
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-gray-900/50 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 hidden sm:block">
                            <span className="text-blue-400 font-bold">Tip:</span> Use markdown headers, lists, and tables for best display.
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:text-white transition-all"
                        >
                            Discard Changes
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 border border-blue-500 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span>💾</span> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
