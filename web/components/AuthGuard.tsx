'use client'

import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login')
            } else if (event === 'SIGNED_IN') {
                if (pathname === '/login') {
                    router.push('/')
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [pathname])

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session && pathname !== '/login') {
                router.push('/login')
            } else if (session && pathname === '/login') {
                router.push('/')
            }
        } catch (error) {
            console.error('Error checking auth:', error)
        } finally {
            setLoading(false)
        }
    }

    // Optional: Show loading state only on initial load
    // if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    return <>{children}</>
}
