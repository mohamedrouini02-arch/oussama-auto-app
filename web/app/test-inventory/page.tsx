'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function TestInventoryPage() {
    const [logs, setLogs] = useState<string[]>([])

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const testStorage = async () => {
        log('Testing Storage (car-media)...')
        try {
            // 1. List buckets
            const { data: buckets, error: listError } = await supabase.storage.listBuckets()
            if (listError) {
                log(`Error listing buckets: ${listError.message}`)
            } else {
                log(`Buckets: ${buckets.map(b => b.name).join(', ')}`)
                const carMediaBucket = buckets.find(b => b.name === 'car-media')
                if (!carMediaBucket) {
                    log('CRITICAL: car-media bucket NOT found!')
                } else {
                    log(`car-media bucket found. Public: ${carMediaBucket.public}`)
                }
            }

            // 2. Try upload
            const blob = new Blob(['test'], { type: 'text/plain' })
            const fileName = `test-${Date.now()}.txt`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('car-media')
                .upload(fileName, blob)

            if (uploadError) {
                log(`Error uploading: ${uploadError.message}`)
            } else {
                log(`Upload successful: ${uploadData.path}`)

                // 3. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('car-media')
                    .getPublicUrl(fileName)
                log(`Public URL: ${publicUrl}`)

                // 4. Verify Public Access (fetch)
                try {
                    const res = await fetch(publicUrl)
                    if (res.ok) {
                        log('Public URL is accessible (200 OK)')
                    } else {
                        log(`Public URL NOT accessible: ${res.status} ${res.statusText}`)
                    }
                } catch (e) {
                    log(`Error fetching public URL: ${e}`)
                }
            }

        } catch (e) {
            log(`Unexpected error: ${e}`)
        }
    }

    const testDB = async () => {
        log('Testing DB Insert (car_inventory)...')
        try {
            const { data, error } = await (supabase.from('car_inventory') as any).insert({
                brand: 'TestBrand',
                model: 'TestModel',
                year: 2024,
                location: 'TestLoc',
                selling_price: 1000,
                currency: 'DZD',
                status: 'available'
            }).select().single()

            if (error) {
                log(`DB Insert Error: ${JSON.stringify(error)}`)
            } else {
                log(`DB Insert Success: ID ${data.id}`)

                // Cleanup
                const { error: delError } = await supabase.from('car_inventory').delete().eq('id', data.id)
                if (delError) log(`Cleanup Error: ${delError.message}`)
                else log('Cleanup Success')
            }
        } catch (e) {
            log(`Unexpected DB Error: ${e}`)
        }
    }


    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Inventory Diagnostics</h1>
            <div className="flex gap-4 mb-4">
                <button onClick={testStorage} className="bg-blue-500 text-white px-4 py-2 rounded">Test Storage</button>
                <button onClick={testDB} className="bg-green-500 text-white px-4 py-2 rounded">Test DB Insert</button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 dark:text-gray-300 p-4 rounded h-96 overflow-auto font-mono text-sm">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    )
}
