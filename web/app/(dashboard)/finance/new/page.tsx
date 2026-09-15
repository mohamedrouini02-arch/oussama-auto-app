'use client'

import MediaPicker, { ExtractedClientData } from '@/components/MediaPicker'
import { useLanguage } from '@/context/LanguageContext'
import { generateShippingPDF } from '@/lib/pdfGenerator'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Car, FileText, Info, Save, Sparkles, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export default function FinanceNew() {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [batches, setBatches] = useState<{ id: string, name: string }[]>([])
    const [formData, setFormData] = useState({
        // Transaction & Order Information
        orderNumber: '',
        type: 'Income',
        category: 'Car Sale',
        description: '',
        date: new Date().toISOString().split('T')[0],
        batchName: '',

        // Payment Details
        currency: 'DZD',
        amount: '',
        paidAmount: '',
        paymentStatus: 'Pending',
        paymentMethod: 'Espèce', // Espèce (Cash), Carte bancaire / Virement (CB)
        deliveryMethod: 'RORO', // RORO, Conteneur, Autre

        // Car Details
        carBrand: '',
        carModel: '',
        carTrim: '', // FINITION (e.g. PREMIUM)
        carYear: '',
        carColor: '',
        carEnergy: 'Essence', // Essence, Diesel, Hybride, Électrique
        carTransmission: 'Automatique', // Automatique, Manuelle
        countryOfOrigin: 'South Korea', // South Korea, China
        carVin: '',
        carMileage: '',
        carBuyingPrice: '', // This is always in DZD
        shippingPrice: '',

        // Currency Exchange
        buyingCurrency: 'KRW', // Default to KRW
        originalBuyingPrice: '',
        exchangeRateDzdUsdt: '',
        exchangeRateUsdtKrw: '',
        isPaidInKorea: false,
        paidInKoreaDate: '',

        // Client Details
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerPostalCode: '',
        customerIdCard: '',
        customerAddress: '',

        // Documents
        passportNumber: '',
        passportPhotoUrl: '',
        idCardUrl: '',
        idCardBackUrl: '',
        vehiclePhotosUrls: '',

        // Commissions
        sellerName: '',
        sellerCommission: '',
        buyerName: '',
        buyerCommission: '',
        bureauCommission: '',

        // Additional Info
        relatedOrderNumber: '',
        notes: ''
    })

    const isCarTransaction = formData.category === 'Car Sale' || formData.category === 'Buying Car'

    useEffect(() => {
        fetchSettingsAndBatches()
    }, [])

    async function fetchSettingsAndBatches() {
        try {
            // Fetch exchange settings
            const { data: settingsData } = await supabase
                .from('settings')
                .select('*')
                .in('key', ['exchange_rate_dzd_usdt', 'exchange_rate_usdt_krw'])

            const updates: any = {}
            settingsData?.forEach((setting: any) => {
                if (setting.key === 'exchange_rate_dzd_usdt') updates.exchangeRateDzdUsdt = setting.value
                if (setting.key === 'exchange_rate_usdt_krw') updates.exchangeRateUsdtKrw = setting.value
            })

            // Fetch available batches
            const { data: batchesData } = await (supabase.from('shipment_batches') as any)
                .select('id, name')
                .eq('is_archived', false)
                .order('created_at', { ascending: false })

            if (batchesData && batchesData.length > 0) {
                setBatches(batchesData)
            }

            // Auto-suggest next order number if empty
            const { count } = await supabase
                .from('financial_transactions')
                .select('*', { count: 'exact', head: true })

            if (count !== null && count !== undefined) {
                updates.orderNumber = String((count || 0) + 101)
            }

            setFormData(prev => ({ ...prev, ...updates }))
        } catch (error) {
            console.error('Error fetching settings/batches:', error)
        }
    }

    // Auto-calculate DZD price when currency/rates change
    useEffect(() => {
        if (!isCarTransaction) return

        const originalPrice = parseFloat(formData.originalBuyingPrice) || 0
        const rateDzdUsdt = parseFloat(formData.exchangeRateDzdUsdt) || 0
        const rateUsdtKrw = parseFloat(formData.exchangeRateUsdtKrw) || 0

        let dzdPrice = 0

        if (formData.buyingCurrency === 'DZD') {
            dzdPrice = originalPrice
        } else if (formData.buyingCurrency === 'USDT') {
            dzdPrice = originalPrice * rateDzdUsdt
        } else if (formData.buyingCurrency === 'KRW') {
            if (rateUsdtKrw > 0) {
                const usdtAmount = originalPrice / rateUsdtKrw
                dzdPrice = usdtAmount * rateDzdUsdt
            }
        }

        setFormData(prev => ({
            ...prev,
            carBuyingPrice: dzdPrice > 0 ? dzdPrice.toFixed(2) : prev.carBuyingPrice
        }))
    }, [
        formData.buyingCurrency,
        formData.originalBuyingPrice,
        formData.exchangeRateDzdUsdt,
        formData.exchangeRateUsdtKrw,
        isCarTransaction
    ])

    const calculateTotalCommissions = () => {
        const seller = parseFloat(formData.sellerCommission) || 0
        const buyer = parseFloat(formData.buyerCommission) || 0
        const bureau = parseFloat(formData.bureauCommission) || 0
        return seller + buyer + bureau
    }

    const calculateRemaining = () => {
        const total = parseFloat(formData.amount) || 0
        const paid = parseFloat(formData.paidAmount) || 0
        return Math.max(0, total - paid)
    }

    const calculateProfit = () => {
        const sellingPrice = parseFloat(formData.amount) || 0
        const buyingPrice = parseFloat(formData.carBuyingPrice) || 0
        const commissions = calculateTotalCommissions()
        return sellingPrice - buyingPrice - commissions
    }

    // OCR Auto-Fill Handler
    const handleDocumentDataExtracted = (extracted: ExtractedClientData) => {
        setFormData(prev => {
            const next = { ...prev }
            if (extracted.customerName && !prev.customerName) {
                next.customerName = extracted.customerName
            }
            if (extracted.customerIdCard) {
                next.customerIdCard = extracted.customerIdCard
            }
            if (extracted.passportNumber) {
                next.passportNumber = extracted.passportNumber
            }
            if (!prev.description && (extracted.customerName || next.customerName)) {
                next.description = `Car Sale - ${extracted.customerName || next.customerName}`
            }
            return next
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const amount = parseFloat(formData.amount)
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0')
            setLoading(false)
            return
        }

        if (formData.paymentStatus === 'Partial') {
            const paid = parseFloat(formData.paidAmount)
            if (isNaN(paid) || paid < 0) {
                alert('Please enter a valid paid amount')
                setLoading(false)
                return
            }
            if (paid > amount) {
                alert('Paid amount cannot be greater than total amount')
                setLoading(false)
                return
            }
        }

        // MANDATORY VIN VALIDATION for car transactions
        if (isCarTransaction) {
            if (!formData.carVin || !formData.carVin.trim()) {
                alert('Error: N° VIN is MANDATORY for vehicle transactions.')
                setLoading(false)
                return
            }

            const year = parseInt(formData.carYear)
            if (formData.carYear && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
                alert('Please enter a valid car year')
                setLoading(false)
                return
            }
        }

        if (!formData.description) {
            // Auto-generate if empty
            formData.description = formData.customerName 
                ? `Car Sale - ${formData.customerName}` 
                : `${formData.category} - ${formData.carBrand} ${formData.carModel}`
        }

        try {
            // Append extra info to description for backward compatibility
            let finalDescription = formData.description
            if (formData.relatedOrderNumber) finalDescription += `\n(Related Order: ${formData.relatedOrderNumber})`
            if (formData.customerIdCard) finalDescription += `\nID Card: ${formData.customerIdCard}`
            if (formData.customerAddress) finalDescription += `\nAddress: ${formData.customerAddress}`
            if (formData.notes) finalDescription += `\nNotes: ${formData.notes}`

            const paidValue = formData.paymentStatus === 'Partial' 
                ? (parseFloat(formData.paidAmount) || 0) 
                : (formData.paymentStatus === 'Paid' ? amount : 0)

            const transactionData = {
                id: uuidv4(),
                type: formData.type,
                amount: amount,
                category: formData.category,
                description: finalDescription,
                transaction_date: formData.date,
                currency: formData.currency,
                payment_method: formData.paymentMethod,
                payment_status: formData.paymentStatus,
                paid_amount: paidValue,

                // Order & Batches
                order_number: formData.orderNumber || null,
                delivery_method: formData.deliveryMethod || null,
                batch_name: formData.batchName || null,

                // Commissions
                seller_commission: formData.sellerCommission ? parseFloat(formData.sellerCommission) : null,
                buyer_commission: formData.buyerCommission ? parseFloat(formData.buyerCommission) : null,
                bureau_commission: formData.bureauCommission ? parseFloat(formData.bureauCommission) : null,

                // Names
                seller_name: formData.sellerName || null,
                buyer_name: formData.buyerName || null,

                // Car Details
                car_brand: formData.carBrand || null,
                car_model: formData.carModel || null,
                car_trim: formData.carTrim || null,
                car_year: formData.carYear ? parseInt(formData.carYear) : null,
                car_vin: formData.carVin || null,
                car_color: formData.carColor || null,
                car_energy: formData.carEnergy || null,
                car_transmission: formData.carTransmission || null,
                country_of_origin: formData.countryOfOrigin || null,
                car_milage: formData.carMileage ? parseFloat(formData.carMileage) : null,
                car_buying_price: formData.carBuyingPrice ? parseFloat(formData.carBuyingPrice) : null,
                shipping_price: formData.shippingPrice ? parseFloat(formData.shippingPrice) : null,

                // Currency & Payment Status
                buying_currency: formData.buyingCurrency || null,
                original_buying_price: formData.originalBuyingPrice ? parseFloat(formData.originalBuyingPrice) : null,
                exchange_rate_dzd_usdt: formData.exchangeRateDzdUsdt ? parseFloat(formData.exchangeRateDzdUsdt) : null,
                exchange_rate_usdt_krw: formData.exchangeRateUsdtKrw ? parseFloat(formData.exchangeRateUsdtKrw) : null,
                is_paid_in_korea: formData.isPaidInKorea,
                paid_in_korea_date: formData.isPaidInKorea ? (formData.paidInKoreaDate || new Date().toISOString()) : null,

                // Client Details
                customer_name: formData.customerName || null,
                customer_phone: formData.customerPhone || null,
                customer_email: formData.customerEmail || null,
                customer_address: formData.customerAddress || null,
                customer_postal_code: formData.customerPostalCode || null,

                // Documents
                passport_number: formData.passportNumber || null,
                passport_photo_url: formData.passportPhotoUrl || null,
                id_card_url: formData.idCardUrl || null,
                id_card_back_url: formData.idCardBackUrl || null,
                vehicle_photos_urls: formData.vehiclePhotosUrls ? formData.vehiclePhotosUrls.split(',') : null,
                customer_id_card: formData.customerIdCard || null,

                related_order_id: null,
                related_car_id: null
            }

            const { error } = await supabase.from('financial_transactions').insert(transactionData as any)

            if (error) throw error

            // Auto-create shipping form if sufficient data exists
            if (transactionData.customer_name && transactionData.customer_phone) {
                try {
                    const vinToCheck = transactionData.car_vin
                    let existingForm = null

                    if (vinToCheck) {
                        const { data: existingByVin } = await supabase
                            .from('shipping_forms')
                            .select('id')
                            .eq('vin_number', vinToCheck)
                            .maybeSingle()
                        existingForm = existingByVin
                    }

                    if (!existingForm) {
                        const pdfData = {
                            name: transactionData.customer_name,
                            phone: transactionData.customer_phone,
                            email: transactionData.customer_email || '',
                            address: transactionData.customer_address || '',
                            passport_number: transactionData.passport_number || '',
                            id_card_number: transactionData.customer_id_card || '',
                            code_postal: transactionData.customer_postal_code || '',
                            zip_number: '',
                            vehicle_model: `${transactionData.car_brand || ''} ${transactionData.car_model || ''} ${transactionData.car_trim || ''}`.trim(),
                            vin_number: transactionData.car_vin || '',
                            notes: transactionData.description || '',
                            passport_photo_url: transactionData.passport_photo_url,
                            id_card_url: transactionData.id_card_url,
                            id_card_back_url: transactionData.id_card_back_url,
                            vehicle_photos_urls: transactionData.vehicle_photos_urls ? transactionData.vehicle_photos_urls.join(',') : '',
                            created_at: new Date().toISOString()
                        }

                        let pdfUrl = null
                        try {
                            const pdfBlob = await generateShippingPDF(pdfData)
                            const fileName = `shipping-form-${Date.now()}.pdf`
                            const filePath = `shipping-forms/${fileName}`

                            const { error: uploadError } = await supabase.storage
                                .from('documents')
                                .upload(filePath, pdfBlob, { contentType: 'application/pdf' })

                            if (!uploadError) {
                                const { data: urlData } = supabase.storage
                                    .from('documents')
                                    .getPublicUrl(filePath)
                                pdfUrl = urlData?.publicUrl || null
                            }
                        } catch (pdfErr) {
                            console.error('Error generating/uploading shipping PDF:', pdfErr)
                        }

                        await (supabase.from('shipping_forms') as any).insert({
                            ...pdfData,
                            pdf_url: pdfUrl
                        })
                    }
                } catch (shippingError) {
                    console.error('Error auto-creating shipping form:', shippingError)
                }
            }

            router.push('/finance')
        } catch (error) {
            console.error('Error adding transaction:', JSON.stringify(error, null, 2))
            alert('Failed to add transaction: ' + ((error as any)?.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/finance" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    {t.common.back}
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.finance.newTransaction}</h1>
                        <p className="text-sm text-gray-500 mt-1">Vehicle import transaction & Bon de Commande creation</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Transaction & Order Info */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <Info className="w-5 h-5 text-blue-500" />
                        {t.forms.transactionInfo}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t.finance.orderNumber} (Numéro de commande)
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-mono font-bold"
                                value={formData.orderNumber}
                                onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                                placeholder="e.g. 194"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'Income' })}
                                    className={`flex-1 py-2 rounded-lg font-medium border-2 transition ${formData.type === 'Income' ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400'}`}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'Expense' })}
                                    className={`flex-1 py-2 rounded-lg font-medium border-2 transition ${formData.type === 'Expense' ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400'}`}
                                >
                                    Expense
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Car Sale">Car Sale (بيع سيارة)</option>
                                <option value="Buying Car">Buying Car (شراء سيارة)</option>
                                <option value="Shipping">Shipping (شحن)</option>
                                <option value="Customs">Customs (جمارك)</option>
                                <option value="Commission">Commission (عمولة)</option>
                                <option value="Salaries">Salaries (رواتب)</option>
                                <option value="Rent">Rent (إيجار)</option>
                                <option value="Maintenance">Maintenance (صيانة)</option>
                                <option value="Marketing">Marketing (تسويق)</option>
                                <option value="Other">Other (أخرى)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.shipping.date}</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.batch} (Shipment Batch)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    list="batch-options"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.batchName}
                                    onChange={e => setFormData({ ...formData, batchName: e.target.value })}
                                    placeholder="e.g. Batch-KOR-2026-09"
                                />
                                <datalist id="batch-options">
                                    {batches.map(b => (
                                        <option key={b.id} value={b.name} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.deliveryMethod}</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.deliveryMethod}
                                onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value })}
                            >
                                <option value="RORO">RORO</option>
                                <option value="Conteneur">Conteneur</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                rows={2}
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Details about the transaction..."
                            />
                        </div>
                    </div>
                </div>

                {/* Client Details & Intelligent OCR Scanning */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                            <Users className="w-5 h-5 text-indigo-500" />
                            {t.forms.clientDetails}
                        </h2>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                            <Sparkles className="w-3.5 h-3.5" /> OCR Scanning: Uploading IDs auto-fills Client details!
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.clientName}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-medium"
                                value={formData.customerName}
                                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                placeholder="e.g. GUENOUNE MOHAMED SALAH"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.clientPhone}</label>
                            <input
                                type="tel"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerPhone}
                                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                placeholder="0781782036"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t.forms.idCard} (NIN - 18 chiffres)
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-mono"
                                value={formData.customerIdCard}
                                onChange={e => setFormData({ ...formData, customerIdCard: e.target.value })}
                                placeholder="18-digit NIN number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passport Number (9 chiffres)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-mono"
                                value={formData.passportNumber}
                                onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                                placeholder="9-digit passport number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerEmail}
                                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                                placeholder="client@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code (الرمز البريدي)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerPostalCode}
                                onChange={e => setFormData({ ...formData, customerPostalCode: e.target.value })}
                                placeholder="e.g. 18002"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Address (العنوان)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerAddress}
                                onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                                placeholder="e.g. TAHER - JIJEL"
                            />
                        </div>
                    </div>

                    {/* Untouched Document Scanning Slots */}
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <MediaPicker
                                    label="Passport Data Page"
                                    documentType="passport"
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, passportPhotoUrl: urls[0] || '' }))}
                                    existingFiles={formData.passportPhotoUrl ? [formData.passportPhotoUrl] : []}
                                    bucket="documents"
                                    folder="passport-photos"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                    maxFiles={1}
                                    onDataExtracted={handleDocumentDataExtracted}
                                />
                            </div>
                            <div>
                                <MediaPicker
                                    label="ID Card Front (الواجهة الأمامية)"
                                    documentType="id_front"
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, idCardUrl: urls[0] || '' }))}
                                    existingFiles={formData.idCardUrl ? [formData.idCardUrl] : []}
                                    bucket="documents"
                                    folder="id-cards"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                    maxFiles={1}
                                    onDataExtracted={handleDocumentDataExtracted}
                                />
                            </div>
                            <div>
                                <MediaPicker
                                    label="ID Card Back (الواجهة الخلفية)"
                                    documentType="id_back"
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, idCardBackUrl: urls[0] || '' }))}
                                    existingFiles={formData.idCardBackUrl ? [formData.idCardBackUrl] : []}
                                    bucket="documents"
                                    folder="id-cards"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                    maxFiles={1}
                                    onDataExtracted={handleDocumentDataExtracted}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Car Specifications (Bon de Commande Specs) */}
                {isCarTransaction && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5 text-yellow-500" />
                            {t.forms.vehicleDetails} (Spécification de la véhicule)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.forms.carBrand} (MARQUE)
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carBrand}
                                    onChange={e => setFormData({ ...formData, carBrand: e.target.value.toUpperCase() })}
                                    placeholder="e.g. CHEVROLET, HYUNDAI, KIA"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.forms.carModel} (MODEL)
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carModel}
                                    onChange={e => setFormData({ ...formData, carModel: e.target.value.toUpperCase() })}
                                    placeholder="e.g. SPARK, TUCSON"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.finance.carTrim} (FINITION)
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carTrim}
                                    onChange={e => setFormData({ ...formData, carTrim: e.target.value.toUpperCase() })}
                                    placeholder="e.g. PREMIUM, EXCLUSIVE"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.forms.color} (COULEUR)
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carColor}
                                    onChange={e => setFormData({ ...formData, carColor: e.target.value.toUpperCase() })}
                                    placeholder="e.g. BLUE, NOIR, BLANC"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.finance.carEnergy} (ENERGY / Carburant)
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.carEnergy}
                                    onChange={e => setFormData({ ...formData, carEnergy: e.target.value })}
                                >
                                    <option value="Essence">Essence</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Hybride">Hybride</option>
                                    <option value="Électrique">Électrique</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.finance.carTransmission} (TRANSMISSION)
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.carTransmission}
                                    onChange={e => setFormData({ ...formData, carTransmission: e.target.value })}
                                >
                                    <option value="Automatique">Automatique</option>
                                    <option value="Manuelle">Manuelle</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.inventory.year} (ANNÉE)
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.carYear}
                                    onChange={e => setFormData({ ...formData, carYear: e.target.value })}
                                    placeholder="2023"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.finance.mileage} (KLM)
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.carMileage}
                                    onChange={e => setFormData({ ...formData, carMileage: e.target.value })}
                                    placeholder="e.g. 40000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                    N°: VIN * (MANDATORY)
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2 border-2 border-red-300 dark:border-red-900 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-950 dark:text-white font-mono uppercase"
                                    value={formData.carVin}
                                    onChange={e => setFormData({ ...formData, carVin: e.target.value.toUpperCase() })}
                                    placeholder="e.g. KLYDC487DNC003291"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t.finance.countryOfOrigin} (PAY EXPO)
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.countryOfOrigin}
                                    onChange={e => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                                >
                                    <option value="South Korea">South Korea (كوريا الجنوبية)</option>
                                    <option value="China">China (الصين)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipping Price (DA)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.shippingPrice}
                                    onChange={e => setFormData({ ...formData, shippingPrice: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Photos</label>
                                <MediaPicker
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, vehiclePhotosUrls: urls.join(',') }))}
                                    existingFiles={formData.vehiclePhotosUrls ? formData.vehiclePhotosUrls.split(',').filter(Boolean) : []}
                                    bucket="vehicle-photos"
                                    folder="photos"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                />
                            </div>
                        </div>

                        {/* Currency Exchange Section */}
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{t.finance.buyingPriceDZD} & {t.finance.currency}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t.finance.currency}</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white"
                                        value={formData.buyingCurrency}
                                        onChange={e => setFormData({ ...formData, buyingCurrency: e.target.value })}
                                    >
                                        <option value="DZD">DZD</option>
                                        <option value="USDT">USDT</option>
                                        <option value="KRW">KRW</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t.finance.originalPrice}</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white"
                                        value={formData.originalBuyingPrice}
                                        onChange={e => setFormData({ ...formData, originalBuyingPrice: e.target.value })}
                                        placeholder="Price in original currency"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t.finance.buyingPriceDZD}</label>
                                    <input
                                        type="number"
                                        readOnly
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-100 dark:bg-slate-900 font-bold text-gray-700 dark:text-gray-300"
                                        value={formData.carBuyingPrice}
                                    />
                                </div>

                                {(formData.buyingCurrency === 'USDT' || formData.buyingCurrency === 'KRW') && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rate DZD/USDT</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white"
                                            value={formData.exchangeRateDzdUsdt}
                                            onChange={e => setFormData({ ...formData, exchangeRateDzdUsdt: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formData.buyingCurrency === 'KRW' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rate USDT/KRW</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:text-white"
                                            value={formData.exchangeRateUsdtKrw}
                                            onChange={e => setFormData({ ...formData, exchangeRateUsdtKrw: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        checked={formData.isPaidInKorea}
                                        onChange={e => setFormData({ ...formData, isPaidInKorea: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.finance.paidInKorea}</span>
                                </label>
                                {formData.isPaidInKorea && (
                                    <input
                                        type="date"
                                        className="p-1 border border-gray-300 rounded text-sm bg-white dark:bg-slate-950 dark:text-white"
                                        value={formData.paidInKoreaDate}
                                        onChange={e => setFormData({ ...formData, paidInKoreaDate: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-4 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex justify-between items-center">
                                <span className="text-green-800 dark:text-green-300 font-medium">{t.finance.netProfit}:</span>
                                <span className={`text-xl font-bold ${calculateProfit() >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {calculateProfit().toLocaleString()} {formData.currency}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Details (Détails du paiment) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <Wallet className="w-5 h-5 text-green-500" />
                        Détails du paiment (Payment Details)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.currency}</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="DZD">Algerian Dinar (DZD)</option>
                                <option value="EUR">Euro (EUR)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="KRW">South Korean Won (KRW)</option>
                                <option value="USDT">Tether (USDT)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Montant . T (Total Selling Price *)
                            </label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-bold text-lg"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="e.g. 2300000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.paymentStatus}
                                onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                            >
                                <option value="Paid">{t.finance.paid}</option>
                                <option value="Partial">{t.finance.partial}</option>
                                <option value="Pending">{t.finance.pending}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Méthode de paiement (Payment Method)
                            </label>
                            <div className="flex gap-4 p-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="Espèce"
                                        checked={formData.paymentMethod === 'Espèce'}
                                        onChange={() => setFormData({ ...formData, paymentMethod: 'Espèce' })}
                                        className="text-blue-600"
                                    />
                                    <span>Espèce (Cash)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="Carte bancaire / Virement"
                                        checked={formData.paymentMethod === 'Carte bancaire / Virement' || formData.paymentMethod === 'Cb'}
                                        onChange={() => setFormData({ ...formData, paymentMethod: 'Carte bancaire / Virement' })}
                                        className="text-blue-600"
                                    />
                                    <span>Cb / Virement</span>
                                </label>
                            </div>
                        </div>

                        {/* Partial or Paid breakdown */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/60 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                    Montant . P (Amount Received / Paid)
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-medium"
                                    value={formData.paymentStatus === 'Paid' ? formData.amount : formData.paidAmount}
                                    onChange={e => setFormData({ ...formData, paidAmount: e.target.value })}
                                    disabled={formData.paymentStatus === 'Paid'}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                    Montant . R (Remaining Due Balance)
                                </label>
                                <div className="p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg font-bold text-lg text-red-600 dark:text-red-400">
                                    {formData.paymentStatus === 'Paid' ? '0 DA' : `${calculateRemaining().toLocaleString()} ${formData.currency}`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commissions (Conditional) */}
                {isCarTransaction && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            {t.forms.commissionsParties}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.seller}</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.sellerName}
                                    onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.buyer}</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.buyerName}
                                    onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.seller} Commission</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.sellerCommission}
                                    onChange={e => setFormData({ ...formData, sellerCommission: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.buyer} Commission</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.buyerCommission}
                                    onChange={e => setFormData({ ...formData, buyerCommission: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.officeCommission}</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.bureauCommission}
                                    onChange={e => setFormData({ ...formData, bureauCommission: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-center">
                            <p className="text-blue-800 dark:text-blue-300 font-bold">
                                {t.finance.totalCommissions}: {calculateTotalCommissions().toLocaleString()} {formData.currency}
                            </p>
                        </div>
                    </div>
                )}

                {/* Additional Info & Notes */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <FileText className="w-5 h-5 text-gray-500" />
                        {t.forms.additionalInfo}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Related Order Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.relatedOrderNumber}
                                onChange={e => setFormData({ ...formData, relatedOrderNumber: e.target.value })}
                                placeholder="e.g. WA-2025-..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t.forms.notes} (Note sur le bon de commande)
                            </label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Notes or instructions to appear on Bon de Commande / Invoice..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/finance"
                        className="px-6 py-3 bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        {t.forms.cancel}
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? t.forms.saving : t.forms.save}
                    </button>
                </div>
            </form>
        </div>
    )
}
