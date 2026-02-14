import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type ShippingFormCardProps = {
    customerName: string;
    carModel: string;
    vin: string;
    date: string;
    status: string;
    pdfUrl: string | null;
    shippingProvider?: string | null;
    onPress: () => void;
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return 'bg-orange-500';
        case 'processed': return 'bg-blue-500';
        case 'completed': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
};

export default function ShippingFormCard({ customerName, carModel, vin, date, status, pdfUrl, shippingProvider, onPress }: ShippingFormCardProps) {
    // Format date
    const formattedDate = new Date(date).toLocaleDateString();

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-white font-bold text-lg">{customerName}</Text>
                    <Text className="text-gray-400 text-sm">{formattedDate}</Text>
                </View>
                <View className={`${getStatusColor(status)} px-3 py-1 rounded-full`}>
                    <Text className="text-white text-xs font-bold uppercase">{status}</Text>
                </View>
            </View>

            <View className="mb-3">
                <Text className="text-white font-semibold text-base">{carModel}</Text>
                <Text className="text-gray-500 font-mono text-xs mt-1">VIN: {vin}</Text>
                {shippingProvider && (
                    <View className="bg-purple-500/20 self-start px-2 py-1 rounded mt-2">
                        <Text className="text-purple-400 text-xs font-medium">{shippingProvider}</Text>
                    </View>
                )}
            </View>

            <View className="flex-row justify-between items-center border-t border-gray-700 pt-3">
                <View className="flex-row items-center">
                    {pdfUrl && (
                        <View className="flex-row items-center bg-red-500/20 px-2 py-1 rounded mr-2">
                            <Ionicons name="document-text" size={14} color="#EF4444" />
                            <Text className="text-red-400 text-xs ml-1">PDF Available</Text>
                        </View>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
        </TouchableOpacity>
    );
}
