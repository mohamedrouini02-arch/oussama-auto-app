import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

export default function AddCar() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: '',
        mileage: '',
        price: '',
        location: '',
        color: '',
        vin: ''
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled) {
                setUploading(true);
                const newImages = [...images];

                for (const asset of result.assets) {
                    if (asset.base64) {
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                        const filePath = `${fileName}`;

                        const { data, error } = await supabase.storage
                            .from('car-images')
                            .upload(filePath, decode(asset.base64), {
                                contentType: 'image/jpeg'
                            });

                        if (error) {
                            console.error('Upload error:', error);
                            continue;
                        }

                        const { data: { publicUrl } } = supabase.storage
                            .from('car-images')
                            .getPublicUrl(filePath);

                        newImages.push(publicUrl);
                    }
                }
                setImages(newImages);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        } finally {
            setUploading(false);
        }
    };

    // Helper to decode base64 (simple version for this context)
    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const handleSaveCar = async () => {
        if (!formData.brand || !formData.model || !formData.year || !formData.price) {
            Alert.alert('Error', 'Please fill in all required fields (Brand, Model, Year, Price)');
            return;
        }

        setLoading(true);
        try {
            const newCar: Database['public']['Tables']['car_inventory']['Insert'] = {
                brand: formData.brand,
                model: formData.model,
                year: parseInt(formData.year) || new Date().getFullYear(),
                mileage: parseInt(formData.mileage) || 0,
                selling_price: parseFloat(formData.price) || 0,
                location: formData.location || 'Showroom',
                status: 'available',
                color: formData.color,
                vin: formData.vin,
                currency: 'DZD',
                photos_urls: images
            };

            console.log('Sending Car:', newCar);

            const { error } = await (supabase
                .from('car_inventory') as any)
                .insert(newCar);

            if (error) throw error;

            Alert.alert('Success', 'Car added successfully', [
                { text: 'OK', onPress: () => router.replace('/inventory') }
            ]);
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: 'Add New Car',
                headerBackTitle: 'Cancel',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="px-4">
                        <Text className="text-blue-600 font-medium text-lg">Cancel</Text>
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1 px-4 py-4">
                {/* Basic Info */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</Text>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Brand *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. Kia"
                            value={formData.brand}
                            onChangeText={(text) => updateField('brand', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Model *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. Sportage"
                            value={formData.model}
                            onChangeText={(text) => updateField('model', text)}
                        />
                    </View>

                    <View className="flex-row space-x-4 gap-4">
                        <View className="flex-1 mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Year *</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="2023"
                                keyboardType="numeric"
                                value={formData.year}
                                onChangeText={(text) => updateField('year', text)}
                            />
                        </View>
                        <View className="flex-1 mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Mileage (km)</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="50000"
                                keyboardType="numeric"
                                value={formData.mileage}
                                onChangeText={(text) => updateField('mileage', text)}
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Location</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. Showroom, Port"
                            value={formData.location}
                            onChangeText={(text) => updateField('location', text)}
                        />
                    </View>
                </View>

                {/* Pricing */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pricing</Text>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Selling Price (DZD) *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="0"
                            keyboardType="numeric"
                            value={formData.price}
                            onChangeText={(text) => updateField('price', text)}
                        />
                    </View>
                </View>

                {/* Photos */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-24">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Photos</Text>

                    <ScrollView horizontal className="mb-4 flex-row gap-2">
                        {images.map((uri, index) => (
                            <Image key={index} source={{ uri }} className="w-24 h-24 rounded-lg mr-2" />
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        onPress={pickImage}
                        disabled={uploading}
                        className="h-32 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl items-center justify-center"
                    >
                        {uploading ? (
                            <ActivityIndicator color="#3B82F6" />
                        ) : (
                            <>
                                <Ionicons name="camera" size={32} color="#9CA3AF" />
                                <Text className="text-gray-500 mt-2">Tap to add photos</Text>
                            </>
                        )}
                    </TouchableOpacity>
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
                    onPress={handleSaveCar}
                    className={`flex-1 bg-blue-600 py-3 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Save Car</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
