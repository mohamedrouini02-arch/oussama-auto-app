'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/lib/supabase'
import { Edit, Plus, Printer, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ExchangeModal from './ExchangeModal'

interface ExchangeSectionProps {
    currentDate: Date
}

export default function ExchangeSection({ currentDate }: ExchangeSectionProps) {
    const { t } = useLanguage()
    const [exchanges, setExchanges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [exchangeToEdit, setExchangeToEdit] = useState<any>(null)
    const { role } = useUserRole()

    const handlePrint = (ex: any) => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const date = new Date(ex.transaction_date).toLocaleDateString()
        const usdt = ex.original_amount || (ex.amount / (ex.exchange_rate_dzd_usdt || 1))

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Exchange Receipt</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #1f2937; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
                    .title { font-size: 18px; color: #4b5563; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f9fafb; padding-bottom: 8px; }
                    .label { font-weight: 600; color: #6b7280; }
                    .value { font-weight: 500; font-size: 16px; }
                    .total { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 18px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Oussama Auto</div>
                    <div class="title">Exchange Receipt</div>
                </div>
                
                <div class="row">
                    <span class="label">Transaction Date</span>
                    <span class="value">${date}</span>
                </div>
                <div class="row">
                    <span class="label">Amount (DZD)</span>
                    <span class="value">${Number(ex.amount).toLocaleString()} DZD</span>
                </div>
                <div class="row">
                    <span class="label">Exchange Rate</span>
                    <span class="value">${ex.exchange_rate_dzd_usdt}</span>
                </div>
                
                <div class="row total">
                    <span class="label" style="color: #059669;">Total (USDT)</span>
                    <span class="value" style="color: #059669; font-weight: bold;">${Number(usdt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                </div>

                ${ex.description ? `
                <div style="margin-top: 20px;">
                    <span class="label">Notes</span>
                    <p style="margin-top: 5px; color: #4b5563;">${ex.description}</p>
                </div>
                ` : ''}

                <div class="footer">
                    Generated on ${new Date().toLocaleString()}
                </div>
                <script>
                    window.onload = () => { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t.exchange.confirmDelete)) return

        try {
            const { error } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchExchanges()
        } catch (error) {
            console.error('Error deleting exchange:', error)
            alert(t.exchange.deleteError)
        }
    }

    const handleEdit = (ex: any) => {
        setExchangeToEdit(ex)
        setIsModalOpen(true)
    }

    const fetchExchanges = async () => {
        setLoading(true)
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()

            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('category', 'Exchange')
                .gte('transaction_date', startOfMonth)
                .lte('transaction_date', endOfMonth)
                .order('transaction_date', { ascending: false })

            if (error) throw error
            setExchanges(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExchanges()
    }, [currentDate])

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.exchange.history}</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    {t.exchange.newExchange}
                </button>
            </div>

            <ExchangeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setExchangeToEdit(null)
                }}
                onSuccess={fetchExchanges}
                exchangeToEdit={exchangeToEdit}
            />

            {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t.common.loading}</div>
            ) : exchanges.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                    {t.exchange.noExchanges}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-left">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{t.exchange.date}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{t.exchange.amountDzd}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{t.exchange.rate}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{t.exchange.usdt}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{t.exchange.notes}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">{t.exchange.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {exchanges.map((ex) => {
                                    const usdt = ex.original_amount || (ex.amount / (ex.exchange_rate_dzd_usdt || 1))

                                    return (
                                        <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(ex.transaction_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {ex.amount?.toLocaleString()} DZD
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {ex.exchange_rate_dzd_usdt}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                                                {usdt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                {ex.description}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button
                                                    onClick={() => handlePrint(ex)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition"
                                                    title={t.common.print}
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(ex)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition"
                                                    title={t.common.edit}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDelete(ex.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition"
                                                        title={t.common.delete}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
