'use client'

import { cmsClient as supabase } from '@/lib/cms-client'
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MediaItem {
    id: string
    name: string
    file_path: string
    file_url: string
    file_type: string
    file_size: number
    alt_text: string
    category: string
    created_at: string
}

interface MediaManagerProps {
    t: Record<string, any>
    dir: string
}

export default function MediaManager({ t, dir }: MediaManagerProps) {
    const [media, setMedia] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [category, setCategory] = useState('')

    useEffect(() => {
        fetchMedia()
    }, [])

    async function fetchMedia() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('website_media')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMedia(data || [])
        } catch (err) {
            console.error('Error fetching media:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return
        setUploading(true)

        try {
            for (const file of Array.from(files)) {
                const ext = file.name.split('.').pop()
                const fileName = `media/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

                const { error: uploadError } = await supabase.storage
                    .from('website-images')
                    .upload(fileName, file)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    continue
                }

                const { data: urlData } = supabase.storage.from('website-images').getPublicUrl(fileName)

                const { error: insertError } = await supabase.from('website_media').insert({
                    name: file.name,
                    file_path: fileName,
                    file_url: urlData.publicUrl,
                    file_type: file.type,
                    file_size: file.size,
                    category: category || 'general',
                })

                if (insertError) {
                    console.error('Insert error:', insertError)
                }
            }
            fetchMedia()
        } catch (err) {
            console.error('Error uploading:', err)
        } finally {
            setUploading(false)
            // Reset file input
            e.target.value = ''
        }
    }

    async function deleteMedia(item: MediaItem) {
        if (!confirm(t.website.confirmDelete)) return
        try {
            // Delete from storage
            await supabase.storage.from('website-images').remove([item.file_path])
            // Delete from DB
            await supabase.from('website_media').delete().eq('id', item.id)
            setMedia(prev => prev.filter(m => m.id !== item.id))
        } catch (err) {
            console.error('Error deleting:', err)
        }
    }

    function copyUrl(url: string) {
        navigator.clipboard.writeText(url)
    }

    function formatSize(bytes: number): string {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const categories = ['general', 'car', 'hero', 'gallery', 'logo']
    const filteredMedia = category ? media.filter(m => m.category === category) : media

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-3">
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <label className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {t.website.uploadImage}
                    <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                </label>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{media.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Images</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-blue-600">{media.filter(m => m.category === 'car').length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Car Images</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-purple-600">{media.filter(m => m.category === 'hero').length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hero Images</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                    <p className="text-2xl font-bold text-emerald-600">
                        {formatSize(media.reduce((acc, m) => acc + (m.file_size || 0), 0))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Size</p>
                </div>
            </div>

            {/* Media Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" />
                </div>
            ) : filteredMedia.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No images uploaded yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredMedia.map(item => (
                        <div
                            key={item.id}
                            className="group bg-white dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700/50 overflow-hidden hover:shadow-lg transition-all"
                        >
                            <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                                <img
                                    src={item.file_url}
                                    alt={item.alt_text || item.name}
                                    className="w-full h-full object-cover"
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => copyUrl(item.file_url)}
                                        className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="Copy URL"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteMedia(item)}
                                        className="p-2 bg-red-500/80 backdrop-blur rounded-lg text-white hover:bg-red-600 transition-colors"
                                        title={t.website.deleteImage}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded">{item.category}</span>
                                    <span className="text-[10px] text-gray-400">{formatSize(item.file_size)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
