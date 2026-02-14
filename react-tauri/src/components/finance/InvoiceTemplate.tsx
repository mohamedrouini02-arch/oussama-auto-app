import { format } from 'date-fns'
import logo from '../../assets/invoice-logo.png'

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
    const carColor = car?.color || order?.order_data?.color || ''
    const carVin = transaction.car_vin || car?.vin_number || car?.vin || ''
    const carMileage = transaction.car_milage || car?.mileage || ''

    // Financials
    const sellingPrice = transaction.amount || 0
    const paidAmount = transaction.paid_amount || 0
    const remainingAmount = Math.max(0, sellingPrice - paidAmount)
    const currency = transaction.currency || 'DZD'

    const currentDate = format(new Date(), 'dd/MM/yyyy')

    return (
        <div className="hidden print:block h-[296mm] overflow-hidden p-8 max-w-[210mm] text-black font-sans bg-white relative" id="invoice-template">
            {/* Style to hide browser print headers/footers */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; }
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="Wahid Auto Logo" className="w-40 object-contain" />
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

            {/* Signatures - Back in flow */}
            <div className="grid grid-cols-2 gap-20 mb-8 max-w-2xl mx-auto">
                <div className="text-center">
                    <p className="font-bold text-gray-800 text-sm uppercase mb-8">Signature du Client</p>
                    <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
                <div className="text-center">
                    <p className="font-bold text-gray-800 text-sm uppercase mb-8">Signature du Gérant</p>
                    <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
            </div>

            {/* Footer - Absolute Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-[10px] text-gray-500 bg-white border-t border-gray-200 m-8">
                <p className="font-bold text-gray-700 mb-0.5">Wahid Auto</p>
                <p className="mb-0.5">Adresse: Bazoul, Tahir, Jijel | Site Web: wahid-auto.com</p>
                <p>Tél: 0781 66 32 01 / 0557 06 04 78</p>
            </div>
        </div>
    )
}
