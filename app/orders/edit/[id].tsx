import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../../lib/database.types';
import { supabase } from '../../../lib/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

export default function EditOrderScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_wilaya: '',
        car_brand: '',
        car_model: '',
        budget: '',
        notes: ''
    });

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

            if (data) {
                const order = data as Order;
                const orderData = order.order_data as any || {};
                setFormData({
                    customer_name: order.customer_name || '',
                    customer_phone: order.customer_phone || '',
                    customer_wilaya: order.customer_wilaya || '',
                    car_brand: order.car_brand || '',
                    car_model: order.car_model || '',
                    budget: orderData.budget ? orderData.budget.toString() : '',
                    notes: order.notes || orderData.notes || ''
                });
            }
        } catch (error: any) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'Could not fetch order details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.customer_name || !formData.car_brand || !formData.car_model) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const updates: any = {
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                customer_wilaya: formData.customer_wilaya,
                car_brand: formData.car_brand,
                car_model: formData.car_model,
                notes: formData.notes,
                order_data: {
                    budget: formData.budget ? parseFloat(formData.budget) : null,
                    notes: formData.notes
                }
            };

            const { error } = await (supabase.from('orders') as any)
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            Alert.alert('Success', 'Order updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: 'Edit Order',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="px-2">
                        <Ionicons name="arrow-back" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1 px-4 py-6">
                <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-6">Customer Details</Text>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Full Name *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            value={formData.customer_name}
                            onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
                            placeholder="Enter customer name"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Phone Number</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            value={formData.customer_phone}
                            onChangeText={(text) => setFormData({ ...formData, customer_phone: text })}
                            placeholder="Enter phone number"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Wilaya</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            value={formData.customer_wilaya}
                            onChangeText={(text) => setFormData({ ...formData, customer_wilaya: text })}
                            placeholder="Enter wilaya"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>

                <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-20">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-6">Car Details</Text>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Brand *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            value={formData.car_brand}
                            onChangeText={(text) => setFormData({ ...formData, car_brand: text })}
                            placeholder="e.g. Toyota"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Model *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            value={formData.car_model}
                            onChangeText={(text) => setFormData({ ...formData, car_model: text })}
                            placeholder="e.g. Corolla"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Budget (DZD)</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            value={formData.budget}
                            onChangeText={(text) => setFormData({ ...formData, budget: text })}
                            placeholder="Enter budget"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Notes</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 min-h-[100px]"
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                            placeholder="Enter any additional notes"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`py-4 rounded-xl items-center ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
