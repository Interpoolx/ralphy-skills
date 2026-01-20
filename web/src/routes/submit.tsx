import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { API_URL } from '../constants'
import { useState } from 'react'

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
})

const submissionSchema = z.object({
  githubUrl: z
    .string()
    .url('Please enter a valid URL')
    .includes('github.com', { message: 'Must be a GitHub URL' }),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
})

type SubmissionForm = z.infer<typeof submissionSchema>

function SubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      githubUrl: '',
      submitterName: '',
      submitterEmail: '',
    },
  })

  const onSubmit = async (data: SubmissionForm) => {
    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit skill')
      }

      toast.success('Skill submitted successfully!', {
        description: 'Your skill is now pending review. It will appear in the directory once approved.',
      })
      reset()
    } catch (error) {
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Submit a Skill
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Share your Ralphy skill with the community. All submissions are reviewed before publishing.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* GitHub URL */}
            <div>
              <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700">
                GitHub Repository URL <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repo/tree/main/skills/my-skill"
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.githubUrl ? 'border-red-300' : 'border-gray-300'
                    }`}
                  {...register('githubUrl')}
                />
                {errors.githubUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.githubUrl.message}</p>
                )}
              </div>
            </div>

            {/* Submitter Name */}
            <div>
              <label htmlFor="submitterName" className="block text-sm font-medium text-gray-700">
                Your Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="mt-1">
                <input
                  id="submitterName"
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  {...register('submitterName')}
                />
              </div>
            </div>

            {/* Submitter Email */}
            <div>
              <label htmlFor="submitterEmail" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-gray-400 font-normal">(Optional, for notifications)</span>
              </label>
              <div className="mt-1">
                <input
                  id="submitterEmail"
                  type="email"
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.submitterEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                  {...register('submitterEmail')}
                />
                {errors.submitterEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.submitterEmail.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Skill'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
