'use client'

import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'
import { Car, DollarSign, LayoutDashboard, LogOut, ShoppingCart, Truck, Users, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useLanguage } from '@/context/LanguageContext'
import LanguageToggle from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { role } = useUserRole()
    const { t, dir } = useLanguage()

    const navigation = [
        { name: t.common.dashboard, href: '/', icon: LayoutDashboard },
        { name: t.common.orders, href: '/orders', icon: ShoppingCart },
        { name: t.common.inventory, href: '/inventory', icon: Car },
        { name: t.common.finance, href: '/finance', icon: DollarSign },
        { name: t.common.shipping, href: '/shipping', icon: Truck },
        { name: t.common.attendance, href: '/attendance', icon: Users },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={clsx(
                'fixed inset-y-0 z-50 flex w-72 flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden',
                'bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl',
                'border-gray-200/60 dark:border-slate-700/60',
                dir === 'rtl' ? 'right-0 border-s' : 'left-0 border-e',
                isOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
            )}>
                <div className="px-5 py-6">
                    {/* Logo */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Image
                                    src="/logo-final.png"
                                    alt="Oussama Auto"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Oussama Auto</span>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.common.dashboard}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1.5">
                        {navigation.filter(item => {
                            if (item.href === '/finance') return role === 'admin'
                            if (item.href === '/attendance') return role === 'admin'
                            return true
                        }).map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => onClose()}
                                    className={clsx(
                                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800/70 dark:hover:text-gray-200'
                                    )}
                                >
                                    <item.icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500')} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Settings Section */}
                    <div className="mt-8 space-y-3">
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-2">{t.settings.title}</p>
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700/50">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.settings.theme}</span>
                            <ThemeToggle />
                        </div>
                        <LanguageToggle />
                    </div>
                </div>

                {/* Sign Out */}
                <div className="p-5 border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        {t.common.signOut}
                    </button>
                </div>
            </div>
        </>
    )
}
