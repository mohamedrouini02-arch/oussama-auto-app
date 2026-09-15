'use client'

import ExchangeSection from '@/components/finance/ExchangeSection'
import FinanceTabs from '@/components/finance/FinanceTabs'
import TransactionList from '@/components/finance/TransactionList'
import { useLanguage } from '@/context/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { Calendar, Filter, Layers, Plus, Search, ShieldAlert, Ship, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Transaction = any

export default function FinanceList() {
    const { t } = useLanguage()
    const { role, loading: roleLoading } = usePermissions()

    // UI State
    const [activeTab, setActiveTab] = useState<'transactions' | 'car_sales' | 'car_expenses' | 'general_expenses' | 'exchange'>('transactions')

    // Filter State
    const [dateFilterMode, setDateFilterMode] = useState<'all' | 'month'>('all') // 'all' = Show All, 'month' = Filter by Month/Date
    const [currentDate, setCurrentDate] = useState(new Date()) // Used when dateFilterMode is 'month'
    const [statusFilter, setStatusFilter] = useState('All')
    const [selectedBatch, setSelectedBatch] = useState<string>('All')
    const [batches, setBatches] = useState<{ id: string, name: string }[]>([])
    const [search, setSearch] = useState('')

    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (role === 'admin') {
            fetchTransactions()
            fetchBatches()
        }
    }, [role, dateFilterMode, currentDate])

    async function fetchBatches() {
        try {
            const { data } = await (supabase.from('shipment_batches') as any)
                .select('id, name')
                .eq('is_archived', false)
                .order('created_at', { ascending: false })

            if (data) setBatches(data)
        } catch (e) {
            console.error('Error fetching batches:', e)
        }
    }

    async function fetchTransactions() {
        setLoading(true)
        try {
            let query = supabase
                .from('financial_transactions')
                .select('*')
                .order('transaction_date', { ascending: false })

            // Apply Date Filter ONLY if mode is 'month'
            if (dateFilterMode === 'month') {
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()

                query = query
                    .gte('transaction_date', startOfMonth)
                    .lte('transaction_date', endOfMonth)
            }

            const { data, error } = await query

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t.finance.confirmDelete)) return

        try {
            const { error } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            setTransactions(transactions.filter(t => t.id !== id))
        } catch (error) {
            console.error('Error deleting transaction:', error)
            alert(t.finance.errorDelete)
        }
    }

    if (roleLoading) {
        return <div className="p-8 text-center text-gray-500">Loading permissions...</div>
    }

    // STRICT PERMISSION CHECK
    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
                <p className="text-gray-500 max-w-md">
                    You do not have permission to view the financial records.
                    Please contact an administrator if you believe this is an error.
                </p>
            </div>
        )
    }

    // Filter Logic
    const filteredTransactions = transactions.filter(t => {
        // 1. Search Filter (Optimized for ANY piece of info)
        const searchLower = search.toLowerCase()
        const matchesSearch =
            !search ||
            t.description?.toLowerCase().includes(searchLower) ||
            t.category?.toLowerCase().includes(searchLower) ||
            t.type?.toLowerCase().includes(searchLower) ||
            t.order_number?.toLowerCase().includes(searchLower) ||
            t.batch_name?.toLowerCase().includes(searchLower) ||
            t.customer_name?.toLowerCase().includes(searchLower) ||
            t.customer_phone?.toLowerCase().includes(searchLower) ||
            t.customer_email?.toLowerCase().includes(searchLower) ||
            t.customer_address?.toLowerCase().includes(searchLower) ||
            t.car_brand?.toLowerCase().includes(searchLower) ||
            t.car_model?.toLowerCase().includes(searchLower) ||
            t.car_trim?.toLowerCase().includes(searchLower) ||
            t.car_year?.toString().toLowerCase().includes(searchLower) ||
            t.car_vin?.toLowerCase().includes(searchLower) ||
            t.seller_name?.toLowerCase().includes(searchLower) ||
            t.buyer_name?.toLowerCase().includes(searchLower) ||
            t.notes?.toLowerCase().includes(searchLower) ||
            t.currency?.toLowerCase().includes(searchLower) ||
            t.amount?.toString().includes(searchLower) ||
            t.payment_method?.toLowerCase().includes(searchLower) ||
            t.payment_status?.toLowerCase().includes(searchLower)

        // 2. Status Filter
        const matchesStatus = statusFilter === 'All' || t.payment_status === statusFilter

        // 3. Batch Filter
        let matchesBatch = true
        if (selectedBatch === 'Unassigned') {
            matchesBatch = !t.batch_name
        } else if (selectedBatch !== 'All') {
            matchesBatch = t.batch_name === selectedBatch
        }

        // 4. Tab Filter
        let matchesTab = false
        if (activeTab === 'transactions') {
            matchesTab = t.category !== 'Exchange'
        } else if (activeTab === 'car_sales') {
            matchesTab = t.category === 'Car Sale' || t.category === 'Buying Car'
        } else if (activeTab === 'car_expenses') {
            const carExpenseCategories = ['Shipping', 'Customs', 'Commission', 'Maintenance']
            matchesTab = carExpenseCategories.includes(t.category) || (t.type === 'Expense' && t.category === 'Other')
        } else if (activeTab === 'general_expenses') {
            const generalCategories = ['Salaries', 'Rent', 'Marketing']
            matchesTab = generalCategories.includes(t.category) || (t.type === 'Expense' && t.category === 'Other' && !t.related_car_id)
        } else if (activeTab === 'exchange') {
            matchesTab = t.category === 'Exchange'
        }

        return matchesSearch && matchesStatus && matchesBatch && matchesTab
    })

    const unassignedCount = transactions.filter(t => !t.batch_name).length

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.finance.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">Vehicle import finance, Bon de Commande & legal contracts</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/finance/batches"
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition font-medium text-sm shadow-sm"
                    >
                        <Ship className="w-4 h-4 text-blue-600" />
                        {t.finance.batches}
                    </Link>
                    <Link
                        href="/finance/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t.finance.newTransaction}
                    </Link>
                </div>
            </div>

            <div className="space-y-6">
                <FinanceTabs activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'exchange' ? (
                    <ExchangeSection currentDate={currentDate} />
                ) : (
                    <>
                        {/* Shipment Batch Filter Bar */}
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mr-1">
                                    <Ship className="w-3.5 h-3.5 text-blue-500" />
                                    {t.finance.batch}:
                                </span>

                                <button
                                    onClick={() => setSelectedBatch('All')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                                        selectedBatch === 'All'
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                    )}
                                >
                                    {t.finance.allBatches} ({transactions.length})
                                </button>

                                <button
                                    onClick={() => setSelectedBatch('Unassigned')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                                        selectedBatch === 'Unassigned'
                                            ? "bg-amber-600 text-white shadow-sm"
                                            : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                                    )}
                                >
                                    {t.finance.unassigned} ({unassignedCount})
                                </button>

                                {batches.map(batch => {
                                    const count = transactions.filter(t => t.batch_name === batch.name).length
                                    const isSelected = selectedBatch === batch.name
                                    return (
                                        <button
                                            key={batch.id}
                                            onClick={() => setSelectedBatch(batch.name)}
                                            className={clsx(
                                                "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                                                isSelected
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                                            )}
                                        >
                                            {batch.name} ({count})
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-2">
                                {selectedBatch !== 'All' && selectedBatch !== 'Unassigned' && (
                                    <Link
                                        href={`/finance/batch-export?batch=${encodeURIComponent(selectedBatch)}`}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800"
                                    >
                                        Export {selectedBatch}
                                    </Link>
                                )}
                                <Link
                                    href="/finance/batches"
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline font-medium"
                                >
                                    Manage Batches &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search anything (client, phone, address, VIN, price, order #)..."
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-950 dark:text-white"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Filters Group */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Date Filter Toggle */}
                                <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setDateFilterMode('all')}
                                        className={clsx(
                                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                            dateFilterMode === 'all'
                                                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                                        )}
                                    >
                                        Show All
                                    </button>
                                    <button
                                        onClick={() => setDateFilterMode('month')}
                                        className={clsx(
                                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                                            dateFilterMode === 'month'
                                                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                                        )}
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        Month
                                    </button>
                                </div>

                                {/* Month Picker Input (Conditional) */}
                                {dateFilterMode === 'month' && (
                                    <div className="relative">
                                        <input
                                            type="month"
                                            className="px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white font-medium"
                                            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [year, month] = e.target.value.split('-').map(Number)
                                                    setCurrentDate(new Date(year, month - 1, 1))
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <select
                                        className="px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="All">{t.finance.allStatus}</option>
                                        <option value="Paid">{t.finance.paid}</option>
                                        <option value="Partial">{t.finance.partial}</option>
                                        <option value="Pending">{t.finance.pending}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* List Component */}
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">{t.finance.loading}</div>
                        ) : (
                            <TransactionList
                                transactions={filteredTransactions}
                                onDelete={handleDelete}
                                userRole={role}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
