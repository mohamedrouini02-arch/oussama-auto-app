import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type OverviewCardProps = {
    title: string;
    count: string | number;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
};

export function OverviewCard({ title, count, subtitle, icon, color, onPress }: OverviewCardProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex-1 mx-1 min-w-[150px]"
            style={{ borderLeftWidth: 4, borderLeftColor: color }}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                {subtitle && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {subtitle}
                    </Text>
                )}
            </View>

            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {count}
            </Text>

            <Text className="text-sm text-gray-600 dark:text-gray-300">
                {title}
            </Text>
        </TouchableOpacity>
    );
}
