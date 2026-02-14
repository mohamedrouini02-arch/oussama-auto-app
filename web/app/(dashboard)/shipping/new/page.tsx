'use client'

import MediaPicker from '@/components/MediaPicker'
import { useLanguage } from '@/context/LanguageContext'
import { generateShippingPDF } from '@/lib/pdfGenerator'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ShippingNew() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useLanguage()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
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
        status: 'completed',
        shipping_provider: '',
        shipment_month: new Date().toISOString().slice(0, 7) // Default to current month YYYY-MM
    })

    useEffect(() => {
        const fetchTransactionAndPopulate = async () => {
            const transactionId = searchParams.get('transaction_id')
            if (transactionId) {
                setFetching(true)
                try {
                    const { data: rawData, error } = await supabase
                        .from('financial_transactions')
                        .select('*')
                        .eq('id', transactionId)
                        .single()

                    if (error) throw error

                    const data = rawData as any

                    if (data) {
                        const vehiclePhotos = data.vehicle_photos_urls
                            ? (Array.isArray(data.vehicle_photos_urls) ? data.vehicle_photos_urls.join(',') : data.vehicle_photos_urls)
                            : ''

                        let idCardNumber = ''
                        if (data.description) {
                            const idCardMatch = data.description.match(/\nID Card: (.*)/)
                            if (idCardMatch) {
                                idCardNumber = idCardMatch[1]
                            }
                        }

                        setFormData(prev => ({
                            ...prev,
                            name: data.customer_name || '',
                            phone: data.customer_phone || '',
                            email: data.customer_email || '',
                            address: data.customer_address || '',
                            passport_number: data.passport_number || '',
                            id_card_number: idCardNumber,
                            code_postal: data.customer_postal_code || '',
                            vehicle_model: `${data.car_brand || ''} ${data.car_model || ''}`.trim(),
                            vin_number: data.car_vin || '',
                            notes: data.notes || '',
                            passport_photo_url: data.passport_photo_url || '',
                            id_card_url: data.id_card_url || '',
                            id_card_back_url: data.id_card_back_url || '',
                            vehicle_photos_urls: vehiclePhotos
                        }))
                    }
                } catch (error) {
                    console.error('Error fetching transaction:', error)
                } finally {
                    setFetching(false)
                }
            } else {
                // Fallback to URL params for legacy or manual calls
                const name = searchParams.get('name')
                if (name) {
                    setFormData(prev => ({
                        ...prev,
                        name: name || '',
                        phone: searchParams.get('phone') || '',
                        email: searchParams.get('email') || '',
                        address: searchParams.get('address') || '',
                        passport_number: searchParams.get('passport_number') || '',
                        passport_photo_url: searchParams.get('passport_photo_url') || '',
                        id_card_url: searchParams.get('id_card_url') || '',
                        id_card_back_url: searchParams.get('id_card_back_url') || '',
                        code_postal: searchParams.get('code_postal') || '',
                        vehicle_model: searchParams.get('vehicle_model') || '',
                        vin_number: searchParams.get('vin_number') || '',
                        vehicle_photos_urls: searchParams.get('vehicle_photos_urls') || '',
                        status: 'completed'
                    }))
                }
            }
        }

        fetchTransactionAndPopulate()
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Check for existing forms with the same name or VIN
            let existingForm: any = null
            let matchField = ''

            if (formData.name) {
                const { data: existingByName } = await supabase
                    .from('shipping_forms')
                    .select('id, name, vin_number')
                    .ilike('name', formData.name)
                    .limit(1)
                if (existingByName && existingByName.length > 0) {
                    existingForm = existingByName[0]
                    matchField = `name "${(existingForm as any).name}"`
                }
            }

            if (!existingForm && formData.vin_number) {
                const { data: existingByVin } = await supabase
                    .from('shipping_forms')
                    .select('id, name, vin_number')
                    .eq('vin_number', formData.vin_number)
                    .limit(1)
                if (existingByVin && existingByVin.length > 0) {
                    existingForm = existingByVin[0]
                    matchField = `VIN "${(existingForm as any).vin_number}"`
                }
            }

            if (existingForm) {
                const userChoice = window.confirm(
                    `A shipping form already exists with the same ${matchField}. Click OK to update the existing form, or Cancel to abort.`
                )
                if (!userChoice) {
                    setLoading(false)
                    return
                }
            }

            // 1. Generate PDF
            const pdfBlob = await generateShippingPDF({
                ...formData,
                created_at: new Date().toISOString()
            })

            // 2. Upload PDF
            const safeName = formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const fileName = `shipping_form_${safeName}_${Date.now()}.pdf`

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

            const formPayload = {
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
            } as any

            // 4. Save or Update in Database
            if (existingForm) {
                const { error } = await (supabase
                    .from('shipping_forms') as any)
                    .update(formPayload)
                    .eq('id', existingForm.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('shipping_forms').insert(formPayload)
                if (error) throw error
            }

            router.push('/shipping')
        } catch (error) {
            console.error('Error creating shipping form:', error)
            alert('Failed to create shipping form: ' + (error as any).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/shipping" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shipping
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Shipping Form</h1>
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
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.shipping.shippingProvider}</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                                value={formData.shipping_provider}
                                onChange={e => setFormData({ ...formData, shipping_provider: e.target.value })}
                            >
                                <option value="">{t.common.selectProvider}</option>
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
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Create Form'}
                    </button>
                </div>
            </form>
        </div>
    )
}
