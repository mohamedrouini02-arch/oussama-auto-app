'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Car = Database['public']['Tables']['car_inventory']['Row']
type Order = Database['public']['Tables']['orders']['Row']

interface ShareCarModalProps {
    car: Car
    isOpen: boolean
    onClose: () => void
}

export default function ShareCarModal({ car, isOpen, onClose }: ShareCarModalProps) {
    const { t } = useLanguage()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedOrders, setSelectedOrders] = useState<number[]>([])

    useEffect(() => {
        if (isOpen) {
            fetchConfirmedOrders()
            setSelectedOrders([])
        }
    }, [isOpen])

    async function fetchConfirmedOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'confirmed')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleOrder = (id: number) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(o => o !== id))
        } else {
            setSelectedOrders([...selectedOrders, id])
        }
    }

    const handleShare = () => {
        const selectedCustomers = orders.filter(o => selectedOrders.includes(o.id))

        selectedCustomers.forEach(order => {
            if (!order.customer_phone) return

            let phone = order.customer_phone.replace(/\D/g, '')
            if (phone.startsWith('0')) phone = phone.substring(1)
            if (!phone.startsWith('213')) phone = '213' + phone

            // Format Photos
            const photosList = car.photos_urls?.map((url, index) => {
                const fullUrl = url.startsWith('http') ? url : supabase.storage.from('car-media').getPublicUrl(url).data.publicUrl
                return `${index + 1}. ${fullUrl}`
            }).join('\n') || ''

            // Format Video
            let videoList = ''
            if (car.video_url) {
                const fullVideoUrl = car.video_url.startsWith('http') ? car.video_url : supabase.storage.from('car-media').getPublicUrl(car.video_url).data.publicUrl
                videoList = `1. ${fullVideoUrl}`
            }

            const imagesCount = car.photos_urls?.length || 0
            const videosCount = car.video_url ? 1 : 0
            const price = car.selling_price?.toLocaleString() || '0'
            const mileage = car.mileage?.toLocaleString() || '0'

            const message = `شكراً لاختيارك وحيد أوتو لاستيراد السيارات الكورية! 

━━━━━━━━━━━━━━━━━━━━━
 تفاصيل السيارة المتاحة
━━━━━━━━━━━━━━━━━━━━━

 السيارة: ${car.brand} ${car.model}
 سنة الصنع: ${car.year}
 السعر: ${price} ${car.currency}
 الموقع:  ${car.location || 'غير محدد'}
 المسافة المقطوعة: ${mileage} كم
 اللون: ${car.color || 'غير محدد'}

 ملاحظات:
${car.notes || 'لا توجد ملاحظات'}

━━━━━━━━━━━━━━━━━━━━━
 الصور والفيديوهات (${imagesCount} صور، ${videosCount} فيديو)

 الصور:
${photosList}

 الفيديوهات:
${videoList}

━━━━━━━━━━━━━━━━━━━━━
 للاستفسار والحجز:

نحن في خدمتك! اتصل بنا الآن للمزيد من التفاصيل أو لحجز هذه السيارة.

 تتبع طلبك: https://oussama-auto.com/order-status
 موقعنا: https://oussama-auto.com

فريق وحيد أوتو 
نجلب لك الأفضل من كوريا والصين!`

            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
        })

        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t.modals.shareCarTitle}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-4">{t.modals.selectOrders}</p>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">{t.modals.loadingOrders}</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">{t.modals.noConfirmedOrders}</div>
                    ) : (
                        <div className="space-y-2">
                            {orders.map(order => (
                                <label key={order.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => toggleOrder(order.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500">{t.modals.lookingFor}: {order.car_brand} {order.car_model}</div>
                                    </div>
                                </label>
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
                        onClick={handleShare}
                        disabled={selectedOrders.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {t.modals.shareWhatsApp}
                    </button>
                </div>
            </div>
        </div>
    )
}
