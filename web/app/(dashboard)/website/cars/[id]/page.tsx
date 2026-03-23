'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface CarForm {
    slug: string
    brand: string
    brand_ar: string
    brand_fr: string
    model: string
    model_ar: string
    model_fr: string
    year: number
    end_year: number | null
    description_ar: string
    description_fr: string
    price_min: number
    price_max: number
    image: string
    images: string[]
    engine: string
    engine_fr: string
    transmission: string
    transmission_fr: string
    fuel_type: string
    fuel_type_fr: string
    seats: number
    features: string[]
    features_fr: string[]
    colors: string[]
    colors_fr: string[]
    category: string
    is_popular: boolean
    origin: string
    is_active: boolean
}

const initialForm: CarForm = {
    slug: '',
    brand: '',
    brand_ar: '',
    brand_fr: '',
    model: '',
    model_ar: '',
    model_fr: '',
    year: new Date().getFullYear(),
    end_year: null,
    description_ar: '',
    description_fr: '',
    price_min: 0,
    price_max: 0,
    image: '',
    images: [],
    engine: '',
    engine_fr: '',
    transmission: 'أوتوماتيك',
    transmission_fr: 'Automatique',
    fuel_type: 'بنزين',
    fuel_type_fr: 'Essence',
    seats: 5,
    features: [],
    features_fr: [],
    colors: [],
    colors_fr: [],
    category: 'sedan',
    is_popular: false,
    origin: 'korean',
    is_active: true,
}

