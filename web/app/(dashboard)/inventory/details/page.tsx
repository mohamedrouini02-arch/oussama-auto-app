'use client'

import ShareCarModal from '@/components/ShareCarModal'
import AssignCarModal from '@/components/inventory/AssignCarModal'
import { useLanguage } from '@/context/LanguageContext'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, Link as LinkIcon, MapPin, MessageCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type Car = Database['public']['Tables']['car_inventory']['Row']

function CarDetailsContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const { t } = useLanguage()
    const [car, setCar] = useState<Car | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeImage, setActiveImage] = useState(0)

    const [assignedOrder, setAssignedOrder] = useState<any>(null)
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [shareModalOpen, setShareModalOpen] = useState(false)

    useEffect(() => {
        if (id) {
            fetchCar()
        } else {
            setLoading(false)
        }
    }, [id])

    async function fetchCar() {
        if (!id) return
        try {
            const { data, error } = await (supabase.from('car_inventory') as any)
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setCar(data)

            if (data.assigned_to_order) {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', parseInt(data.assigned_to_order))
                    .single()

                if (orderData) {
                    setAssignedOrder(orderData)
                }
            } else {
                setAssignedOrder(null)
            }
        } catch (error) {
            console.error('Error fetching car:', error)
            alert('Car not found')
            router.push('/inventory')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (status: string) => {
        if (!car) return
        try {
            const { error } = await (supabase.from('car_inventory') as any)
                .update({ status })
                .eq('id', car.id)

            if (error) throw error
            setCar({ ...car, status })
        } catch {
            alert('Error updating status')
        }
    }

    const getImageUrl = (path: string) => path.startsWith('http') ? path : supabase.storage.from('car-media').getPublicUrl(path).data.publicUrl

    if (loading) return <div className="p-8 text-center">{t.inventory.loading}</div>
    if (!id || !car) return <div className="p-8 text-center">{t.inventory.noCars}</div>

    const images = car.photos_urls || []

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <Link href="/inventory" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        {t.common.back}
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{car.year} {car.brand} {car.model}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-sm text-gray-500 bg-gray-100 dark:bg-slate-800 dark:text-gray-400 px-2 py-1 rounded">{car.vin}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${car.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            car.status === 'reserved' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-300'
                            }`}>
                            {/* @ts-ignore */}
                            {t.inventory[car.status?.toLowerCase()] || car.status}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShareModalOpen(true)}
                        className="px-4 py-2 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition flex items-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {t.inventory.share}
                    </button>
                    {car.assigned_to_order ? (
                        <button
                            onClick={async () => {
                                if (!confirm(t.modals.assignCarTitle.replace('Assign', 'Unassign') + '?')) return
                                try {
                                    // 1. Update Car
                                    const { error: carError } = await (supabase.from('car_inventory') as any)
                                        .update({ assigned_to_order: null, status: 'available' })
                                        .eq('id', car.id)
                                    if (carError) throw carError

                                    // 2. Update Order
                                    const { error: orderError } = await (supabase.from('orders') as any)
                                        .update({ status: 'confirmed', assigned_car_id: null })
                                        .eq('id', car.assigned_to_order)
                                    if (orderError) throw orderError

                                    // 3. Try to delete related transaction
                                    await supabase.from('financial_transactions')
                                        .delete()
                                        .match({ related_car_id: car.id, related_order_id: car.assigned_to_order })

                                    alert('Car unassigned successfully')
                                    fetchCar()
                                } catch (error) {
                                    console.error('Error unassigning:', error)
                                    alert('Failed to unassign car')
                                }
                            }}
                            className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {t.inventory.unassign}
                        </button>
                    ) : (
                        <button
                            onClick={() => setAssignModalOpen(true)}
                            className="px-4 py-2 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition flex items-center gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {t.inventory.assign}
                        </button>
                    )}
                    <Link
                        href={`/inventory/edit?id=${car.id}`}
                        className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        {t.common.edit}
                    </Link>
                    <button
                        onClick={async () => {
                            if (!confirm(t.common.delete + '?')) return
                            try {
                                const { error } = await supabase.from('car_inventory').delete().eq('id', car.id)
                                if (error) throw error
                                router.push('/inventory')
                            } catch (error) {
                                console.error('Error deleting car:', error)
                                alert('Failed to delete car')
                            }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t.common.delete}
                    </button>
                </div>
            </div>

            <AssignCarModal
                car={car}
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                onAssign={fetchCar}
            />
            <ShareCarModal
                car={car}
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 relative">
                        {images.length > 0 ? (
                            <img
                                src={getImageUrl(images[activeImage])}
                                alt="Car Main"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                {t.inventory.noImage}
                            </div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${activeImage === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <img src={getImageUrl(img)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Video Player */}
                    {car.video_url && (
                        <div className="mt-8">
                            <h2 className="text-lg font-bold mb-4 dark:text-white">{t.forms.media}</h2>
                            <div className="aspect-video bg-black rounded-xl overflow-hidden">
                                <video
                                    src={car.video_url}
                                    controls
                                    className="w-full h-full"
                                    poster={car.photos_urls?.[0]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.common.viewDetails}</h2>

                        {/* Status Change Buttons */}
                        <div className="mb-6 pb-6 border-b border-gray-100 dark:border-slate-800">
                            <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Status</span>
                            <div className="flex gap-2">
                                {['available', 'reserved', 'sold'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(status)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition ${car.status === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {/* @ts-ignore */}
                                        {t.inventory[status] || status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{t.inventory.year}</span>
                                <span className="font-medium text-lg dark:text-white">{car.year}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{t.common.model}</span>
                                <span className="font-medium text-lg dark:text-white">{car.brand} {car.model}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Color</span>
                                <span className="font-medium capitalization dark:text-white">{car.color || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Mileage</span>
                                <span className="font-medium dark:text-white">{car.mileage?.toLocaleString()} km</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Location</span>
                                <span className="font-medium flex items-center gap-1 dark:text-white">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {car.location}
                                </span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Selling Price</span>
                                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">{car.selling_price?.toLocaleString()} {car.currency}</span>
                            </div>
                        </div>
                    </div>

                    {assignedOrder && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 border-s-4 border-s-blue-500">
                            <h2 className="text-lg font-bold mb-4 dark:text-white">Assigned Order</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.finance.clientName}</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{assignedOrder.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reference</p>
                                    <p className="font-mono text-gray-700 dark:text-gray-300">#{assignedOrder.reference_number}</p>
                                </div>
                                <Link
                                    href={`/orders/details?id=${assignedOrder.id}`}
                                    className="block w-full text-center py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition font-medium mt-2"
                                >
                                    View Order
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Buying Price</span>
                                <span className="font-medium dark:text-white">
                                    {car.buying_price_krw ? (car.buying_price_krw.toLocaleString() + ' KRW') : (car.purchase_price ? car.purchase_price.toLocaleString() + ' ' + car.currency : '-')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {car.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">{t.common.notes}</h3>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{car.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CarDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CarDetailsContent />
        </Suspense>
    )
}
