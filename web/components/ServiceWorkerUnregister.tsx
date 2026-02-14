'use client'

import { useEffect } from 'react'

export default function ServiceWorkerUnregister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    console.log('Unregistering Service Worker:', registration)
                    registration.unregister()
                }

                if (registrations.length > 0) {
                    console.log('Service Workers found and unregistered. Reloading...')
                    // Optional: Force reload if we actually killed something to ensure fresh content
                    // window.location.reload() 
                }
            })
        }
    }, [])

    return null
}
