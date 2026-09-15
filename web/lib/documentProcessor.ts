import { createWorker } from 'tesseract.js'

export interface ExtractedDocumentData {
    fullName?: string
    nin?: string
    passportNumber?: string
    address?: string
    rawText: string
}

/**
 * Parses MRZ (Machine Readable Zone) lines found on Passports and ID cards
 */
function parseMRZ(text: string): Partial<ExtractedDocumentData> {
    const result: Partial<ExtractedDocumentData> = {}
    
    // Clean lines: keep only A-Z, 0-9, and '<'
    const lines = text
        .split('\n')
        .map(l => l.trim().toUpperCase().replace(/[^A-Z0-9<]/g, ''))
        .filter(l => l.length >= 30)

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Passport MRZ Line 1: P<DZA... or P<...
        if (line.startsWith('P<') || line.startsWith('P<DZA') || line.startsWith('PDZA')) {
            const namePart = line.replace(/^P<[A-Z]{3}/, '').replace(/^P</, '')
            const [surname, givenNames] = namePart.split('<<')
            if (surname) {
                const cleanSurname = surname.replace(/</g, ' ').trim()
                const cleanGiven = givenNames ? givenNames.replace(/</g, ' ').trim() : ''
                result.fullName = `${cleanGiven} ${cleanSurname}`.trim()
            }

            // Check next line for passport number and NIN
            if (i + 1 < lines.length) {
                const line2 = lines[i + 1]
                // First 9 chars often passport number
                const passportCandidate = line2.substring(0, 9).replace(/</g, '')
                if (/^[0-9A-Z]{8,9}$/.test(passportCandidate)) {
                    result.passportNumber = passportCandidate
                }

                // Look for 18 digit NIN in line 2
                const digitsOnly = line2.replace(/[^0-9]/g, '')
                const ninMatch = digitsOnly.match(/\d{18}/)
                if (ninMatch) {
                    result.nin = ninMatch[0]
                }
            }
        }

        // ID Card MRZ: IDDZA or I<DZA
        if (line.startsWith('IDDZA') || line.startsWith('I<DZA') || line.startsWith('I<')) {
            const digitsOnly = line.replace(/[^0-9]/g, '')
            const ninMatch = digitsOnly.match(/\d{18}/)
            if (ninMatch) {
                result.nin = ninMatch[0]
            }
        }
    }

    return result
}

/**
 * Parses text labels in French / Arabic commonly found on Algerian National ID Cards and Passports
 */
function parseLabels(text: string): Partial<ExtractedDocumentData> {
    const result: Partial<ExtractedDocumentData> = {}
    const normalized = text.replace(/\r/g, '')

    // 1. Extract 18-digit NIN (رقم التعريف الوطني)
    // Format: 18 consecutive digits, or separated by spaces
    const ninPattern = /(?:رقم التعريف الوطني|NIN|N° personnel|Personal No\.?|Identité nationale)[^\d]*(\d[\s\d]{16,22}\d)/i
    const ninMatch = normalized.match(ninPattern)
    if (ninMatch) {
        const cleanNin = ninMatch[1].replace(/\s+/g, '')
        if (cleanNin.length === 18) {
            result.nin = cleanNin
        }
    }

    // Fallback search for any isolated 18-digit number
    if (!result.nin) {
        const any18 = normalized.match(/\b\d{18}\b/)
        if (any18) {
            result.nin = any18[0]
        }
    }

    // 2. Extract Passport Number (9 digits)
    const passportPattern = /(?:N° passeport|Passport No\.?|رقم جواز السفر)[^\d]*([0-9]{9})/i
    const passportMatch = normalized.match(passportPattern)
    if (passportMatch) {
        result.passportNumber = passportMatch[1]
    } else if (!result.passportNumber) {
        // Look for 9 digit pattern that is NOT part of an 18 digit number
        const matches = normalized.match(/\b\d{9}\b/g)
        if (matches && matches.length > 0) {
            // Pick first 9-digit number that isn't phone (Algerian phones usually start with 05, 06, 07)
            const candidate = matches.find(m => !m.startsWith('05') && !m.startsWith('06') && !m.startsWith('07'))
            if (candidate) {
                result.passportNumber = candidate
            }
        }
    }

    // 3. Extract Name (Surname & Given Name)
    let surname = ''
    let firstname = ''

    // Match "Nom: X" or "Nom / اللقب: X"
    const surnameMatch = normalized.match(/(?:Nom|اللقب)[\s/:]+([A-ZÀ-Ÿ\s'-]{2,30})/i)
    if (surnameMatch) {
        surname = surnameMatch[1].trim().split('\n')[0].trim()
    }

    // Match "Prénom: Y" or "Prénom / الإسم: Y"
    const firstnameMatch = normalized.match(/(?:Pr[ée]nom|الإسم|الاسم)[\s/:]+([A-ZÀ-Ÿ\s'-]{2,30})/i)
    if (firstnameMatch) {
        firstname = firstnameMatch[1].trim().split('\n')[0].trim()
    }

    if (surname || firstname) {
        result.fullName = `${firstname} ${surname}`.trim()
    }

    return result
}

/**
 * Intelligent OCR Scanner using Tesseract.js
 * Processes an in-memory image without altering or compressing the original file.
 */
export async function processDocumentImage(
    fileOrUrl: File | Blob | string,
    docType: 'passport' | 'id_front' | 'id_back' = 'passport',
    onProgress?: (progress: number) => void
): Promise<ExtractedDocumentData> {
    let worker: any = null

    try {
        worker = await createWorker('fra+ara', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(Math.round(m.progress * 100))
                }
            }
        })

        const ret = await worker.recognize(fileOrUrl)
        const rawText = ret.data.text || ''

        // Combine MRZ parsing + standard label extraction
        const mrzData = parseMRZ(rawText)
        const labelData = parseLabels(rawText)

        return {
            rawText,
            fullName: mrzData.fullName || labelData.fullName || undefined,
            nin: mrzData.nin || labelData.nin || undefined,
            passportNumber: mrzData.passportNumber || labelData.passportNumber || undefined,
            address: labelData.address || undefined
        }
    } catch (error) {
        console.error('OCR processing error:', error)
        return {
            rawText: '',
            fullName: undefined,
            nin: undefined,
            passportNumber: undefined
        }
    } finally {
        if (worker) {
            await worker.terminate()
        }
    }
}
