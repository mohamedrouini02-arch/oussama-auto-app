import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function OrdersEdit() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerWilaya: '',
        carBrand: '',
        carModel: '',
        notes: '',
        budget: '',
        customBudget: ''
    })

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', parseInt(id))
                    .single()

                if (error) throw error
                if (data) {
                    const order = data as any
                    setFormData({
                        customerName: order.customer_name || '',
                        customerPhone: order.customer_phone || '',
                        customerEmail: order.customer_email || '',
                        customerWilaya: order.customer_wilaya || '',
                        carBrand: order.car_brand || '',
                        carModel: order.car_model || '',
                        notes: order.notes || '',
                        budget: order.car_budget || '',
                        customBudget: order.car_custom_budget || ''
                    })
                }
            } catch (error) {
                console.error('Error fetching order:', error)
                alert('Order not found')
                navigate('/orders')
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await (supabase.from('orders') as any)
                .update({
                    customer_name: formData.customerName,
                    customer_phone: formData.customerPhone,
                    customer_email: formData.customerEmail,
                    customer_wilaya: formData.customerWilaya,
                    car_brand: formData.carBrand,
                    car_model: formData.carModel,
                    notes: formData.notes,
                    car_budget: formData.budget,
                    car_custom_budget: formData.customBudget
                })
                .eq('id', parseInt(id!))

            if (error) throw error
            navigate('/orders')
        } catch (error) {
            console.error('Error updating order:', error)
            alert('Failed to update order')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link to="/orders" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orders
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Order</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Customer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.customerName}
                                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                            <input
                                required
                                type="tel"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.customerPhone}
                                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.customerEmail}
                                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wilaya</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.customerWilaya}
                                onChange={e => setFormData({ ...formData, customerWilaya: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Vehicle Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Car Brand *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.carBrand}
                                onChange={e => setFormData({ ...formData, carBrand: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Car Model *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.carModel}
                                onChange={e => setFormData({ ...formData, carModel: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.budget}
                                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Budget</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.customBudget}
                                onChange={e => setFormData({ ...formData, customBudget: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        to="/orders"
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
