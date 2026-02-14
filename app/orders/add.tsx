import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

export default function AddOrder() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        phoneNumber: '',
        wilaya: '',
        brand: '',
        model: '',
        budget: '',
        year: '',
        notes: ''
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateOrder = async () => {
        if (!formData.customerName || !formData.phoneNumber || !formData.brand || !formData.model) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Generate reference number in format: WA-year-xxxxxx
            const year = new Date().getFullYear();
            const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
            const referenceNumber = `WA-${year}-${randomNum}`;

            const newOrder: Database['public']['Tables']['orders']['Insert'] = {
                reference_number: referenceNumber,
                customer_name: formData.customerName,
                customer_phone: formData.phoneNumber,
                customer_wilaya: formData.wilaya,
                car_brand: formData.brand,
                car_model: formData.model,
                status: 'pending',
                order_data: {
                    budget: formData.budget,
                    year: formData.year,
                    notes: formData.notes
                }
            };

            const { error } = await (supabase
                .from('orders') as any)
                .insert(newOrder);

            if (error) throw error;

            // Redirect immediately
            router.replace('/orders');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: 'New Order',
                headerBackTitle: 'Cancel',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="px-4">
                        <Text className="text-blue-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                )
            }} />

            {/* Progress Steps */}
            <View className="flex-row justify-between px-8 py-4 bg-white dark:bg-gray-800 mb-4">
                {[1, 2, 3].map((s) => (
                    <View key={s} className="items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <Text className={`font-bold ${step >= s ? 'text-white' : 'text-gray-500'}`}>{s}</Text>
                        </View>
                        <Text className="text-xs text-gray-500">
                            {s === 1 ? 'Customer' : s === 2 ? 'Car' : 'Review'}
                        </Text>
                    </View>
                ))}
            </View>

            <ScrollView className="flex-1 px-4">
                {step === 1 && (
                    <View>
                        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Customer Information</Text>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Full Name *</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. Ahmed Benali"
                                value={formData.customerName}
                                onChangeText={(text) => updateField('customerName', text)}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Phone Number *</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. 0555..."
                                keyboardType="phone-pad"
                                value={formData.phoneNumber}
                                onChangeText={(text) => updateField('phoneNumber', text)}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Wilaya</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="Select Wilaya"
                                value={formData.wilaya}
                                onChangeText={(text) => updateField('wilaya', text)}
                            />
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View>
                        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Car Preferences</Text>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Brand *</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. Kia, Hyundai"
                                value={formData.brand}
                                onChangeText={(text) => updateField('brand', text)}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Model *</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. Sportage"
                                value={formData.model}
                                onChangeText={(text) => updateField('model', text)}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Budget (DZD)</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. 5,000,000"
                                keyboardType="numeric"
                                value={formData.budget}
                                onChangeText={(text) => updateField('budget', text)}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Year (Optional)</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. 2022"
                                keyboardType="numeric"
                                value={formData.year}
                                onChangeText={(text) => updateField('year', text)}
                            />
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View>
                        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Review & Submit</Text>

                        <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                            <Text className="font-bold text-gray-500 mb-2 uppercase text-xs">Customer</Text>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">{formData.customerName}</Text>
                            <Text className="text-gray-500">{formData.phoneNumber}</Text>
                            <Text className="text-gray-500">{formData.wilaya}</Text>
                        </View>

                        <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                            <Text className="font-bold text-gray-500 mb-2 uppercase text-xs">Car Request</Text>
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">{formData.brand} {formData.model}</Text>
                            <Text className="text-gray-500">Budget: {formData.budget || 'N/A'} DZD</Text>
                            {formData.year ? <Text className="text-gray-500">Year: {formData.year}</Text> : null}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-row justify-between">
                {step > 1 ? (
                    <TouchableOpacity
                        onPress={() => setStep(step - 1)}
                        className="bg-gray-200 dark:bg-gray-700 py-3 px-6 rounded-xl"
                        disabled={loading}
                    >
                        <Text className="font-bold text-gray-700 dark:text-white">Back</Text>
                    </TouchableOpacity>
                ) : (
                    <View />
                )}

                <TouchableOpacity
                    onPress={() => {
                        if (step < 3) setStep(step + 1);
                        else handleCreateOrder();
                    }}
                    className={`bg-blue-600 py-3 px-8 rounded-xl ${loading ? 'opacity-70' : ''}`}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold">{step === 3 ? 'Create Order' : 'Next'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
