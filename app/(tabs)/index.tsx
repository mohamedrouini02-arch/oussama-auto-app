
import { Stack } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { OverviewCard } from '../../components/dashboard/OverviewCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const { session } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [stats, setStats] = React.useState({
    orders: 0,
    inventory: 0,
    revenue: '0',
    tasks: 0,
    totalShippingForms: 0,
    totalTransactions: 0
  });

  const fetchStats = React.useCallback(async () => {
    try {
      // Orders Count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Inventory Count
      const { count: inventoryCount } = await supabase
        .from('car_inventory')
        .select('*', { count: 'exact', head: true });

      // Total Shipping Forms Count
      const { count: shippingFormsCount } = await supabase
        .from('shipping_forms')
        .select('*', { count: 'exact', head: true });

      // Total Transactions Count
      const { count: transactionsCount } = await supabase
        .from('financial_transactions')
        .select('*', { count: 'exact', head: true });

      // Pending Tasks (Pending Orders + Pending Shipping Forms)
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingForms } = await supabase
        .from('shipping_forms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // Revenue (Sum of Income transactions)
      // Note: This is a simplified calculation. In a real app, you might use a Postgres function.
      const { data } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'Income');

      const transactions = data as { amount: number }[] | null;

      const totalRevenue = (transactions || []).reduce((sum, tx) => {
        return sum + (tx.amount || 0);
      }, 0);

      setStats({
        orders: ordersCount || 0,
        inventory: inventoryCount || 0,
        revenue: (totalRevenue / 1000000).toFixed(1) + 'M',
        tasks: (pendingOrders || 0) + (pendingForms || 0),
        totalShippingForms: shippingFormsCount || 0,
        totalTransactions: transactionsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 mt-2">
          <View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">Welcome back,</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {session?.user?.email?.split('@')[0] || 'Admin'}
            </Text>
          </View>
          <View className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Text className="text-blue-600 dark:text-blue-300 font-bold px-2">WA</Text>
          </View>
        </View>

        {/* Overview Cards */}
        <View className="flex-row mb-4">
          <OverviewCard
            title="Total Orders"
            count={stats.orders}
            subtitle="All time"
            icon="cart"
            color="#F59E0B"
          />
          <OverviewCard
            title="Inventory"
            count={stats.inventory}
            subtitle="Cars available"
            icon="car-sport"
            color="#3B82F6"
          />
        </View>

        <View className="flex-row mb-6">
          <OverviewCard
            title="Revenue"
            count={stats.revenue}
            subtitle="DZD (Total)"
            icon="wallet"
            color="#10B981"
          />
          <OverviewCard
            title="Pending"
            count={stats.tasks}
            subtitle="Tasks"
            icon="time"
            color="#EF4444"
          />
        </View>

        <View className="flex-row mb-6">
          <OverviewCard
            title="Shipping Forms"
            count={stats.totalShippingForms}
            subtitle="Total Forms"
            icon="boat"
            color="#8B5CF6"
          />
          <OverviewCard
            title="Transactions"
            count={stats.totalTransactions}
            subtitle="Total Records"
            icon="swap-horizontal"
            color="#EC4899"
          />
        </View>

        {/* Activity Feed */}
        <ActivityFeed />

        {/* Bottom Spacer for FAB */}
        <View className="h-24" />
      </ScrollView>

      <QuickActions />
    </SafeAreaView >
  );
}
