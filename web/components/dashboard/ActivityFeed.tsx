'use client'

import { useLanguage } from '@/context/LanguageContext'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Car, FileText, ShoppingCart, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

type ActivityItem = {
    id: string
    type: 'order' | 'shipping' | 'inventory' | 'transaction'
    title: string
    description: string
    time: Date
    icon: any
    gradient: string
}

export function ActivityFeed() {
    const { t } = useLanguage()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchActivities()
    }, [])

    async function fetchActivities() {
        try {
            const [orders, shipping, inventory, transactions] = await Promise.all([
                supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
                supabase.from('shipping_forms').select('*').order('created_at', { ascending: false }).limit(5),
                supabase.from('car_inventory').select('*').order('created_at', { ascending: false }).limit(5),
                supabase.from('financial_transactions').select('*').order('created_at', { ascending: false }).limit(5)
            ])

            const allActivities: ActivityItem[] = []

            if (orders.data) {
                orders.data.forEach((order: any) => {
                    allActivities.push({
                        id: `order-${order.id}`,
                        type: 'order',
                        title: `${t.common.orders} #${order.reference_number}`,
                        description: `${order.customer_name} — ${order.car_brand} ${order.car_model}`,
                        time: new Date(order.created_at),
                        icon: ShoppingCart,
                        gradient: 'from-blue-500 to-blue-600'
                    })
                })
            }

            if (shipping.data) {
                shipping.data.forEach((form: any) => {
                    allActivities.push({
                        id: `shipping-${form.id}`,
                        type: 'shipping',
                        title: t.common.shipping,
                        description: `${form.name} — ${form.vehicle_model}`,
                        time: new Date(form.created_at),
                        icon: FileText,
                        gradient: 'from-orange-500 to-amber-600'
                    })
                })
            }

            if (inventory.data) {
                inventory.data.forEach((car: any) => {
                    allActivities.push({
                        id: `car-${car.id}`,
                        type: 'inventory',
                        title: t.common.inventory,
                        description: `${car.brand} ${car.model} (${car.year})`,
                        time: new Date(car.created_at),
                        icon: Car,
                        gradient: 'from-violet-500 to-purple-600'
                    })
                })
            }

            if (transactions.data) {
                transactions.data.forEach((tx: any) => {
                    allActivities.push({
                        id: `tx-${tx.id}`,
                        type: 'transaction',
                        title: t.common.finance,
                        description: `${tx.type}: ${tx.amount?.toLocaleString()} DZD`,
                        time: new Date(tx.created_at),
                        icon: Wallet,
                        gradient: 'from-emerald-500 to-teal-600'
                    })
                })
            }

            allActivities.sort((a, b) => b.time.getTime() - a.time.getTime())
            setActivities(allActivities.slice(0, 10))
        } catch (error) {
            console.error('Error fetching activities:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-2/3" />
                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-lg w-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (activities.length === 0) {
        return <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No recent activity</div>
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 group">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${activity.gradient} text-white shrink-0 shadow-sm`}>
                        <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{activity.description}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(activity.time, { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
