import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type OverviewCardProps = {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
};

const OverviewCard = ({ title, value, icon, color, bgColor }: OverviewCardProps) => (
    <View className="bg-gray-800 p-4 rounded-xl flex-1 mr-3 border border-gray-700 min-w-[150px]">
        <View className={`w-10 h-10 ${bgColor} rounded-full items-center justify-center mb-3`}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text className="text-gray-400 text-xs font-medium mb-1">{title}</Text>
        <Text className="text-white text-lg font-bold">{value}</Text>
    </View>
);

type OverviewCardsProps = {
    ordersCount: string;
    inventoryCount: string;
    revenueAmount: string;
    pendingTasks: string;
};

export default function OverviewCards({ ordersCount, inventoryCount, revenueAmount, pendingTasks }: OverviewCardsProps) {
    return (
        <View className="px-4 mt-4">
            <View className="flex-row mb-4">
                <OverviewCard
                    title="Active Orders"
                    value={ordersCount}
                    icon="cart-outline"
                    color="#10B981"
                    bgColor="bg-emerald-500/20"
                />
                <OverviewCard
                    title="Inventory"
                    value={inventoryCount}
                    icon="car-sport-outline"
                    color="#3B82F6"
                    bgColor="bg-blue-500/20"
                />
            </View>
            <View className="flex-row">
                <OverviewCard
                    title="Total Revenue"
                    value={revenueAmount}
                    icon="cash-outline"
                    color="#F59E0B"
                    bgColor="bg-yellow-500/20"
                />
                <OverviewCard
                    title="Pending Tasks"
                    value={pendingTasks}
                    icon="checkbox-outline"
                    color="#EC4899"
                    bgColor="bg-pink-500/20"
                />
            </View>
        </View>
    );
}
