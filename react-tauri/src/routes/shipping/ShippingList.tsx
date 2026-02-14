import { format } from 'date-fns'
import { Copy, Edit, FileText, MessageCircle, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { Database } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

type ShippingForm = Database['public']['Tables']['shipping_forms']['Row']

export default function ShippingList() {
    const [forms, setForms] = useState<ShippingForm[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchForms()
    }, [])

    async function fetchForms() {
        try {
            const { data, error } = await supabase
                .from('shipping_forms')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setForms(data || [])
        } catch (error) {
            console.error('Error fetching shipping forms:', error)
        } finally {
            setLoading(false)
        }
    }

    const { t } = useLanguage()
    const [statusFilter, setStatusFilter] = useState('All')

    const filteredForms = forms.filter(f => {
        const matchesSearch =
            f.name?.toLowerCase().includes(search.toLowerCase()) ||
            f.vehicle_model?.toLowerCase().includes(search.toLowerCase()) ||
            f.vin_number?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus = statusFilter === 'All' || f.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const handleWhatsApp = (form: ShippingForm) => {
        if (!form.phone) return
        let cleanPhone = form.phone.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1)
        if (!cleanPhone.startsWith('213')) cleanPhone = '213' + cleanPhone

        let vehiclePhotos: string[] = []
        try {
            const rawPhotos = form.vehicle_photos_urls
            if (Array.isArray(rawPhotos)) {
                vehiclePhotos = rawPhotos
            } else if (typeof rawPhotos === 'string') {
                if (rawPhotos.trim().startsWith('[')) {
                    try {
                        const parsed = JSON.parse(rawPhotos)
                        if (Array.isArray(parsed)) vehiclePhotos = parsed
                    } catch { }
                }
                if (vehiclePhotos.length === 0) {
                    vehiclePhotos = rawPhotos
                        .replace(/^\{|\}$/g, '')
                        .replace(/"/g, '')
                        .split(',')
                        .map(u => u.trim())
                        .filter(u => u.length > 0 && u !== 'null')
                }
            }
        } catch { vehiclePhotos = [] }

        let message = `
*Shipping Details*
------------------
*Customer Info*
Name: ${form.name}
Phone: ${form.phone}
Address: ${form.address || 'N/A'}

*Vehicle Info*
Model: ${form.vehicle_model}
VIN: ${form.vin_number || 'N/A'}
Status: ${form.status}

*Documents & Media*
`.trim()

        if (form.pdf_url) {
            message += `\n📄 *Shipping Form PDF*: ${form.pdf_url}`
        }
        if (form.passport_photo_url) {
            message += `\n🛂 *Passport Photo*: ${form.passport_photo_url}`
        }
        if (form.id_card_url) {
            message += `\n🆔 *ID Card*: ${form.id_card_url}`
        }
        if (vehiclePhotos.length > 0) {
            message += `\n\n🚗 *Vehicle Photos*:`
            vehiclePhotos.forEach((url, index) => {
                message += `\n${index + 1}. ${url}`
            })
        }

        message += `\n\n------------------\n*Wahid Auto*`

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const handleCopyInfo = (form: ShippingForm) => {
        const info = `
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}
Address: ${form.address}
Passport: ${form.passport_number}
ID Card: ${form.id_card_number || 'N/A'}
Vehicle: ${form.vehicle_model}
VIN: ${form.vin_number}
Notes: ${form.notes}
        `.trim()

        navigator.clipboard.writeText(info)
        alert('Shipping info copied to clipboard!')
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this shipping form? This action cannot be undone.')) return

        try {
            const { error } = await supabase
                .from('shipping_forms')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Update local state
            setForms(forms.filter(f => f.id !== id))
        } catch (error) {
            console.error('Error deleting shipping form:', error)
            alert('Failed to delete shipping form')
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t.shipping.title}</h1>
                <Link
                    to="/shipping/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    {t.shipping.newForm}
                </Link>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={t.shipping.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 placeholder:text-gray-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white min-w-[150px] text-gray-900"
                >
                    <option value="All">{t.shipping.allStatus}</option>
                    <option value="pending">{t.shipping.pending}</option>
                    <option value="completed">{t.shipping.completed}</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">{t.shipping.loading}</div>
                ) : filteredForms.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">{t.shipping.noForms}</div>
                ) : (
                    filteredForms.map((form) => (
                        <div key={form.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${form.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {/* @ts-ignore */}
                                    {t.shipping[form.status?.toLowerCase()] || form.status || t.shipping.pending}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-1">{form.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{form.vehicle_model}</p>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.shipping.phone}:</span>
                                    <span className="font-medium text-gray-900">{form.phone || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.shipping.vin}:</span>
                                    <span className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-700">{form.vin_number || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.shipping.date}:</span>
                                    <span className="text-gray-900">{form.created_at ? format(new Date(form.created_at), 'MMM d, yyyy') : '-'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => handleWhatsApp(form)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 transition"
                                    title="WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleCopyInfo(form)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                                    title="Copy Info"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <Link
                                    to={`/shipping/${form.id}/edit`}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                                <Link
                                    to={`/shipping/${form.id}`}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition"
                                    title="View Details"
                                >
                                    <Search className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(form.id)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
