import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type Car = Database['public']['Tables']['car_inventory']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export default function CarDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [assignedOrder, setAssignedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        fetchCarDetails();
    }, [id]);

    const fetchCarDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('car_inventory')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setCar(data);

            if (data.assigned_to_order) {
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', data.assigned_to_order)
                    .single();

                if (!orderError && orderData) {
                    setAssignedOrder(orderData);
                }
            }
        } catch (error: any) {
            console.error('Error fetching car details:', error);
            Alert.alert('Error', 'Could not fetch car details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!car) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
                <Text className="text-gray-500">Car not found</Text>
            </View>
        );
    }

    const images = car.photos_urls || car.photos || [];

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: `${car.brand} ${car.model}`,
                headerBackTitle: 'Inventory',
                headerRight: () => (
                    <TouchableOpacity onPress={() => { }} className="p-2">
                        <Ionicons name="share-outline" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1">
                {/* Gallery */}
                <View className="h-72 bg-gray-900 w-full relative">
                    {images.length > 0 ? (
                        <Image
                            source={{ uri: images[currentImageIndex] }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-gray-200 dark:bg-gray-800">
                            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-2">No photos available</Text>
                        </View>
                    )}

                    {/* Image Indicators */}
                    {images.length > 1 && (
                        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                        </View>
                    )}
                </View>

                <View className="px-4 py-6 pb-32">
                    {/* Header Info */}
                    <View className="flex-row justify-between items-start mb-6">
                        <View>
                            <Text className="text-3xl font-bold text-gray-900 dark:text-white">{car.brand} {car.model}</Text>
                            <Text className="text-gray-500 text-xl font-medium">{car.year}</Text>
                        </View>
                        <View className={`px-4 py-2 rounded-full ${car.status === 'Available' ? 'bg-green-100' :
                            car.status === 'Reserved' ? 'bg-yellow-100' :
                                car.status === 'Sold' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                            <Text className={`font-bold ${car.status === 'Available' ? 'text-green-700' :
                                car.status === 'Reserved' ? 'text-yellow-700' :
                                    car.status === 'Sold' ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                {car.status}
                            </Text>
                        </View>
                    </View>

                    {/* Price Card */}
                    <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                        <Text className="text-gray-500 text-sm font-medium mb-1">Selling Price</Text>
                        <Text className="text-4xl font-bold text-green-600">
                            {car.selling_price ? car.selling_price.toLocaleString() : 'N/A'} <Text className="text-xl text-gray-500">DZD</Text>
                        </Text>
                    </View>

                    {/* Assigned Order Section */}
                    {assignedOrder && (
                        <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-6 border-l-4 border-l-blue-500 border border-gray-100 dark:border-gray-700">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-900 dark:text-white">Assigned Order</Text>
                                <TouchableOpacity
                                    onPress={() => router.push(`/orders/${assignedOrder.id}` as any)}
                                    className="flex-row items-center"
                                >
                                    <Text className="text-blue-600 text-sm font-medium mr-1">View</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row items-center mb-3">
                                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-3">
                                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                                        {assignedOrder.reference_number}
                                    </Text>
                                    <Text className="text-gray-500 text-sm">{assignedOrder.customer_name}</Text>
                                </View>
                            </View>

                            <View className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                <View className="flex-row justify-between mb-1">
                                    <Text className="text-gray-500 text-xs">Status</Text>
                                    <Text className="text-gray-900 dark:text-white text-xs font-medium capitalize">{assignedOrder.status}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500 text-xs">Date</Text>
                                    <Text className="text-gray-900 dark:text-white text-xs font-medium">
                                        {new Date(assignedOrder.created_at || Date.now()).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Specs Grid */}
                    <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Specifications</Text>
                        <View className="flex-row flex-wrap">
                            <View className="w-1/2 mb-6 pr-2">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="speedometer-outline" size={16} color="#6B7280" className="mr-1" />
                                    <Text className="text-gray-500 text-xs ml-1">Mileage</Text>
                                </View>
                                <Text className="font-bold text-lg text-gray-900 dark:text-white">
                                    {car.mileage ? car.mileage.toLocaleString() : 'N/A'} km
                                </Text>
                            </View>
                            <View className="w-1/2 mb-6 pl-2">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="color-palette-outline" size={16} color="#6B7280" className="mr-1" />
                                    <Text className="text-gray-500 text-xs ml-1">Color</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300 mr-2" />
                                    <Text className="font-bold text-lg text-gray-900 dark:text-white">{car.color || 'N/A'}</Text>
                                </View>
                            </View>
                            <View className="w-1/2 mb-2 pr-2">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="location-outline" size={16} color="#6B7280" className="mr-1" />
                                    <Text className="text-gray-500 text-xs ml-1">Location</Text>
                                </View>
                                <Text className="font-bold text-lg text-gray-900 dark:text-white">{car.location}</Text>
                            </View>
                            <View className="w-1/2 mb-2 pl-2">
                                <View className="flex-row items-center mb-1">
                                    <Ionicons name="barcode-outline" size={16} color="#6B7280" className="mr-1" />
                                    <Text className="text-gray-500 text-xs ml-1">VIN</Text>
                                </View>
                                <Text className="font-bold text-sm text-gray-900 dark:text-white" numberOfLines={1}>
                                    {car.vin_number || car.vin || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Notes */}
                    {car.notes && (
                        <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Notes</Text>
                            <Text className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                {car.notes}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
                <TouchableOpacity
                    onPress={() => { /* Handle Edit */ }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 py-4 rounded-xl items-center"
                >
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => { /* Handle Share */ }}
                    className="flex-1 bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-200"
                >
                    <Text className="text-white font-bold text-lg">Share</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
