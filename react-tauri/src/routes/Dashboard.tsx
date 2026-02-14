import { Activity, CreditCard, Package, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CurrencyConverter from '../components/CurrencyConverter'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserRole } from '../hooks/useUserRole'
import { supabase } from '../lib/supabase'

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

                // Calculate revenue (only for admin)
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
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">{t.common.dashboard}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Orders"
                    value={stats.orders}
                    icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
                    bg="bg-blue-100"
                    href="/orders"
                />
                {role === 'admin' && (
                    <StatCard
                        title="Total Revenue"
                        value={`${stats.revenue.toLocaleString()} DZD`}
                        icon={<CreditCard className="w-6 h-6 text-green-600" />}
                        bg="bg-green-100"
                        href="/finance"
                    />
                )}
                <StatCard
                    title="Inventory"
                    value={stats.inventory}
                    icon={<Activity className="w-6 h-6 text-purple-600" />}
                    bg="bg-purple-100"
                    href="/inventory"
                />
                <StatCard
                    title="Shipping Forms"
                    value={stats.shipping}
                    icon={<Package className="w-6 h-6 text-orange-600" />}
                    bg="bg-orange-100"
                    href="/shipping"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {role === 'admin' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                        <ActivityFeed />
                    </div>
                )}

                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/orders/new" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left font-medium block text-gray-900">
                                + New Order
                            </Link>
                            <Link to="/finance/new" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left font-medium block text-gray-900">
                                + New Transaction
                            </Link>
                            <Link to="/inventory/new" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left font-medium block text-gray-900">
                                + Add Car
                            </Link>
                            <Link to="/shipping/new" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left font-medium block text-gray-900">
                                + Shipping Form
                            </Link>
                        </div>
                    </div>
                    <CurrencyConverter />
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, bg, href }: { title: string, value: string | number, icon: React.ReactNode, bg: string, href?: string }) {
    const Content = () => (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
            <div className={`p-4 rounded-full ${bg} mr-4`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    )

    if (href) {
        return (
            <Link to={href} className="block">
                <Content />
            </Link>
        )
    }

    return <Content />
}
