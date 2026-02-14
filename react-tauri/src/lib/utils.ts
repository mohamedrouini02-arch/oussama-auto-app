import { clsx, type ClassValue } from 'clsx'
import { format } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, formatStr)
}

export function formatCurrency(amount: number, currency: string = 'DZD'): string {
    return new Intl.NumberFormat('ar-DZ', {
        style: 'currency',
        currency: currency,
    }).format(amount)
}

export function generateReferenceNumber(prefix: string = 'REF'): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `${prefix}-${timestamp}-${random}`
}

export function formatPhoneNumber(phone: string): string {
    // Format for WhatsApp (remove spaces, add country code if needed)
    let cleaned = phone.replace(/\s+/g, '')
    if (!cleaned.startsWith('+')) {
        cleaned = '+213' + cleaned // Default to Algeria
    }
    return cleaned
}

export function generateWhatsAppLink(phone: string, message: string): string {
    const formattedPhone = formatPhoneNumber(phone)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}
