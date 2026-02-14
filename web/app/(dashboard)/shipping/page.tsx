'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Calendar, Copy, Edit, FileText, MessageCircle, Plus, Search, Ship, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type ShippingForm = Database['public']['Tables']['shipping_forms']['Row']

export default function ShippingList() {
    const [forms, setForms] = useState<ShippingForm[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { t } = useLanguage()
    const { canEdit, canDelete } = usePermissions()
    const [statusFilter, setStatusFilter] = useState('All')

    // New filters for provider and month
    const [providerFilter, setProviderFilter] = useState('All')
    const [shippingProviders, setShippingProviders] = useState<string[]>([])
    const [monthFilter, setMonthFilter] = useState('') // Empty = show all months

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

            // Extract unique shipping providers from data
            const providers = [...new Set((data || [])
                .map(f => (f as any).shipping_provider)
                .filter((p): p is string => p !== null && p !== undefined && p.trim() !== '')
            )]
            setShippingProviders(providers)
        } catch (error) {
            console.error('Error fetching shipping forms:', error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate counts for each provider filter
    const getProviderCount = (filter: string) => {
        if (filter === 'All') return forms.length;
        if (filter === 'No Provider') {
            return forms.filter(f => !(f as any).shipping_provider || (f as any).shipping_provider.trim() === '').length;
        }
        return forms.filter(f => (f as any).shipping_provider === filter).length;
    };

    const filteredForms = forms.filter(f => {
        const searchLower = search.toLowerCase()
        const matchesSearch =
            f.name?.toLowerCase().includes(searchLower) ||
            f.vehicle_model?.toLowerCase().includes(searchLower) ||
            f.vin_number?.toLowerCase().includes(searchLower) ||
            f.phone?.toLowerCase().includes(searchLower) ||
            f.email?.toLowerCase().includes(searchLower) ||
            f.address?.toLowerCase().includes(searchLower) ||
            f.passport_number?.toLowerCase().includes(searchLower) ||
            f.id_card_number?.toLowerCase().includes(searchLower) ||
            f.code_postal?.toLowerCase().includes(searchLower) ||
            f.zip_number?.toLowerCase().includes(searchLower) ||
            f.notes?.toLowerCase().includes(searchLower) ||
            (f as any).shipping_provider?.toLowerCase().includes(searchLower)

        const matchesStatus = statusFilter === 'All' || f.status === statusFilter

        // Provider filter: 'All' = all, 'No Provider' = null/empty provider, otherwise match exact
        const formProvider = (f as any).shipping_provider
        let matchesProvider = true
        if (providerFilter === 'No Provider') {
            matchesProvider = !formProvider || formProvider.trim() === ''
        } else if (providerFilter !== 'All') {
            matchesProvider = formProvider === providerFilter
        }

        // Month filter (empty means show all)
        const formMonth = (f as any).shipment_month
        const matchesMonth = !monthFilter || formMonth === monthFilter

        return matchesSearch && matchesStatus && matchesProvider && matchesMonth
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
                const photosStr = rawPhotos as string;
                if (photosStr.trim().startsWith('[')) {
                    try {
                        const parsed = JSON.parse(photosStr)
                        if (Array.isArray(parsed)) vehiclePhotos = parsed
                    } catch { }
                }
                if (vehiclePhotos.length === 0) {
                    vehiclePhotos = photosStr
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

        message += `\n\n------------------\n*Oussama Auto*`

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const handleCopyInfo = (form: ShippingForm) => {
        if (!form) return

        let vehiclePhotos: string[] = []
        try {
            const rawPhotos = form.vehicle_photos_urls
            if (Array.isArray(rawPhotos)) {
                vehiclePhotos = rawPhotos
            } else if (typeof rawPhotos === 'string') {
                const photosStr = rawPhotos as string;
                if (photosStr.trim().startsWith('[')) {
                    try {
                        const parsed = JSON.parse(photosStr)
                        if (Array.isArray(parsed)) vehiclePhotos = parsed
                    } catch { }
                }
            }
        } catch { vehiclePhotos = [] }

        const info = `
*Shipping Details*
------------------
*Customer Info*
Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email || 'N/A'}
Address: ${form.address || 'N/A'}
Passport: ${form.passport_number || 'N/A'}
ID Card: ${form.id_card_number || 'N/A'}
Postal Code: ${form.code_postal || 'N/A'}
City Name: ${form.zip_number || 'N/A'}

*Vehicle Info*
Model: ${form.vehicle_model}
VIN: ${form.vin_number || 'N/A'}
Status: ${form.status}
Notes: ${form.notes || 'N/A'}

*Documents & Media*
${form.pdf_url ? `PDF: ${form.pdf_url}` : ''}
${form.passport_photo_url ? `Passport Photo: ${form.passport_photo_url}` : ''}
${form.id_card_url ? `ID Card (Front): ${form.id_card_url}` : ''}
${form.id_card_back_url ? `ID Card (Back): ${form.id_card_back_url}` : ''}

*Vehicle Photos*
${vehiclePhotos.map((url, i) => `${i + 1}. ${url}`).join('\n')}
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
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.shipping.title}</h1>
                <Link
                    href="/shipping/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition w-full md:w-auto justify-center"
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 dark:text-white placeholder:text-gray-500 bg-white dark:bg-slate-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-900 min-w-[150px] text-gray-900 dark:text-white"
                >
                    <option value="All">{t.shipping.allStatus}</option>
                    <option value="pending">{t.shipping.pending}</option>
                    <option value="completed">{t.shipping.completed}</option>
                </select>
                {/* Month Filter */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                    {monthFilter && (
                        <button
                            onClick={() => setMonthFilter('')}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Show all months"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Shipping Provider Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                <button
                    onClick={() => setProviderFilter('All')}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${providerFilter === 'All'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                >
                    <Ship className="w-4 h-4" />
                    {t.shipping.allStatus} ({getProviderCount('All')})
                </button>
                <button
                    onClick={() => setProviderFilter('No Provider')}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${providerFilter === 'No Provider'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                >
                    <Ship className="w-4 h-4" />
                    {t.common.noProvider} ({getProviderCount('No Provider')})
                </button>
                {shippingProviders.map((provider) => (
                    <button
                        key={provider}
                        onClick={() => setProviderFilter(provider)}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${providerFilter === provider
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Ship className="w-4 h-4" />
                        {provider} ({getProviderCount(provider)})
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">{t.shipping.loading}</div>
                ) : filteredForms.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">{t.shipping.noForms}</div>
                ) : (
                    filteredForms.map((form) => (
                        <div key={form.id} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition group flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${form.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {/* @ts-ignore */}
                                    {t.shipping[form.status?.toLowerCase()] || form.status || t.shipping.pending}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{form.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{form.vehicle_model}</p>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.shipping.phone}:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-300">{form.phone || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.shipping.vin}:</span>
                                    <span className="font-mono bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{form.vin_number || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t.shipping.date}:</span>
                                    <span className="text-gray-900 dark:text-gray-300">{form.created_at ? format(new Date(form.created_at), 'MMM d, yyyy') : '-'}</span>
                                </div>
                                {form.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                            {t.forms.notes}
                                        </p>
                                        <p className="text-sm text-gray-500 whitespace-pre-wrap line-clamp-3">
                                            {form.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-5 gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    onClick={() => handleWhatsApp(form)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition"
                                    title="WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleCopyInfo(form)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition"
                                    title="Copy Info"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                {canEdit(form) && (
                                    <Link
                                        href={`/shipping/edit?id=${form.id}`}
                                        className="flex items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                )}
                                <Link
                                    href={`/shipping/details?id=${form.id}`}
                                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition"
                                    title="View Details"
                                >
                                    <Search className="w-4 h-4" />
                                </Link>
                                {canDelete(form) && (
                                    <button
                                        onClick={() => handleDelete(form.id)}
                                        className="flex items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )
                }
            </div >
        </div >
    )
}
