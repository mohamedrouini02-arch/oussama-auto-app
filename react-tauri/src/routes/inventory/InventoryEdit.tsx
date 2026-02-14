import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function InventoryEdit() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [images, setImages] = useState<string[]>([])

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: '',
        price: '',
        buying_price_krw: '',
        location: '',
        color: '',
        vin: '',
        currency: 'DZD'
    })

    const [video, setVideo] = useState<File | null>(null)
    const [videoUrl, setVideoUrl] = useState<string>('')
    const [uploadingVideo, setUploadingVideo] = useState(false)

    useEffect(() => {
        if (id) {
            fetchCar()
        }
    }, [id])

    async function fetchCar() {
        try {
            const { data: car, error } = await (supabase.from('car_inventory') as any)
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error

            setFormData({
                brand: car.brand,
                model: car.model,
                year: car.year,
                mileage: car.mileage.toString(),
                price: car.selling_price.toString(),
                buying_price_krw: car.buying_price_krw ? car.buying_price_krw.toString() : '',
                location: car.location || '',
                color: car.color || '',
                vin: car.vin || '',
                currency: car.currency || 'DZD'
            })
            setImages(car.photos_urls || [])
            setVideoUrl(car.video_url || '')
        } catch (error) {
            console.error('Error fetching car:', error)
            alert('Car not found')
            navigate('/inventory')
        } finally {
            setLoading(false)
        }
    }

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
        setSaving(true)

        const year = formData.year
        if (year < 1900 || year > new Date().getFullYear() + 1) {
            alert('Please enter a valid year')
            setSaving(false)
            return
        }

        const mileage = parseInt(formData.mileage)
        if (formData.mileage && (isNaN(mileage) || mileage < 0)) {
            alert('Please enter a valid mileage')
            setSaving(false)
            return
        }

        const price = parseFloat(formData.price)
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid selling price')
            setSaving(false)
            return
        }

        try {
            const { error } = await (supabase.from('car_inventory') as any)
                .update({
                    brand: formData.brand,
                    model: formData.model,
                    year: formData.year,
                    mileage: parseInt(formData.mileage) || 0,
                    selling_price: parseFloat(formData.price) || 0,
                    buying_price_krw: formData.buying_price_krw ? parseFloat(formData.buying_price_krw) : null,
                    location: formData.location,
                    color: formData.color,
                    vin: formData.vin,
                    currency: formData.currency,
                    photos_urls: images,
                    video_url: videoUrl || null
                })
                .eq('id', id)

            if (error) throw error
            navigate('/inventory')
        } catch (error) {
            console.error('Error updating car:', error)
            alert('Failed to update car: ' + (error as any).message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link to="/inventory" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Inventory
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Car</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.brand}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.mileage}
                                onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.vin}
                                onChange={e => setFormData({ ...formData, vin: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Location */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Pricing & Location</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price (KRW)</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.buying_price_krw}
                                onChange={e => setFormData({ ...formData, buying_price_krw: e.target.value })}
                                placeholder="e.g. 15000000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="DZD">DZD</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                placeholder="e.g. Showroom"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Photos & Video */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Media</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
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

                            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">Upload Photo</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">{video ? video.name : 'Upload Video'}</span>
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
                        to="/inventory"
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving || uploading || uploadingVideo}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
