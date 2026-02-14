
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarCard, CarStatus } from '../../components/inventory/CarCard';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

const TABS: (CarStatus | 'All')[] = ['All', 'Available', 'Reserved', 'Sold', 'In Transit'];

type Car = Database['public']['Tables']['car_inventory']['Row'];

export default function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<'All' | CarStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<Car[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchInventory = async () => {
    try {
      let query = supabase
        .from('car_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'All') {
        query = query.eq('status', activeTab);
      }

      if (searchQuery) {
        query = query.or(`brand.ilike.% ${searchQuery}%, model.ilike.% ${searchQuery}%, vin.ilike.% ${searchQuery}% `);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeTab, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-4 pt-2 pb-4 bg-white dark:bg-gray-800 shadow-sm z-10">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</Text>
          <TouchableOpacity
            onPress={() => router.push('/inventory/add' as any)}
            className="bg-blue-600 p-2 rounded-full"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search cars..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-gray-900 dark:text-white"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full mr-2 ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              <Text className={`font-medium ${activeTab === tab ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={inventory}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <CarCard
            id={item.id.toString()}
            brand={item.brand || 'Unknown'}
            model={item.model || 'Unknown'}
            year={item.year.toString()}
            price={item.selling_price ? item.selling_price.toLocaleString() : 'N/A'}
            status={item.status as CarStatus}
            location={item.location}
            image={item.photos_urls?.[0] || item.photos?.[0] || 'https://via.placeholder.com/300'}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center mt-10">
            <Text className="text-gray-500">No cars found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
