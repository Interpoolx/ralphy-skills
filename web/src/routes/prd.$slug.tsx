import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ShareModal } from '../components/ShareModal'
import { SEO } from '../components/SEO'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { API_URL } from '../constants'

export const Route = createFileRoute('/prd/$slug')({
  component: PrdPage,
})

interface Prd {
  id: string
  slug: string
  name: string
  description: string
  category: string
  tags: string
  author: string
  version: string
  file_path: string
  content?: string // Added for database-stored content
  view_count: number
  download_count: number
  like_count: number
  created_at: string
  updated_at: string
}

function PrdPage() {
  const { slug } = useParams({ from: '/prd/$slug' })
  const [isLiked, setIsLiked] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [content, setContent] = useState<string | null>(null)

  // Fetch PRD data
  const { data: prd, isLoading } = useQuery<Prd>({
    queryKey: ['prd', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/prds/${slug}`)
      if (!res.ok) throw new Error('PRD not found')
      return res.json()
    }
  })

  // Fetch related PRDs
  const { data: relatedData } = useQuery({
    queryKey: ['related-prds', prd?.category],
    queryFn: async () => {
      if (!prd?.category) return { prds: [] }
      const res = await fetch(`${API_URL}/api/prds?category=${prd.category}&limit=5`)
      return res.json()
    },
    enabled: !!prd?.category
  })

  const relatedPrds = (relatedData?.prds || []).filter((p: Prd) => p.slug !== slug).slice(0, 3)

  // Load PRD content
  useEffect(() => {
    if (prd?.content) {
      setContent(prd.content)
    } else if (prd?.file_path) {
      const contentUrl = prd.file_path.startsWith('http')
        ? prd.file_path
        : `${window.location.origin}${prd.file_path}`

      fetch(contentUrl)
        .then(res => res.text())
        .then(setContent)
        .catch(err => {
          console.error('Failed to load PRD content:', err)
          setContent('*Content could not be loaded.*')
        })
    }
  }, [prd?.file_path, prd?.content])

  // Track view
  useEffect(() => {
    if (slug) {
      fetch(`${API_URL}/api/prds/${slug}/view`, { method: 'POST' }).catch(() => { })
    }
  }, [slug])

  // Load like state
  useEffect(() => {
    const likedPrds = JSON.parse(localStorage.getItem('likedPrds') || '[]')
    setIsLiked(likedPrds.includes(slug))
  }, [slug])

  const toggleLike = () => {
    const likedPrds = JSON.parse(localStorage.getItem('likedPrds') || '[]')
    let newLikedPrds
    if (isLiked) {
      newLikedPrds = likedPrds.filter((id: string) => id !== slug)
    } else {
      newLikedPrds = [...likedPrds, slug]
      fetch(`${API_URL}/api/prds/${slug}/like`, { method: 'POST' }).catch(() => { })
    }
    localStorage.setItem('likedPrds', JSON.stringify(newLikedPrds))
    setIsLiked(!isLiked)
  }

  const handleDownload = async () => {
    if (!prd || !content) return
    await fetch(`${API_URL}/api/prds/${slug}/download`, { method: 'POST' }).catch(() => { })
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prd.slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!prd) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Spec not found</h2>
        <p className="mt-6 text-base leading-7 text-gray-600">The specification you are looking for does not exist.</p>
        <div className="mt-10">
          <Link to="/prds" className="text-sm font-semibold leading-7 text-indigo-600">
            <span aria-hidden="true">&larr;</span> Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  const tags = typeof prd.tags === 'string' ? JSON.parse(prd.tags || '[]') : (prd.tags || [])
  const reportIssueUrl = `https://github.com/Interpoolx/ralphy-skills/issues/new?title=Issue+with+${encodeURIComponent(prd.name)}&body=I+found+an+issue+with+spec:+${prd.slug}`

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={prd.name}
        description={prd.description}
        keywords={tags}
        type="article"
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        skillName={prd.name}
        skillUrl={window.location.href}
      />

      <div className="fixed inset-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-30" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80caff] to-[#4f46e5] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
        ></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/prds" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            &larr; Back to Directory
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl ring-1 ring-gray-200 overflow-hidden p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {prd.name}
                  </h1>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>v{prd.version}</span>
                    <span>•</span>
                    <span>{prd.view_count} views</span>
                    <span>•</span>
                    <span>Updated {prd.updated_at ? new Date(prd.updated_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleLike}
                    className={clsx(
                      "p-2 rounded-full transition-colors",
                      isLiked ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400 hover:text-red-500"
                    )}
                  >
                    <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  <span className="font-semibold">{prd.view_count} views</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                  <span className="font-semibold">{prd.download_count} downloads</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                  {prd.category}
                </div>
              </div>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                {prd.description}
              </p>

              <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Author</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] uppercase">
                      {prd.author?.substring(0, 2)}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 truncate">{prd.author}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                      {prd.category}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Version</h3>
                  <div className="mt-2">
                    <span className="text-sm font-semibold text-gray-900">{prd.version}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <div className="mt-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {prd.updated_at ? new Date(prd.updated_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Specification Content</h2>
              {content ? (
                <MarkdownRenderer content={content} className="prose-content" />
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Download Card */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4">Download This Spec</h3>
              <button
                onClick={handleDownload}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Markdown
              </button>
            </div>

            {/* Resources Card */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <a href={reportIssueUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Report an Issue
                  </a>
                </li>
              </ul>
            </div>

            {/* Tags Card */}
            {tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Specs */}
            {relatedPrds.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Related Specs</h3>
                <div className="space-y-4">
                  {relatedPrds.map((related: Prd) => (
                    <Link
                      key={related.id}
                      to="/prd/$slug"
                      params={{ slug: related.slug }}
                      className="group block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          {related.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {related.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {related.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
