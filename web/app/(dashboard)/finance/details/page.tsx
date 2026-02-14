'use client'

import InvoiceTemplate from '@/components/finance/InvoiceTemplate'
import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Car, Edit, FileText, Globe, Printer, Trash2, Truck, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function FinanceDetailsContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const { t } = useLanguage()
    const [transaction, setTransaction] = useState<any>(null)
    const [order, setOrder] = useState<any>(null)
    const [car, setCar] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchTransaction()
        } else {
            console.error('No ID provided')
            router.push('/finance')
        }
    }, [id])

    async function fetchTransaction() {
        if (!id) return
        try {
            const { data: trxData, error: trxError } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('id', id)
                .single()

            if (trxError) throw trxError
            // Force type assertion to any to bypass strict 'never' checks if supabase types are failing to infer specifically
            const finalTrxData: any = trxData;
            setTransaction(finalTrxData)

            // Fetch related order if exists
            if (finalTrxData.related_order_id) {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', finalTrxData.related_order_id)
                    .single()

                if (orderData) setOrder(orderData)
            }

            // Fetch related car if exists (priority to related_car_id, fallback to finding by VIN/Model in description?)
            // Actually transaction has related_car_id
            if (finalTrxData.related_car_id) {
                const { data: carData } = await supabase
                    .from('car_inventory')
                    .select('*')
                    .eq('id', finalTrxData.related_car_id)
                    .single()

                if (carData) setCar(carData)
            }

        } catch (error) {
            console.error('Error fetching details:', error)
            alert('Failed to load transaction details')
            router.push('/finance')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!id || !confirm(t.finance.confirmDelete)) return

        try {
            const { error } = await supabase
                .from('financial_transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            router.push('/finance')
        } catch (error) {
            console.error('Error deleting transaction:', error)
            alert(t.finance.errorDelete)
        }
    }

    if (loading) return <div className="p-8 text-center">{t.common.loading}</div>
    if (!id || !transaction) return <div className="p-8 text-center">{t.finance.noTransactions}</div>

    // Parse description for extra fields
    let description = transaction.description || ''
    let relatedOrderNumber = ''
    let notes = ''

    const sellerMatch = description.match(/\nSeller: (.*)/)
    if (sellerMatch) description = description.replace(sellerMatch[0], '')

    const buyerMatch = description.match(/\nBuyer: (.*)/)
    if (buyerMatch) description = description.replace(buyerMatch[0], '')

    const orderMatch = description.match(/\n\(Related Order: (.*)\)/)
    if (orderMatch) {
        relatedOrderNumber = orderMatch[1]
        description = description.replace(orderMatch[0], '')
    }

    const notesMatch = description.match(/\nNotes: (.*)/)
    if (notesMatch) {
        notes = notesMatch[1]
        description = description.replace(notesMatch[0], '')
    }

    const isIncome = transaction.type === 'Income'
    const isCarTransaction = transaction.category === 'Car Sale' || transaction.category === 'Buying Car'

    const calculateRemaining = () => {
        const total = transaction.amount || 0
        const paid = transaction.paid_amount || 0
        return Math.max(0, total - paid)
    }

    const calculateProfit = () => {
        const sellingPrice = transaction.amount || 0
        const buyingPrice = transaction.car_buying_price || 0
        const commissions = (transaction.seller_commission || 0) + (transaction.buyer_commission || 0) + (transaction.bureau_commission || 0)
        return sellingPrice - buyingPrice - commissions
    }

    return (
        <>
            <div className="p-4 md:p-8 max-w-4xl mx-auto print:hidden">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <Link href="/finance" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2 mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            {t.common.back}
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction Details</h1>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={`/shipping/new?transaction_id=${id}`}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            <Truck className="w-4 h-4" />
                            Create Shipping Form
                        </Link>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </button>
                        <Link
                            href={`/finance/edit?id=${id}`}
                            className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex items-center gap-2"
                            // To prevent prefetching issues in some contexts or if unnecessary:
                            prefetch={false}
                        >
                            <Edit className="w-4 h-4" />
                            {t.common.edit}
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t.common.delete}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Info Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 md:col-span-2">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{description.trim()}</h2>
                                <p className="text-gray-500 dark:text-gray-400">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                            </div>
                            <div className={`text-3xl font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} <span className="text-lg text-gray-400 dark:text-gray-500">{transaction.currency}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Category</span>
                                <span className="font-medium text-gray-900 dark:text-white">{transaction.category}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Status</span>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${transaction.payment_status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    transaction.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {transaction.payment_status}
                                </span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Method</span>
                                <span className="font-medium text-gray-900 dark:text-white capitalize">{transaction.payment_method?.replace('_', ' ')}</span>
                            </div>
                            {transaction.payment_status === 'Partial' && (
                                <div>
                                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining</span>
                                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{calculateRemaining().toLocaleString()} {transaction.currency}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Details */}
                    {(transaction.customer_name || transaction.customer_phone) && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Client Details
                            </h3>
                            <div className="space-y-3">
                                {transaction.customer_name && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Name</span>
                                        <span className="font-medium dark:text-white">{transaction.customer_name}</span>
                                    </div>
                                )}
                                {transaction.customer_phone && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Phone</span>
                                        <span className="font-medium dark:text-white">{transaction.customer_phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}



                    {/* Documents & Identification */}
                    {(transaction.passport_number || transaction.customer_id_card || transaction.passport_photo_url || transaction.id_card_url) && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-teal-500" />
                                Documents & ID
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {transaction.passport_number && (
                                        <div>
                                            <span className="block text-sm text-gray-500 dark:text-gray-400">Passport Number</span>
                                            <span className="font-medium dark:text-white">{transaction.passport_number}</span>
                                        </div>
                                    )}
                                    {transaction.customer_id_card && (
                                        <div>
                                            <span className="block text-sm text-gray-500 dark:text-gray-400">ID Card Number</span>
                                            <span className="font-medium dark:text-white">{transaction.customer_id_card}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    {transaction.passport_photo_url && (
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500 block">Passport</span>
                                            <a href={transaction.passport_photo_url} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden hover:opacity-80 transition">
                                                <img src={transaction.passport_photo_url} alt="Passport" className="w-full h-24 object-cover" />
                                            </a>
                                        </div>
                                    )}
                                    {transaction.id_card_url && (
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500 block">ID Card Front</span>
                                            <a href={transaction.id_card_url} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden hover:opacity-80 transition">
                                                <img src={transaction.id_card_url} alt="ID Front" className="w-full h-24 object-cover" />
                                            </a>
                                        </div>
                                    )}
                                    {transaction.id_card_back_url && (
                                        <div className="space-y-1">
                                            <span className="text-xs text-gray-500 block">ID Card Back</span>
                                            <a href={transaction.id_card_back_url} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden hover:opacity-80 transition">
                                                <img src={transaction.id_card_back_url} alt="ID Back" className="w-full h-24 object-cover" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Car Details */}
                    {isCarTransaction && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Car className="w-5 h-5 text-purple-500" />
                                Car Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Model</span>
                                    <span className="font-medium dark:text-white">{transaction.car_model || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Year</span>
                                    <span className="font-medium dark:text-white">{transaction.car_year || '-'}</span>
                                </div>
                                {transaction.car_vin && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">VIN</span>
                                        <span className="font-medium font-mono text-xs dark:text-gray-300">{transaction.car_vin}</span>
                                    </div>
                                )}
                                {transaction.car_milage && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Mileage</span>
                                        <span className="font-medium dark:text-white">{transaction.car_milage.toLocaleString()} km</span>
                                    </div>
                                )}
                            </div>

                            {transaction.vehicle_photos_urls && transaction.vehicle_photos_urls.length > 0 && (
                                <div className="mt-4">
                                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Vehicle Photos</span>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                        {(Array.isArray(transaction.vehicle_photos_urls) ? transaction.vehicle_photos_urls : transaction.vehicle_photos_urls.split(',')).map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden hover:opacity-80 transition aspect-square">
                                                <img src={url} alt={`Vehicle ${i + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    )}

                    {/* Financial Breakdown (For Car Sales) */}
                    {isCarTransaction && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 md:col-span-2">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-green-600" />
                                Financial Breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Selling Price</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{transaction.amount?.toLocaleString()} {transaction.currency}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Buying Price (DZD)</span>
                                        <span className="font-medium text-gray-900 dark:text-white">-{transaction.car_buying_price?.toLocaleString()} DZD</span>
                                    </div>
                                    {(transaction.seller_commission || transaction.buyer_commission || transaction.bureau_commission) && (
                                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                            <span className="text-gray-600 dark:text-gray-400">Total Commissions</span>
                                            <span className="font-medium text-red-600 dark:text-red-400">
                                                -{((transaction.seller_commission || 0) + (transaction.buyer_commission || 0) + (transaction.bureau_commission || 0)).toLocaleString()} DZD
                                            </span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
                                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                            <span className="text-green-800 dark:text-green-400 font-bold">Net Profit</span>
                                            <span className={`text-xl font-bold ${calculateProfit() >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {calculateProfit().toLocaleString()} DZD
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Currency Info */}
                                <div className="space-y-3 text-sm">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Currency Exchange Info
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-gray-500 dark:text-gray-400">Original Currency</span>
                                            <span className="font-medium dark:text-white">{transaction.buying_currency || 'DZD'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 dark:text-gray-400">Original Price</span>
                                            <span className="font-medium dark:text-white">{transaction.original_buying_price?.toLocaleString() || '-'}</span>
                                        </div>
                                        {transaction.exchange_rate_dzd_usdt && (
                                            <div>
                                                <span className="block text-gray-500 dark:text-gray-400">Rate DZD/USDT</span>
                                                <span className="font-medium dark:text-white">{transaction.exchange_rate_dzd_usdt}</span>
                                            </div>
                                        )}
                                        {transaction.exchange_rate_usdt_krw && (
                                            <div>
                                                <span className="block text-gray-500 dark:text-gray-400">Rate USDT/KRW</span>
                                                <span className="font-medium dark:text-white">{transaction.exchange_rate_usdt_krw}</span>
                                            </div>
                                        )}
                                    </div>
                                    {transaction.is_paid_in_korea && (
                                        <div className="mt-4 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded text-center font-medium">
                                            Paid in Korea {transaction.paid_in_korea_date ? `on ${new Date(transaction.paid_in_korea_date).toLocaleDateString()}` : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    {(relatedOrderNumber || notes) && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 md:col-span-2">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" />
                                Additional Information
                            </h3>
                            <div className="space-y-4">
                                {relatedOrderNumber && (
                                    <div>
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Related Order</span>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">{relatedOrderNumber}</span>
                                    </div>
                                )}
                                {notes && (
                                    <div>
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</span>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div >

            <InvoiceTemplate transaction={transaction} order={order} car={car} />
        </>
    )
}

export default function FinanceDetails() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FinanceDetailsContent />
        </Suspense>
    )
}
