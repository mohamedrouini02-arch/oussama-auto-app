import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionCard } from '../../components/finance/TransactionCard';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type Transaction = Database['public']['Tables']['financial_transactions']['Row'];

export default function FinanceScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        income: 0,
        expenses: 0,
        netProfit: 0
    });
    const router = useRouter();

    const fetchTransactions = async () => {
        try {
            let query = supabase
                .from('financial_transactions')
                .select('*')
                .order('transaction_date', { ascending: false });

            if (filter !== 'All') {
                query = query.eq('type', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            const txs = data || [];
            setTransactions(txs);

            // Update stats whenever we fetch transactions (or we could do it separately)
            calculateStats();

        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const calculateStats = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('amount, type');

            if (error) throw error;

            let income = 0;
            let expenses = 0;

            const txs = data as { amount: number; type: string }[] | null;

            txs?.forEach(tx => {
                if (tx.type === 'Income') {
                    income += tx.amount || 0;
                } else if (tx.type === 'Expense') {
                    expenses += tx.amount || 0;
                }
            });

            setStats({
                income,
                expenses,
                netProfit: income - expenses
            });
        } catch (error) {
            console.error('Error calculating stats:', error);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTransactions();
        await calculateStats();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + ' DZD';
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View className="px-4 pt-2 pb-6 bg-blue-600 rounded-b-[32px] shadow-lg">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-3xl font-bold text-white">Finance</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/finance/add' as any)}
                            className="bg-white/20 p-3 rounded-full backdrop-blur-sm"
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Summary Cards */}
                    <View className="flex-row justify-between mb-4">
                        <View className="bg-white/15 p-4 rounded-2xl flex-1 mr-2 backdrop-blur-md border border-white/10">
                            <View className="flex-row items-center mb-2">
                                <View className="bg-green-400/20 p-1.5 rounded-full mr-2">
                                    <Ionicons name="arrow-down" size={16} color="#4ADE80" />
                                </View>
                                <Text className="text-white/90 font-medium text-sm">Income</Text>
                            </View>
                            <Text className="text-white font-bold text-xl" numberOfLines={1}>
                                {formatCurrency(stats.income)}
                            </Text>
                        </View>
                        <View className="bg-white/15 p-4 rounded-2xl flex-1 ml-2 backdrop-blur-md border border-white/10">
                            <View className="flex-row items-center mb-2">
                                <View className="bg-red-400/20 p-1.5 rounded-full mr-2">
                                    <Ionicons name="arrow-up" size={16} color="#F87171" />
                                </View>
                                <Text className="text-white/90 font-medium text-sm">Expenses</Text>
                            </View>
                            <Text className="text-white font-bold text-xl" numberOfLines={1}>
                                {formatCurrency(stats.expenses)}
                            </Text>
                        </View>
                    </View>

                    <View className="bg-white p-5 rounded-2xl shadow-lg mx-1">
                        <Text className="text-gray-500 text-sm font-medium mb-1">Net Profit</Text>
                        <Text className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(stats.netProfit)}
                        </Text>
                    </View>
                </View>

                {/* Transactions List */}
                <View className="px-4 mt-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</Text>
                        <View className="flex-row bg-gray-200 dark:bg-gray-700 rounded-xl p-1">
                            {(['All', 'Income', 'Expense'] as const).map((f) => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-lg ${filter === f ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                >
                                    <Text className={`text-xs font-medium ${filter === f ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {f}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {transactions.length === 0 ? (
                        <View className="items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-4 font-medium">No transactions found</Text>
                        </View>
                    ) : (
                        transactions.map((tx) => (
                            <TransactionCard key={tx.id} transaction={tx} />
                        ))
                    )}
                </View>

                <View className="h-24" />
            </ScrollView>
        </SafeAreaView>
    );
}

