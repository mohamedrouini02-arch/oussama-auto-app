import { Calendar, Link as LinkIcon, MapPin, MessageCircle, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AssignCarModal from '../../components/AssignCarModal'
import ShareCarModal from '../../components/ShareCarModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { Database } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

type Car = Database['public']['Tables']['car_inventory']['Row']

export default function InventoryList() {
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
                .select('*, orders!assigned_car_id(id, customer_name, reference_number, status)')
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
                .update({ status: 'confirmed', assigned_car_id: null } as any)
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
                    to="/inventory/new"
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white min-w-[150px]"
                >
                    <option value="All">{t.inventory.allStatus}</option>
                    <option value="available">{t.inventory.available}</option>
                    <option value="reserved">{t.inventory.reserved}</option>
                    <option value="sold">{t.inventory.sold}</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">{t.inventory.loading}</div>
            ) : filteredCars.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t.inventory.noCars}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCars.map((car) => (
                        <div key={car.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                            <div className="h-48 bg-gray-200 relative group cursor-pointer">
                                <Link to={`/inventory/${car.id}`} className="block w-full h-full">
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
                                <Link to={`/inventory/${car.id}`} className="block">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 hover:text-blue-600 transition">{car.year} {car.brand} {car.model}</h3>
                                </Link>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-1">{car.vin}</p>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span>{car.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>{car.mileage?.toLocaleString()} km</span>
                                    </div>
                                    {car.notes && (
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 bg-gray-50 p-2 rounded">
                                            {car.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                                    <div className="font-bold text-blue-600 text-lg">
                                        {car.selling_price?.toLocaleString()} {car.currency}
                                    </div>
                                    <Link
                                        to={`/inventory/${car.id}/edit`}
                                        className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                                    >
                                        {t.common.edit}
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {car.assigned_to_order ? (
                                        <>
                                            <div className="col-span-2 bg-blue-50 p-2 rounded-lg mb-1 border border-blue-100">
                                                <div className="text-xs text-blue-500 font-bold uppercase mb-1">Assigned Order</div>
                                                <Link to={`/orders/${(car as any).orders?.id || car.assigned_to_order}`} className="text-sm font-bold text-blue-700 hover:underline block truncate">
                                                    {(car as any).orders?.customer_name || 'View Order'}
                                                </Link>
                                                <div className="text-xs text-blue-600">{(car as any).orders?.reference_number}</div>
                                            </div>
                                            <button
                                                onClick={() => handleUnassign(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                Unassign
                                            </button>
                                            <button
                                                onClick={() => openShareModal(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition text-sm font-medium"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                {t.inventory.share}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => openAssignModal(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition text-sm font-medium"
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                                {t.inventory.assign}
                                            </button>
                                            <button
                                                onClick={() => openShareModal(car)}
                                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition text-sm font-medium"
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
