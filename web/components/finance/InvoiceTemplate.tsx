import { format } from 'date-fns'

/* 
   NOTE: This file is synced from react-tauri/src/components/finance/InvoiceTemplate.tsx 
   to ensure exact parity. DO NOT MODIFY without syncing both.
*/

interface InvoiceTemplateProps {
    transaction: any
    order?: any
    car?: any
}

export default function InvoiceTemplate({ transaction, order, car }: InvoiceTemplateProps) {
    if (!transaction) return null

    // Customer Details
    // Try to extract address from description if possible, as it's often saved there
    const descriptionAddressRequest = transaction.description?.match(/Address: (.*)/)?.[1]
    const customerName = transaction.customer_name || order?.customer_name || 'Client de passage'
    const customerPhone = transaction.customer_phone || order?.customer_phone || ''
    const customerAddress = descriptionAddressRequest || transaction.customer_address || order?.customer_wilaya || order?.order_data?.address || ''
    const customerIdCard = transaction.description?.match(/ID Card: (.*)/)?.[1] || order?.order_data?.id_card_number || ''

    // Car Details
    const carBrand = transaction.car_brand || car?.brand || order?.car_brand || ''
    const carModel = transaction.car_model || car?.model || order?.car_model || ''
    const carYear = transaction.car_year || car?.year || ''
    const carColor = transaction.car_color || car?.color || order?.order_data?.color || ''
    const carVin = transaction.car_vin || car?.vin_number || car?.vin || ''
    const carMileage = transaction.car_milage || car?.mileage || ''

    // Financials
    const sellingPrice = transaction.amount || 0
    const paidAmount = transaction.paid_amount || 0
    const remainingAmount = Math.max(0, sellingPrice - paidAmount)
    const currency = transaction.currency || 'DZD'

    const currentDate = format(new Date(), 'dd/MM/yyyy')

    return (
        <div className="block p-8 max-w-[210mm] min-h-[297mm] text-black font-sans bg-white relative box-border mx-auto shadow-lg print:shadow-none mb-8" id="invoice-template">
            <style>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 0; 
                    }
                    body { 
                        visibility: hidden;
                    }
                    #invoice-template { 
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0;
                        padding: 20mm !important;
                        background: white;
                        box-shadow: none;
                    }
                    /* Ensure content inside is visible */
                    #invoice-template * {
                        visibility: visible;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    {/* Web App Image Path */}
                    <img src="/invoice-logo.png" alt="Oussama Auto Logo" className="w-40 object-contain" />
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 uppercase">Facture</h1>
                    <p className="text-sm text-gray-600">N°: #{transaction.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">Date: {currentDate}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-8">
                {/* Client Info */}
                <div>
                    <h3 className="font-bold text-gray-800 uppercase text-sm border-b border-gray-300 pb-2 mb-3">
                        Informations Client
                    </h3>
                    <div className="space-y-1.5 text-sm">
                        <p><span className="font-semibold w-24 inline-block">Nom Complet:</span> {customerName}</p>
                        <p><span className="font-semibold w-24 inline-block">Téléphone:</span> {customerPhone}</p>
                        <p><span className="font-semibold w-24 inline-block">Adresse:</span> {customerAddress}</p>
                        <p><span className="font-semibold w-24 inline-block">N° CNI:</span> {customerIdCard}</p>
                    </div>
                </div>

                {/* Vehicle Info */}
                <div>
                    <h3 className="font-bold text-gray-800 uppercase text-sm border-b border-gray-300 pb-2 mb-3">
                        Informations Véhicule
                    </h3>
                    <div className="space-y-1.5 text-sm">
                        <p><span className="font-semibold w-24 inline-block">Marque:</span> {carBrand}</p>
                        <p><span className="font-semibold w-24 inline-block">Modèle:</span> {carModel}</p>
                        <p><span className="font-semibold w-24 inline-block">Année:</span> {carYear}</p>
                        <p><span className="font-semibold w-24 inline-block">Couleur:</span> {carColor}</p>
                        <p><span className="font-semibold w-24 inline-block">Kilométrage:</span> {carMileage ? `${carMileage.toLocaleString()} KM` : ''}</p>
                        <p><span className="font-semibold w-24 inline-block">VIN:</span> {carVin}</p>
                    </div>
                </div>
            </div>

            {/* Financial Details Table */}
            <div className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-800 uppercase text-xs">
                            <th className="py-3 px-4 text-left border-y border-gray-300">Description</th>
                            <th className="py-3 px-4 text-left border-y border-gray-300">Mode de Paiement</th>
                            <th className="py-3 px-4 text-right border-y border-gray-300">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-4 px-4 border-b border-gray-200 align-top">
                                <p className="font-bold text-gray-900">{transaction.description.split('\n')[0] || 'Achat de véhicule'}</p>
                                <p className="text-xs text-gray-500 mt-1">{carYear} {carBrand} {carModel}</p>
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 align-top capitalize">
                                {transaction.payment_method?.replace('_', ' ') || 'Espèces'}
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 text-right font-medium">
                                {sellingPrice.toLocaleString()} {currency}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-600">Prix de Vente:</span>
                        <span className="font-medium">{sellingPrice.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-600">Montant Payé:</span>
                        <span className="font-medium">{paidAmount.toLocaleString()} {currency}</span>
                    </div>
                    {remainingAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-red-600">
                            <span className="font-semibold">Reste à payer:</span>
                            <span className="font-bold">{remainingAmount.toLocaleString()} {currency}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between items-center text-lg">
                        <span className="font-bold text-gray-900">Total:</span>
                        <span className="font-bold text-gray-900">{sellingPrice.toLocaleString()} {currency}</span>
                    </div>
                </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-20 mb-32 max-w-2xl mx-auto">
                <div className="text-center">
                    <p className="font-bold text-gray-800 text-sm uppercase mb-8">Signature du Client</p>
                    <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
                <div className="text-center">
                    <p className="font-bold text-gray-800 text-sm uppercase mb-8">Signature du Gérant</p>
                    <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-0 right-0 p-4 text-center text-[10px] text-gray-500 bg-white">
                <div className="border-t border-gray-200 pt-2">
                    <p className="font-bold text-gray-700 mb-0.5">Oussama Auto</p>
                    <p className="mb-0.5">Adresse: El milia, Jijel</p>
                    <p>Tél: 0782 76 94 27</p>
                </div>
            </div>
        </div>
    )
}
