import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from '../components/DataTable'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '../constants'
import { toast } from 'sonner'

export const Route = createFileRoute('/hpanel/submissions')({
    component: SubmissionsPage,
})

interface Submission {
    id: string
    githubUrl: string
    submitterName?: string
    submitterEmail?: string
    submitterIp?: string // Added submitterIp
    status: 'pending' | 'approved' | 'rejected'
    submittedAt: string
    reviewNotes?: string
}

const columnHelper = createColumnHelper<Submission>()

function SubmissionsPage() {
    const queryClient = useQueryClient()

    // Query Submissions
    const { data: submissions = [], isLoading } = useQuery<Submission[]>({
        queryKey: ['admin-submissions'],
        queryFn: async () => {
            // Use proper auth header
            const res = await fetch(`${API_URL}/api/admin/submissions`, {
                headers: { 'Authorization': 'Bearer ralphy-default-admin-token' } // In real setup, getting token from store
            })
            if (!res.ok) throw new Error('Failed to fetch submissions')
            return res.json()
        }
    })

    // State for Modals
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    })
    const [modalMode, setModalMode] = useState<'approve' | 'reject' | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    // Approval Form State
    const [approvalForm, setApprovalForm] = useState({
        name: '',
        id: '',
        namespace: '',
        category: 'general'
    })

    const openApprove = (submission: Submission) => {
        // Pre-fill form derived from URL
        const url = submission.githubUrl
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
        const owner = match?.[1] || 'unknown'
        const repo = match?.[2]?.replace(/\.git$/, '') || 'unknown'

        setApprovalForm({
            name: repo,
            id: repo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            namespace: `${owner}/${repo}`,
            category: 'general'
        })
        setSelectedSubmission(submission)
        setModalMode('approve')
    }

    const openReject = (submission: Submission) => {
        setRejectReason('')
        setSelectedSubmission(submission)
        setModalMode('reject')
    }

    const closeModals = () => {
        setModalMode(null)
        setSelectedSubmission(null)
    }

    // Approve Mutation (Updated to accept overrides)
    const approveMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/api/admin/submissions/${selectedSubmission?.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ralphy-default-admin-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            if (!res.ok) throw new Error('Failed to approve')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Submission approved and skill created!')
            queryClient.invalidateQueries({ queryKey: ['admin-submissions'] })
            queryClient.invalidateQueries({ queryKey: ['skills'] })
            closeModals()
        },
        onError: () => toast.error('Failed to approve')
    })

    // Reject Mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
            const res = await fetch(`${API_URL}/api/admin/submissions/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ralphy-default-admin-token' },
                body: JSON.stringify({ notes })
            })
            if (!res.ok) throw new Error('Failed to reject')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Submission rejected')
            queryClient.invalidateQueries({ queryKey: ['admin-submissions'] })
            closeModals()
        },
        onError: () => toast.error('Failed to reject')
    })

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/admin/submissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ralphy-default-admin-token' }
            })
            if (!res.ok) throw new Error('Failed to delete')
            return res.json()
        },
        onSuccess: () => {
            toast.success('Submission deleted')
            queryClient.invalidateQueries({ queryKey: ['admin-submissions'] })
        },
        onError: () => toast.error('Failed to delete')
    })

    const columns = [
        columnHelper.accessor('submittedAt', {
            header: 'Submitted',
            cell: info => new Date(info.getValue()).toLocaleDateString()
        }),
        columnHelper.accessor('submitterName', {
            header: 'Submitter',
            cell: info => (
                <div>
                    <div className="font-medium text-white">{info.getValue() || 'Anonymous'}</div>
                    <div className="text-xs text-gray-500">{info.row.original.submitterEmail}</div>
                    {info.row.original.submitterIp && <div className="text-[10px] text-gray-600 mt-0.5" title="Submitter IP">{info.row.original.submitterIp}</div>}
                </div>
            )
        }),
        columnHelper.accessor('githubUrl', {
            header: 'URL',
            cell: info => (
                <a href={info.getValue()} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate max-w-[200px] block">
                    {info.getValue()}
                </a>
            )
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: info => {
                const status = info.getValue()
                let color = 'bg-gray-700 text-gray-300'
                if (status === 'approved') color = 'bg-green-500/20 text-green-400 border border-green-500/30'
                if (status === 'rejected') color = 'bg-red-500/20 text-red-400 border border-red-500/30'
                if (status === 'pending') color = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'

                return (
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${color} capitalize`}>
                        {status}
                    </span>
                )
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: info => {
                const status = info.row.original.status

                return (
                    <div className="flex items-center gap-2">
                        {status === 'pending' && (
                            <>
                                <button
                                    onClick={() => openApprove(info.row.original)}
                                    className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                    title="Approve"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button
                                    onClick={() => openReject(info.row.original)}
                                    className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                    title="Reject"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Submission',
                                    message: 'Are you sure you want to permanently delete this submission record? This action cannot be undone.',
                                    onConfirm: () => {
                                        deleteMutation.mutate(info.row.original.id);
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    }
                                })
                            }}
                            className="p-1.5 bg-gray-700 text-gray-400 rounded hover:bg-gray-600 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )
            }
        })
    ]

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Skill Submissions</h1>
                <p className="text-gray-400">Review and approve community submissions.</p>
            </div>

            <DataTable
                data={submissions}
                columns={columns}
                isLoading={isLoading}
                searchColumn="githubUrl"
                pageSize={10}
                getRowId={(row) => row.id}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                confirmText="Permanently Delete"
            />

            {/* Approval Modal */}
            {modalMode === 'approve' && selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-white">Approve & Import Skill</h3>
                            <p className="text-sm text-gray-400 mt-1">Review derived details from GitHub URL.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">GitHub URL</label>
                                <input type="text" disabled value={selectedSubmission.githubUrl} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-400 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Skill Name</label>
                                    <input type="text" value={approvalForm.name} onChange={e => setApprovalForm({ ...approvalForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">ID (Slug)</label>
                                    <input type="text" value={approvalForm.id} onChange={e => setApprovalForm({ ...approvalForm, id: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Namespace</label>
                                <input type="text" value={approvalForm.namespace} onChange={e => setApprovalForm({ ...approvalForm, namespace: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                                <select value={approvalForm.category} onChange={e => setApprovalForm({ ...approvalForm, category: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                    <option value="general">General</option>
                                    <option value="frontend">Frontend</option>
                                    <option value="backend">Backend</option>
                                    <option value="devops">DevOps</option>
                                    <option value="ai-ml">AI/ML</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                            <button onClick={closeModals} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">Cancel</button>
                            <button
                                onClick={() => approveMutation.mutate(approvalForm)}
                                disabled={approveMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                {approveMutation.isPending ? 'Processing...' : 'Approve & Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {modalMode === 'reject' && selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-white">Reject Submission</h3>
                            <p className="text-sm text-gray-400 mt-1">Are you sure you want to reject this submission?</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reason (Optional)</label>
                            <textarea
                                rows={3}
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                                placeholder="e.g. Invalid URL, Duplicate..."
                            />
                        </div>
                        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                            <button onClick={closeModals} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">Cancel</button>
                            <button
                                onClick={() => rejectMutation.mutate({ id: selectedSubmission.id, notes: rejectReason })}
                                disabled={rejectMutation.isPending}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Submission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
