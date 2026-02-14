import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export type CarStatus = 'Available' | 'Reserved' | 'In Transit' | 'Sold';

type CarCardProps = {
    id: string;
    brand: string;
    model: string;
    year: string;
    price: string;
    status: CarStatus;
    location: string;
    image?: string;
};

const STATUS_COLORS: Record<CarStatus, string> = {
    Available: '#10B981', // Green
    Reserved: '#F59E0B', // Yellow
    'In Transit': '#3B82F6', // Blue
    Sold: '#9CA3AF', // Gray
};

export function CarCard({ id, brand, model, year, price, status, location, image }: CarCardProps) {
    const router = useRouter();
    const color = STATUS_COLORS[status] || STATUS_COLORS.Available;

    return (
        <TouchableOpacity
            onPress={() => router.push(`/inventory/${id}` as any)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-4 overflow-hidden"
        >
            <View className="h-40 bg-gray-200 relative">
                {image ? (
                    <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="w-full h-full items-center justify-center">
                        <Ionicons name="car-sport" size={48} color="#9CA3AF" />
                    </View>
                )}
                <View className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded">
                    <Text className="text-white text-xs font-bold">
                        {location === 'Korea' ? '🇰🇷 Korea' : location === 'China' ? '🇨🇳 China' : `📍 ${location}`}
                    </Text>
                </View>
                <View className="absolute top-2 right-2 px-2 py-1 rounded" style={{ backgroundColor: color }}>
                    <Text className="text-white text-xs font-bold">{status}</Text>
                </View>
            </View>

            <View className="p-4">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {brand} {model} <Text className="text-gray-500 font-normal">{year}</Text>
                </Text>

                <Text className="text-xl font-bold text-green-600 mb-2">
                    {price} DZD
                </Text>

                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">54k km</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="color-palette-outline" size={16} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">White</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
