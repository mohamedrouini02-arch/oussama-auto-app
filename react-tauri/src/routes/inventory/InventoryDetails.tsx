import { ArrowLeft, Edit, Link as LinkIcon, MapPin, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AssignCarModal from '../../components/AssignCarModal'
import ShareCarModal from '../../components/ShareCarModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { Database } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

type Car = Database['public']['Tables']['car_inventory']['Row']

export default function InventoryDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const [car, setCar] = useState<Car | null>(null)
    const [loading, setLoading] = useState(true)
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [assignedOrder, setAssignedOrder] = useState<any>(null)
    const [activeImage, setActiveImage] = useState(0)

    useEffect(() => {
        fetchCar()
    }, [id])

    async function fetchCar() {
        if (!id) return
        try {
            const { data, error } = await supabase
                .from('car_inventory')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) throw new Error('Car not found')

            if ((data as any).assigned_to_order) {
                const { data: orderData } = await (supabase.from('orders') as any)
                    .select('*')
                    .eq('id', parseInt((data as any).assigned_to_order))
                    .single()

                if (orderData) {
                    setAssignedOrder(orderData)
                }
            } else {
                setAssignedOrder(null)
            }

            setCar(data as Car)
        } catch (error) {
            console.error('Error fetching car:', error)
            alert('Failed to load car details')
            navigate('/inventory')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">{t.inventory.loading}</div>
    if (!car) return <div className="p-8 text-center">{t.inventory.noCars}</div>

    const images = car.photos_urls || []
    // Helper to get full URL (handling both raw URLs and storage paths)
    const getImageUrl = (path: string) => path.startsWith('http') ? path : supabase.storage.from('car-media').getPublicUrl(path).data.publicUrl

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <Link to="/inventory" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        {t.common.back}
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">{car.year} {car.brand} {car.model}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{car.vin}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${car.status === 'available' ? 'bg-green-100 text-green-800' :
                            car.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {/* @ts-ignore */}
                            {t.inventory[car.status?.toLowerCase()] || car.status}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShareModalOpen(true)}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition flex items-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {t.inventory.share}
                    </button>
                    {car.assigned_to_order ? (
                        <button
                            onClick={async () => {
                                if (!confirm(t.inventory.confirmUnassign || 'Are you sure you want to unassign this car?')) return
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

                                    // 3. Try to delete related transaction (optional, but good for cleanup)
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
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {t.inventory.unassign || 'Unassign'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setAssignModalOpen(true)}
                            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition flex items-center gap-2"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {t.inventory.assign}
                        </button>
                    )}
                    <Link
                        to={`/inventory/${id}/edit`}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        {t.common.edit}
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
                        {images.length > 0 ? (
                            <img
                                src={getImageUrl(images[activeImage])}
                                alt={`${car.brand} ${car.model}`}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${activeImage === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.common.viewDetails}</h2>

                        {/* Status Change Buttons */}
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <span className="block text-sm text-gray-500 mb-2">Status</span>
                            <div className="flex gap-2">
                                {['available', 'reserved', 'sold'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={async () => {
                                            if (!car) return
                                            try {
                                                const { error } = await (supabase.from('car_inventory') as any)
                                                    .update({ status })
                                                    .eq('id', car.id)

                                                if (error) throw error
                                                setCar({ ...car, status })
                                            } catch (error) {
                                                console.error('Error updating status', error)
                                                alert('Failed to update status')
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition ${car.status === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {/* @ts-ignore */}
                                        {t.inventory[status] || status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">{t.inventory.year}</span>
                                <span className="font-medium text-lg">{car.year}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">{t.common.model}</span>
                                <span className="font-medium text-lg">{car.brand} {car.model}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">Color</span>
                                <span className="font-medium capitalization">{car.color || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">Mileage</span>
                                <span className="font-medium">{car.mileage?.toLocaleString()} km</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">Location</span>
                                <span className="font-medium flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {car.location}
                                </span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">Selling Price</span>
                                <span className="font-bold text-xl text-blue-600">{car.selling_price?.toLocaleString()} {car.currency}</span>
                            </div>
                        </div>
                    </div>

                    {assignedOrder && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                            <h2 className="text-lg font-bold mb-4">Assigned Order</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <p className="font-bold text-gray-900">{assignedOrder.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Reference</p>
                                    <p className="font-mono text-gray-700">#{assignedOrder.reference_number}</p>
                                </div>
                                <Link
                                    to={`/orders/${assignedOrder.id}`}
                                    className="block w-full text-center py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium mt-2"
                                >
                                    View Order
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">Buying Price</span>
                                <span className="font-medium">{car.purchase_price?.toLocaleString()} {car.currency}</span>
                            </div>

                        </div>
                    </div>

                    {car.notes && (
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                            <h3 className="font-bold text-yellow-800 mb-2">{t.common.notes}</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{car.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <ShareCarModal
                car={car}
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
            />
            <AssignCarModal
                car={car}
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                onAssign={fetchCar}
            />
        </div>
    )
}
