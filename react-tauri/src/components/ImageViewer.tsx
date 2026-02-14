import { X } from 'lucide-react'
import { useState } from 'react'

interface ImageViewerProps {
    url: string
    alt: string
    onClose?: () => void
}

export default function ImageViewer({ url, alt, onClose }: ImageViewerProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Close button - always visible */}
            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-50 p-3 bg-white text-gray-900 hover:bg-gray-200 rounded-full transition shadow-lg"
            >
                <X className="w-6 h-6" />
            </button>

            <div
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {loading && !error && (
                    <div className="text-white text-lg">Loading image...</div>
                )}

                {error ? (
                    <div className="text-white text-center bg-gray-800 p-8 rounded-lg">
                        <p className="text-xl mb-4">Failed to load image</p>
                        <p className="text-sm mb-4 text-gray-400">The image might be inaccessible or the URL is invalid</p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Open in Browser
                        </a>
                    </div>
                ) : (
                    <img
                        src={url}
                        alt={alt}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false)
                            setError(true)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
