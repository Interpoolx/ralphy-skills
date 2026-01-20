import React from 'react'

interface ValidationModalProps {
    isOpen: boolean
    total: number
    processed: number
    valid: number
    invalid: number
    isComplete: boolean
    onClose: () => void
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    total,
    processed,
    valid,
    invalid,
    isComplete,
    onClose
}) => {
    if (!isOpen) return null

    const progress = total > 0 ? (processed / total) * 100 : 0

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                                {isComplete ? 'Validation Complete' : 'Validating Skill URLs'}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {isComplete ? 'All repositories have been checked.' : 'Checking repository availability in real-time...'}
                            </p>
                        </div>
                        {isComplete && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm mb-3">
                            <span className="text-blue-400 font-medium">{Math.round(progress)}% Complete</span>
                            <span className="text-gray-500">{processed} / {total} Skills</span>
                        </div>
                        <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50 p-1">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-2xl text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total</div>
                            <div className="text-2xl font-bold text-white">{total}</div>
                        </div>
                        <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl text-center">
                            <div className="text-green-500/60 text-xs font-bold uppercase tracking-wider mb-1">Valid</div>
                            <div className="text-2xl font-bold text-green-400">{valid}</div>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl text-center">
                            <div className="text-red-500/60 text-xs font-bold uppercase tracking-wider mb-1">Invalid</div>
                            <div className="text-2xl font-bold text-red-400">{invalid}</div>
                        </div>
                    </div>

                    {/* Pending Info */}
                    {!isComplete && (
                        <div className="mt-8 flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-blue-400 font-medium">Processing batch of skills...</p>
                        </div>
                    )}

                    {isComplete && (
                        <div className="mt-8">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-800 hover:bg-gray-750 text-white font-bold rounded-2xl transition-all border border-gray-700"
                            >
                                Close Progress
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
