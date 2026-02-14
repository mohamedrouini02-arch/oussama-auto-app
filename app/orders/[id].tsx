import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type Car = Database['public']['Tables']['car_inventory']['Row'];

export default function OrderDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [assignedCar, setAssignedCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);

            // Check for assigned car
            // We need to find a car that is assigned to this order
            // The schema says car_inventory has assigned_to_order column
            const { data: carData, error: carError } = await supabase
                .from('car_inventory')
                .select('*')
                .eq('assigned_to_order', id)
                .single();

            if (!carError && carData) {
                setAssignedCar(carData);
            }

        } catch (error: any) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'Could not fetch order details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const { error } = await (supabase.from('orders') as any)
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setOrder(prev => prev ? { ...prev, status: newStatus } : null);
            Alert.alert('Success', `Order status updated to ${newStatus}`);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('orders')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;

                            Alert.alert('Success', 'Order deleted successfully', [
                                { text: 'OK', onPress: () => router.replace('/orders') }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleCall = () => {
        if (order?.customer_phone) {
            Linking.openURL(`tel:${order.customer_phone}`);
        }
    };

    const handleWhatsApp = () => {
        if (order?.customer_phone) {
            Linking.openURL(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!order) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
                <Text className="text-gray-500">Order not found</Text>
            </View>
        );
    }

    const orderData = order.order_data as any || {};

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: order.reference_number || 'Order Details',
                headerRight: () => (
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => router.push(`/orders/edit/${id}` as any)}
                            className="p-2 bg-blue-50 rounded-full"
                        >
                            <Ionicons name="pencil" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-50 rounded-full">
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ),
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="px-2">
                        <Ionicons name="arrow-back" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1 px-4 py-4">
                {/* Status Section */}
                <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Status</Text>
                        <View className={`px-3 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100' :
                            order.status === 'confirmed' ? 'bg-blue-100' :
                                order.status === 'cancelled' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                            <Text className={`font-bold text-xs ${order.status === 'completed' ? 'text-green-700' :
                                order.status === 'confirmed' ? 'text-blue-700' :
                                    order.status === 'cancelled' ? 'text-red-700' : 'text-yellow-700'
                                }`}>
                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => handleUpdateStatus(status)}
                                disabled={updating || order.status === status}
                                className={`px-4 py-2 rounded-lg border ${order.status === status
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                                    }`}
                            >
                                <Text className={`font-medium text-xs ${order.status === status ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Assigned Car Section */}
                {assignedCar && (
                    <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-4 border-l-4 border-l-purple-500 border border-gray-100 dark:border-gray-700">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">Assigned Car</Text>
                            <TouchableOpacity
                                onPress={() => router.push(`/inventory/${assignedCar.id}` as any)}
                                className="flex-row items-center"
                            >
                                <Text className="text-blue-600 text-sm font-medium mr-1">View</Text>
                                <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center mb-3">
                            <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-3">
                                <Ionicons name="car-sport" size={24} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                                    {assignedCar.brand} {assignedCar.model}
                                </Text>
                                <Text className="text-gray-500 text-sm">{assignedCar.year} • {assignedCar.color}</Text>
                            </View>
                        </View>

                        <View className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-gray-500 text-xs">VIN</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-medium">{assignedCar.vin_number || 'N/A'}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-500 text-xs">Price</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-medium">
                                    {assignedCar.selling_price ? assignedCar.selling_price.toLocaleString() + ' DZD' : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Customer Section */}
                <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer</Text>

                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="person" size={24} color="#3B82F6" />
                        </View>
                        <View>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">{order.customer_name}</Text>
                            <Text className="text-gray-500">{order.customer_wilaya}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleWhatsApp}
                            className="flex-1 bg-green-500 py-3 rounded-xl flex-row justify-center items-center shadow-sm shadow-green-200"
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="white" />
                            <Text className="text-white font-bold ml-2">WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleCall}
                            className="flex-1 bg-blue-500 py-3 rounded-xl flex-row justify-center items-center shadow-sm shadow-blue-200"
                        >
                            <Ionicons name="call" size={20} color="white" />
                            <Text className="text-white font-bold ml-2">Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Car Request Section */}
                <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-20 border border-gray-100 dark:border-gray-700">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Car Request</Text>

                    <View className="space-y-3">
                        <View className="flex-row justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-gray-500">Brand</Text>
                            <Text className="font-medium text-gray-900 dark:text-white">{order.car_brand}</Text>
                        </View>
                        <View className="flex-row justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-gray-500">Model</Text>
                            <Text className="font-medium text-gray-900 dark:text-white">{order.car_model}</Text>
                        </View>
                        <View className="flex-row justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                            <Text className="text-gray-500">Budget</Text>
                            <Text className="font-bold text-gray-900 dark:text-white">
                                {orderData.budget ? `${orderData.budget} DZD` : 'N/A'}
                            </Text>
                        </View>
                        {orderData.year && (
                            <View className="flex-row justify-between py-3 border-b border-gray-50 dark:border-gray-700">
                                <Text className="text-gray-500">Year</Text>
                                <Text className="font-medium text-gray-900 dark:text-white">{orderData.year}</Text>
                            </View>
                        )}
                        {orderData.notes && (
                            <View className="py-3">
                                <Text className="text-gray-500 mb-2">Notes</Text>
                                <Text className="text-gray-900 dark:text-white leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                    {orderData.notes}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
