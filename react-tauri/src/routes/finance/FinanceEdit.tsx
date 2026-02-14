import { ArrowLeft, Car, FileText, Info, Save, Users, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

export default function FinanceEdit() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        // Transaction Information
        type: 'Income',
        category: 'Car Sale',
        description: '',
        date: new Date().toISOString().split('T')[0],

        // Payment Details
        currency: 'DZD',
        amount: '',
        paidAmount: '',
        paymentStatus: 'Pending',
        paymentMethod: 'cash',

        // Car Details
        carBrand: '',
        carModel: '',
        carYear: '',
        carVin: '',
        carMileage: '',
        carBuyingPrice: '', // Always in DZD

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
        customerIdCard: '',
        customerAddress: '',

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
        fetchTransaction()
    }, [id])

    async function fetchTransaction() {
        try {
            const { data, error } = await (supabase.from('financial_transactions') as any)
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (data) {
                // Extract fields from description
                let description = data.description || ''
                let relatedOrderNumber = ''
                let customerIdCard = ''
                let notes = ''

                // Regex extraction
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
                if (idCardMatch) {
                    customerIdCard = idCardMatch[1]
                    description = description.replace(idCardMatch[0], '')
                }

                let customerAddress = ''
                const addressMatch = description.match(/\nAddress: (.*)/)
                if (addressMatch) {
                    customerAddress = addressMatch[1]
                    description = description.replace(addressMatch[0], '')
                }

                const notesMatch = description.match(/\nNotes: (.*)/)
                if (notesMatch) {
                    notes = notesMatch[1]
                    description = description.replace(notesMatch[0], '')
                }

                setFormData({
                    type: data.type || 'Income',
                    category: data.category || 'Other',
                    description: description.trim(),
                    date: data.transaction_date,
                    currency: data.currency || 'DZD',
                    amount: data.amount?.toString() || '',
                    paidAmount: data.paid_amount?.toString() || '',
                    paymentStatus: data.payment_status || 'Pending',
                    paymentMethod: data.payment_method || 'cash',

                    carBrand: data.car_brand || '',
                    carModel: data.car_model || '',
                    carYear: data.car_year?.toString() || '',
                    carVin: data.car_vin || '',
                    carMileage: data.car_milage?.toString() || '',
                    carBuyingPrice: data.car_buying_price?.toString() || '',

                    // Currency Fields
                    buyingCurrency: data.buying_currency || 'DZD',
                    originalBuyingPrice: data.original_buying_price?.toString() || '',
                    exchangeRateDzdUsdt: data.exchange_rate_dzd_usdt?.toString() || '',
                    exchangeRateUsdtKrw: data.exchange_rate_usdt_krw?.toString() || '',
                    isPaidInKorea: data.is_paid_in_korea || false,
                    paidInKoreaDate: data.paid_in_korea_date ? data.paid_in_korea_date.split('T')[0] : '',

                    customerName: data.customer_name || '',
                    customerPhone: data.customer_phone || '',
                    customerIdCard: customerIdCard,
                    customerAddress,

                    sellerName: data.seller_name || '',
                    sellerCommission: data.seller_commission?.toString() || '',
                    buyerName: data.buyer_name || '',
                    buyerCommission: data.buyer_commission?.toString() || '',
                    bureauCommission: data.bureau_commission?.toString() || '',
                    relatedOrderNumber,
                    notes
                })
            }
        } catch (error) {
            console.error('Error fetching transaction:', error)
            alert('Failed to load transaction')
            navigate('/finance')
        } finally {
            setLoading(false)
        }
    }

    // Auto-calculate DZD price when currency/rates change
    useEffect(() => {
        if (!isCarTransaction || loading) return

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

        // Only update if we have a valid calculation
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
        isCarTransaction,
        loading
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const amount = parseFloat(formData.amount)
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0')
            setSaving(false)
            return
        }

        if (!formData.description) {
            alert('Please enter a description')
            setSaving(false)
            return
        }

        try {
            // Re-construct description
            let finalDescription = formData.description
            if (formData.relatedOrderNumber) finalDescription += `\n(Related Order: ${formData.relatedOrderNumber})`
            if (formData.customerIdCard) finalDescription += `\nID Card: ${formData.customerIdCard}`
            if (formData.customerAddress) finalDescription += `\nAddress: ${formData.customerAddress}`
            if (formData.notes) finalDescription += `\nNotes: ${formData.notes}`

            const transactionData = {
                type: formData.type,
                amount: amount,
                category: formData.category,
                description: finalDescription,
                transaction_date: formData.date,
                currency: formData.currency,
                payment_method: formData.paymentMethod,
                payment_status: formData.paymentStatus,
                paid_amount: formData.paymentStatus === 'Partial' ? (parseFloat(formData.paidAmount) || 0) : (formData.paymentStatus === 'Paid' ? amount : 0),

                // Commissions
                seller_commission: formData.sellerCommission ? parseFloat(formData.sellerCommission) : null,
                buyer_commission: formData.buyerCommission ? parseFloat(formData.buyerCommission) : null,
                bureau_commission: formData.bureauCommission ? parseFloat(formData.bureauCommission) : null,

                seller_name: formData.sellerName || null,
                buyer_name: formData.buyerName || null,

                // Car Details
                car_brand: formData.carBrand || null,
                car_model: formData.carModel || null,
                car_year: formData.carYear || null,
                car_vin: formData.carVin || null,
                car_milage: formData.carMileage ? parseFloat(formData.carMileage) : null,
                car_buying_price: formData.carBuyingPrice ? parseFloat(formData.carBuyingPrice) : null,

                // Currency & Payment Status
                buying_currency: formData.buyingCurrency || null,
                original_buying_price: formData.originalBuyingPrice ? parseFloat(formData.originalBuyingPrice) : null,
                exchange_rate_dzd_usdt: formData.exchangeRateDzdUsdt ? parseFloat(formData.exchangeRateDzdUsdt) : null,
                exchange_rate_usdt_krw: formData.exchangeRateUsdtKrw ? parseFloat(formData.exchangeRateUsdtKrw) : null,
                is_paid_in_korea: formData.isPaidInKorea,
                paid_in_korea_date: formData.isPaidInKorea ? (formData.paidInKoreaDate || new Date().toISOString()) : null,

                customer_name: formData.customerName || null,
                customer_phone: formData.customerPhone || null,
            }

            const { error } = await (supabase.from('financial_transactions') as any)
                .update(transactionData)
                .eq('id', id)

            if (error) throw error
            navigate('/finance')
        } catch (error) {
            console.error('Error updating transaction:', error)
            alert('Failed to update transaction')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading transaction...</div>
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link to="/finance" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Finance
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Transaction</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Transaction Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        Transaction Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'Income' })}
                                    className={`flex-1 py-2 rounded-lg font-medium border-2 transition ${formData.type === 'Income' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'Expense' })}
                                    className={`flex-1 py-2 rounded-lg font-medium border-2 transition ${formData.type === 'Expense' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                >
                                    Expense
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Car Sale">Car Sale</option>
                                <option value="Buying Car">Buying Car</option>
                                <option value="Shipping">Shipping</option>
                                <option value="Customs">Customs</option>
                                <option value="Commission">Commission</option>
                                <option value="Salaries">Salaries</option>
                                <option value="Rent">Rent</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        {/* Client Details */}
                        <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.finance.clientName}</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.customerName}
                                        onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                        placeholder={t.finance.clientName}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.finance.clientPhone}</label>
                                    <input
                                        type="tel"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.customerPhone}
                                        onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                        placeholder={t.finance.clientPhone}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Card Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.customerIdCard}
                                        onChange={e => setFormData({ ...formData, customerIdCard: e.target.value })}
                                        placeholder="ID Card Number"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.customerAddress}
                                    onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                                    placeholder="Client Address"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                required
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Details about the transaction..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Car Details (Conditional) */}
                {isCarTransaction && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5 text-yellow-500" />
                            Car Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Car Brand</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.carBrand}
                                    onChange={e => setFormData({ ...formData, carBrand: e.target.value })}
                                    placeholder="e.g. Kia"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.carModel}
                                    onChange={e => setFormData({ ...formData, carModel: e.target.value })}
                                    placeholder="e.g. Sportage"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.carYear}
                                    onChange={e => setFormData({ ...formData, carYear: e.target.value })}
                                    placeholder="2023"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">VIN (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.carVin}
                                    onChange={e => setFormData({ ...formData, carVin: e.target.value })}
                                    placeholder="Chassis Number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.finance.mileage} (km)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.carMileage}
                                    onChange={e => setFormData({ ...formData, carMileage: e.target.value })}
                                    placeholder="e.g. 120000"
                                />
                            </div>
                        </div>

                        {/* Currency Exchange Section */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700 mb-4">Buying Price & Currency</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.finance.currency}</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                        value={formData.buyingCurrency}
                                        onChange={e => setFormData({ ...formData, buyingCurrency: e.target.value })}
                                    >
                                        <option value="DZD">DZD</option>
                                        <option value="USDT">USDT</option>
                                        <option value="KRW">KRW</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.finance.originalPrice}</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                        value={formData.originalBuyingPrice}
                                        onChange={e => setFormData({ ...formData, originalBuyingPrice: e.target.value })}
                                        placeholder="Price in original currency"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.finance.buyingPriceDZD}</label>
                                    <input
                                        type="number"
                                        readOnly
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-100 font-bold text-gray-700"
                                        value={formData.carBuyingPrice}
                                    />
                                </div>

                                {(formData.buyingCurrency === 'USDT' || formData.buyingCurrency === 'KRW') && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Rate DZD/USDT</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            value={formData.exchangeRateDzdUsdt}
                                            onChange={e => setFormData({ ...formData, exchangeRateDzdUsdt: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formData.buyingCurrency === 'KRW' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Rate USDT/KRW</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
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
                                    <span className="text-sm font-medium text-gray-700">{t.finance.paidInKorea}</span>
                                </label>
                                {formData.isPaidInKorea && (
                                    <input
                                        type="date"
                                        className="p-1 border border-gray-300 rounded text-sm"
                                        value={formData.paidInKoreaDate}
                                        onChange={e => setFormData({ ...formData, paidInKoreaDate: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex justify-between items-center">
                                <span className="text-green-800 font-medium">{t.finance.netProfit}:</span>
                                <span className={`text-xl font-bold ${calculateProfit() >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {calculateProfit().toLocaleString()} {formData.currency}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-500" />
                        Payment Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.paymentStatus}
                                onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                            >
                                <option value="Paid">Fully Paid</option>
                                <option value="Partial">Partially Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.paymentMethod}
                                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="check">Check</option>
                                <option value="credit_card">Credit Card</option>
                            </select>
                        </div>
                        {formData.paymentStatus === 'Partial' && (
                            <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                                    value={formData.paidAmount}
                                    onChange={e => setFormData({ ...formData, paidAmount: e.target.value })}
                                    placeholder="Amount paid so far"
                                />
                                <p className="text-sm text-gray-600">
                                    {t.finance.remainingAmount}: <span className="font-bold">{calculateRemaining().toLocaleString()} {formData.currency}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Commissions (Conditional) */}
                {isCarTransaction && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            Commissions & Parties
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.sellerName}
                                    onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.buyerName}
                                    onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seller Commission</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.sellerCommission}
                                    onChange={e => setFormData({ ...formData, sellerCommission: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Commission</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.buyerCommission}
                                    onChange={e => setFormData({ ...formData, buyerCommission: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bureau Commission</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.bureauCommission}
                                    onChange={e => setFormData({ ...formData, bureauCommission: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <p className="text-blue-800 font-bold">
                                Total Commissions: {calculateTotalCommissions().toLocaleString()} {formData.currency}
                            </p>
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        Additional Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Related Order Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.relatedOrderNumber}
                                onChange={e => setFormData({ ...formData, relatedOrderNumber: e.target.value })}
                                placeholder="e.g. WA-2025-..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        to="/finance"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
