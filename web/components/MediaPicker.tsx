'use client'

import { supabase } from '@/lib/supabase'
import { FileText, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface MediaPickerProps {
    onFilesSelected: (urls: string[]) => void
    existingFiles?: string[]
    bucket?: string
    folder?: string
    accept?: Record<string, string[]>
    maxFiles?: number
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
    maxFiles = 5
}: MediaPickerProps) {
    const [uploading, setUploading] = useState(false)
    const [files, setFiles] = useState<string[]>(existingFiles)

    // Sync with external changes (e.g. data fetching)
    useEffect(() => {
        setFiles(existingFiles)
    }, [existingFiles])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (files.length + acceptedFiles.length > maxFiles) {
            alert(`You can only upload up to ${maxFiles} files.`)
            return
        }

        setUploading(true)
        const newUrls: string[] = []

        try {
            for (const file of acceptedFiles) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
                const filePath = `${folder}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
                newUrls.push(data.publicUrl)
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
    }, [files, bucket, folder, maxFiles, onFilesSelected])

    const removeFile = (urlToRemove: string) => {
        const updatedFiles = files.filter(url => url !== urlToRemove)
        setFiles(updatedFiles)
        onFilesSelected(updatedFiles)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: maxFiles - files.length,
        disabled: uploading || files.length >= maxFiles
    })

    const isImage = (url: string) => {
        return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null
    }

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${(uploading || files.length >= maxFiles) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="w-8 h-8" />
                    {uploading ? (
                        <p>Uploading...</p>
                    ) : files.length >= maxFiles ? (
                        <p>Maximum files limit reached</p>
                    ) : isDragActive ? (
                        <p>Drop the files here...</p>
                    ) : (
                        <p>Drag & drop files here, or click to select</p>
                    )}
                    <p className="text-xs text-gray-400">
                        Supports Images and PDFs (Max {maxFiles} files)
                    </p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {files.map((url, index) => (
                        <div key={index} className="relative group bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <button
                                onClick={() => removeFile(url)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition z-10"
                                type="button"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md bg-white">
                                {isImage(url) ? (
                                    <img
                                        src={url}
                                        alt="Uploaded file"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                                        <FileText className="w-12 h-12 mb-2" />
                                        <span className="text-xs truncate max-w-full px-2">View PDF</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
