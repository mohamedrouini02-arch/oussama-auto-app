'use client'

import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { dir } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        checkUser()
    }, [])

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
            }
        } catch (error) {
            console.error('Error checking auth:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 animate-pulse" />
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile Header */}
            <div className="lg:hidden print:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-800/60 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Image
                            src="/logo-final.png"
                            alt="Oussama Auto"
                            width={36}
                            height={36}
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Oussama Auto</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <main className={clsx(
                "min-h-screen transition-all duration-300 print:p-0 print:m-0 print:w-full",
                dir === 'rtl' ? 'lg:pr-72 print:pr-0' : 'lg:pl-72 print:pl-0'
            )}>
                {children}
            </main>
        </div>
    )
}
