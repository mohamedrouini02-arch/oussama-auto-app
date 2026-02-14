'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface ExchangeModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    exchangeToEdit?: any
}

export default function ExchangeModal({ isOpen, onClose, onSuccess, exchangeToEdit }: ExchangeModalProps) {
    const { t } = useLanguage()
    const { userId } = usePermissions()
    const [loading, setLoading] = useState(false)

    const [amountDZD, setAmountDZD] = useState('')
    const [rate, setRate] = useState('')
    const [notes, setNotes] = useState('')

    const [recentIncomes, setRecentIncomes] = useState<any[]>([])
    const [sourceTransactionId, setSourceTransactionId] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            fetchRecentIncomes()
            if (exchangeToEdit) {
                setAmountDZD(exchangeToEdit.amount?.toString() || '')
                setRate(exchangeToEdit.exchange_rate_dzd_usdt?.toString() || '')
                const desc = exchangeToEdit.description || ''
                const prefix = 'Exchange DZD to USDT: '
                const notePart = desc.includes(prefix) ? desc.split(prefix)[1] : desc
                const finalNote = notePart?.split(' (Source:')[0] || notePart
                setNotes(finalNote)
            } else {
                setAmountDZD('')
                setRate('')
                setNotes('')
                setSourceTransactionId('')
            }
        }
    }, [isOpen, exchangeToEdit])

    async function fetchRecentIncomes() {
        const { data } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('type', 'Income')
            .order('transaction_date', { ascending: false })
            .limit(20)

        if (data) setRecentIncomes(data)
    }

    if (!isOpen) return null

    const dzd = parseFloat(amountDZD) || 0
    const exchangeRate = parseFloat(rate) || 0
    const usdt = exchangeRate > 0 ? dzd / exchangeRate : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const selectedSource = recentIncomes.find(t => t.id === sourceTransactionId)
            const description = `Exchange DZD to USDT: ${notes}` + (selectedSource ? ` (Source: ${selectedSource.description})` : '')

            const payload: any = {
                type: 'Expense',
                category: 'Exchange',
                description,
                amount: dzd,
                currency: 'DZD',
                exchange_rate_dzd_usdt: exchangeRate,
                original_amount: usdt,
                payment_status: 'Paid',
                payment_method: 'cash',
                transaction_date: exchangeToEdit ? exchangeToEdit.transaction_date : new Date().toISOString(),
                added_by: userId,
            }

            if (selectedSource) {
                payload.related_order_id = selectedSource.related_order_id
                payload.related_car_id = selectedSource.related_car_id
                payload.related_order_number = selectedSource.related_order_number
                payload.car_brand = selectedSource.car_brand
                payload.car_model = selectedSource.car_model
                payload.car_year = selectedSource.car_year
                payload.car_vin = selectedSource.car_vin
            }

            let error;

            if (exchangeToEdit) {
                const res = await (supabase.from('financial_transactions') as any)
                    .update(payload)
                    .eq('id', exchangeToEdit.id)
                error = res.error
            } else {
                payload.id = uuidv4()
                const res = await supabase.from('financial_transactions').insert(payload as any)
                error = res.error
            }

            if (error) throw error

            if (selectedSource) {
                await (supabase.from('financial_transactions') as any)
                    .update({
                        is_paid_in_korea: true,
                        paid_in_korea_date: new Date().toISOString()
                    })
                    .eq('id', selectedSource.id)
            }

            onSuccess()
            onClose()
            setAmountDZD('')
            setRate('')
            setNotes('')
            setSourceTransactionId('')
        } catch (error) {
            console.error('Error saving exchange:', error)
            alert(t.exchange.failedSave)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{exchangeToEdit ? t.exchange.editExchange : t.exchange.newExchangeDzdUsdt}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t.exchange.sourceTransaction} {t.exchange.optional}
                        </label>
                        <select
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                            value={sourceTransactionId}
                            onChange={e => setSourceTransactionId(e.target.value)}
                        >
                            <option value="">{t.exchange.noSpecificSource}</option>
                            {recentIncomes.map(inc => (
                                <option key={inc.id} value={inc.id}>
                                    {new Date(inc.transaction_date).toLocaleDateString()} - {inc.amount?.toLocaleString()} DZD ({inc.description?.substring(0, 30)}...)
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t.exchange.linkingNote}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t.exchange.amountDzd}
                        </label>
                        <input
                            type="number"
                            required
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                            value={amountDZD}
                            onChange={e => setAmountDZD(e.target.value)}
                            placeholder="e.g. 100000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t.exchange.exchangeRate}
                        </label>
                        <input
                            type="number"
                            required
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                            value={rate}
                            onChange={e => setRate(e.target.value)}
                            placeholder="e.g. 240"
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">{t.exchange.calculatedUsdt}</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {usdt.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t.exchange.notes}
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? t.exchange.processing : (exchangeToEdit ? t.exchange.updateExchange : t.exchange.saveExchange)}
                    </button>
                </form>
            </div>
        </div>
    )
}
