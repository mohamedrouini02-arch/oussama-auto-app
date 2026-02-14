'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewOrderPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerWilaya: '',
        customerIdCard: '',
        carBrand: '',
        carModel: '',
        budget: '',
        customBudget: '',
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Generate Reference Number
            const year = new Date().getFullYear()
            const { data: latestOrder } = await (supabase.from('orders') as any)
                .select('reference_number')
                .ilike('reference_number', `WA-${year}-%`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            let sequence = 1
            if (latestOrder?.reference_number) {
                const parts = latestOrder.reference_number.split('-')
                if (parts.length === 3) {
                    sequence = parseInt(parts[2]) + 1
                }
            }

            const referenceNumber = `WA-${year}-${sequence.toString().padStart(6, '0')}`

            // Construct initial order_data for tracking system
            const initialOrderData = {
                referenceNumber,
                status: 'pending',
                source: 'dashboard',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                displayDate: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                customerInfo: {
                    name: formData.customerName,
                    phone: formData.customerPhone.replace(/\D/g, ''),
                    email: formData.customerEmail,
                    wilaya: formData.customerWilaya,
                    idCard: formData.customerIdCard,
                    whatsappPhone: `213${formData.customerPhone.replace(/\D/g, '').replace(/^0/, '')}`
                },
                carDetails: {
                    brand: formData.carBrand,
                    model: formData.carModel,
                    budget: formData.budget,
                    customBudget: formData.customBudget,
                    brandDisplay: formData.carBrand, // Should ideally be translated/formatted
                    modelDisplay: `${formData.carBrand} ${formData.carModel}`,
                    budgetDisplay: formData.budget ? `${formData.budget} DZD` : 'N/A'
                },
                notes: formData.notes,
                statusHistory: [
                    {
                        status: 'pending',
                        timestamp: Date.now(),
                        date: new Date().toLocaleDateString('ar-EG'),
                        note: 'تم إنشاء الطلب من لوحة التحكم'
                    }
                ]
            }

            const { error } = await supabase.from('orders').insert({
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone.replace(/\D/g, ''),
                customer_email: formData.customerEmail,
                customer_wilaya: formData.customerWilaya,
                car_brand: formData.carBrand,
                car_model: formData.carModel,
                car_budget: formData.budget,
                car_custom_budget: formData.customBudget,
                notes: formData.notes,
                status: 'pending',
                reference_number: referenceNumber,
                order_data: initialOrderData,
                created_at: new Date().toISOString()
            } as any)

            if (error) throw error
            router.push('/orders')
        } catch (error) {
            console.error('Error creating order:', error)
            alert('Failed to create order: ' + (error as any).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/orders" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    {t.forms.back}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.orders.newOrder}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">{t.forms.customerInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.fullName} *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerName}
                                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.phone} *</label>
                            <input
                                required
                                type="tel"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerPhone}
                                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.email}</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerEmail}
                                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.wilaya}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerWilaya}
                                onChange={e => setFormData({ ...formData, customerWilaya: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.idCard}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customerIdCard}
                                onChange={e => setFormData({ ...formData, customerIdCard: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">{t.forms.vehicleDetails}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.carBrand} *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.carBrand}
                                onChange={e => setFormData({ ...formData, carBrand: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.carModel} *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.carModel}
                                onChange={e => setFormData({ ...formData, carModel: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.budget}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.budget}
                                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.customBudget}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.customBudget}
                                onChange={e => setFormData({ ...formData, customBudget: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.notes}</label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/orders"
                        className="px-6 py-2 bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        {t.forms.cancel}
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? t.forms.saving : t.forms.createOrder}
                    </button>
                </div>
            </form>
        </div>
    )
}
