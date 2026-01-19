import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { MARKETPLACE_URL } from '../constants'
import type { MarketplaceData } from '../types'

export const Route = createFileRoute('/submit')({
  component: SubmitSkillPage,
})

function SubmitSkillPage() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [existingSkills, setExistingSkills] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(MARKETPLACE_URL)
      .then(res => res.json())
      .then((data: MarketplaceData) => {
        const ids = new Set(data.skills.map(s => s.id))
        setExistingSkills(ids)
      })
  }, [])

  const checkDuplicate = (inputUrl: string) => {
    // Extract ID from URL (naive check for now, can be improved)
    // Expected format: .../skills/skill-id
    try {
      const parts = inputUrl.split('/')
      const potentialId = parts[parts.length - 1]
      if (existingSkills.has(potentialId)) {
        setIsDuplicate(true)
        setError('This skill appears to already exist in the marketplace.')
      } else {
        setIsDuplicate(false)
        setError(null)
      }
    } catch (e) {
      // ignore invalid urls for now
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isDuplicate) return

    if (!url.includes('github.com')) {
      setError('Please provide a valid GitHub repository URL.')
      return
    }

    // Open GitHub Issue with pre-filled body
    const issueTitle = `New Skill Submission`
    const issueBody = `### Skill Repository URL\n${url}\n\n### Description\n[Brief description of your skill]\n\n### Author\n@${'YOUR_GITHUB_USERNAME'}`
    const submitUrl = `https://github.com/Interpoolx/ralphy-skills/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`

    window.open(submitUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Submit a New Skill
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Share your agent skill with the community.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                GitHub Repository URL
              </label>
              <div className="mt-1">
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    checkDuplicate(e.target.value)
                  }}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="https://github.com/username/repo/tree/main/skills/my-skill"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isDuplicate}
                className={`flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${isDuplicate
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
              >
                Continue to GitHub
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">How it works</span>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500 space-y-4">
              <p>1. <strong>Paste your URL</strong>: We'll check if it's already in the marketplace.</p>
              <p>2. <strong>Create an Issue</strong>: You'll be redirected to GitHub to open a submission issue.</p>
              <p>3. <strong>Review</strong>: Our team (and Ralphy bot) will review and verify your skill.</p>
              <p>4. <strong>Live!</strong>: Once approved, your skill will be available to everyone.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
