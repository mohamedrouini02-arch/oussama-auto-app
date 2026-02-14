'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'


export default function InventoryNew() {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [images, setImages] = useState<string[]>([])
    // Removed auto-fetching of user profile/email as per user request for manual input
    const [addedByName, setAddedByName] = useState('')

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: '',
        price: '',
        buying_price_krw: '',
        location: 'Korea',
        color: '',
        vin: '',
        currency: 'DZD',
        notes: ''
    })

    const [video, setVideo] = useState<File | null>(null)
    const [videoUrl, setVideoUrl] = useState<string>('')
    const [uploadingVideo, setUploadingVideo] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        try {
            const newImages = [...images]

            for (const file of Array.from(e.target.files)) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('car-media')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('car-media')
                    .getPublicUrl(filePath)

                newImages.push(publicUrl)
            }
            setImages(newImages)
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error uploading image')
        } finally {
            setUploading(false)
        }
    }

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploadingVideo(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('car-media')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('car-media')
                .getPublicUrl(filePath)

            setVideoUrl(publicUrl)
            setVideo(file)
        } catch (error) {
            console.error('Error uploading video:', error)
            alert('Error uploading video')
        } finally {
            setUploadingVideo(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert('You must be logged in to add a car')
            setLoading(false)
            return
        }

        const mileage = parseInt(formData.mileage)
        if (formData.mileage && (isNaN(mileage) || mileage < 0)) {
            alert('Please enter a valid mileage')
            setLoading(false)
            return
        }

        const price = parseFloat(formData.price)
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid selling price')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.from('car_inventory').insert({
                brand: formData.brand,
                model: formData.model,
                year: formData.year,
                mileage: parseInt(formData.mileage) || 0,
                buying_price_krw: formData.buying_price_krw ? parseFloat(formData.buying_price_krw) : null,
                selling_price: parseFloat(formData.price) || 0,
                location: formData.location,
                color: formData.color,
                vin: formData.vin,
                currency: formData.currency,
                status: 'available',
                photos_urls: images,
                video_url: videoUrl || null,
                notes: formData.notes,
                added_by: (await supabase.auth.getUser()).data.user?.id,
                added_by_name: addedByName // Save the manual input
            } as any)

            if (error) throw error
            router.push('/inventory')
        } catch (error) {
            console.error('Error adding car:', error)
            alert('Failed to add car: ' + (error as any).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/inventory" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    {t.common.back}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.inventory.addCar}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">{t.forms.basicInfo}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Added By *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={addedByName}
                                onChange={(e) => setAddedByName(e.target.value)}
                                placeholder="Enter name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.forms.carBrand} *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.brand}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.forms.carModel} *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.inventory.year} *</label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.finance.mileage} (km)</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.mileage}
                                onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.forms.color}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.shipping.vin}</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.vin}
                                onChange={e => setFormData({ ...formData, vin: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.forms.notes}</label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={t.forms.notes}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Location */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">{t.forms.pricingLocation}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.forms.buyingPrice} (KRW)</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.buying_price_krw}
                                onChange={e => setFormData({ ...formData, buying_price_krw: e.target.value })}
                                placeholder="e.g. 15000000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.forms.sellingPrice} *</label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.finance.currency}</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="DZD">DZD</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.forms.location}</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            >
                                <option value="Korea">Korea</option>
                                <option value="China">China</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Photos & Video */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4">{t.forms.media}</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.forms.photos}</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <img src={url} alt="Car" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">{t.forms.uploadPhoto}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        {uploading && <p className="text-sm text-blue-600 mt-2">Uploading images...</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.forms.video}</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">{video ? video.name : t.forms.uploadVideo}</span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleVideoUpload}
                                    disabled={uploadingVideo}
                                />
                            </label>
                            {videoUrl && (
                                <video src={videoUrl} controls className="h-32 rounded-lg bg-black" />
                            )}
                        </div>
                        {uploadingVideo && <p className="text-sm text-blue-600 mt-2">Uploading video...</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/inventory"
                        className="px-6 py-2 bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        {t.forms.cancel}
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || uploading || uploadingVideo}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? t.forms.saving : t.forms.save}
                    </button>
                </div>
            </form>
        </div>
    )
}