export default function CarFormPage() {
    const router = useRouter()
    const params = useParams()
    const { t, dir } = useLanguage()
    const isEdit = params?.id && params.id !== 'new'
    const [form, setForm] = useState<CarForm>(initialForm)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [newFeature, setNewFeature] = useState('')
    const [newFeatureFr, setNewFeatureFr] = useState('')
    const [newColor, setNewColor] = useState('')
    const [newColorFr, setNewColorFr] = useState('')

    useEffect(() => {
        if (isEdit) fetchCar()
    }, [isEdit])

    async function fetchCar() {
        const { data } = await supabase.from('website_cars').select('*').eq('id', params.id).single()
        if (data) {
            setForm({
                slug: data.slug || '',
                brand: data.brand || '',
                brand_ar: data.brand_ar || '',
                brand_fr: data.brand_fr || '',
                model: data.model || '',
                model_ar: data.model_ar || '',
                model_fr: data.model_fr || '',
                year: data.year || new Date().getFullYear(),
                end_year: data.end_year || null,
                description_ar: data.description_ar || '',
                description_fr: data.description_fr || '',
                price_min: data.price_min || 0,
                price_max: data.price_max || 0,
                image: data.image || '',
                images: data.images || [],
                engine: data.engine || '',
                engine_fr: data.engine_fr || '',
                transmission: data.transmission || '',
                transmission_fr: data.transmission_fr || '',
                fuel_type: data.fuel_type || '',
                fuel_type_fr: data.fuel_type_fr || '',
                seats: data.seats || 5,
                features: data.features || [],
                features_fr: data.features_fr || [],
                colors: data.colors || [],
                colors_fr: data.colors_fr || [],
                category: data.category || 'sedan',
                is_popular: data.is_popular || false,
                origin: data.origin || 'korean',
                is_active: data.is_active !== false,
            })
        }
    }

    function updateField(field: keyof CarForm, value: unknown) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    function autoSlug() {
        const slug = `${form.brand}-${form.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
        updateField('slug', slug)
    }

    async function uploadImage(file: File): Promise<string | null> {
        setUploading(true)
        try {
            const ext = file.name.split('.').pop()
            const fileName = `cars/${form.slug || 'temp'}/${Date.now()}.${ext}`
            const { error } = await supabase.storage.from('website-images').upload(fileName, file)
            if (error) throw error
            const { data } = supabase.storage.from('website-images').getPublicUrl(fileName)
            return data.publicUrl
        } catch (err) {
            console.error('Upload error:', err)
            return null
        } finally {
            setUploading(false)
        }
    }

    async function handleMainImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const url = await uploadImage(file)
        if (url) updateField('image', url)
    }

    async function handleGalleryImages(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files) return
        for (const file of Array.from(files)) {
            const url = await uploadImage(file)
            if (url) setForm(prev => ({ ...prev, images: [...prev.images, url] }))
        }
    }

    function removeGalleryImage(index: number) {
        setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    }

    function addFeature() {
        if (!newFeature.trim()) return
        setForm(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }))
        setNewFeature('')
    }

    function addFeatureFr() {
        if (!newFeatureFr.trim()) return
        setForm(prev => ({ ...prev, features_fr: [...prev.features_fr, newFeatureFr.trim()] }))
        setNewFeatureFr('')
    }

    function removeFeature(index: number) {
        setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }))
    }

    function removeFeatureFr(index: number) {
        setForm(prev => ({ ...prev, features_fr: prev.features_fr.filter((_, i) => i !== index) }))
    }

    function addColor() {
        if (!newColor.trim()) return
        setForm(prev => ({ ...prev, colors: [...prev.colors, newColor.trim()] }))
        setNewColor('')
    }

    function addColorFr() {
        if (!newColorFr.trim()) return
        setForm(prev => ({ ...prev, colors_fr: [...prev.colors_fr, newColorFr.trim()] }))
        setNewColorFr('')
    }

    function removeColor(index: number) {
        setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }))
    }

    function removeColorFr(index: number) {
        setForm(prev => ({ ...prev, colors_fr: prev.colors_fr.filter((_, i) => i !== index) }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                slug: form.slug,
                brand: form.brand,
                brand_ar: form.brand_ar,
                brand_fr: form.brand_fr,
                model: form.model,
                model_ar: form.model_ar,
                model_fr: form.model_fr,
                year: form.year,
                end_year: form.end_year,
                description_ar: form.description_ar,
                description_fr: form.description_fr,
                price_min: form.price_min,
                price_max: form.price_max,
                image: form.image,
                images: form.images,
                engine: form.engine,
                engine_fr: form.engine_fr,
                transmission: form.transmission,
                transmission_fr: form.transmission_fr,
                fuel_type: form.fuel_type,
                fuel_type_fr: form.fuel_type_fr,
                seats: form.seats,
                features: form.features,
                features_fr: form.features_fr,
                colors: form.colors,
                colors_fr: form.colors_fr,
                category: form.category,
                is_popular: form.is_popular,
                origin: form.origin,
                is_active: form.is_active,
            }

            if (isEdit) {
                await supabase.from('website_cars').update(payload).eq('id', params.id)
            } else {
                await supabase.from('website_cars').insert(payload)
            }
            router.push('/website')
        } catch (err) {
            console.error('Save error:', err)
        } finally {
            setSaving(false)
        }
    }

    const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto" dir={dir}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/website" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEdit ? t.website.editCar : t.website.addCar}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.forms.basicInfo}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>{t.website.brand} (EN)</label>
                            <input className={inputClass} value={form.brand} onChange={e => { updateField('brand', e.target.value); }} onBlur={autoSlug} required />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.brand} (AR)</label>
                            <input className={inputClass} value={form.brand_ar} onChange={e => updateField('brand_ar', e.target.value)} dir="rtl" required />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.brand} (FR)</label>
                            <input className={inputClass} value={form.brand_fr} onChange={e => updateField('brand_fr', e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>{t.website.model} (EN)</label>
                            <input className={inputClass} value={form.model} onChange={e => updateField('model', e.target.value)} onBlur={autoSlug} required />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.model} (AR)</label>
                            <input className={inputClass} value={form.model_ar} onChange={e => updateField('model_ar', e.target.value)} dir="rtl" required />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.model} (FR)</label>
                            <input className={inputClass} value={form.model_fr} onChange={e => updateField('model_fr', e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>{t.website.slug}</label>
                            <input className={inputClass} value={form.slug} onChange={e => updateField('slug', e.target.value)} required placeholder="chevrolet-spark" />
                        </div>
                        <div>
                            <label className={labelClass}>{t.common.year}</label>
                            <input type="number" className={inputClass} value={form.year} onChange={e => updateField('year', parseInt(e.target.value))} required />
                        </div>
                        <div>
                            <label className={labelClass}>{t.common.year} (End)</label>
                            <input type="number" className={inputClass} value={form.end_year || ''} onChange={e => updateField('end_year', e.target.value ? parseInt(e.target.value) : null)} placeholder="Optional" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>{t.website.origin}</label>
                            <select className={inputClass} value={form.origin} onChange={e => updateField('origin', e.target.value)}>
                                <option value="korean">🇰🇷 {t.website.korean}</option>
                                <option value="chinese">🇨🇳 {t.website.chinese}</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.category}</label>
                            <select className={inputClass} value={form.category} onChange={e => updateField('category', e.target.value)}>
                                <option value="city">{t.website.city}</option>
                                <option value="suv">{t.website.suv}</option>
                                <option value="sedan">{t.website.sedan}</option>
                                <option value="hatchback">{t.website.hatchback}</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_popular} onChange={e => updateField('is_popular', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t.website.popular}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => updateField('is_active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t.website.active}</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.website.descriptionAr} / {t.website.descriptionFr}</h2>
                    <div>
                        <label className={labelClass}>{t.website.descriptionAr}</label>
                        <textarea className={inputClass} rows={3} value={form.description_ar} onChange={e => updateField('description_ar', e.target.value)} dir="rtl" required />
                    </div>
                    <div>
                        <label className={labelClass}>{t.website.descriptionFr}</label>
                        <textarea className={inputClass} rows={3} value={form.description_fr} onChange={e => updateField('description_fr', e.target.value)} required />
                    </div>
                </section>

                {/* Pricing */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.forms.pricingLocation}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>{t.website.priceMin}</label>
                            <input type="number" className={inputClass} value={form.price_min || ''} onChange={e => updateField('price_min', parseInt(e.target.value) || 0)} required />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.priceMax}</label>
                            <input type="number" className={inputClass} value={form.price_max || ''} onChange={e => updateField('price_max', parseInt(e.target.value) || 0)} required />
                        </div>
                    </div>
                </section>

                {/* Specs */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.forms.vehicleDetails}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>{t.website.engine} (AR)</label>
                            <input className={inputClass} value={form.engine} onChange={e => updateField('engine', e.target.value)} dir="rtl" />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.engine} (FR)</label>
                            <input className={inputClass} value={form.engine_fr} onChange={e => updateField('engine_fr', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.transmission} (AR)</label>
                            <input className={inputClass} value={form.transmission} onChange={e => updateField('transmission', e.target.value)} dir="rtl" />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.transmission} (FR)</label>
                            <input className={inputClass} value={form.transmission_fr} onChange={e => updateField('transmission_fr', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.fuelType} (AR)</label>
                            <input className={inputClass} value={form.fuel_type} onChange={e => updateField('fuel_type', e.target.value)} dir="rtl" />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.fuelType} (FR)</label>
                            <input className={inputClass} value={form.fuel_type_fr} onChange={e => updateField('fuel_type_fr', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.seats}</label>
                            <input type="number" className={inputClass} value={form.seats} onChange={e => updateField('seats', parseInt(e.target.value) || 5)} min={2} max={9} />
                        </div>
                    </div>
                </section>

                {/* Images */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.forms.media}</h2>

                    {/* Main image */}
                    <div>
                        <label className={labelClass}>{t.website.mainImage}</label>
                        <div className="flex items-center gap-4">
                            {form.image && (
                                <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm text-gray-700 dark:text-gray-300">
                                <Upload className="w-4 h-4" />
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.website.uploadImage}
                                <input type="file" accept="image/*" onChange={handleMainImage} className="hidden" />
                            </label>
                            <span className="text-xs text-gray-400">or</span>
                            <input className={inputClass + ' flex-1'} placeholder="Image URL" value={form.image} onChange={e => updateField('image', e.target.value)} />
                        </div>
                    </div>

                    {/* Gallery images */}
                    <div>
                        <label className={labelClass}>Gallery Images</label>
                        <div className="flex flex-wrap gap-3 mb-3">
                            {form.images.map((img, i) => (
                                <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 group">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(i)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm text-gray-700 dark:text-gray-300">
                            <Plus className="w-4 h-4" />
                            Add Gallery Images
                            <input type="file" accept="image/*" multiple onChange={handleGalleryImages} className="hidden" />
                        </label>
                    </div>
                </section>

                {/* Features */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.website.features}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>{t.website.features} (AR)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.features.map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
                                        {f}
                                        <button type="button" onClick={() => removeFeature(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input className={inputClass} dir="rtl" value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} placeholder="Add feature..." />
                                <button type="button" onClick={addFeature} className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.features} (FR)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.features_fr.map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                        {f}
                                        <button type="button" onClick={() => removeFeatureFr(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input className={inputClass} value={newFeatureFr} onChange={e => setNewFeatureFr(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeatureFr())} placeholder="Add feature..." />
                                <button type="button" onClick={addFeatureFr} className="px-3 py-2 bg-blue-500 text-white rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Colors */}
                <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.website.colors}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>{t.website.colors} (AR)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.colors.map((c, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                                        {c}
                                        <button type="button" onClick={() => removeColor(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input className={inputClass} dir="rtl" value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())} placeholder="Add color..." />
                                <button type="button" onClick={addColor} className="px-3 py-2 bg-purple-500 text-white rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t.website.colors} (FR)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.colors_fr.map((c, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs">
                                        {c}
                                        <button type="button" onClick={() => removeColorFr(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input className={inputClass} value={newColorFr} onChange={e => setNewColorFr(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColorFr())} placeholder="Add color..." />
                                <button type="button" onClick={addColorFr} className="px-3 py-2 bg-orange-500 text-white rounded-xl text-sm"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pb-8">
                    <Link href="/website" className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">
                        {t.common.cancel}
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? t.forms.saving : t.common.save}
                    </button>
                </div>
            </form>
        </div>
    )
}
