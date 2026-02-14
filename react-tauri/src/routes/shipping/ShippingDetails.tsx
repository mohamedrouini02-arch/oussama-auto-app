import { downloadDir, join } from '@tauri-apps/api/path'
import { BaseDirectory, writeFile } from '@tauri-apps/plugin-fs'
import { open } from '@tauri-apps/plugin-shell'
import { ArrowLeft, CheckCircle, Copy, Download, Edit, MessageCircle, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadAndCacheFile } from '../../lib/fileCache'
import { supabase } from '../../lib/supabase'

interface ShippingForm {
    id: number
    name: string
    phone: string
    email?: string
    address?: string
    passport_number?: string
    id_card_number?: string
    code_postal?: string
    zip_number?: string
    vehicle_model: string
    vin_number?: string
    status: string
    notes?: string
    pdf_url?: string
    passport_photo_url?: string
    id_card_url?: string
    id_card_back_url?: string
    vehicle_photos_urls?: string[] | string
    created_at: string
}

export default function ShippingDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState<ShippingForm | null>(null)
    const [loading, setLoading] = useState(true)
    const [cachedFiles, setCachedFiles] = useState<{ [key: string]: string }>({})

    // Image Viewer State
    const [viewingImage, setViewingImage] = useState<string | null>(null)

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
                const formData = data as ShippingForm
                setForm(formData)

                // Cache all files
                if (formData) {
                    const filesToCache: { [key: string]: string } = {}

                    if (formData.pdf_url) {
                        const cached = await downloadAndCacheFile(formData.pdf_url, `pdf_${id}.pdf`)
                        if (cached) filesToCache.pdf = cached
                    }
                    if (formData.passport_photo_url) {
                        const cached = await downloadAndCacheFile(formData.passport_photo_url, `passport_${id}.jpg`)
                        if (cached) filesToCache.passport = cached
                    }
                    if (formData.id_card_url) {
                        const cached = await downloadAndCacheFile(formData.id_card_url, `id_front_${id}.jpg`)
                        if (cached) filesToCache.idFront = cached
                    }
                    if (formData.id_card_back_url) {
                        const cached = await downloadAndCacheFile(formData.id_card_back_url, `id_back_${id}.jpg`)
                        if (cached) filesToCache.idBack = cached
                    }

                    // Cache vehicle photos
                    const vehiclePhotos = Array.isArray(formData.vehicle_photos_urls) ? formData.vehicle_photos_urls : []
                    for (let i = 0; i < vehiclePhotos.length; i++) {
                        const cached = await downloadAndCacheFile(vehiclePhotos[i], `vehicle_${id}_${i}.jpg`)
                        if (cached) filesToCache[`vehicle_${i}`] = cached
                    }

                    console.log('Files to cache:', filesToCache)
                    setCachedFiles(filesToCache)
                }
            } catch (error) {
                console.error('Error fetching shipping form:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchForm()
    }, [id])

    const handleWhatsApp = () => {
        if (!form || !form.phone) return
        let cleanPhone = form.phone.replace(/\D/g, '')
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1)
        if (!cleanPhone.startsWith('213')) cleanPhone = '213' + cleanPhone

        let vehiclePhotos: string[] = []
        try {
            const rawPhotos = form.vehicle_photos_urls
            console.log('Raw vehicle photos:', rawPhotos)
            if (Array.isArray(rawPhotos)) {
                vehiclePhotos = rawPhotos
            } else if (typeof rawPhotos === 'string') {
                if (rawPhotos.trim().startsWith('[')) {
                    try {
                        const parsed = JSON.parse(rawPhotos)
                        if (Array.isArray(parsed)) vehiclePhotos = parsed
                    } catch (e) { console.error('JSON parse error:', e) }
                }

            }
            console.log('Parsed vehicle photos:', vehiclePhotos)
        } catch (e) {
            console.error('Vehicle photos processing error:', e)
            vehiclePhotos = []
        }

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
            vehiclePhotos.forEach((url: string, index: number) => {
                message += `\n${index + 1}. ${url}`
            })
        }

        message += `\n\n------------------\n*Wahid Auto*`

        open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`)
    }

    const handleCopyInfo = () => {
        if (!form) return

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

    const handleStatusToggle = async () => {
        if (!form) return
        const newStatus = form.status === 'completed' ? 'pending' : 'completed'

        try {
            const { error } = await (supabase
                .from('shipping_forms') as any)
                .update({ status: newStatus })
                .eq('id', parseInt(id!))

            if (error) throw error
            // Refetch to ensure UI is in sync
            const { data: updatedForm } = await supabase
                .from('shipping_forms')
                .select('*')
                .eq('id', parseInt(id!))
                .single()

            if (updatedForm) setForm(updatedForm)
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this shipping form? This action cannot be undone.')) return

        try {
            const { error } = await supabase
                .from('shipping_forms')
                .delete()
                .eq('id', parseInt(id!))

            if (error) throw error
            navigate('/shipping')
        } catch (error) {
            console.error('Error deleting shipping form:', error)
            alert('Failed to delete shipping form')
        }
    }

    const savePdfToDownloads = async () => {
        if (!cachedFiles.pdf && !form?.pdf_url) return null

        try {
            const filename = `shipping_${form?.name.replace(/\s+/g, '_') || 'customer'}.pdf`
            let pdfData: Uint8Array

            if (cachedFiles.pdf) {
                const base64 = cachedFiles.pdf.split(',')[1]
                const binaryString = atob(base64)
                const len = binaryString.length
                const bytes = new Uint8Array(len)
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                pdfData = bytes
            } else {
                const response = await fetch(form!.pdf_url!)
                const blob = await response.blob()
                pdfData = new Uint8Array(await blob.arrayBuffer())
            }

            await writeFile(filename, pdfData, { baseDir: BaseDirectory.Download })
            const downloadDirPath = await downloadDir()
            const filePath = await join(downloadDirPath, filename)

            return { filename, filePath }
        } catch (error) {
            console.error('Error saving PDF:', error)
            alert('Failed to save PDF')
            return null
        }
    }

    const handleDownloadPdf = async () => {
        const result = await savePdfToDownloads()
        if (result) {
            alert(`PDF saved to your Downloads folder as "${result.filename}"`)
        }
    }

    const handleWhatsAppPdf = async () => {
        const result = await savePdfToDownloads()
        if (!result) return

        // Open Downloads folder
        // We use a slight delay to ensure the file is written and system is ready
        setTimeout(async () => {
            try {
                const downloadDirPath = await downloadDir()
                await open(downloadDirPath)
            } catch (e) {
                console.error('Failed to open folder:', e)
            }
        }, 500)

        const message = `Here is the shipping document for ${form?.name}.`
        await open(`https://wa.me/?text=${encodeURIComponent(message)}`)

        alert(`PDF saved as "${result.filename}".\n\nI've opened your Downloads folder.\n\nSimply drag and drop the file into WhatsApp!`)
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!form) return <div className="p-8 text-center">Form not found</div>

    // Robust parsing for vehicle photos
    let vehiclePhotos: string[] = []
    try {
        const rawPhotos = form.vehicle_photos_urls
        console.log('Rendering - Raw vehicle photos:', rawPhotos)
        if (Array.isArray(rawPhotos)) {
            vehiclePhotos = rawPhotos
        } else if (typeof rawPhotos === 'string') {
            // Try parsing as JSON first (e.g. "[\"url1\", \"url2\"]")
            if (rawPhotos.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(rawPhotos)
                    if (Array.isArray(parsed)) vehiclePhotos = parsed
                } catch (e) {
                    console.error('Rendering - JSON parse error:', e)
                }
            }
        }
        console.log('Rendering - Parsed vehicle photos:', vehiclePhotos)
    } catch (e) {
        console.error('Rendering - Error parsing vehicle photos:', e)
        vehiclePhotos = []
    }

    return (
        <div className="p-8 max-w-4xl mx-auto relative">
            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setViewingImage(null)}
                    >
                        <XCircle className="w-8 h-8" />
                    </button>
                    <img
                        src={viewingImage}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="mb-8">
                <Link to="/shipping" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shipping
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Details</h1>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${form.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {form.status || 'Pending'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                            onClick={handleCopyInfo}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                        >
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Copy</span>
                        </button>
                        <button
                            onClick={handleStatusToggle}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${form.status === 'completed'
                                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                        >
                            {form.status === 'completed' ? (
                                <><XCircle className="w-4 h-4" /><span className="hidden sm:inline">Mark Pending</span></>
                            ) : (
                                <><CheckCircle className="w-4 h-4" /><span className="hidden sm:inline">Mark Complete</span></>
                            )}
                        </button>
                        <Link
                            to={`/shipping/${id}/edit`}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2">Customer Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Full Name</label>
                            <p className="font-medium">{form.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Phone</label>
                            <p className="font-medium">{form.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium">{form.email || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Address</label>
                            <p className="font-medium">{form.address || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Passport Number</label>
                            <p className="font-medium">{form.passport_number || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">ID Card Number</label>
                            <p className="font-medium">{form.id_card_number || '-'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Postal Code</label>
                                <p className="font-medium">{form.code_postal || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">City Name</label>
                                <p className="font-medium">{form.zip_number || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2">Vehicle Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-500">Vehicle Model</label>
                            <p className="font-medium">{form.vehicle_model}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">VIN Number</label>
                            <p className="font-mono bg-gray-50 px-2 py-1 rounded inline-block">{form.vin_number || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Notes</label>
                            <p className="font-medium whitespace-pre-wrap">{form.notes || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Documents */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2">Documents & Media</h2>
                    {/* PDF Viewer */}
                    <div className="md:col-span-3">
                        <label className="text-sm text-gray-500 block mb-2">Shipping Form PDF</label>
                        {cachedFiles.pdf || form.pdf_url ? (
                            <div className="space-y-2">
                                <iframe
                                    src={cachedFiles.pdf || form.pdf_url}
                                    className="w-full h-[600px] rounded-lg border border-gray-200"
                                    title="Shipping Form PDF"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={handleWhatsAppPdf}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Share PDF via WhatsApp
                                    </button>
                                    <button
                                        onClick={handleDownloadPdf}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <Download className="w-4 h-4" />
                                        Save PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">No PDF generated</p>
                        )}
                    </div>

                    {/* Passport Photo */}
                    <div>
                        <label className="text-sm text-gray-500 block mb-2">Passport Photo</label>
                        {cachedFiles.passport || form.passport_photo_url ? (
                            <img
                                src={cachedFiles.passport || form.passport_photo_url}
                                alt="Passport"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                onClick={() => setViewingImage(cachedFiles.passport || form.passport_photo_url || '')}
                            />
                        ) : (
                            <p className="text-gray-400 italic">No passport photo</p>
                        )}
                    </div>

                    {/* ID Card Front */}
                    <div>
                        <label className="text-sm text-gray-500 block mb-2">ID Card (Front)</label>
                        {cachedFiles.idFront || form.id_card_url ? (
                            <img
                                src={cachedFiles.idFront || form.id_card_url}
                                alt="ID Card Front"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                onClick={() => setViewingImage(cachedFiles.idFront || form.id_card_url || '')}
                            />
                        ) : (
                            <p className="text-gray-400 italic">No ID card front</p>
                        )}
                    </div>

                    {/* ID Card Back */}
                    <div>
                        <label className="text-sm text-gray-500 block mb-2">ID Card (Back)</label>
                        {cachedFiles.idBack || form.id_card_back_url ? (
                            <img
                                src={cachedFiles.idBack || form.id_card_back_url}
                                alt="ID Card Back"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                onClick={() => setViewingImage(cachedFiles.idBack || form.id_card_back_url || '')}
                            />
                        ) : (
                            <p className="text-gray-400 italic">No ID card back</p>
                        )}
                    </div>
                </div>

                {/* Vehicle Photos */}
                {vehiclePhotos.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <label className="text-sm text-gray-500 block mb-2">Vehicle Photos</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {vehiclePhotos.map((url: string, index: number) => {
                                const displayUrl = cachedFiles[`vehicle_${index}`] || url
                                return (
                                    <img
                                        key={index}
                                        src={displayUrl}
                                        alt={`Vehicle ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                        onClick={() => setViewingImage(displayUrl)}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
