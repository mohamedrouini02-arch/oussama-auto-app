'use client'

import MediaPicker, { ExtractedClientData } from '@/components/MediaPicker'
import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Car, FileText, Info, Save, Sparkles, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function FinanceEditContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
        paymentMethod: 'Espèce',
        deliveryMethod: 'RORO',

        // Car Details
        carBrand: '',
        carModel: '',
        carTrim: '',
        carYear: '',
        carColor: '',
        carEnergy: 'Essence',
        carTransmission: 'Automatique',
        countryOfOrigin: 'South Korea',
        carVin: '',
        carMileage: '',
        carBuyingPrice: '',
        shippingPrice: '',

        // Currency Exchange
        buyingCurrency: 'DZD',
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
        if (id) {
            fetchTransaction()
            fetchBatches()
        } else {
            console.error('No ID provided')
            router.push('/finance')
        }
    }, [id])

    async function fetchBatches() {
        try {
            const { data } = await (supabase.from('shipment_batches') as any)
                .select('id, name')
                .eq('is_archived', false)
                .order('created_at', { ascending: false })
            if (data) setBatches(data)
        } catch (e) {
            console.error('Error fetching batches:', e)
        }
    }

    async function fetchTransaction() {
        if (!id) return
        try {
            const { data, error } = await (supabase.from('financial_transactions') as any)
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (data) {
                // Extract fields from description
                let description = data.description || ''
                let relatedOrderNumber = data.related_order_number || ''
                let customerIdCard = data.customer_id_card || ''
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

                const idCardMatch = description.match(/\nID Card: (.*)/)
                if (idCardMatch && !customerIdCard) {
                    customerIdCard = idCardMatch[1]
                    description = description.replace(idCardMatch[0], '')
                }

                let customerAddress = data.customer_address || ''
                const addressMatch = description.match(/\nAddress: (.*)/)
                if (addressMatch) {
                    if (!customerAddress) customerAddress = addressMatch[1]
                    description = description.replace(addressMatch[0], '')
                }

                const notesMatch = description.match(/\nNotes: (.*)/)
                if (notesMatch) {
                    notes = notesMatch[1]
                    description = description.replace(notesMatch[0], '')
                }

                setFormData({
                    orderNumber: data.order_number || '',
                    type: data.type || 'Income',
                    category: data.category || 'Other',
                    description: description.trim(),
                    date: data.transaction_date ? data.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0],
                    batchName: data.batch_name || '',

                    currency: data.currency || 'DZD',
                    amount: data.amount?.toString() || '',
                    paidAmount: data.paid_amount?.toString() || '',
                    paymentStatus: data.payment_status || 'Pending',
                    paymentMethod: data.payment_method || 'Espèce',
                    deliveryMethod: data.delivery_method || 'RORO',

                    carBrand: data.car_brand || '',
                    carModel: data.car_model || '',
                    carTrim: data.car_trim || '',
                    carYear: data.car_year?.toString() || '',
                    carColor: data.car_color || '',
                    carEnergy: data.car_energy || 'Essence',
                    carTransmission: data.car_transmission || 'Automatique',
                    countryOfOrigin: data.country_of_origin || 'South Korea',
                    carVin: data.car_vin || '',
                    carMileage: data.car_milage?.toString() || '',
                    carBuyingPrice: data.car_buying_price?.toString() || '',
                    shippingPrice: data.shipping_price?.toString() || '',

                    buyingCurrency: data.buying_currency || 'DZD',
                    originalBuyingPrice: data.original_buying_price?.toString() || '',
                    exchangeRateDzdUsdt: data.exchange_rate_dzd_usdt?.toString() || '',
                    exchangeRateUsdtKrw: data.exchange_rate_usdt_krw?.toString() || '',
                    isPaidInKorea: !!data.is_paid_in_korea,
                    paidInKoreaDate: data.paid_in_korea_date ? data.paid_in_korea_date.split('T')[0] : '',

                    customerName: data.customer_name || '',
                    customerPhone: data.customer_phone || '',
                    customerEmail: data.customer_email || '',
                    customerPostalCode: data.customer_postal_code || '',
                    customerIdCard: customerIdCard,
                    customerAddress: customerAddress,

                    passportNumber: data.passport_number || '',
                    passportPhotoUrl: data.passport_photo_url || '',
                    idCardUrl: data.id_card_url || '',
                    idCardBackUrl: data.id_card_back_url || '',
                    vehiclePhotosUrls: Array.isArray(data.vehicle_photos_urls) ? data.vehicle_photos_urls.join(',') : '',

                    sellerName: data.seller_name || '',
                    sellerCommission: data.seller_commission?.toString() || '',
                    buyerName: data.buyer_name || '',
                    buyerCommission: data.buyer_commission?.toString() || '',
                    bureauCommission: data.bureau_commission?.toString() || '',

                    relatedOrderNumber: relatedOrderNumber,
                    notes: notes
                })
            }
        } catch (error) {
            console.error('Error fetching transaction:', error)
            alert('Failed to load transaction')
            router.push('/finance')
        } finally {
            setLoading(false)
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

        if (dzdPrice > 0) {
            setFormData(prev => ({
                ...prev,
                carBuyingPrice: dzdPrice.toFixed(2)
            }))
        }
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
            return next
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const amount = parseFloat(formData.amount)
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0')
            setSaving(false)
            return
        }

        if (formData.paymentStatus === 'Partial') {
            const paid = parseFloat(formData.paidAmount)
            if (isNaN(paid) || paid < 0) {
                alert('Please enter a valid paid amount')
                setSaving(false)
                return
            }
            if (paid > amount) {
                alert('Paid amount cannot be greater than total amount')
                setSaving(false)
                return
            }
        }

        // MANDATORY VIN VALIDATION
        if (isCarTransaction) {
            if (!formData.carVin || !formData.carVin.trim()) {
                alert('Error: N° VIN is MANDATORY for vehicle transactions.')
                setSaving(false)
                return
            }

            const year = parseInt(formData.carYear)
            if (formData.carYear && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
                alert('Please enter a valid car year')
                setSaving(false)
                return
            }
        }

        try {
            let finalDescription = formData.description
            if (formData.relatedOrderNumber) finalDescription += `\n(Related Order: ${formData.relatedOrderNumber})`
            if (formData.customerIdCard) finalDescription += `\nID Card: ${formData.customerIdCard}`
            if (formData.customerAddress) finalDescription += `\nAddress: ${formData.customerAddress}`
            if (formData.notes) finalDescription += `\nNotes: ${formData.notes}`

            const paidValue = formData.paymentStatus === 'Partial'
                ? (parseFloat(formData.paidAmount) || 0)
                : (formData.paymentStatus === 'Paid' ? amount : 0)

            const transactionData = {
                type: formData.type,
                amount: amount,
                category: formData.category,
                description: finalDescription,
                transaction_date: formData.date,
                currency: formData.currency,
                payment_method: formData.paymentMethod,
                payment_status: formData.paymentStatus,
                paid_amount: paidValue,

                order_number: formData.orderNumber || null,
                delivery_method: formData.deliveryMethod || null,
                batch_name: formData.batchName || null,

                seller_commission: formData.sellerCommission ? parseFloat(formData.sellerCommission) : null,
                buyer_commission: formData.buyerCommission ? parseFloat(formData.buyerCommission) : null,
                bureau_commission: formData.bureauCommission ? parseFloat(formData.bureauCommission) : null,

                seller_name: formData.sellerName || null,
                buyer_name: formData.buyerName || null,

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

                buying_currency: formData.buyingCurrency || null,
                original_buying_price: formData.originalBuyingPrice ? parseFloat(formData.originalBuyingPrice) : null,
                exchange_rate_dzd_usdt: formData.exchangeRateDzdUsdt ? parseFloat(formData.exchangeRateDzdUsdt) : null,
                exchange_rate_usdt_krw: formData.exchangeRateUsdtKrw ? parseFloat(formData.exchangeRateUsdtKrw) : null,
                is_paid_in_korea: formData.isPaidInKorea,
                paid_in_korea_date: formData.isPaidInKorea ? (formData.paidInKoreaDate || new Date().toISOString()) : null,

                customer_name: formData.customerName || null,
                customer_phone: formData.customerPhone || null,
                customer_email: formData.customerEmail || null,
                customer_address: formData.customerAddress || null,
                customer_postal_code: formData.customerPostalCode || null,

                passport_number: formData.passportNumber || null,
                passport_photo_url: formData.passportPhotoUrl || null,
                id_card_url: formData.idCardUrl || null,
                id_card_back_url: formData.idCardBackUrl || null,
                vehicle_photos_urls: formData.vehiclePhotosUrls ? formData.vehiclePhotosUrls.split(',').filter(Boolean) : null,
                customer_id_card: formData.customerIdCard || null,
                updated_at: new Date().toISOString()
            }

            const { error } = await (supabase.from('financial_transactions') as any)
                .update(transactionData)
                .eq('id', id)

            if (error) throw error

            router.push(`/finance/details?id=${id}`)
        } catch (error) {
            console.error('Error updating transaction:', error)
            alert('Failed to update transaction: ' + ((error as any)?.message || 'Unknown error'))
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center">{t.common.loading}</div>

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href={`/finance/details?id=${id}`} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    {t.common.back}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Transaction & Bon de Commande</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Transaction Info */}
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.batch}</label>
                            <input
                                type="text"
                                list="batch-options-edit"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.batchName}
                                onChange={e => setFormData({ ...formData, batchName: e.target.value })}
                                placeholder="e.g. Batch-KOR-2026-09"
                            />
                            <datalist id="batch-options-edit">
                                {batches.map(b => (
                                    <option key={b.id} value={b.name} />
                                ))}
                            </datalist>
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
                            />
                        </div>
                    </div>
                </div>

                {/* Client Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                            <Users className="w-5 h-5 text-indigo-500" />
                            {t.forms.clientDetails}
                        </h2>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                            <Sparkles className="w-3.5 h-3.5" /> OCR Auto-Fill Active
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.clientPhone}</label>
                            <input
                                type="tel"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerPhone}
                                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.idCard} (NIN - 18 chiffres)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-mono"
                                value={formData.customerIdCard}
                                onChange={e => setFormData({ ...formData, customerIdCard: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passport Number (9 chiffres)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white font-mono"
                                value={formData.passportNumber}
                                onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerEmail}
                                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code (الرمز البريدي)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerPostalCode}
                                onChange={e => setFormData({ ...formData, customerPostalCode: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Address (العنوان)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerAddress}
                                onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                            />
                        </div>
                    </div>

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

                {/* Car Specifications */}
                {isCarTransaction && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5 text-yellow-500" />
                            {t.forms.vehicleDetails} (Spécification de la véhicule)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.carBrand} (MARQUE)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carBrand}
                                    onChange={e => setFormData({ ...formData, carBrand: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.carModel} (MODEL)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carModel}
                                    onChange={e => setFormData({ ...formData, carModel: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.carTrim} (FINITION)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carTrim}
                                    onChange={e => setFormData({ ...formData, carTrim: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.color} (COULEUR)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white uppercase"
                                    value={formData.carColor}
                                    onChange={e => setFormData({ ...formData, carColor: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.carEnergy} (ENERGY)</label>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.carTransmission} (TRANSMISSION)</label>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.inventory.year} (ANNÉE)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.carYear}
                                    onChange={e => setFormData({ ...formData, carYear: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.mileage} (KLM)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                    value={formData.carMileage}
                                    onChange={e => setFormData({ ...formData, carMileage: e.target.value })}
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
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.finance.countryOfOrigin} (PAY EXPO)</label>
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

                {/* Payment Details */}
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
                                        name="paymentMethodEdit"
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
                                        name="paymentMethodEdit"
                                        value="Carte bancaire / Virement"
                                        checked={formData.paymentMethod === 'Carte bancaire / Virement' || formData.paymentMethod === 'Cb'}
                                        onChange={() => setFormData({ ...formData, paymentMethod: 'Carte bancaire / Virement' })}
                                        className="text-blue-600"
                                    />
                                    <span>Cb / Virement</span>
                                </label>
                            </div>
                        </div>

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

                {/* Commissions */}
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
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href={`/finance/details?id=${id}`}
                        className="px-6 py-3 bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        {t.forms.cancel}
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? t.forms.saving : t.forms.save}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default function FinanceEdit() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <FinanceEditContent />
        </Suspense>
    )
}
