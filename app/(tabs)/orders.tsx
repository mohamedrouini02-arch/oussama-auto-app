import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard, OrderStatus } from '../../components/orders/OrderCard';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

const TABS: (OrderStatus | 'All')[] = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered'];

type Order = Database['public']['Tables']['orders']['Row'];

export default function OrdersScreen() {
    const [activeTab, setActiveTab] = useState<'All' | OrderStatus>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchOrders = async () => {
        try {
            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (activeTab !== 'All') {
                query = query.eq('status', activeTab.toLowerCase()); // Database uses lowercase
            }

            if (searchQuery) {
                query = query.or(`customer_name.ilike.%${searchQuery}%,reference_number.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [activeTab, searchQuery]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 pt-2 pb-4 bg-white dark:bg-gray-800 shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Orders</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/orders/add' as any)}
                        className="bg-blue-600 p-2 rounded-full"
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-4">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search orders..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 ml-2 text-gray-900 dark:text-white"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full mr-2 ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                        >
                            <Text className={`font-medium ${activeTab === tab ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={orders}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }) => (
                    <OrderCard
                        id={item.id.toString()}
                        reference={item.reference_number}
                        customerName={item.customer_name || 'Unknown'}
                        carModel={item.car_model || 'Unknown'}
                        status={item.status as OrderStatus}
                        date={new Date(item.created_at || Date.now()).toLocaleDateString()}
                        budget={item.car_budget}
                        customBudget={item.car_custom_budget}
                    />
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-10">
                        <Text className="text-gray-500">No orders found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
