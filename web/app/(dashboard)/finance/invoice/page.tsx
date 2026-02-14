'use client'

import InvoiceTemplate from '@/components/finance/InvoiceTemplate'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Printer } from 'lucide-react'
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
                const { data: transactionData, error: transactionError } = await supabase
                    .from('financial_transactions')
                    .select('*')
                    .eq('id', id)
                    .single() as any

                if (transactionError) throw transactionError
                setTransaction(transactionData)

                // 2. Fetch Related Order (if exists)
                if (transactionData.related_order_id) {
                    const { data: orderData } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', transactionData.related_order_id)
                        .single() as any
                    setOrder(orderData)
                }

                // 3. Fetch Related Car (if exists)
                // Try related_car_id first, if not, try to get from order
                const carId = transactionData.related_car_id || (order?.car_id)

                if (carId) {
                    const { data: carData } = await supabase
                        .from('car_inventory')
                        .select('*')
                        .eq('id', carId)
                        .single() as any
                    setCar(carData)
                }

                // If we didn't get car from ID, but we have order, maybe fetch car from order's car_id if we have order data now
                if (!carId && transactionData.related_order_id) {
                    const { data: orderData } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', transactionData.related_order_id)
                        .single() as any

                    if (orderData?.car_id) {
                        const { data: carData } = await supabase
                            .from('car_inventory')
                            .select('*')
                            .eq('id', orderData.car_id)
                            .single() as any
                        setCar(carData)
                    }
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
        return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 p-8 text-gray-500">Loading invoice...</div>
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
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto mb-6 print:hidden flex justify-between items-center">
                <Link
                    href="/finance"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Finance
                </Link>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Printer className="w-5 h-5" />
                    Print Invoice
                </button>
            </div>

            <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-sm overflow-hidden">
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
