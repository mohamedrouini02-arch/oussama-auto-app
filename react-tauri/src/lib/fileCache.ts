import { BaseDirectory, exists, mkdir, readFile, writeFile } from '@tauri-apps/plugin-fs'

export async function downloadAndCacheFile(url: string, filename: string): Promise<string | null> {
    try {
        // Create cache directory if it doesn't exist
        const cacheDir = 'shipping_cache'
        const dirExists = await exists(cacheDir, { baseDir: BaseDirectory.AppLocalData })

        if (!dirExists) {
            await mkdir(cacheDir, { baseDir: BaseDirectory.AppLocalData, recursive: true })
        }

        // Check if file already exists in cache
        const filePath = `${cacheDir}/${filename}`
        const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppLocalData })

        if (fileExists) {
            // Read cached file and convert to base64 data URL
            const fileData = await readFile(filePath, { baseDir: BaseDirectory.AppLocalData })
            const base64 = btoa(String.fromCharCode(...fileData))
            const mimeType = getMimeType(filename)
            return `data:${mimeType};base64,${base64}`
        }

        // Download file
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to download file')

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Save to local storage
        await writeFile(filePath, uint8Array, { baseDir: BaseDirectory.AppLocalData })

        // Convert to base64 data URL
        const base64 = btoa(String.fromCharCode(...uint8Array))
        const mimeType = getMimeType(filename)
        return `data:${mimeType};base64,${base64}`
    } catch (error) {
        console.error('Error downloading file:', url, error)
        return null
    }
}

function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
        case 'pdf':
            return 'application/pdf'
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg'
        case 'png':
            return 'image/png'
        case 'gif':
            return 'image/gif'
        case 'webp':
            return 'image/webp'
        default:
            return 'application/octet-stream'
    }
}
