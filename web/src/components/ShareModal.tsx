import { useState } from 'react'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    skillName: string
    skillUrl: string
}

export function ShareModal({ isOpen, onClose, skillName, skillUrl }: ShareModalProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(skillUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const encodedText = encodeURIComponent(`Check out ${skillName} on Ralphy Skills! 🚀`)
    const encodedUrl = encodeURIComponent(skillUrl)

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 text-gray-900">

                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                        <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Share this skill</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">Spread the word and help others discover {skillName}.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-[#1DA1F2]/10 px-3 py-2 text-sm font-semibold text-[#1DA1F2] hover:bg-[#1DA1F2]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DA1F2]"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                            Twitter / X
                        </a>
                        <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-[#0A66C2]/10 px-3 py-2 text-sm font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                            </svg>
                            LinkedIn
                        </a>
                    </div>

                    <div className="mt-5">
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="text"
                                name="share-link"
                                id="share-link"
                                className="block w-full rounded-md border-0 py-2.5 pl-3 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                value={skillUrl}
                                readOnly
                            />
                            <button
                                onClick={handleCopy}
                                className="absolute inset-y-0 right-0 flex items-center px-4 rounded-r-md text-indigo-600 font-semibold text-sm hover:bg-indigo-50 focus:outline-none"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
