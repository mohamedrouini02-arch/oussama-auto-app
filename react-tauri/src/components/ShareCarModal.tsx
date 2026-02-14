import { Check, Loader2, MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'

type Car = Database['public']['Tables']['car_inventory']['Row']
type Order = Database['public']['Tables']['orders']['Row']

interface ShareCarModalProps {
    car: Car
    isOpen: boolean
    onClose: () => void
}

async function shortenUrl(url: string): Promise<string> {
    try {
        const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
        if (response.ok) {
            return await response.text()
        }
        return url
    } catch (e) {
        console.error('Error shortening URL:', e)
        return url
    }
}

export default function ShareCarModal({ car, isOpen, onClose }: ShareCarModalProps) {
    const { t } = useLanguage()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [selectedOrders, setSelectedOrders] = useState<number[]>([])

    useEffect(() => {
        if (isOpen) {
            fetchConfirmedOrders()
            setSelectedOrders([])
            setProcessing(false)
        }
    }, [isOpen])

    async function fetchConfirmedOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                // .eq('status', 'confirmed') // Removed restriction to allow sharing with any order
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

    const handleShare = async () => {
        setProcessing(true)

        try {
            // 1. Prepare Content
            const images = car.photos_urls || []
            const video = car.video_url

            // Get Public URLs and Shorten them (Parallelly)
            const shortImageUrls = await Promise.all(
                images.map(async (path) => {
                    const fullUrl = path.startsWith('http')
                        ? path
                        : supabase.storage.from('car-media').getPublicUrl(path).data.publicUrl
                    return await shortenUrl(fullUrl)
                })
            )

            let shortVideoUrl = ''
            if (video) {
                const fullVideoUrl = video.startsWith('http')
                    ? video
                    : supabase.storage.from('car-media').getPublicUrl(video).data.publicUrl
                shortVideoUrl = await shortenUrl(fullVideoUrl)
            }

            // 2. Build Message
            const imagesList = shortImageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')
            const videoSection = shortVideoUrl ? `\n\n الفيديوهات:\n1. ${shortVideoUrl}` : ''

            const message = `شكراً لاختيارك وحيد أوتو لاستيراد السيارات الكورية! 

━━━━━━━━━━━━━━━━━━━━━
 تفاصيل السيارة المتاحة
━━━━━━━━━━━━━━━━━━━━━

 السيارة: ${car.brand} ${car.model}
 سنة الصنع: ${car.year}
 السعر: ${car.selling_price?.toLocaleString()} ${car.currency || 'دج'}
 الموقع:  ${car.location}
 المسافة المقطوعة: ${car.mileage?.toLocaleString()} كم
 اللون: ${car.color || 'غير محدد'}



 ملاحظات:
${car.notes || 'لا توجد ملاحظات إضافية'}

━━━━━━━━━━━━━━━━━━━━━
 الصور والفيديوهات (${images.length} صور، ${video ? '1' : '0'} فيديو)

 الصور:
${imagesList}${videoSection}

━━━━━━━━━━━━━━━━━━━━━
 للاستفسار والحجز:

نحن في خدمتك! اتصل بنا الآن للمزيد من التفاصيل أو لحجز هذه السيارة.

 تتبع طلبك: https://wahid-auto.com/order-status
 موقعنا: https://wahid-auto.com

فريق وحيد أوتو 
نجلب لك الأفضل من كوريا والصين! `

            // 3. Send to Customers
            const selectedCustomers = orders.filter(o => selectedOrders.includes(o.id))

            // We can't open multiple windows in a loop reliably without triggering popup blockers.
            // But for a desktop app (Tauri), it might work better, or we might need to do one by one.
            // Let's try opening them.

            for (const order of selectedCustomers) {
                if (!order.customer_phone) continue

                let phone = order.customer_phone.replace(/\D/g, '')

                // Handle 00 prefix
                if (phone.startsWith('00')) phone = phone.substring(2)
                // Handle 0 prefix
                if (phone.startsWith('0')) phone = phone.substring(1)
                // Add 213 (check again to avoid double prefix if user entered 213...)
                if (!phone.startsWith('213')) phone = '213' + phone

                await import('@tauri-apps/plugin-shell').then(({ open }) => {
                    open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
                }).catch(() => {
                    // Fallback for web mode
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
                })

                // Add a small delay to prevent overwhelming the system
                await new Promise(r => setTimeout(r, 500))
            }

            onClose()

        } catch (error) {
            console.error('Error sharing car:', error)
            alert('Error generating links or sending message')
        } finally {
            setProcessing(false)
        }
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

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder={t.orders.searchPlaceholder}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onChange={() => {
                                // Simple client-side filter could be added here if needed
                            }}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">{t.modals.loadingOrders}</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">{t.modals.noOrders}</div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs text-gray-500">{selectedOrders.length} selected</span>
                                {selectedOrders.length > 0 && (
                                    <button
                                        onClick={() => setSelectedOrders([])}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {orders.map(order => (
                                <label key={order.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${selectedOrders.includes(order.id) ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => toggleOrder(order.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{order.customer_name || t.common.unknownCustomer}</div>
                                        <div className="text-xs text-gray-500 flex gap-1">
                                            <span>{order.car_brand || '-'} {order.car_model || '-'}</span>
                                            <span>•</span>
                                            <span>{order.customer_phone || '-'}</span>
                                        </div>
                                    </div>
                                    {selectedOrders.includes(order.id) && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        disabled={processing}
                    >
                        {t.modals.cancel}
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={selectedOrders.length === 0 || processing}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                        {t.modals.shareWhatsApp}
                    </button>
                </div>
            </div>
        </div>
    )
}
