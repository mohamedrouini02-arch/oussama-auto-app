'use client'

import { format } from 'date-fns'
import { CheckSquare, Mail, MapPin, Phone, Square } from 'lucide-react'

interface InvoiceTemplateProps {
    transaction: any
    order?: any
    car?: any
}

function formatDZD(amount: number | string | null | undefined): string {
    const num = parseFloat(String(amount || 0))
    if (isNaN(num) || num === 0) return '00 DA'
    // Format e.g. 2.300.000.00 DA
    const parts = num.toFixed(2).split('.')
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${integerPart}.${parts[1]} DA`
}

export default function InvoiceTemplate({ transaction, order, car }: InvoiceTemplateProps) {
    if (!transaction) return null

    // Customer Details
    const customerName = transaction.customer_name || order?.customer_name || 'GUENOUNE MOHAMED SALAH'
    const customerPhone = transaction.customer_phone || order?.customer_phone || '0781782036'
    const customerAddress = transaction.customer_address || order?.customer_wilaya || 'TAHER - JIJEL'
    const customerIdCard = transaction.customer_id_card || transaction.passport_number || '119289366'

    // Order Details
    const orderNumber = transaction.order_number || transaction.related_order_number || transaction.id?.substring(0, 4)?.toUpperCase() || '194'
    const rawDate = transaction.transaction_date ? new Date(transaction.transaction_date) : new Date()
    const formattedDate = format(rawDate, 'dd/MM/yyyy')

    // Car Details
    const carBrand = (transaction.car_brand || car?.brand || order?.car_brand || 'CHEVROLET').toUpperCase()
    const carModel = (transaction.car_model || car?.model || order?.car_model || 'SPARK').toUpperCase()
    const carTrim = (transaction.car_trim || car?.trim || 'PREMIUM').toUpperCase()
    const carColor = (transaction.car_color || car?.color || 'BLUE').toUpperCase()
    const carEnergy = (transaction.car_energy || car?.energy || 'ESSENCE').toUpperCase()
    const carTransmission = (transaction.car_transmission || car?.transmission || 'AUTO').toUpperCase()
    const carYear = transaction.car_year || car?.year || '2023'
    const carMileage = transaction.car_milage || car?.mileage ? `${(transaction.car_milage || car?.mileage).toLocaleString()} KM` : '40000 KM'
    const carVin = (transaction.car_vin || car?.vin_number || car?.vin || 'KLYDC487DNC003291').toUpperCase()
    const countryOfOrigin = (transaction.country_of_origin || 'SOUTH KOREA').toUpperCase()

    // Financials
    const totalAmount = parseFloat(transaction.amount || 0)
    const paidAmount = parseFloat(transaction.paid_amount || 0)
    const remainingAmount = Math.max(0, totalAmount - paidAmount)

    const paymentMethod = transaction.payment_method || 'Espèce'
    const isCash = paymentMethod.toLowerCase().includes('espèce') || paymentMethod.toLowerCase().includes('cash')
    const isCb = paymentMethod.toLowerCase().includes('carte') || paymentMethod.toLowerCase().includes('cb') || paymentMethod.toLowerCase().includes('virement')
    const deliveryMethod = transaction.delivery_method || 'RORO'
    const notes = transaction.notes || ''

    return (
        <div className="relative mx-auto bg-white text-black font-sans shadow-lg print:shadow-none box-border" id="bon-de-commande">
            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0;
                    }
                    html, body {
                        width: 210mm !important;
                        height: 100% !important;
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Force exact reproduction of all colors, borders, and fills */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    /* Hide unnecessary dashboard and UI elements */
                    aside, nav, header, .print\\:hidden, .no-print, button {
                        display: none !important;
                    }
                    /* Reset dashboard parent containers */
                    #__next, [data-nextjs-scroll-focus-boundary], main, .min-h-screen {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        min-height: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                        transform: none !important;
                        background: white !important;
                    }
                    #bon-de-commande {
                        position: relative !important;
                        left: auto !important;
                        top: auto !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        height: 297mm !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    .bon-de-commande-sheet {
                        width: 210mm !important;
                        max-width: 210mm !important;
                        min-height: 297mm !important;
                        height: 297mm !important;
                        padding: 10mm 14mm !important;
                        margin: 0 auto !important;
                        border: none !important;
                        box-sizing: border-box !important;
                        overflow: visible !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        background: white !important;
                    }
                }
            `}</style>

            {/* A4 Container */}
            <div className="bon-de-commande-sheet relative w-[210mm] min-h-[297mm] p-[10mm_14mm] mx-auto border border-gray-200 print:border-none bg-white flex flex-col box-border">
                
                {/* Watermark Logo Background */}
                <div 
                    className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] z-0 overflow-hidden"
                    aria-hidden="true"
                >
                    <img 
                        src="/invoice-logo.png" 
                        alt="Watermark" 
                        className="w-[140mm] object-contain rotate-[-18deg]"
                    />
                </div>

                <div className="relative z-10 flex flex-col flex-1">
                    {/* Header: Branding, Contacts, Location */}
                    <div className="flex justify-between items-center pb-3 border-b-[3px] border-orange-500 mb-4">
                        {/* Company Logo and Tagline */}
                        <div className="flex items-center gap-4">
                            <img src="/invoice-logo.png" alt="Oussama Auto" className="h-14 w-auto object-contain" />
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-orange-600 uppercase leading-none">oussama auto</h1>
                                <p className="text-[13px] font-bold text-gray-800 mt-1">Importation des véhicules - 3 ans</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span>Boulevard, El-Milia - JIJEL</span>
                        </div>

                        {/* Contacts */}
                        <div className="text-right text-sm space-y-1 font-semibold text-gray-800">
                            <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                                <span className="text-[13px] font-mono font-bold">+82 1068737079</span>
                                <Phone className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-gray-900 font-mono">
                                <span className="text-[13px]">0782769427</span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-gray-700">
                                <span className="text-[12px]">oussamaboulemnakher@gmail.com</span>
                                <Mail className="w-3.5 h-3.5 text-red-500" />
                            </div>
                        </div>
                    </div>

                    {/* Main Title Banner */}
                    <div className="text-center my-3">
                        <div className="inline-block bg-white px-10 py-2 border-[3px] border-orange-500 rounded-sm shadow-sm">
                            <h2 className="text-2xl font-black tracking-wider uppercase text-gray-900">
                                BON DE COMMANDE
                            </h2>
                        </div>
                    </div>

                    {/* Order & Customer Info Header Box */}
                    <div className="border-[3px] border-orange-500 rounded-md p-4 mb-4 bg-orange-50/20 text-sm">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Left: Order Info */}
                            <div className="space-y-2">
                                <p className="flex items-center">
                                    <span className="font-bold text-gray-900 w-48">Numéro de commande :</span>
                                    <span className="font-extrabold text-orange-600 font-mono text-base" contentEditable suppressContentEditableWarning>
                                        {orderNumber}
                                    </span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-bold text-gray-900 w-48">Date :</span>
                                    <span className="font-semibold text-gray-800" contentEditable suppressContentEditableWarning>
                                        {formattedDate}
                                    </span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-bold text-gray-900 w-48">Tél :</span>
                                    <span className="font-bold text-gray-900 font-mono" contentEditable suppressContentEditableWarning>
                                        {customerPhone}
                                    </span>
                                </p>
                            </div>

                            {/* Right: Client Info */}
                            <div className="space-y-2">
                                <p className="flex items-center">
                                    <span className="font-bold text-gray-900 w-32">Nom :</span>
                                    <span className="font-extrabold text-gray-900 uppercase" contentEditable suppressContentEditableWarning>
                                        {customerName}
                                    </span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-bold text-gray-900 w-32">Adresse :</span>
                                    <span className="font-semibold text-gray-800 uppercase" contentEditable suppressContentEditableWarning>
                                        {customerAddress}
                                    </span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-bold text-gray-900 w-32">ID Number :</span>
                                    <span className="font-bold text-gray-900 font-mono" contentEditable suppressContentEditableWarning>
                                        {customerIdCard}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Two-Column Specifications & Payment Grid */}
                    <div className="grid grid-cols-2 gap-5 mb-4 items-start">
                        {/* Left Column: Vehicle Specifications */}
                        <div>
                            <h3 className="text-orange-600 font-bold text-base mb-2 uppercase tracking-tight">
                                Spécification de la véhicule :
                            </h3>
                            <table className="w-full border-collapse border-2 border-gray-900 text-sm text-center font-bold">
                                <tbody>
                                    <tr className="border-b border-gray-900">
                                        <td className="w-1/2 p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">MARQUE</td>
                                        <td className="w-1/2 p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carBrand}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">MODEL</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carModel}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">FINITION</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carTrim}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">COULEUR</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carColor}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">ENERGY</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carEnergy}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">TRANSMISSION</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carTransmission}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">ANNÉE</td>
                                        <td className="p-2.5" contentEditable suppressContentEditableWarning>{carYear}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">KLM</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{carMileage}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">N°: VIN</td>
                                        <td className="p-2.5 font-mono uppercase text-[13px] tracking-wider text-blue-900" contentEditable suppressContentEditableWarning>{carVin}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 text-center bg-gray-50 border-r border-gray-900 uppercase">PAY EXPO</td>
                                        <td className="p-2.5 uppercase" contentEditable suppressContentEditableWarning>{countryOfOrigin}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Right Column: Payment Details */}
                        <div>
                            <h3 className="text-orange-600 font-bold text-base mb-2 uppercase tracking-tight">
                                Détails du paiment :
                            </h3>
                            <table className="w-full border-collapse border-2 border-gray-900 text-sm font-bold mb-3">
                                <thead>
                                    <tr className="bg-gray-100 border-b-2 border-gray-900 text-center">
                                        <th className="p-2.5 w-1/2 border-r border-gray-900 uppercase">ARTICLE</th>
                                        <th className="p-2.5 w-1/2 uppercase">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 border-r border-gray-900 bg-gray-50 uppercase">Montant . T</td>
                                        <td className="p-2.5 font-mono text-sm" contentEditable suppressContentEditableWarning>{formatDZD(totalAmount)}</td>
                                    </tr>
                                    <tr className="border-b border-gray-900">
                                        <td className="p-2.5 border-r border-gray-900 bg-gray-50 uppercase">Montant . P</td>
                                        <td className="p-2.5 font-mono text-sm text-emerald-700" contentEditable suppressContentEditableWarning>{formatDZD(paidAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 border-r border-gray-900 bg-gray-50 uppercase">Montant . R</td>
                                        <td className="p-2.5 font-mono text-sm text-red-600" contentEditable suppressContentEditableWarning>{formatDZD(remainingAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Payment Method Checkbox & Delivery Method */}
                            <div className="space-y-3 text-sm font-bold text-gray-900 pt-1">
                                <div className="flex items-center gap-4">
                                    <span>Méthode de paiement :</span>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        {isCash ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                                        <span>Espèce</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        {isCb ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                                        <span>Cb</span>
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span>Moyen de Livraison :</span>
                                    <span className="font-extrabold text-blue-900 uppercase" contentEditable suppressContentEditableWarning>
                                        {deliveryMethod}
                                    </span>
                                </div>

                                {/* Note Box */}
                                <div className="mt-2">
                                    <span className="block mb-1 text-[13px]">Note :</span>
                                    <div 
                                        className="p-3 bg-yellow-100/70 border border-yellow-300 rounded text-sm min-h-[60px] text-gray-800"
                                        contentEditable
                                        suppressContentEditableWarning
                                    >
                                        {notes || 'Véhicule conforme aux spécifications convenues. Délais d\'expédition estimés communiqués au client.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spacer to push summary & signature toward bottom */}
                    <div className="flex-1 min-h-[10mm]" />

                    {/* Summary & Legal Commitment Section */}
                    <div className="border-t-2 border-gray-900 pt-3 space-y-2 text-sm leading-relaxed text-gray-900">
                        <p className="font-medium" contentEditable suppressContentEditableWarning>
                            •Le montant: <strong className="font-extrabold text-emerald-700">{formatDZD(paidAmount)}</strong> a été reçu du client: <strong className="font-extrabold uppercase">{customerName}</strong> Le {formattedDate} dans le cadre du processus d'importation d'une voiture <strong className="font-extrabold">{carBrand} {carModel}</strong>.
                        </p>
                        <p className="font-medium" contentEditable suppressContentEditableWarning>
                            •Le montant restant dû est estimé à :<strong className="font-extrabold text-red-600">{formatDZD(remainingAmount)}</strong> payer ultérieurement après l'expédition.
                        </p>
                        <p className="text-[12px] font-bold text-red-600 uppercase tracking-tight leading-normal" contentEditable suppressContentEditableWarning>
                            •NB: LE CLIENT EST TENU DE RESPECTER LES DELAIS DE PAIEMENT. EN CAS DE RETARD IL ASSUMERA LES FRAIS CONFERMEMENT AU CONTRAT CONCLU ENTRE LES DEUX PARTIES.
                        </p>

                        <div className="pt-4 flex justify-between items-end">
                            <div className="text-sm font-bold text-gray-900">
                                <span>Le : </span>
                                <span className="font-semibold" contentEditable suppressContentEditableWarning>{formattedDate}</span>
                                <span className="ml-6">à : </span>
                                <span className="font-semibold" contentEditable suppressContentEditableWarning>El-Milia</span>
                            </div>
                            <div className="text-right">
                                <p className="font-extrabold text-sm uppercase mb-8">Signature :</p>
                                <div className="w-48 border-b-2 border-gray-800 border-dotted"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer copyright */}
                <div className="text-center text-[11px] text-gray-400 pt-2 border-t border-gray-100 mt-4">
                    Oussama Auto - Tous droits réservés • Document officiel généré le {formattedDate}
                </div>
            </div>
        </div>
    )
}
