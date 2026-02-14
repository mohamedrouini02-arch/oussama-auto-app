import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Purchased' | 'Shipped' | 'Customs' | 'Ready' | 'Delivered';

type OrderCardProps = {
    id: string;
    reference: string;
    customerName: string;
    carModel: string;
    status: OrderStatus;
    date: string;
    budget?: string | null;
    customBudget?: string | null;
};

const STATUS_COLORS: Record<OrderStatus, string> = {
    Pending: '#F59E0B', // Orange
    Confirmed: '#3B82F6', // Blue
    Purchased: '#8B5CF6', // Purple
    Shipped: '#0EA5E9', // Sky Blue
    Customs: '#EAB308', // Yellow
    Ready: '#10B981', // Green
    Delivered: '#10B981', // Green
};

export function OrderCard({ id, reference, customerName, carModel, status, date, budget, customBudget }: OrderCardProps) {
    const router = useRouter();
    const color = STATUS_COLORS[status] || '#9CA3AF';

    return (
        <TouchableOpacity
            onPress={() => router.push(`/orders/${id}` as any)}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border-l-4"
            style={{ borderLeftColor: color }}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-xs text-gray-500 font-bold mb-1">{reference}</Text>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">{carModel}</Text>
                </View>
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
                    <Text className="text-xs font-bold" style={{ color: color }}>
                        {status}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center mb-2">
                <Ionicons name="person-outline" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                    {customerName}
                </Text>
            </View>

            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <Text className="text-xs text-gray-400">{date}</Text>
                {(budget || customBudget) && (
                    <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {(() => {
                            const budgetToShow = budget === 'Other' && customBudget ? customBudget : (customBudget || budget);
                            if (!budgetToShow) return '';
                            // Check if numeric
                            const numericBudget = parseFloat(budgetToShow);
                            if (!isNaN(numericBudget)) {
                                return `${numericBudget.toLocaleString()} DZD`;
                            }
                            // Non-numeric, display as-is
                            return budgetToShow;
                        })()}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}
