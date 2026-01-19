import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { MarketplaceData, Skill } from '../types'
import { MARKETPLACE_URL } from '../constants'
import confetti from 'canvas-confetti'
import clsx from 'clsx'
import { ShareModal } from '../components/ShareModal'

export const Route = createFileRoute('/skill/$skillId')({
  component: SkillPage,
})

function SkillPage() {
  const { skillId } = useParams({ from: '/skill/$skillId' })
  const [skill, setSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(true)

  // Local State for interactions
  const [isLiked, setIsLiked] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    // Load Skill Data
    fetch(MARKETPLACE_URL)
      .then((res) => res.json())
      .then((data: MarketplaceData) => {
        const found = data.skills.find((s) => s.id === skillId)
        setSkill(found || null)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load skill:', err)
        setLoading(false)
      })

    // Load User State
    const likedSkills = JSON.parse(localStorage.getItem('likedSkills') || '[]')
    setIsLiked(likedSkills.includes(skillId))

    const installedSkills = JSON.parse(localStorage.getItem('installedSkills') || '[]')
    setIsInstalled(installedSkills.includes(skillId))
  }, [skillId])

  const toggleLike = () => {
    const likedSkills = JSON.parse(localStorage.getItem('likedSkills') || '[]')
    let newLikedSkills
    if (isLiked) {
      newLikedSkills = likedSkills.filter((id: string) => id !== skillId)
    } else {
      newLikedSkills = [...likedSkills, skillId]
    }
    localStorage.setItem('likedSkills', JSON.stringify(newLikedSkills))
    setIsLiked(!isLiked)
  }

  const toggleInstalled = () => {
    const installedSkills = JSON.parse(localStorage.getItem('installedSkills') || '[]')
    let newInstalledSkills

    if (isInstalled) {
      newInstalledSkills = installedSkills.filter((id: string) => id !== skillId)
      localStorage.setItem('installedSkills', JSON.stringify(newInstalledSkills))
      setIsInstalled(false)
    } else {
      newInstalledSkills = [...installedSkills, skillId]
      localStorage.setItem('installedSkills', JSON.stringify(newInstalledSkills))
      setIsInstalled(true)

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }



  const reportIssueUrl = skill ? `https://github.com/Interpoolx/ralphy-skills/issues/new?title=Issue+with+${skill.name}&body=I+found+an+issue+with+skill:+${skill.id}` : '#'

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Skill not found</h2>
        <p className="mt-6 text-base leading-7 text-gray-600">The skill you are looking for does not exist.</p>
        <div className="mt-10">
          <Link to="/skills" className="text-sm font-semibold leading-7 text-indigo-600">
            <span aria-hidden="true">&larr;</span> Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        skillName={skill?.name || ''}
        skillUrl={window.location.href}
      />
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-30"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
          }}
        ></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/skills" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
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
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      {skill.name}
                    </h1>
                    {skill.verified && (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>v{skill.version || '1.0.0'}</span>
                    <span>•</span>
                    <span>{(skill.downloads || 0) + (isInstalled ? 1 : 0)} installs</span>
                    <span>•</span>
                    <span>Updated {skill.created_at ? new Date(skill.created_at).toLocaleDateString() : 'Recently'}</span>
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
                    className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors relative"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                {skill.description}
              </p>

              <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
                {skill.author && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Author</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                        {skill.author.name.substring(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{skill.author.name}</span>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                      {skill.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Installation Card */}
            <div className="bg-gray-900 text-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-4">Installation</h2>
              <p className="text-gray-400 text-sm mb-6">Run this command in your terminal to add this skill to your agent.</p>

              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  const command = `npx ralphy-skills install ${skill.id}`
                  navigator.clipboard.writeText(command)
                  setShowCopied(true)
                  setTimeout(() => setShowCopied(false), 2000)
                }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-between rounded-lg bg-black px-4 py-4 ring-1 ring-white/10 hover:bg-white/5 transition-colors">
                  <code className="flex-1 border-0 bg-transparent text-indigo-300 font-mono text-sm select-all">
                    npx ralphy-skills install {skill.id}
                  </code>
                  {showCopied ? (
                    <span className="text-xs text-green-400 font-semibold bg-green-400/10 px-2 py-1 rounded ml-2 animate-in fade-in slide-in-from-right-2">
                      Copied!
                    </span>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                {!isInstalled ? (
                  <>
                    <p className="text-sm text-gray-400">Did you install it?</p>
                    <button
                      onClick={toggleInstalled}
                      className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Yes, I installed it!
                    </button>
                  </>
                ) : (
                  <button
                    onClick={toggleInstalled}
                    className="group flex items-center gap-2 text-green-400 bg-green-400/10 hover:bg-red-400/10 hover:text-red-400 px-4 py-2 rounded-lg transition-all"
                    title="Click to unmark as installed"
                  >
                    <span className="group-hover:hidden flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold text-sm">Installed & Verified</span>
                    </span>
                    <span className="hidden group-hover:flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="font-semibold text-sm">Undo Install</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Reviews Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Community Reviews</h2>
                <a
                  href={`https://github.com/Interpoolx/ralphy-skills/issues/new?title=Review+for+${skill.name}&body=###+Rating:+⭐⭐⭐⭐⭐%0A%0A###+Review%0A[Write+your+review+here]`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 font-semibold hover:text-indigo-500 hover:underline"
                >
                  Write a review
                </a>
              </div>

              <div className="space-y-8">
                {/* Mock Review 1 */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 flex-none rounded-full bg-gray-100"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Alex D.</h3>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                    <div className="flex items-center text-yellow-400 text-xs my-1">
                      ★★★★★
                    </div>
                    <p className="text-sm text-gray-600">This skill saved me hours setting up my Next.js project. The standards are solid.</p>
                  </div>
                </div>
                {/* Mock Review 2 */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 flex-none rounded-full bg-gray-100"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Sarah M.</h3>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                    <div className="flex items-center text-yellow-400 text-xs my-1">
                      ★★★★☆
                    </div>
                    <p className="text-sm text-gray-600">Great resource, but would love to see more about RSC data fetching patterns.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Metadata Card */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-4">
                {skill.source && (
                  <li>
                    <a href={skill.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                      View Source Code
                    </a>
                  </li>
                )}
                <li>
                  <a href={reportIssueUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Report an Issue
                  </a>
                </li>
              </ul>
            </div>

            {/* Tags Card */}
            {skill.tags && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {tag}
                    </span>
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
