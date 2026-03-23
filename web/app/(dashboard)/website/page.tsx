'use client'

import { useLanguage } from '@/context/LanguageContext'
import { cmsClient as supabase } from '@/lib/cms-client'
import { Car, Edit2, Eye, EyeOff, Globe, Image, Pencil, Plus, Search, Star, Trash2, Type } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ContentEditor from './ContentEditor'
import MediaManager from './MediaManager'

interface WebsiteCar {
    id: string
    slug: string
    brand: string
    brand_ar: string
    model: string
    model_ar: string
    year: number
    end_year?: number
    price_min: number
    price_max: number
    image: string
    category: string
    is_popular: boolean
    is_active: boolean
    origin: string
    created_at: string
}

type Tab = 'cars' | 'content' | 'media'

export default function WebsitePage() {
    const { t, dir } = useLanguage()
    const [activeTab, setActiveTab] = useState<Tab>('cars')
    const [cars, setCars] = useState<WebsiteCar[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [originFilter, setOriginFilter] = useState<string>('')

    useEffect(() => {
        fetchCars()
    }, [])

    async function fetchCars() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('website_cars')
                .select('id, slug, brand, brand_ar, model, model_ar, year, end_year, price_min, price_max, image, category, is_popular, is_active, origin, created_at')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false })

            if (error) throw error
            setCars(data || [])
        } catch (err) {
            console.error('Error fetching cars:', err)
        } finally {
            setLoading(false)
        }
    }

    async function toggleActive(id: string, currentStatus: boolean) {
        try {
            await supabase
                .from('website_cars')
                .update({ is_active: !currentStatus })
                .eq('id', id)
            setCars(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c))
        } catch (err) {
            console.error('Error toggling car:', err)
        }
    }

    async function togglePopular(id: string, currentStatus: boolean) {
        try {
            await supabase
                .from('website_cars')
                .update({ is_popular: !currentStatus })
                .eq('id', id)
            setCars(prev => prev.map(c => c.id === id ? { ...c, is_popular: !currentStatus } : c))
        } catch (err) {
            console.error('Error toggling popular:', err)
        }
    }

    async function deleteCar(id: string) {
        if (!confirm(t.website.confirmDelete)) return
        try {
            await supabase.from('website_cars').delete().eq('id', id)
            setCars(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            console.error('Error deleting car:', err)
        }
    }

    const filteredCars = cars.filter(car => {
        const matchesSearch = search === '' ||
            car.brand.toLowerCase().includes(search.toLowerCase()) ||
            car.model.toLowerCase().includes(search.toLowerCase()) ||
            car.brand_ar.includes(search) ||
            car.model_ar.includes(search)
        const matchesOrigin = originFilter === '' || car.origin === originFilter
        return matchesSearch && matchesOrigin
    })

    function formatPrice(price: number) {
        return new Intl.NumberFormat('fr-DZ').format(price) + ' DZD'
    }

    const tabs = [
        { key: 'cars' as Tab, label: t.website.cars, icon: Car },
        { key: 'content' as Tab, label: t.website.content, icon: Type },
        { key: 'media' as Tab, label: t.website.media, icon: Image },
    ]

    return (
        <div className="p-4 lg:p-8 space-y-6" dir={dir}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        {t.website.title}
                    </h1>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl max-w-md">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.key
                                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Cars Tab */}
            {activeTab === 'cars' && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex gap-3 flex-1 w-full sm:w-auto">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t.website.searchCars}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <select
                                value={originFilter}
                                onChange={e => setOriginFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">{t.website.allOrigins}</option>
                                <option value="korean">🇰🇷 {t.website.korean}</option>
                                <option value="chinese">🇨🇳 {t.website.chinese}</option>
                            </select>
                        </div>
                        <Link
                            href="/website/cars/new"
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            {t.website.addCar}
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{cars.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.website.cars}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                            <p className="text-2xl font-bold text-emerald-600">{cars.filter(c => c.is_active).length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.website.active}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                            <p className="text-2xl font-bold text-blue-600">{cars.filter(c => c.origin === 'korean').length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">🇰🇷 {t.website.korean}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                            <p className="text-2xl font-bold text-red-600">{cars.filter(c => c.origin === 'chinese').length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">🇨🇳 {t.website.chinese}</p>
                        </div>
                    </div>

                    {/* Car List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" />
                        </div>
                    ) : filteredCars.length === 0 ? (
                        <div className="text-center py-20">
                            <Car className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">{t.website.noCars}</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-slate-700/50">
                                            <th className="text-start px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.website.brand}</th>
                                            <th className="text-start px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.website.model}</th>
                                            <th className="text-start px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.website.price}</th>
                                            <th className="text-start px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.website.origin}</th>
                                            <th className="text-start px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.website.category}</th>
                                            <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.website.popular}</th>
                                            <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t.common.status}</th>
                                            <th className="text-end px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/30">
                                        {filteredCars.map(car => (
                                            <tr key={car.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                                            {car.image && (
                                                                <img src={car.image} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{dir === 'rtl' ? car.brand_ar : car.brand}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {dir === 'rtl' ? car.model_ar : car.model}
                                                    <span className="text-gray-400 ms-1">({car.year}{car.end_year ? `-${car.end_year}` : ''})</span>
                                                </td>
                                                <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatPrice(car.price_min)}
                                                    {car.price_max > car.price_min && (
                                                        <span className="text-gray-400 text-xs block">→ {formatPrice(car.price_max)}</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        car.origin === 'korean'
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {car.origin === 'korean' ? '🇰🇷' : '🇨🇳'}
                                                        {car.origin === 'korean' ? t.website.korean : t.website.chinese}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                    {(t.website as Record<string, string>)[car.category] || car.category}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => togglePopular(car.id, car.is_popular)}
                                                        className={`p-1.5 rounded-lg transition-all ${
                                                            car.is_popular
                                                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                                : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'
                                                        }`}
                                                    >
                                                        <Star className="w-4 h-4" fill={car.is_popular ? 'currentColor' : 'none'} />
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleActive(car.id, car.is_active)}
                                                        className={`p-1.5 rounded-lg transition-all ${
                                                            car.is_active
                                                                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                                : 'text-gray-300 dark:text-gray-600 hover:text-emerald-500'
                                                        }`}
                                                        title={car.is_active ? t.website.active : t.website.inactive}
                                                    >
                                                        {car.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/website/cars/${car.id}/edit`}
                                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => deleteCar(car.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Tab (Phase 2) */}
            {activeTab === 'content' && (
                <ContentEditor t={t} dir={dir} />
            )}

            {/* Media Tab (Phase 3) */}
            {activeTab === 'media' && (
                <MediaManager t={t} dir={dir} />
            )}
        </div>
    )
}
