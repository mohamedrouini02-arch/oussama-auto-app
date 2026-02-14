import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

type ShippingForm = Database['public']['Tables']['shipping_forms']['Row'];

const SHIPPING_PROVIDERS = ['dumsan', 'El rawassi', 'Alko car'];

export default function ShippingScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [forms, setForms] = useState<ShippingForm[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [providerFilter, setProviderFilter] = useState('All');
    const router = useRouter();

    const fetchForms = async () => {
        try {
            let query = supabase
                .from('shipping_forms')
                .select('*')
                .order('created_at', { ascending: false });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,vehicle_model.ilike.%${searchQuery}%,vin_number.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setForms(data || []);
        } catch (error) {
            console.error('Error fetching shipping forms:', error);
        }
    };

    useEffect(() => {
        fetchForms();
    }, [searchQuery]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchForms();
        setRefreshing(false);
    };

    const getStatusColor = (status: string | null) => {
        switch (status?.toLowerCase()) {
            case 'completed': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'processing': return '#3B82F6';
            default: return '#9CA3AF';
        }
    };

    // Filter forms by provider
    const filteredForms = forms.filter(item => {
        if (providerFilter === 'All') return true;
        if (providerFilter === 'No Provider') {
            return !item.shipping_provider || item.shipping_provider.trim() === '';
        }
        return item.shipping_provider === providerFilter;
    });

    // Calculate counts for each tab
    const getCount = (filter: string) => {
        if (filter === 'All') return forms.length;
        if (filter === 'No Provider') {
            return forms.filter(f => !f.shipping_provider || f.shipping_provider.trim() === '').length;
        }
        return forms.filter(f => f.shipping_provider === filter).length;
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 pt-2 pb-4 bg-white dark:bg-gray-800 shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Shipping Forms</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/shipping/add' as any)}
                        className="bg-blue-600 p-2 rounded-full"
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-3">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search forms..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 ml-2 text-gray-900 dark:text-white"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Provider Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <TouchableOpacity
                        onPress={() => setProviderFilter('All')}
                        className={`px-4 py-2 rounded-full mr-2 ${providerFilter === 'All' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <Text className={`font-medium ${providerFilter === 'All' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>All ({getCount('All')})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setProviderFilter('No Provider')}
                        className={`px-4 py-2 rounded-full mr-2 ${providerFilter === 'No Provider' ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <Text className={`font-medium ${providerFilter === 'No Provider' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>No Provider ({getCount('No Provider')})</Text>
                    </TouchableOpacity>
                    {SHIPPING_PROVIDERS.map((provider) => (
                        <TouchableOpacity
                            key={provider}
                            onPress={() => setProviderFilter(provider)}
                            className={`px-4 py-2 rounded-full mr-2 ${providerFilter === provider ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <Text className={`font-medium ${providerFilter === provider ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{provider} ({getCount(provider)})</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={filteredForms}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push(`/shipping/${item.id}` as any)}
                        className="bg-white dark:bg-gray-800 mx-4 mb-3 p-4 rounded-xl shadow-sm"
                    >
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.name || 'Unknown Customer'}</Text>
                                <Text className="text-gray-500 dark:text-gray-400">{item.vehicle_model || 'Unknown Vehicle'}</Text>
                            </View>
                            <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(item.status) }}>
                                <Text className="text-white text-xs font-bold capitalize">{item.status || 'Unknown'}</Text>
                            </View>
                        </View>

                        {item.shipping_provider && (
                            <View className="bg-purple-100 dark:bg-purple-900/30 self-start px-2 py-1 rounded mb-2">
                                <Text className="text-purple-700 dark:text-purple-300 text-xs font-medium">{item.shipping_provider}</Text>
                            </View>
                        )}

                        <View className="flex-row items-center mt-2">
                            <Ionicons name="barcode-outline" size={16} color="#6B7280" />
                            <Text className="text-gray-500 dark:text-gray-400 ml-1 text-xs">VIN: {item.vin_number || 'N/A'}</Text>

                            <View className="flex-1" />

                            <Text className="text-gray-400 text-xs">
                                {new Date(item.created_at || Date.now()).toLocaleDateString()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingVertical: 16 }}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-10">
                        <Text className="text-gray-500">No shipping forms found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
