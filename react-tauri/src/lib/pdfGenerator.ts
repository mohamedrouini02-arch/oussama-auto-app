import jsPDF from 'jspdf'

export interface ShippingFormData {
    vehicle_model: string
    vin_number: string
    name: string
    phone: string
    email: string
    address: string
    passport_number: string
    code_postal: string
    zip_number: string
    notes?: string | null
    created_at?: string | null
    reference_number?: string // If available
    passport_photo_url?: string | null
    id_card_url?: string | null
    id_card_back_url?: string | null
    id_card_number?: string | null
    vehicle_photos_urls?: string | null
}

export const generateShippingPDF = async (data: ShippingFormData): Promise<Blob> => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = 20

    // Helper to add text
    const addText = (text: string, x: number, y: number, size = 12, isBold = false) => {
        doc.setFontSize(size)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.text(text, x, y)
    }

    // Helper to add label and value
    const addField = (label: string, value: string, x: number, y: number) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(label, x, y)
        doc.setFont('helvetica', 'normal')
        doc.text(value || 'N/A', x + 40, y)
    }

    // Title
    doc.setTextColor(41, 128, 185) // Blue color
    addText('SHIPPING FORM', pageWidth / 2, yPos, 22, true)
    doc.setTextColor(0)
    yPos += 20

    // Date
    const dateStr = data.created_at
        ? new Date(data.created_at).toLocaleDateString()
        : new Date().toLocaleDateString()
    doc.setFontSize(10)
    doc.text(`Date: ${dateStr}`, pageWidth - margin, 30, { align: 'right' })

    // Customer Information
    addText('Customer Information', margin, yPos, 16, true)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
    yPos += 15

    addField('Full Name:', data.name, margin, yPos)
    yPos += 10
    addField('Phone:', data.phone, margin, yPos)
    yPos += 10
    addField('Email:', data.email, margin, yPos)
    yPos += 10
    addField('Address:', data.address, margin, yPos)
    yPos += 10

    if (data.passport_number) {
        addField('Passport No:', data.passport_number, margin, yPos)
        yPos += 10
    }

    if (data.id_card_number) {
        addField('ID Card No:', data.id_card_number, margin, yPos)
        yPos += 10
    }

    addField('Postal Code:', data.code_postal, margin, yPos)
    yPos += 10
    addField('City Name:', data.zip_number, margin, yPos)
    yPos += 20

    // Vehicle Information
    addText('Vehicle Information', margin, yPos, 16, true)
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
    yPos += 15

    addField('Model:', data.vehicle_model, margin, yPos)
    yPos += 10
    addField('VIN:', data.vin_number, margin, yPos)
    yPos += 20

    // Notes
    if (data.notes) {
        addText('Notes', margin, yPos, 16, true)
        doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
        yPos += 15
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const splitNotes = doc.splitTextToSize(data.notes, pageWidth - (margin * 2))
        doc.text(splitNotes, margin, yPos)
        yPos += (splitNotes.length * 5) + 10
    }

    // Documents & Media Links
    if (data.passport_photo_url || data.id_card_url || data.id_card_back_url || data.vehicle_photos_urls) {
        if (yPos > 200) {
            doc.addPage()
            yPos = 20
        }

        addText('Documents & Media Links', margin, yPos, 16, true)
        doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
        yPos += 15

        const addLink = (label: string, url: string) => {
            if (yPos > 270) {
                doc.addPage()
                yPos = 20
            }

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 255) // Blue for link

            // Add text with link
            doc.textWithLink(label, margin, yPos, { url: url })

            doc.setTextColor(0) // Reset color
            yPos += 10
        }

        if (data.passport_photo_url) {
            addLink('Passport Photo (Click to View)', data.passport_photo_url)
        }

        if (data.id_card_url) {
            addLink('ID Card Front (Click to View)', data.id_card_url)
        }

        if (data.id_card_back_url) {
            addLink('ID Card Back (Click to View)', data.id_card_back_url)
        }

        if (data.vehicle_photos_urls) {
            const photos = data.vehicle_photos_urls.split(',').filter(u => u.trim())
            photos.forEach((url, index) => {
                addLink(`Vehicle Photo ${index + 1} (Click to View)`, url.trim())
            })
        }
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text('Wahid Auto - Shipping Department | +82 10-8089-0802', pageWidth / 2, pageHeight - 10, { align: 'center' })

    return doc.output('blob')
}
