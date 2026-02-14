import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TransactionCard from '../../components/finance/TransactionCard'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

type Transaction = any

export default function FinanceList() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const { t } = useLanguage()

    useEffect(() => {
        fetchTransactions()
    }, [])

    async function fetchTransactions() {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .order('transaction_date', { ascending: false })

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

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.category?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus = statusFilter === 'All' || t.payment_status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">{t.finance.title}</h1>
                <Link
                    to="/finance/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    {t.finance.newTransaction}
                </Link>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={t.finance.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 placeholder:text-gray-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white min-w-[150px] text-gray-900"
                >
                    <option value="All">{t.finance.allStatus}</option>
                    <option value="Paid">{t.finance.paid}</option>
                    <option value="Pending">{t.finance.pending}</option>
                    <option value="Unpaid">{t.finance.unpaid}</option>
                    <option value="Partial">{t.finance.partial}</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">{t.finance.loading}</div>
            ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t.finance.noTransactions}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTransactions.map((t) => (
                        <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
