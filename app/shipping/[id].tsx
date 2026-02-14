import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type ShippingForm = Database['public']['Tables']['shipping_forms']['Row'];

export default function ShippingFormDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [form, setForm] = useState<ShippingForm | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForm();
    }, [id]);

    const fetchForm = async () => {
        try {
            const { data, error } = await supabase
                .from('shipping_forms')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setForm(data);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to load shipping form');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Form',
            'Are you sure you want to delete this shipping form?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('shipping_forms')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;

                            Alert.alert('Success', 'Form deleted successfully', [
                                { text: 'OK', onPress: () => router.replace('/shipping') }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    if (!form) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
                <Text className="text-gray-500">Form not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: 'Shipping Form',
                headerBackTitle: 'Forms',
                headerRight: () => (
                    <TouchableOpacity onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1 p-4">
                {/* Status */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4 flex-row justify-between items-center">
                    <Text className="text-gray-500">Status</Text>
                    <View className="bg-orange-100 px-3 py-1 rounded-full">
                        <Text className="text-orange-600 font-bold capitalize">{form.status || 'Pending'}</Text>
                    </View>
                </View>

                {/* Vehicle Info */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Vehicle Information</Text>
                    <View className="mb-3">
                        <Text className="text-gray-500 text-xs uppercase">Model</Text>
                        <Text className="text-lg font-medium text-gray-900 dark:text-white">{form.vehicle_model || 'N/A'}</Text>
                    </View>
                    <View className="mb-3">
                        <Text className="text-gray-500 text-xs uppercase">VIN</Text>
                        <Text className="text-lg font-mono text-gray-900 dark:text-white">{form.vin_number || 'N/A'}</Text>
                    </View>
                    {form.shipping_provider && (
                        <View>
                            <Text className="text-gray-500 text-xs uppercase">Shipping Provider</Text>
                            <View className="bg-blue-100 dark:bg-blue-900 self-start px-3 py-1 rounded-full mt-1">
                                <Text className="text-blue-700 dark:text-blue-300 font-medium">{form.shipping_provider}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Customer Info */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Customer Information</Text>
                    <View className="space-y-3">
                        <View>
                            <Text className="text-gray-500 text-xs uppercase">Full Name</Text>
                            <Text className="font-medium text-gray-900 dark:text-white">{form.name || 'N/A'}</Text>
                        </View>
                        <View>
                            <Text className="text-gray-500 text-xs uppercase">Phone</Text>
                            <Text className="font-medium text-gray-900 dark:text-white">{form.phone || 'N/A'}</Text>
                        </View>
                        {form.email && (
                            <View>
                                <Text className="text-gray-500 text-xs uppercase">Email</Text>
                                <Text className="font-medium text-gray-900 dark:text-white">{form.email}</Text>
                            </View>
                        )}
                        {form.address && (
                            <View>
                                <Text className="text-gray-500 text-xs uppercase">Address</Text>
                                <Text className="font-medium text-gray-900 dark:text-white">{form.address}</Text>
                            </View>
                        )}
                        {form.passport_number && (
                            <View>
                                <Text className="text-gray-500 text-xs uppercase">Passport</Text>
                                <Text className="font-medium text-gray-900 dark:text-white">{form.passport_number}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Created At */}
                {form.created_at && (
                    <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-24">
                        <Text className="text-gray-500 text-xs uppercase">Submitted</Text>
                        <Text className="font-medium text-gray-900 dark:text-white">
                            {new Date(form.created_at).toLocaleString()}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
