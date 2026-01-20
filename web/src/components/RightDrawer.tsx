import { useState, useEffect, type ReactNode } from 'react'

interface RightDrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
    width?: string
}

export function RightDrawer({ isOpen, onClose, title, children, width = 'max-w-md' }: RightDrawerProps) {
    const [mounted, setMounted] = useState(false)
    const [animating, setAnimating] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setMounted(true)
            // Trigger animation after mount
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimating(true)
                })
            })
        } else {
            setAnimating(false)
            // Unmount after animation
            const timer = setTimeout(() => setMounted(false), 350)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!mounted) return null

    return (
        <>
            {/* Backdrop with fade */}
            <div
                className={`fixed inset-0 bg-black z-40 transition-all duration-300 ease-out ${animating ? 'opacity-50' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Drawer with smooth slide */}
            <div
                className={`fixed right-0 top-0 h-full ${width} w-full bg-gray-800 border-l border-gray-700 z-50 shadow-2xl transition-all duration-300 ease-out ${animating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-95'
                    }`}
                style={{ willChange: 'transform, opacity' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
                    {children}
                </div>
            </div>
        </>
    )
}
