import { Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ActivityItem {
    id: string
    type: string
    description: string
    timestamp: string
}

export function ActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecentActivity()
    }, [])

    async function fetchRecentActivity() {
        try {
            const activities: ActivityItem[] = []

            // Fetch recent orders
            const { data: orders } = await supabase
                .from('orders')
                .select('id, created_at, customer_name, car_model')
                .order('created_at', { ascending: false })
                .limit(5)

            orders?.forEach((order: any) => {
                activities.push({
                    id: `order-${order.id}`,
                    type: 'order',
                    description: `New order from ${order.customer_name} for ${order.car_model}`,
                    timestamp: order.created_at
                })
            })

            // Fetch recent inventory additions
            const { data: cars } = await supabase
                .from('car_inventory')
                .select('id, created_at, brand, model')
                .order('created_at', { ascending: false })
                .limit(5)

            cars?.forEach((car: any) => {
                activities.push({
                    id: `car-${car.id}`,
                    type: 'inventory',
                    description: `Added ${car.brand} ${car.model} to inventory`,
                    timestamp: car.created_at
                })
            })

            // Sort by timestamp
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

            setActivities(activities.slice(0, 10))
        } catch (error) {
            console.error('Error fetching activity:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-center text-gray-500">Loading...</div>
    }

    return (
        <div className="space-y-3">
            {activities.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No recent activity</div>
            ) : (
                activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleDateString()} · {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
