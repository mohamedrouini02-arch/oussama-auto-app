'use client'

import MediaPicker from '@/components/MediaPicker'
import { useLanguage } from '@/context/LanguageContext'
import { generateShippingPDF } from '@/lib/pdfGenerator'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function ShippingEditContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const { t } = useLanguage()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        passport_number: '',
        id_card_number: '',
        code_postal: '',
        zip_number: '',
        vehicle_model: '',
        vin_number: '',
        notes: '',
        pdf_url: '',
        passport_photo_url: '',
        id_card_url: '',
        id_card_back_url: '',
        vehicle_photos_urls: '',
        status: 'pending',
        shipping_provider: '',
        shipment_month: ''
    })

    useEffect(() => {
        const fetchForm = async () => {
            if (!id) return

            try {
                const { data, error } = await supabase
                    .from('shipping_forms')
                    .select('*')
                    .eq('id', parseInt(id))
                    .single()

                if (error) throw error
                if (data) {
                    const shippingData = data as any

                    // Handle vehicle_photos_urls safely
                    let photos = ''
                    if (Array.isArray(shippingData.vehicle_photos_urls)) {
                        photos = shippingData.vehicle_photos_urls.join(',')
                    } else if (typeof shippingData.vehicle_photos_urls === 'string') {
                        // Remove potential Postgres array braces {} and quotes
                        photos = shippingData.vehicle_photos_urls.replace(/^\{|\}$/g, '').replace(/"/g, '')
                    }

                    setFormData({
                        name: shippingData.name,
                        phone: shippingData.phone,
                        email: shippingData.email,
                        address: shippingData.address,
                        passport_number: shippingData.passport_number,
                        id_card_number: shippingData.id_card_number || '',
                        code_postal: shippingData.code_postal,
                        zip_number: shippingData.zip_number,
                        vehicle_model: shippingData.vehicle_model,
                        vin_number: shippingData.vin_number || '',
                        notes: shippingData.notes || '',
                        pdf_url: shippingData.pdf_url || '',
                        passport_photo_url: shippingData.passport_photo_url || '',
                        id_card_url: shippingData.id_card_url || '',
                        id_card_back_url: shippingData.id_card_back_url || '',
                        vehicle_photos_urls: photos,
                        status: shippingData.status || 'pending',
                        shipping_provider: shippingData.shipping_provider || '',
                        shipment_month: shippingData.shipment_month || ''
                    })
                }
            } catch (error) {
                console.error('Error fetching shipping form:', error)
                alert('Failed to load shipping form')
            } finally {
                setLoading(false)
            }
        }

        fetchForm()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // 1. Generate PDF
            const pdfBlob = await generateShippingPDF({
                ...formData,
                created_at: new Date().toISOString()
            })

            // 2. Upload PDF
            // Use customer name in filename
            const safeName = formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const fileName = `shipping_form_${safeName}_${id}_${Date.now()}.pdf`

            const { error: uploadError } = await supabase.storage
                .from('shipping')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf'
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl: pdfUrl } } = supabase.storage
                .from('shipping')
                .getPublicUrl(fileName)

            // 3. Prepare photos URLs
            const photosUrls = formData.vehicle_photos_urls
                ? formData.vehicle_photos_urls.split(',').map(url => url.trim()).filter(url => url.length > 0)
                : []

            // 4. Update Database
            const { error } = await (supabase as any)
                .from('shipping_forms')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    passport_number: formData.passport_number,
                    id_card_number: formData.id_card_number || null,
                    code_postal: formData.code_postal,
                    zip_number: formData.zip_number,
                    vehicle_model: formData.vehicle_model,
                    vin_number: formData.vin_number,
                    notes: formData.notes,
                    pdf_url: pdfUrl,
                    passport_photo_url: formData.passport_photo_url || null,
                    id_card_url: formData.id_card_url || null,
                    id_card_back_url: formData.id_card_back_url || null,
                    vehicle_photos_urls: photosUrls,
                    status: formData.status,
                    shipping_provider: formData.shipping_provider || null,
                    shipment_month: formData.shipment_month || null
                })
                .eq('id', parseInt(id!))

            if (error) throw error
            router.push('/shipping')
        } catch (error) {
            console.error('Error updating shipping form:', error)
            alert('Failed to update shipping form: ' + (error as any).message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/shipping" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    {t.common.back}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.common.editShippingForm}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">Customer Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                            <input
                                required
                                type="tel"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passport Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.passport_number}
                                onChange={e => setFormData({ ...formData, passport_number: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Card Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.id_card_number}
                                onChange={e => setFormData({ ...formData, id_card_number: e.target.value })}
                                placeholder="If no passport"
                            />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passport Photo</label>
                                <MediaPicker
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, passport_photo_url: urls[0] || '' }))}
                                    existingFiles={formData.passport_photo_url ? [formData.passport_photo_url] : []}
                                    bucket="documents"
                                    folder="passport-photos"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                    maxFiles={1}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Card Front (if no passport)</label>
                                <MediaPicker
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, id_card_url: urls[0] || '' }))}
                                    existingFiles={formData.id_card_url ? [formData.id_card_url] : []}
                                    bucket="documents"
                                    folder="id-cards"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                    maxFiles={1}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Card Back (if no passport)</label>
                                <MediaPicker
                                    onFilesSelected={(urls) => setFormData(prev => ({ ...prev, id_card_back_url: urls[0] || '' }))}
                                    existingFiles={formData.id_card_back_url ? [formData.id_card_back_url] : []}
                                    bucket="documents"
                                    folder="id-cards"
                                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                    maxFiles={1}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                            <textarea
                                rows={2}
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.code_postal}
                                onChange={e => setFormData({ ...formData, code_postal: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.zip_number}
                                onChange={e => setFormData({ ...formData, zip_number: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">Vehicle Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Model *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.vehicle_model}
                                onChange={e => setFormData({ ...formData, vehicle_model: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipping Provider</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.shipping_provider}
                                onChange={e => setFormData({ ...formData, shipping_provider: e.target.value })}
                            >
                                <option value="">Select Provider</option>
                                <option value="dumsan">dumsan</option>
                                <option value="El rawassi">El rawassi</option>
                                <option value="Alko car">Alko car</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipment Month</label>
                            <input
                                type="month"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.shipment_month}
                                onChange={e => setFormData({ ...formData, shipment_month: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VIN Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.vin_number}
                                onChange={e => setFormData({ ...formData, vin_number: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Photos</label>
                            <MediaPicker
                                onFilesSelected={(urls) => setFormData(prev => ({ ...prev, vehicle_photos_urls: urls.join(',') }))}
                                existingFiles={formData.vehicle_photos_urls ? formData.vehicle_photos_urls.split(',').filter(Boolean) : []}
                                bucket="vehicle-photos"
                                folder="photos"
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/shipping"
                        className="px-6 py-2 bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
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

export default function ShippingEdit() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ShippingEditContent />
        </Suspense>
    )
}
