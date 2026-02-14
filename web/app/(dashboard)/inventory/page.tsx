'use client'

import AssignCarModal from '@/components/AssignCarModal'
import ShareCarModal from '@/components/ShareCarModal'
import { useLanguage } from '@/context/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { Calendar, Link as LinkIcon, MapPin, MessageCircle, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Car = Database['public']['Tables']['car_inventory']['Row']

export default function InventoryPage() {
    const [cars, setCars] = useState<Car[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const [selectedCar, setSelectedCar] = useState<Car | null>(null)
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [assignModalOpen, setAssignModalOpen] = useState(false)

    useEffect(() => {
        fetchCars()
    }, [])

    async function fetchCars() {
        try {
            const { data, error } = await supabase
                .from('car_inventory')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setCars(data || [])
        } catch (error) {
            console.error('Error fetching inventory:', error)
        } finally {
            setLoading(false)
        }
    }

    const { t } = useLanguage()
    const { canEdit } = usePermissions()
    const [statusFilter, setStatusFilter] = useState('All')

    const filteredCars = cars.filter(car => {
        const matchesSearch =
            car.brand?.toLowerCase().includes(search.toLowerCase()) ||
            car.model?.toLowerCase().includes(search.toLowerCase()) ||
            car.vin?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus = statusFilter === 'All' || car.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const openShareModal = (car: Car) => {
        setSelectedCar(car)
        setShareModalOpen(true)
    }

    const openAssignModal = (car: Car) => {
        setSelectedCar(car)
        setAssignModalOpen(true)
    }

    const handleUnassign = async (car: Car) => {
        if (!car.assigned_to_order) return
        if (!confirm(t.modals.assignCarTitle + ' - ' + t.common.cancel + '?')) return

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

            fetchCars()
        } catch (error) {
            console.error('Error unassigning:', error)
            alert('Failed to unassign car')
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t.inventory.title}</h1>
                <Link
                    href="/inventory/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    {t.inventory.addCar}
                </Link>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={t.inventory.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-900 dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-900 dark:text-white min-w-[150px]"
                >
                    <option value="All">{t.inventory.allStatus}</option>
                    <option value="available">{t.inventory.available}</option>
                    <option value="reserved">{t.inventory.reserved}</option>
                    <option value="sold">{t.inventory.sold}</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t.inventory.loading}</div>
            ) : filteredCars.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t.inventory.noCars}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCars.map((car) => (
                        <div key={car.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition">
                            <div className="h-48 bg-gray-200 relative group cursor-pointer">
                                <Link href={`/inventory/details?id=${car.id}`} className="block w-full h-full">
                                    {car.photos_urls && car.photos_urls.length > 0 ? (
                                        <img
                                            src={car.photos_urls[0].startsWith('http')
                                                ? car.photos_urls[0]
                                                : supabase.storage.from('car-media').getPublicUrl(car.photos_urls[0]).data.publicUrl}
                                            alt={`${car.brand} ${car.model}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            {t.inventory.noImage}
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase">
                                        {/* @ts-ignore */}
                                        {t.inventory[car.status?.toLowerCase()] || car.status}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </Link>
                            </div>

                            <div className="p-4">
                                <Link href={`/inventory/details?id=${car.id}`} className="block">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition">{car.year} {car.brand} {car.model}</h3>
                                </Link>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1 flex items-center gap-1">
                                    <span className="font-semibold text-xs uppercase bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">VIN</span>
                                    {car.vin}
                                </p>
                                {(car as any).added_by_name && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                                        Added by <span className="font-medium text-gray-600 dark:text-gray-300">{(car as any).added_by_name}</span>
                                    </p>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4" />
                                        <span>{car.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{car.mileage?.toLocaleString()} km</span>
                                    </div>
                                    {car.notes && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 bg-gray-50 dark:bg-slate-800 p-2 rounded">
                                            {car.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 mb-4">
                                    <div className="font-bold text-blue-600 text-lg">
                                        {car.selling_price?.toLocaleString()} {car.currency}
                                    </div>
                                    {canEdit(car) && (
                                        <Link
                                            href={`/inventory/edit?id=${car.id}`}
                                            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium"
                                        >
                                            {t.common.edit}
                                        </Link>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {car.assigned_to_order ? (
                                        <>
                                            <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mb-1 border border-blue-100 dark:border-blue-900/30">
                                                <div className="text-xs text-blue-500 font-bold uppercase mb-1">Assigned Order</div>
                                                <Link href={`/orders/details?id=${(car as any).orders?.id || car.assigned_to_order}`} className="text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline block truncate">
                                                    {(car as any).orders?.customer_name || 'View Order'}
                                                </Link>
                                                <div className="text-xs text-blue-600 dark:text-blue-500">{(car as any).orders?.reference_number}</div>
                                            </div>
                                            <button
                                                onClick={() => handleUnassign(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition text-sm font-medium"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                {t.inventory.unassign}
                                            </button>
                                            <button
                                                onClick={() => openShareModal(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition text-sm font-medium"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                {t.inventory.share}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => openAssignModal(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition text-sm font-medium"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                {t.inventory.assign}
                                            </button>
                                            <button
                                                onClick={() => openShareModal(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition text-sm font-medium"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                {t.inventory.share}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedCar && (
                <>
                    <ShareCarModal
                        car={selectedCar}
                        isOpen={shareModalOpen}
                        onClose={() => setShareModalOpen(false)}
                    />
                    <AssignCarModal
                        car={selectedCar}
                        isOpen={assignModalOpen}
                        onClose={() => setAssignModalOpen(false)}
                        onAssign={fetchCars}
                    />
                </>
            )}
        </div>
    )
}
