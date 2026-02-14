'use client'

import CurrencyConverter from '@/components/CurrencyConverter'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useLanguage } from '@/context/LanguageContext'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/lib/supabase'
import { Activity, ArrowUpRight, CreditCard, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Dashboard() {
    const { t } = useLanguage()
    const [stats, setStats] = useState({
        orders: 0,
        revenue: 0,
        inventory: 0,
        shipping: 0
    })
    const [loading, setLoading] = useState(true)

    const { role, loading: roleLoading } = useUserRole()

    useEffect(() => {
        async function fetchStats() {
            try {
                const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
                const { count: inventoryCount } = await supabase.from('car_inventory').select('*', { count: 'exact', head: true })
                const { count: shippingCount } = await supabase.from('shipping_forms').select('*', { count: 'exact', head: true })

                let revenue = 0
                if (role === 'admin') {
                    const { data: transactions } = await (supabase.from('financial_transactions') as any)
                        .select('amount, type')
                        .eq('type', 'Income')
                    revenue = transactions?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0
                }

                setStats({
                    orders: ordersCount || 0,
                    revenue: revenue,
                    inventory: inventoryCount || 0,
                    shipping: shippingCount || 0
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }

        if (!roleLoading) {
            fetchStats()
        }
    }, [role, roleLoading])

    if (loading || roleLoading) {
        return (
            <div className="p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t.common.dashboard}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    title={t.dashboard.totalOrders}
                    value={stats.orders}
                    icon={<ShoppingCart className="w-5 h-5" />}
                    gradient="from-blue-500 to-blue-600"
                    href="/orders"
                />
                {role === 'admin' && (
                    <StatCard
                        title={t.dashboard.totalRevenue}
                        value={`${stats.revenue.toLocaleString()} DZD`}
                        icon={<CreditCard className="w-5 h-5" />}
                        gradient="from-emerald-500 to-teal-600"
                        href="/finance"
                    />
                )}
                <StatCard
                    title={t.dashboard.inventory}
                    value={stats.inventory}
                    icon={<Activity className="w-5 h-5" />}
                    gradient="from-violet-500 to-purple-600"
                    href="/inventory"
                />
                <StatCard
                    title={t.dashboard.shippingForms}
                    value={stats.shipping}
                    icon={<Package className="w-5 h-5" />}
                    gradient="from-orange-500 to-amber-600"
                    href="/shipping"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {role === 'admin' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.dashboard.recentActivity}</h2>
                        <ActivityFeed />
                    </div>
                )}

                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.dashboard.quickActions}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickAction href="/orders/new" label={t.dashboard.newOrder} gradient="from-blue-500/10 to-indigo-500/10 dark:from-blue-500/10 dark:to-indigo-500/10" textColor="text-blue-700 dark:text-blue-400" />
                            <QuickAction href="/finance/new" label={t.dashboard.newTransaction} gradient="from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/10" textColor="text-emerald-700 dark:text-emerald-400" />
                            <QuickAction href="/inventory/new" label={t.dashboard.addCar} gradient="from-violet-500/10 to-purple-500/10 dark:from-violet-500/10 dark:to-purple-500/10" textColor="text-violet-700 dark:text-violet-400" />
                            <QuickAction href="/shipping/new" label={t.dashboard.shippingForm} gradient="from-orange-500/10 to-amber-500/10 dark:from-orange-500/10 dark:to-amber-500/10" textColor="text-orange-700 dark:text-orange-400" />
                        </div>
                    </div>
                    <CurrencyConverter />
                </div>
            </div>
        </div>
    )
}

function QuickAction({ href, label, gradient, textColor }: { href: string, label: string, gradient: string, textColor: string }) {
    return (
        <Link href={href} className={`group p-4 bg-gradient-to-br ${gradient} rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-between border border-transparent`}>
            <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
            <ArrowUpRight className={`w-4 h-4 ${textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </Link>
    )
}

function StatCard({ title, value, icon, gradient, href }: { title: string, value: string | number, icon: React.ReactNode, gradient: string, href?: string }) {
    const Content = () => (
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 cursor-pointer">
            <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg mb-3`}>
                {icon}
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{value}</p>
            {/* Decorative gradient blob */}
            <div className={`absolute -top-10 -end-10 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500`} />
        </div>
    )

    if (href) {
        return (
            <Link href={href} className="block">
                <Content />
            </Link>
        )
    }

    return <Content />
}
