'use client'

import { processDocumentImage } from '@/lib/documentProcessor'
import { supabase } from '@/lib/supabase'
import { Eye, FileText, Loader2, Scan, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export interface ExtractedClientData {
    customerName?: string
    customerIdCard?: string
    passportNumber?: string
}

interface MediaPickerProps {
    onFilesSelected: (urls: string[]) => void
    existingFiles?: string[]
    bucket?: string
    folder?: string
    accept?: Record<string, string[]>
    maxFiles?: number
    documentType?: 'passport' | 'id_front' | 'id_back' | 'general'
    label?: string
    onDataExtracted?: (data: ExtractedClientData) => void
}

export default function MediaPicker({
    onFilesSelected,
    existingFiles = [],
    bucket = 'shipping',
    folder = 'documents',
    accept = {
        'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
        'application/pdf': ['.pdf']
    },
    maxFiles = 5,
    documentType = 'general',
    label,
    onDataExtracted
}: MediaPickerProps) {
    const [uploading, setUploading] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStatus, setScanStatus] = useState<string>('')
    const [files, setFiles] = useState<string[]>(existingFiles)

    // Sync with external changes (e.g. data fetching)
    useEffect(() => {
        setFiles(existingFiles)
    }, [existingFiles])

    const runOCR = async (file: File) => {
        if (!onDataExtracted) return
        if (documentType === 'general') return

        try {
            setScanning(true)
            setScanProgress(10)
            setScanStatus('Analyzing document with OCR...')

            const extracted = await processDocumentImage(
                file,
                documentType,
                (p) => setScanProgress(p)
            )

            const clientData: ExtractedClientData = {}
            if (extracted.fullName) clientData.customerName = extracted.fullName
            if (extracted.nin) clientData.customerIdCard = extracted.nin
            if (extracted.passportNumber) clientData.passportNumber = extracted.passportNumber

            const hasFoundData = Object.keys(clientData).length > 0
            if (hasFoundData) {
                setScanStatus('Auto-filled from document!')
                onDataExtracted(clientData)
            } else {
                setScanStatus('Scanned (no clear text found)')
            }
        } catch (err) {
            console.error('Failed OCR extraction:', err)
            setScanStatus('Scan completed')
        } finally {
            setScanning(false)
            setTimeout(() => setScanStatus(''), 4000)
        }
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (files.length + acceptedFiles.length > maxFiles) {
            alert(`You can only upload up to ${maxFiles} file(s).`)
            return
        }

        setUploading(true)
        const newUrls: string[] = []

        try {
            for (const file of acceptedFiles) {
                // Keep image 100% original and untouched (no canvas compression, stretching, or cropping)
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
                const filePath = `${folder}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
                newUrls.push(data.publicUrl)

                // Trigger OCR in background for documents if supported
                if (file.type.startsWith('image/') && onDataExtracted && documentType !== 'general') {
                    runOCR(file)
                }
            }

            const updatedFiles = [...files, ...newUrls]
            setFiles(updatedFiles)
            onFilesSelected(updatedFiles)
        } catch (error) {
            console.error('Error uploading files:', error)
            alert('Failed to upload files. Please try again.')
        } finally {
            setUploading(false)
        }
    }, [files, bucket, folder, maxFiles, onFilesSelected, documentType, onDataExtracted])

    const removeFile = (urlToRemove: string) => {
        const updatedFiles = files.filter(url => url !== urlToRemove)
        setFiles(updatedFiles)
        onFilesSelected(updatedFiles)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: maxFiles - files.length,
        disabled: uploading || scanning || files.length >= maxFiles
    })

    const isImage = (url: string) => {
        return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null
    }

    return (
        <div className="space-y-3">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {label}
                    </label>
                    {scanStatus && (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {scanStatus}
                        </span>
                    )}
                </div>
            )}

            {files.length < maxFiles && (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative
                        ${isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-900/50'}
                        ${(uploading || scanning || files.length >= maxFiles) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        {uploading || scanning ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                                <p className="text-xs font-medium">
                                    {uploading ? 'Uploading original document...' : `Scanning OCR (${scanProgress}%)...`}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                    {documentType !== 'general' ? <Scan className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                                </div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {isDragActive ? 'Drop file here...' : 'Click or drop document photo'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    Original untouched image (PNG, JPG, PDF) {documentType !== 'general' && '• Auto-scans details'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {files.length > 0 && (
                <div className={`grid gap-3 ${maxFiles === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                    {files.map((url, index) => (
                        <div key={index} className="relative group bg-gray-50 dark:bg-slate-850 rounded-lg p-2 border border-gray-200 dark:border-slate-700 shadow-sm">
                            <button
                                onClick={() => removeFile(url)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-90 group-hover:opacity-100 hover:bg-red-600 transition z-10"
                                type="button"
                                title="Remove file"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-36 flex items-center justify-center overflow-hidden rounded-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                                {isImage(url) ? (
                                    <img
                                        src={url}
                                        alt="Uploaded document"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-3 text-gray-500">
                                        <FileText className="w-10 h-10 mb-1 text-blue-500" />
                                        <span className="text-[11px] truncate max-w-full font-medium">PDF Document</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 flex items-center justify-between px-1">
                                <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                    {url.split('/').pop()?.split('_').pop() || 'document'}
                                </span>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <Eye className="w-3 h-3" /> View
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
