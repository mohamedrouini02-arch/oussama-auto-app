import { open } from '@tauri-apps/plugin-shell'
import { format } from 'date-fns'
import { arDZ, enUS } from 'date-fns/locale'
import { CheckCircle, Edit, Eye, MessageCircle, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

type Order = any // Using any for now to speed up migration, but logic handles structured data

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    bought: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    customs: 'bg-orange-100 text-orange-800',
    ready: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const { t, language } = useLanguage()

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, car_inventory(brand, model, year, vin, currency, selling_price)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper functions for data extraction with fallbacks
    const extractCustomerName = (order: Order) => {
        return order.customerInfo?.name ||
            order.displayName ||
            order.customer_name || // customer_full_name in legacy? keeping existing property name from type
            order.customer_full_name ||
            t.common.unknownCustomer
    }

    const extractCustomerPhone = (order: Order) => {
        return order.customerInfo?.phone ||
            order.displayPhone ||
            order.customer_phone ||
            t.common.unspecified
    }

    const extractCarDisplay = (order: Order) => {
        const brand = order.carDetails?.brandDisplay || order.carDetails?.brand || order.car_brand || ''
        const model = order.carDetails?.modelDisplay || order.carDetails?.model || order.car_model || ''
        return `${brand} ${model}`.trim() || t.common.unspecified
    }

    const extractBudget = (order: Order) => {
        // Priority 1: If standard budget is "Other" (or equivalent code), SHOW CUSTOM BUDGET
        const rawBudget = order.carDetails?.budget || order.car_budget
        const isOther = rawBudget === 'Other' || rawBudget === 'other' || rawBudget === 'custom' // Add other codes if needed

        const getCustomBudget = () => {
            if (order.carDetails?.customBudget && order.carDetails.customBudget.trim()) {
                return order.carDetails.customBudget
            }
            if (order.car_custom_budget && order.car_custom_budget.trim()) {
                return order.car_custom_budget
            }
            // Check order_data for customBudget (Legacy/Supabase JSON)
            if ((order.order_data as any)?.customBudget && (order.order_data as any).customBudget.trim()) {
                return (order.order_data as any).customBudget
            }
            return null
        }

        const customBudgetVal = getCustomBudget()

        if (isOther && customBudgetVal) {
            return customBudgetVal + ' دج'
        }

        // Priority 2: Custom amount entered by user
        if (customBudgetVal) {
            return customBudgetVal + ' دج'
        }

        // Priority 3: Pre-formatted display value
        if (order.carDetails?.budgetDisplay) {
            return order.carDetails.budgetDisplay
        }

        // Priority 4: Raw budget code/value
        if (order.carDetails?.budget) {
            return order.carDetails.budget
        }

        // Priority 5 (Legacy): Standard Budget field
        if (order.car_budget) {
            return order.car_budget
        }

        return t.common.unspecified
    }

    const extractWilaya = (order: Order) => {
        return order.customerInfo?.wilaya || order.customer_wilaya || ''
    }

    const filteredOrders = orders.filter(order => {
        const customerName = extractCustomerName(order)
        const customerPhone = extractCustomerPhone(order)
        const reference = order.reference_number || ''
        const carModel = extractCarDisplay(order)
        const wilaya = extractWilaya(order)
        const budgetDisplay = extractBudget(order)
        // Also search raw legacy budget fields just in case
        const rawBudget = order.car_budget || ''
        const customBudget = order.car_custom_budget || ''

        const searchLower = search.toLowerCase()

        const matchesSearch =
            customerName.toLowerCase().includes(searchLower) ||
            reference.toLowerCase().includes(searchLower) ||
            carModel.toLowerCase().includes(searchLower) ||
            customerPhone.toLowerCase().includes(searchLower) ||
            wilaya.toLowerCase().includes(searchLower) ||
            budgetDisplay.toLowerCase().includes(searchLower) ||
            rawBudget.toLowerCase().includes(searchLower) ||
            customBudget.toLowerCase().includes(searchLower)

        const matchesStatus = statusFilter === 'All' || order.status?.toLowerCase() === statusFilter.toLowerCase()

        return matchesSearch && matchesStatus
    })

    const handleDelete = async (id: number) => {
        if (!confirm(t.common.confirmDelete)) return

        try {
            const { error } = await supabase.from('orders').delete().eq('id', id)
            if (error) throw error
            setOrders(orders.filter(o => o.id !== id))
        } catch (error) {
            alert(t.common.errorDelete)
            console.error(error)
        }
    }

    const handleWhatsApp = async (phone: string | null) => {
        console.log('Attempting to share via WhatsApp to:', phone)
        if (!phone || phone === t.common.unspecified) {
            console.warn('Invalid phone number for WhatsApp')
            return
        }

        // Remove all non-digits
        let cleanPhone = phone.replace(/\D/g, '')

        // Handle 00 prefix (international)
        if (cleanPhone.startsWith('00')) {
            cleanPhone = cleanPhone.substring(2)
        }

        // Remove leading 0 if present (local)
        if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1)
        }

        // Add +213 if not present (assuming DZ numbers)
        // Check length to avoid adding 213 to a number that is already international but missing 00/+, 
        // OR just strict rule: if not starting with 213, add it.
        // Given the context (Algeria), this safety check is standard.
        if (!cleanPhone.startsWith('213')) {
            cleanPhone = '213' + cleanPhone
        }

        const url = `https://wa.me/${cleanPhone}`
        console.log('Opening WhatsApp URL:', url)

        try {
            await open(url)
        } catch (error) {
            console.error('Failed to open WhatsApp URL:', error)
            alert('Failed to open WhatsApp. Please check your connection or permissions.')
        }
    }

    const handleCall = async (phone: string | null) => {
        if (!phone || phone === t.common.unspecified) return
        await open(`tel:${phone}`)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return format(new Date(dateString), 'MMM d', { locale: language === 'ar' ? arDZ : enUS })
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">{t.orders.title}</h1>
                <Link
                    to="/orders/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    {t.orders.newOrder}
                </Link>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className={`w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                    <input
                        type="text"
                        placeholder={t.orders.searchPlaceholder}
                        className={`w-full py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white min-w-[150px]"
                >
                    <option value="All">{t.orders.allStatus}</option>
                    {Object.keys(STATUS_COLORS).map(status => (
                        <option key={status} value={status} className="capitalize">
                            {/* @ts-ignore */}
                            {t.orders.status[status.replace(' ', '')] || status}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">{t.orders.loading}</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t.orders.noOrders}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredOrders.map((order) => {
                        const customerName = extractCustomerName(order)
                        const customerPhone = extractCustomerPhone(order)
                        const carDisplay = extractCarDisplay(order)
                        const budgetDisplay = extractBudget(order)
                        const wilaya = extractWilaya(order)

                        return (
                            <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">#{order.reference_number}</span>
                                            <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition">{customerName}</h3>
                                    </div>
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${STATUS_COLORS[order.status?.toLowerCase() || 'pending'] || 'bg-gray-100 text-gray-800'}`}>
                                        {/* @ts-ignore */}
                                        {t.orders.status[order.status?.toLowerCase().replace(' ', '')] || order.status || t.orders.status.pending}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex flex-col gap-2 text-sm p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200 pb-1 mb-1">
                                            <span>Requested</span>
                                            {order.assigned_car_id && <span>Assigned</span>}
                                        </div>

                                        <div className="flex justify-between items-start gap-2">
                                            {/* Requested Car */}
                                            <div className="font-medium text-gray-900">
                                                {carDisplay}
                                            </div>

                                            {/* Assigned Car (if any) */}
                                            {order.assigned_car_id && (order as any).car_inventory && (
                                                <div className="flex flex-col items-end text-right">
                                                    <span className="font-bold text-green-700 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {(order as any).car_inventory.year} {(order as any).car_inventory.brand} {(order as any).car_inventory.model}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(budgetDisplay && budgetDisplay !== t.common.unspecified) && (
                                        <div className="flex items-center justify-between text-sm p-2 bg-blue-50 rounded-lg border border-blue-100">
                                            <span className="text-blue-600 font-medium">{t.orders.budget}</span>
                                            <span className="font-bold text-blue-700">
                                                {budgetDisplay}
                                            </span>
                                        </div>
                                    )}

                                    {wilaya && (
                                        <div className="flex items-center justify-between text-sm px-2">
                                            <span className="text-gray-500">{t.orders.wilaya}</span>
                                            <span className="text-gray-900">{wilaya}</span>
                                        </div>
                                    )}

                                    {order.notes && (
                                        <div className="text-sm p-2 bg-yellow-50 rounded-lg border border-yellow-100 mt-2">
                                            <span className="text-xs font-bold text-yellow-700 block mb-1">{t.common.notes}:</span>
                                            <p className="text-gray-700 line-clamp-2">{order.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-5 gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleCall(customerPhone)}
                                        disabled={!customerPhone || customerPhone === t.common.unspecified}
                                        className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        title={t.common.call}
                                    >
                                        <Phone className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleWhatsApp(customerPhone)}
                                        disabled={!customerPhone || customerPhone === t.common.unspecified}
                                        className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        title={t.common.whatsapp}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                    <Link
                                        to={`/orders/${order.id}`}
                                        className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
                                        title={t.common.viewDetails}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        to={`/orders/${order.id}/edit`}
                                        className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 transition"
                                        title={t.common.edit}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(order.id)}
                                        className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                                        title={t.common.delete}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
