'use client'

import InvoiceTemplate from '@/components/finance/InvoiceTemplate'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, FileText, Printer } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function InvoiceContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [transaction, setTransaction] = useState<any>(null)
    const [order, setOrder] = useState<any>(null)
    const [car, setCar] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!id) {
                setLoading(false)
                return
            }

            try {
                // 1. Fetch Transaction
                const { data: transactionData, error: transactionError } = await (supabase.from('financial_transactions') as any)
                    .select('*')
                    .eq('id', id)
                    .single()

                if (transactionError) throw transactionError
                setTransaction(transactionData)

                // 2. Fetch Related Order (if exists)
                if (transactionData.related_order_id) {
                    const { data: orderData } = await (supabase.from('orders') as any)
                        .select('*')
                        .eq('id', transactionData.related_order_id)
                        .single()
                    setOrder(orderData)
                }

                // 3. Fetch Related Car (if exists)
                const carId = transactionData.related_car_id || order?.car_id

                if (carId) {
                    const { data: carData } = await (supabase.from('car_inventory') as any)
                        .select('*')
                        .eq('id', carId)
                        .single()
                    setCar(carData)
                }
            } catch (error) {
                console.error('Error fetching invoice data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTransaction()
    }, [id])

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 p-8 text-gray-500">
                Loading Bon de Commande...
            </div>
        )
    }

    if (!transaction) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-950 p-8">
                <p className="text-red-500 text-lg font-medium mb-4">Transaction not found (ID: {id || 'missing'})</p>
                <Link
                    href="/finance"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Finance
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-4 md:p-8 print:p-0 print:m-0 print:bg-white print:min-h-0">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="max-w-[210mm] mx-auto mb-6 print:hidden flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/finance/details?id=${id}`}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Details
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-500">
                        Editable in browser: click text below to edit before printing
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/finance/contract?id=${id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium border border-emerald-200 transition"
                    >
                        <FileText className="w-4 h-4" />
                        Legal Contract
                    </Link>
                    <Link
                        href={`/finance/edit?id=${id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Data
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-bold shadow-md shadow-orange-600/20"
                    >
                        <Printer className="w-4 h-4" />
                        Print Bon de Commande
                    </button>
                </div>
            </div>

            <div className="max-w-[210mm] mx-auto print:max-w-none print:w-[210mm] print:m-0 print:p-0">
                <InvoiceTemplate transaction={transaction} order={order} car={car} />
            </div>
        </div>
    )
}

export default function InvoicePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <InvoiceContent />
        </Suspense>
    )
}
