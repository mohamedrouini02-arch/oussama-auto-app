import { Download, X } from 'lucide-react'
import { useState } from 'react'

interface PDFViewerProps {
    url: string
    onClose?: () => void
}

export default function PDFViewer({ url, onClose }: PDFViewerProps) {
    const [error, setError] = useState(false)

    // Simple iframe-based PDF viewer for better Tauri compatibility
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">PDF Viewer</h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Close
                        </button>
                    </div>
                </div>

                {/* PDF Content */}
                <div className="flex-1 overflow-hidden bg-gray-100">
                    {error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center bg-white p-8 rounded-lg shadow">
                                <p className="text-xl mb-4 text-gray-900">Unable to display PDF</p>
                                <p className="text-sm mb-4 text-gray-600">
                                    Your browser may not support embedded PDFs.
                                </p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Open in Browser
                                </a>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title="PDF Viewer"
                            onError={() => setError(true)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
