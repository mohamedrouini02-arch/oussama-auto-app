import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { Database } from '../../lib/database.types';

type Transaction = Database['public']['Tables']['financial_transactions']['Row'];

type TransactionCardProps = {
    transaction: Transaction;
};

export function TransactionCard({ transaction }: TransactionCardProps) {
    const isIncome = transaction.type === 'Income';
    const color = isIncome ? '#10B981' : '#EF4444';
    const bgColor = isIncome ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20';
    const iconName = isIncome ? 'arrow-down' : 'arrow-up';

    return (
        <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${bgColor}`}>
                        <Ionicons name={iconName} size={20} color={color} />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-gray-900 dark:text-white text-base">{transaction.category}</Text>
                        <Text className="text-gray-500 text-xs">{new Date(transaction.transaction_date).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Text className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} DZD
                </Text>
            </View>

            {transaction.description && (
                <Text className="text-gray-600 dark:text-gray-300 text-sm mb-2 pl-13">
                    {transaction.description}
                </Text>
            )}

            {(transaction.related_order_id || transaction.related_car_id) && (
                <View className="flex-row gap-2 mt-1 pl-13">
                    {transaction.related_order_id && (
                        <View className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                                Order #{transaction.related_order_id.slice(0, 8)}
                            </Text>
                        </View>
                    )}
                    {transaction.related_car_id && (
                        <View className="bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                                Car #{transaction.related_car_id.slice(0, 8)}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
