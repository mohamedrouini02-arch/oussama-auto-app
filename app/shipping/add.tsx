import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

export default function AddShippingForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        passportNumber: '',
        vehicleModel: '',
        vin: '',
        shippingProvider: ''
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const buildFormData = (): Database['public']['Tables']['shipping_forms']['Insert'] => ({
        name: formData.customerName,
        phone: formData.customerPhone,
        email: formData.customerEmail || '',
        address: formData.customerAddress || '',
        passport_number: formData.passportNumber,
        vehicle_model: formData.vehicleModel,
        vin_number: formData.vin,
        code_postal: '',
        zip_number: '',
        shipping_provider: formData.shippingProvider || null,
        status: 'completed'
    });

    const insertNewForm = async () => {
        setLoading(true);
        try {
            const newForm = buildFormData();
            console.log('Sending Shipping Form:', newForm);

            const { data, error } = await (supabase
                .from('shipping_forms') as any)
                .insert(newForm)
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            Alert.alert('Success', 'Shipping form created successfully', [
                { text: 'OK', onPress: () => router.replace('/shipping') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateExistingForm = async (existingId: string) => {
        setLoading(true);
        try {
            const updateData = buildFormData();
            const { error } = await (supabase
                .from('shipping_forms') as any)
                .update(updateData)
                .eq('id', existingId);

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            Alert.alert('Success', 'Existing shipping form updated successfully', [
                { text: 'OK', onPress: () => router.replace('/shipping') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveForm = async () => {
        if (!formData.customerName || !formData.customerPhone || !formData.vehicleModel || !formData.vin) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Phone, Vehicle, VIN)');
            return;
        }

        setLoading(true);
        try {
            // Check for existing forms with the same name or VIN
            const { data: existingByName } = await (supabase
                .from('shipping_forms') as any)
                .select('id, name, vin_number')
                .ilike('name', formData.customerName)
                .limit(1);

            const { data: existingByVin } = await (supabase
                .from('shipping_forms') as any)
                .select('id, name, vin_number')
                .eq('vin_number', formData.vin)
                .limit(1);

            const existingForm = existingByName?.[0] || existingByVin?.[0];

            if (existingForm) {
                setLoading(false);
                const matchField = existingByName?.[0] ? `name "${existingForm.name}"` : `VIN "${existingForm.vin_number}"`;
                Alert.alert(
                    'Duplicate Found',
                    `A shipping form already exists with the same ${matchField}. Would you like to update the existing form or cancel?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Update Existing',
                            onPress: () => updateExistingForm(existingForm.id)
                        }
                    ]
                );
                return;
            }

            // No duplicate found, insert new
            setLoading(false);
            await insertNewForm();
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: 'New Shipping Form',
                headerBackTitle: 'Cancel',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="px-4">
                        <Text className="text-blue-600 font-medium text-lg">Cancel</Text>
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1 px-4 py-4">
                {/* Customer Info */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Information</Text>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Full Name *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. Ahmed Benali"
                            value={formData.customerName}
                            onChangeText={(text) => updateField('customerName', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Phone Number *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. 0555..."
                            keyboardType="phone-pad"
                            value={formData.customerPhone}
                            onChangeText={(text) => updateField('customerPhone', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Email</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. ahmed@example.com"
                            keyboardType="email-address"
                            value={formData.customerEmail}
                            onChangeText={(text) => updateField('customerEmail', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Address</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. 123 Street, Algiers"
                            value={formData.customerAddress}
                            onChangeText={(text) => updateField('customerAddress', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Passport Number</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. 123456789"
                            value={formData.passportNumber}
                            onChangeText={(text) => updateField('passportNumber', text)}
                        />
                    </View>
                </View>

                {/* Vehicle Info */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Vehicle Information</Text>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Vehicle Model *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. Kia Sportage 2023"
                            value={formData.vehicleModel}
                            onChangeText={(text) => updateField('vehicleModel', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">VIN (Chassis Number) *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. KNA..."
                            value={formData.vin}
                            onChangeText={(text) => updateField('vin', text)}
                        />
                    </View>
                </View>

                {/* Shipping Provider */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-24">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Shipping Provider</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {['dumsan', 'El rawassi', 'Alko car'].map((provider) => (
                            <TouchableOpacity
                                key={provider}
                                onPress={() => updateField('shippingProvider', provider)}
                                className={`px-4 py-2 rounded-full border ${formData.shippingProvider === provider
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <Text className={`${formData.shippingProvider === provider
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                    } font-medium`}>
                                    {provider}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-xl items-center"
                    disabled={loading}
                >
                    <Text className="text-gray-700 dark:text-white font-bold text-lg">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSaveForm}
                    className={`flex-1 bg-blue-600 py-3 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Save</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
