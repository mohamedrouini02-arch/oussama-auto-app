'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import {
    Archive,
    ArchiveRestore,
    ArrowLeft,
    Check,
    Edit2,
    Eye,
    FileSpreadsheet,
    FolderPlus,
    Layers,
    Plus,
    Search,
    Ship,
    Trash2,
    Truck,
    User,
    X
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Batch {
    id: string
    name: string
    description: string | null
    is_archived: boolean
    created_at: string
}

export default function BatchesPage() {
    const { t } = useLanguage()
    const [batches, setBatches] = useState<Batch[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showArchived, setShowArchived] = useState(false)
    const [newBatchName, setNewBatchName] = useState('')
    const [newBatchDesc, setNewBatchDesc] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
    const [editName, setEditName] = useState('')
    const [selectedBatchForAssign, setSelectedBatchForAssign] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            // 1. Fetch batches
            const { data: batchesData, error: batchError } = await (supabase.from('shipment_batches') as any)
                .select('*')
                .order('created_at', { ascending: false })

            if (batchError) console.error('Error fetching batches:', batchError)

            // 2. Fetch car transactions
            const { data: trxsData, error: trxError } = await (supabase.from('financial_transactions') as any)
                .select('id, order_number, customer_name, customer_phone, car_brand, car_model, car_year, car_vin, batch_name, transaction_date')
                .order('transaction_date', { ascending: false })

            if (trxError) console.error('Error fetching transactions:', trxError)

            setBatches(batchesData || [])
            setTransactions(trxsData || [])
        } catch (error) {
            console.error('Error loading batch data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateBatch(e: React.FormEvent) {
        e.preventDefault()
        if (!newBatchName.trim()) return

        try {
            const { data, error } = await (supabase.from('shipment_batches') as any)
                .insert({
                    name: newBatchName.trim(),
                    description: newBatchDesc.trim() || null,
                    is_archived: false
                })
                .select()
                .single()

            if (error) throw error

            setBatches([data, ...batches])
            setNewBatchName('')
            setNewBatchDesc('')
            setShowCreateModal(false)
        } catch (err: any) {
            alert('Failed to create batch: ' + (err.message || 'Duplicate name or server error'))
        }
    }

    async function handleRenameBatch(batchId: string) {
        if (!editName.trim()) return

        try {
            const oldBatch = batches.find(b => b.id === batchId)
            const oldName = oldBatch?.name

            const { error } = await (supabase.from('shipment_batches') as any)
                .update({ name: editName.trim(), updated_at: new Date().toISOString() })
                .eq('id', batchId)

            if (error) throw error

            // Update associated transactions batch_name if it changed
            if (oldName && oldName !== editName.trim()) {
                await (supabase.from('financial_transactions') as any)
                    .update({ batch_name: editName.trim() })
                    .eq('batch_name', oldName)
            }

            setBatches(batches.map(b => b.id === batchId ? { ...b, name: editName.trim() } : b))
            setTransactions(transactions.map(t => t.batch_name === oldName ? { ...t, batch_name: editName.trim() } : t))
            setEditingBatch(null)
            setEditName('')
        } catch (err: any) {
            alert('Failed to rename batch: ' + err.message)
        }
    }

    async function handleToggleArchive(batch: Batch) {
        try {
            const nextStatus = !batch.is_archived
            const { error } = await (supabase.from('shipment_batches') as any)
                .update({ is_archived: nextStatus, updated_at: new Date().toISOString() })
                .eq('id', batch.id)

            if (error) throw error

            setBatches(batches.map(b => b.id === batch.id ? { ...b, is_archived: nextStatus } : b))
        } catch (err: any) {
            alert('Failed to update archive status: ' + err.message)
        }
    }

    async function handleAssignTransaction(trxId: string, batchName: string | null) {
        try {
            const { error } = await (supabase.from('financial_transactions') as any)
                .update({ batch_name: batchName })
                .eq('id', trxId)

            if (error) throw error

            setTransactions(transactions.map(t => t.id === trxId ? { ...t, batch_name: batchName } : t))
        } catch (err: any) {
            alert('Failed to update transaction batch: ' + err.message)
        }
    }

    const filteredBatches = batches.filter(b => showArchived ? true : !b.is_archived)

    const unassignedTransactions = transactions.filter(t => !t.batch_name)

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <Link href="/finance" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Finance
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Ship className="w-8 h-8 text-blue-600" />
                        {t.finance.batches} (Shipment Batches)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Group car shipments into carrier batches and generate export manifests.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition flex items-center gap-2 ${
                            showArchived 
                                ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' 
                                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Showing Archived' : 'Show Archived'}
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Batch
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Active Batches</span>
                        <Layers className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {batches.filter(b => !b.is_archived).length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Unassigned Vehicles</span>
                        <Truck className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                        {unassignedTransactions.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Archived Batches</span>
                        <Archive className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">
                        {batches.filter(b => b.is_archived).length}
                    </p>
                </div>
            </div>

            {/* Batches Cards Grid */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Batch Manifests</h2>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading shipment batches...</div>
                ) : filteredBatches.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
                        <Ship className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No shipment batches found</p>
                        <p className="text-xs text-gray-400 mt-1">Create your first batch to group car shipments.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBatches.map(batch => {
                            const batchTrxs = transactions.filter(t => t.batch_name === batch.name)
                            const isEditing = editingBatch?.id === batch.id

                            return (
                                <div
                                    key={batch.id}
                                    className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all ${
                                        batch.is_archived
                                            ? 'border-gray-200 dark:border-slate-800 opacity-70 bg-gray-50/50'
                                            : 'border-blue-100 dark:border-slate-800 hover:shadow-md'
                                    }`}
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2 flex-1 mr-2">
                                                    <input
                                                        type="text"
                                                        className="p-1 text-sm border rounded w-full dark:bg-slate-950"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleRenameBatch(batch.id)}
                                                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingBatch(null)}
                                                        className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                        {batch.name}
                                                    </h3>
                                                    <button
                                                        onClick={() => {
                                                            setEditingBatch(batch)
                                                            setEditName(batch.name)
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                        title="Rename Batch"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}

                                            {batch.is_archived && (
                                                <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded">
                                                    Archived
                                                </span>
                                            )}
                                        </div>

                                        {batch.description && (
                                            <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                                {batch.description}
                                            </p>
                                        )}

                                        <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-lg flex items-center justify-between mb-4">
                                            <span className="text-xs text-gray-500 font-medium">Vehicles Assigned:</span>
                                            <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                                {batchTrxs.length}
                                            </span>
                                        </div>

                                        {/* Assigned vehicles preview */}
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {batchTrxs.map(t => (
                                                <div key={t.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 dark:border-slate-800">
                                                    <span className="truncate max-w-[170px] font-medium text-gray-800 dark:text-gray-200">
                                                        {t.car_brand} {t.car_model} ({t.customer_name || 'Client'})
                                                    </span>
                                                    <button
                                                        onClick={() => handleAssignTransaction(t.id, null)}
                                                        className="text-red-500 hover:text-red-700 text-[11px] font-semibold"
                                                        title="Unassign from batch"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                            {batchTrxs.length === 0 && (
                                                <p className="text-xs text-gray-400 italic py-1">No vehicles in this batch</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => handleToggleArchive(batch)}
                                            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-xs flex items-center gap-1 transition"
                                        >
                                            {batch.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                            {batch.is_archived ? 'Unarchive' : 'Archive'}
                                        </button>

                                        <Link
                                            href={`/finance/batch-export?batch=${encodeURIComponent(batch.name)}`}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                            Export Manifest
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Unassigned Transactions Table (Quick Assign Area) */}
            <div className="mt-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Truck className="w-5 h-5 text-amber-500" />
                            Unassigned Vehicles ({unassignedTransactions.length})
                        </h2>
                        <p className="text-xs text-gray-500">
                            Assign these pending transactions to a shipment batch.
                        </p>
                    </div>
                </div>

                {unassignedTransactions.length === 0 ? (
                    <p className="text-xs text-emerald-600 font-medium py-4">All vehicles are assigned to a shipment batch!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-slate-700 uppercase">
                                <tr>
                                    <th className="p-3">Order / Date</th>
                                    <th className="p-3">Client</th>
                                    <th className="p-3">Vehicle Details</th>
                                    <th className="p-3">VIN Number</th>
                                    <th className="p-3 text-right">Assign to Batch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {unassignedTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">
                                            #{t.order_number || t.id.substring(0, 6)}
                                        </td>
                                        <td className="p-3">
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{t.customer_name || '—'}</span>
                                            <p className="text-gray-400 text-[10px]">{t.customer_phone}</p>
                                        </td>
                                        <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                            {t.car_brand} {t.car_model} ({t.car_year || '—'})
                                        </td>
                                        <td className="p-3 font-mono uppercase text-blue-600 dark:text-blue-400">
                                            {t.car_vin || '—'}
                                        </td>
                                        <td className="p-3 text-right">
                                            <select
                                                className="p-1.5 border border-gray-300 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-950 dark:text-white"
                                                defaultValue=""
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        handleAssignTransaction(t.id, e.target.value)
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Select Batch...</option>
                                                {batches.filter(b => !b.is_archived).map(b => (
                                                    <option key={b.id} value={b.name}>{b.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Batch Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FolderPlus className="w-5 h-5 text-blue-600" />
                                Create Shipment Batch
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Batch Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-mono"
                                    value={newBatchName}
                                    onChange={e => setNewBatchName(e.target.value)}
                                    placeholder="e.g. Batch-KOR-2026-09"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Description / Shipping Carrier Notes
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={newBatchDesc}
                                    onChange={e => setNewBatchDesc(e.target.value)}
                                    placeholder="Carrier name, port of departure, estimated vessel dates..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm"
                                >
                                    Create Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
