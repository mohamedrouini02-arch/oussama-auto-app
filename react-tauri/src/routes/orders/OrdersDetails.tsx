import { format } from 'date-fns'
import { ArrowLeft, ArrowUpRight, Car, CheckCircle, Clock, Edit, Mail, MapPin, MessageCircle, Phone, Truck, Unlink, User, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

type Order = any // Using any for now

const STATUSES = [
    'pending',
    'confirmed',
    'bought',
    'shipped',
    'customs',
    'ready',
    'delivered',
    'cancelled'
]

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    bought: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    customs: 'bg-orange-100 text-orange-800',
    ready: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignedCar, setAssignedCar] = useState<any>(null)
    const [shippingModalOpen, setShippingModalOpen] = useState(false)
    const [shippingData, setShippingData] = useState({
        carrier: '',
        trackingNumber: '',
        route: '',
        vinLast4Digits: '',
        awaitingTracking: false
    })

    const SHIPPING_COMPANIES = [
        { name: 'CMA CGM', code: 'cma' },
        { name: 'Maersk Line', code: 'maersk' },
        { name: 'COSCO Shipping', code: 'cosco' },
        { name: 'HMM (Hyundai Merchant Marine)', code: 'hmm' },
        { name: 'CIG Shipping', code: 'cig' }
    ]

    useEffect(() => {
        fetchOrder()
    }, [id])

    async function fetchOrder() {
        if (!id) return
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', parseInt(id))
                .single()

            if (error) throw error
            setOrder(data)

            // Fetch assigned car
            const { data: carData } = await supabase
                .from('car_inventory')
                .select('*')
                .eq('assigned_to_order', id)
                .single()

            if (carData) {
                setAssignedCar(carData)
            }
        } catch (error) {
            console.error('Error fetching order:', error)
            alert('Order not found')
            navigate('/orders')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (status: string) => {
        if (!order) return

        if (status === 'shipped') {
            setShippingModalOpen(true)
            return
        }
        try {
            // Create status history entry
            const historyEntry = {
                status,
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('ar-EG'),
                note: `Updated status to ${status}`
            }

            const updatedOrderData = {
                ...(order.order_data as object || {}),
                status,
                lastUpdated: new Date().toISOString(),
                statusHistory: [
                    ...((order.order_data as any)?.statusHistory || []),
                    historyEntry
                ]
            }

            const { error } = await (supabase.from('orders') as any)
                .update({
                    status,
                    order_data: updatedOrderData
                })
                .eq('id', order.id)

            if (error) throw error
            setOrder({ ...order, status, order_data: updatedOrderData })
        } catch {
            alert('Error updating status')
        }
    }

    const handleUnassign = async () => {
        if (!assignedCar || !confirm('Are you sure you want to unassign this car?')) return

        try {
            const { error } = await (supabase.from('car_inventory') as any)
                .update({ assigned_to_order: null, status: 'available' })
                .eq('id', assignedCar.id)

            if (error) throw error
            setAssignedCar(null)
            alert('Car unassigned successfully')
        } catch (error) {
            console.error('Error unassigning car:', error)
            alert('Failed to unassign car')
        }
    }

    const handleShippingSubmit = async () => {
        if (!order) return

        try {
            // Create status history entry for shipping
            const historyEntry = {
                status: 'shipped',
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('ar-EG'),
                note: shippingData.awaitingTracking
                    ? 'Shipped - Waiting for tracking'
                    : `Shipped via ${SHIPPING_COMPANIES.find(c => c.code === shippingData.carrier)?.name || shippingData.carrier} - Tracking: ${shippingData.trackingNumber}`
            }

            const updatedOrderData = {
                ...(order.order_data as object || {}),
                status: 'shipped',
                lastUpdated: new Date().toISOString(),
                shipping: {
                    ...shippingData,
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toLocaleDateString('ar-EG'),
                    trackingNumber: shippingData.awaitingTracking ? 'PENDING' : shippingData.trackingNumber
                },
                statusHistory: [
                    ...((order.order_data as any)?.statusHistory || []),
                    historyEntry
                ]
            }

            const { error } = await (supabase.from('orders') as any)
                .update({
                    status: 'shipped',
                    order_data: updatedOrderData
                })
                .eq('id', order.id)

            if (error) throw error

            setOrder({
                ...order,
                status: 'shipped',
                order_data: updatedOrderData
            })
            setShippingModalOpen(false)
        } catch (error) {
            console.error('Error updating shipping info:', error)
            alert('Error updating shipping info')
        }
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (!order) return null

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <Link to="/orders" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orders
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.reference_number}</h1>
                        <p className="text-gray-500">Created on {format(new Date(order.created_at!), 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STATUSES.map((status) => {
                            return (
                                <button
                                    key={status}
                                    onClick={() => updateStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${order.status === status
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {t.orders.status[status as keyof typeof t.orders.status] || status}
                                </button>
                            )
                        })}
                        <Link
                            to={`/orders/${order.id}/edit`}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Order
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Customer Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        Customer Details
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500">Full Name</label>
                            <p className="font-medium text-lg">{order.customer_name}</p>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <a
                                href={`tel:${order.customer_phone}`}
                                className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition"
                            >
                                <Phone className="w-4 h-4" />
                                Call {order.customer_phone}
                            </a>
                            <a
                                href={`https://wa.me/${order.customer_phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                            </a>
                        </div>

                        {order.customer_email && (
                            <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{order.customer_email}</span>
                            </div>
                        )}
                        {order.customer_wilaya && (
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{order.customer_wilaya}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5 text-gray-400" />
                        Vehicle Details
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500">Brand & Model</label>
                            <p className="font-medium text-xl text-gray-900">{order.car_brand} {order.car_model}</p>
                        </div>
                        {order.car_budget && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Budget</label>
                                <p className="font-medium text-gray-900">{order.car_budget}</p>
                            </div>
                        )}
                        {order.car_custom_budget && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Custom Budget</label>
                                <p className="font-medium text-gray-900">{order.car_custom_budget}</p>
                            </div>
                        )}
                        {order.notes && (
                            <div>
                                <label className="text-sm text-gray-500">Notes</label>
                                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">{order.notes}</p>
                            </div>
                        )}

                        {assignedCar && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-900">Assigned Car</h3>
                                    <button
                                        onClick={handleUnassign}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                    >
                                        <Unlink className="w-3 h-3" />
                                        Unassign
                                    </button>
                                </div>
                                <Link to={`/inventory/${assignedCar.id}`} className="block bg-blue-50 p-4 rounded-xl hover:bg-blue-100 transition border border-blue-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-blue-900">{assignedCar.year} {assignedCar.brand} {assignedCar.model}</p>
                                            <p className="text-sm text-blue-700 mt-1">{assignedCar.selling_price?.toLocaleString()} {assignedCar.currency}</p>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-blue-500" />
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status & Timeline */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Order Status
                    </h2>
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                        {order.status === 'completed' || order.status === 'delivered' ? <CheckCircle className="w-10 h-10 text-green-500" /> :
                            order.status === 'cancelled' ? <XCircle className="w-10 h-10 text-red-500" /> :
                                <Clock className="w-10 h-10 text-blue-500" />}
                        <div>
                            <p className={`font-bold capitalize text-xl ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]?.split(' ')[1] || 'text-gray-900'}`}>
                                {order.status || 'Pending'}
                            </p>
                            <p className="text-sm text-gray-500">Last updated {order.updated_at ? format(new Date(order.updated_at), 'MMM d, HH:mm') : '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900">Timeline</h3>
                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-4 py-2">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                                <p className="text-sm font-medium text-gray-900">Order Created</p>
                                <p className="text-xs text-gray-500">{format(new Date(order.created_at!), 'MMM d, yyyy HH:mm')}</p>
                            </div>
                            {order.updated_at !== order.created_at && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white"></div>
                                    <p className="text-sm font-medium text-gray-900">Last Update</p>
                                    <p className="text-xs text-gray-500">{format(new Date(order.updated_at!), 'MMM d, yyyy HH:mm')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Shipping Modal */}
            {shippingModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="w-6 h-6 text-blue-600" />
                                {t.modals.shippingInfoTitle}
                            </h3>
                            <button
                                onClick={() => setShippingModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Waiting for tracking checkbox */}
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={shippingData.awaitingTracking}
                                        onChange={(e) => setShippingData({ ...shippingData, awaitingTracking: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="font-medium text-gray-900">{t.modals.waitingForTracking}</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Shipping Company */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                                        {t.modals.shippingCompany}
                                        <span className="text-gray-400 text-xs">{t.modals.optional}</span>
                                    </label>
                                    <select
                                        value={shippingData.carrier}
                                        onChange={(e) => setShippingData({ ...shippingData, carrier: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                    >
                                        <option value="">{t.modals.selectCompany}</option>
                                        {SHIPPING_COMPANIES.map(company => (
                                            <option key={company.code} value={company.code}>{company.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tracking Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                                        {t.modals.trackingNumber}
                                        <span className="text-gray-400 text-xs">{t.modals.optional}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={shippingData.trackingNumber}
                                        onChange={(e) => setShippingData({ ...shippingData, trackingNumber: e.target.value })}
                                        disabled={shippingData.awaitingTracking}
                                        placeholder="1234567890"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                </div>
                            </div>

                            {/* CIG Specific: VIN Last 6 Digits */}
                            {shippingData.carrier === 'cig' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                                        VIN (Last 6 Digits)
                                        <span className="text-gray-400 text-xs">Required for CIG</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={shippingData.vinLast4Digits}
                                        onChange={(e) => setShippingData({ ...shippingData, vinLast4Digits: e.target.value })}
                                        placeholder="e.g. 123456"
                                        maxLength={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            {/* Route */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex justify-between">
                                    {t.modals.route}
                                    <span className="text-gray-400 text-xs">{t.modals.optional}</span>
                                </label>
                                <input
                                    type="text"
                                    value={shippingData.route}
                                    onChange={(e) => setShippingData({ ...shippingData, route: e.target.value })}
                                    placeholder="Busan Port → Algiers Port"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShippingModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition"
                            >
                                {t.modals.cancel}
                            </button>
                            <button
                                onClick={handleShippingSubmit}
                                className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition shadow-lg shadow-green-200"
                            >
                                {t.modals.updateStatus}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
