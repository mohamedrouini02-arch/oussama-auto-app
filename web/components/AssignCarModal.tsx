'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { Check, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Car = Database['public']['Tables']['car_inventory']['Row']
type Order = Database['public']['Tables']['orders']['Row']

interface AssignCarModalProps {
    car: Car
    isOpen: boolean
    onClose: () => void
    onAssign: () => void
}

export default function AssignCarModal({ car, isOpen, onClose, onAssign }: AssignCarModalProps) {
    const { t } = useLanguage()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
    const [assigning, setAssigning] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchOrders()
            setSelectedOrderId(null)
            setSearch('')
        }
    }, [isOpen])

    async function fetchOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .neq('status', 'cancelled')
                .neq('status', 'delivered')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }
    const handleAssign = async () => {
        if (!selectedOrderId) return

        setAssigning(true)
        try {
            const { error } = await (supabase.from('car_inventory') as any)
                .update({ assigned_to_order: selectedOrderId.toString(), status: 'reserved' })
                .eq('id', car.id)

            if (error) throw error

            onAssign()
            onClose()
        } catch (error) {
            console.error('Error assigning car:', error)
            alert('Failed to assign car')
        } finally {
            setAssigning(false)
        }
    }

    const filteredOrders = orders.filter(order =>
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
        order.car_model?.toLowerCase().includes(search.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t.modals.assignCarTitle}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={t.modals.searchOrders}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">{t.modals.loadingOrders}</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">{t.modals.noOrders}</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-between ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500">#{order.reference_number} • {order.car_brand} {order.car_model}</div>
                                    </div>
                                    {selectedOrderId === order.id && (
                                        <div className="bg-blue-500 text-white p-1 rounded-full">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        {t.modals.cancel}
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedOrderId || assigning}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {assigning ? t.modals.assigning : t.modals.assignOrder}
                    </button>
                </div>
            </div>
        </div>
    )
}
