'use client'

import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ArrowLeft, Edit, FileText, Image as ImageIcon, Printer, Ship } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function BatchExportContent() {
    const searchParams = useSearchParams()
    const batchName = searchParams.get('batch')
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (batchName) {
            fetchBatchTransactions()
        } else {
            setLoading(false)
        }
    }, [batchName])

    async function fetchBatchTransactions() {
        setLoading(true)
        try {
            const { data, error } = await (supabase.from('financial_transactions') as any)
                .select('*')
                .eq('batch_name', batchName)
                .order('transaction_date', { ascending: true })

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching batch export transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading shipment batch manifest...</div>
    }

    if (!batchName) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 font-bold mb-4">No batch specified.</p>
                <Link href="/finance/batches" className="text-blue-600 underline">
                    Back to Batches
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-4 md:p-8">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 8mm 6mm;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #shipping-manifest, #shipping-manifest * {
                        visibility: visible;
                    }
                    #shipping-manifest {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .manifest-row {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Top Toolbar */}
            <div className="max-w-[297mm] mx-auto mb-6 print:hidden flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        href="/finance/batches"
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Batches
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-500">
                        Carrier Export Manifest • Editable in browser before printing
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition"
                    >
                        <Printer className="w-4 h-4" />
                        Print / Export Manifest (A4 Landscape)
                    </button>
                </div>
            </div>

            {/* Manifest Container (A4 Landscape oriented) */}
            <div className="max-w-[297mm] mx-auto bg-white p-8 rounded-sm shadow-xl print:shadow-none border border-gray-200 print:border-none text-black" id="shipping-manifest">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <img src="/invoice-logo.png" alt="Oussama Auto" className="h-10 w-auto object-contain" />
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">OUSSAMA AUTO</h1>
                                <p className="text-xs font-bold text-gray-600 uppercase">SHIPPING CARRIER EXPORT MANIFEST</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Boulevard, El-Milia - JIJEL | TEL: +82 1068737079 / 0782769427</p>
                    </div>

                    <div className="text-right">
                        <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-1.5 mb-1">
                            <span className="text-xs text-blue-700 font-medium mr-2">BATCH:</span>
                            <span className="text-lg font-black text-blue-900 font-mono" contentEditable suppressContentEditableWarning>
                                {batchName}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Date: {format(new Date(), 'dd/MM/yyyy')} | Total Vehicles: {transactions.length}</p>
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                        No transactions found in batch "{batchName}".
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-400 text-xs">
                            <thead>
                                <tr className="bg-gray-100 text-gray-900 border-b-2 border-gray-400 text-left font-bold uppercase">
                                    <th className="p-2 border border-gray-300 w-8 text-center">N°</th>
                                    <th className="p-2 border border-gray-300 w-64">Client Info (Consignee)</th>
                                    <th className="p-2 border border-gray-300 w-52">Vehicle Specifications</th>
                                    <th className="p-2 border border-gray-300">Identity & Passport Documents</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx, index) => {
                                    const clientName = trx.customer_name || 'Client'
                                    const clientAddress = trx.customer_address || 'Algérie'
                                    const clientPhone = trx.customer_phone || '—'
                                    const passportNo = trx.passport_number || trx.customer_id_card || '—'
                                    const ninNo = trx.customer_id_card || '—'
                                    const postalCode = trx.customer_postal_code || '—'
                                    const clientEmail = trx.customer_email || '—'

                                    const carBrand = (trx.car_brand || '—').toUpperCase()
                                    const carModel = (trx.car_model || '—').toUpperCase()
                                    const carTrim = (trx.car_trim || '').toUpperCase()
                                    const carYear = trx.car_year || '—'
                                    const carColor = (trx.car_color || '—').toUpperCase()
                                    const carVin = (trx.car_vin || '—').toUpperCase()
                                    const carMileage = trx.car_milage ? `${trx.car_milage.toLocaleString()} KM` : '—'
                                    const countryOrigin = (trx.country_of_origin || 'South Korea').toUpperCase()

                                    return (
                                        <tr key={trx.id} className="manifest-row border-b border-gray-300 hover:bg-gray-50/50">
                                            {/* Index Number */}
                                            <td className="p-2 border border-gray-300 text-center font-bold align-top">
                                                {index + 1}
                                            </td>

                                            {/* Client Info Cell (Vertical stacked format) */}
                                            <td className="p-2.5 border border-gray-300 align-top font-mono leading-relaxed" contentEditable suppressContentEditableWarning>
                                                <div className="space-y-1">
                                                    <p><strong className="font-sans font-bold">Name :</strong> {clientName}</p>
                                                    <p><strong className="font-sans font-bold">Address :</strong> {clientAddress}</p>
                                                    <p><strong className="font-sans font-bold">TEL :</strong> {clientPhone}</p>
                                                    <p><strong className="font-sans font-bold">Passport number :</strong> {passportNo}</p>
                                                    <p><strong className="font-sans font-bold">NIN number :</strong> {ninNo}</p>
                                                    <p><strong className="font-sans font-bold">Postal code :</strong> {postalCode}</p>
                                                    <p><strong className="font-sans font-bold">Email :</strong> {clientEmail}</p>
                                                </div>
                                            </td>

                                            {/* Vehicle Specifications */}
                                            <td className="p-2.5 border border-gray-300 align-top leading-relaxed" contentEditable suppressContentEditableWarning>
                                                <div className="space-y-1 font-sans">
                                                    <p><strong className="font-bold">Brand :</strong> {carBrand}</p>
                                                    <p><strong className="font-bold">Model :</strong> {carModel} {carTrim && `(${carTrim})`}</p>
                                                    <p><strong className="font-bold">Year :</strong> {carYear}</p>
                                                    <p><strong className="font-bold">Color :</strong> {carColor}</p>
                                                    <p><strong className="font-bold">Mileage :</strong> {carMileage}</p>
                                                    <p><strong className="font-bold">Origin :</strong> {countryOrigin}</p>
                                                    <p className="mt-1 pt-1 border-t border-gray-200">
                                                        <strong className="font-bold block text-[10px] text-gray-500">VIN Number :</strong>
                                                        <span className="font-mono font-bold text-blue-900 tracking-wider text-xs">{carVin}</span>
                                                    </p>
                                                </div>
                                            </td>

                                            {/* High-Resolution Document Photos (Side-by-side) */}
                                            <td className="p-2 border border-gray-300 align-top">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {/* Passport Photo */}
                                                    <div className="border border-gray-200 rounded p-1 bg-gray-50 text-center">
                                                        <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Passport</span>
                                                        {trx.passport_photo_url ? (
                                                            <div className="h-28 w-full flex items-center justify-center bg-white overflow-hidden rounded">
                                                                <img
                                                                    src={trx.passport_photo_url}
                                                                    alt="Passport"
                                                                    className="max-h-full max-w-full object-contain"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-28 flex items-center justify-center text-gray-300 text-[10px]">
                                                                No Photo
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ID Card Front */}
                                                    <div className="border border-gray-200 rounded p-1 bg-gray-50 text-center">
                                                        <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">ID Front</span>
                                                        {trx.id_card_url ? (
                                                            <div className="h-28 w-full flex items-center justify-center bg-white overflow-hidden rounded">
                                                                <img
                                                                    src={trx.id_card_url}
                                                                    alt="ID Front"
                                                                    className="max-h-full max-w-full object-contain"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-28 flex items-center justify-center text-gray-300 text-[10px]">
                                                                No Photo
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ID Card Back */}
                                                    <div className="border border-gray-200 rounded p-1 bg-gray-50 text-center">
                                                        <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">ID Back</span>
                                                        {trx.id_card_back_url ? (
                                                            <div className="h-28 w-full flex items-center justify-center bg-white overflow-hidden rounded">
                                                                <img
                                                                    src={trx.id_card_back_url}
                                                                    alt="ID Back"
                                                                    className="max-h-full max-w-full object-contain"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-28 flex items-center justify-center text-gray-300 text-[10px]">
                                                                No Photo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Notes & Carrier Sign-off */}
                <div className="mt-8 pt-4 border-t-2 border-gray-300 flex justify-between items-end text-xs">
                    <div>
                        <p className="font-bold text-gray-800">Shipper / Agent: OUSSAMA AUTO</p>
                        <p className="text-gray-500 text-[11px]">Certified complete and accurate for maritime transport.</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold uppercase text-[11px] mb-8">Carrier / Port Inspector Signature & Stamp:</p>
                        <div className="w-56 border-b border-gray-800 border-dotted"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function BatchExportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading Export Manifest...</div>}>
            <BatchExportContent />
        </Suspense>
    )
}
