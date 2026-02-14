import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function TestSuite() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    useEffect(() => {
        runTests();
    }, []);

    const runTests = async () => {
        addLog('Starting System Tests...');

        try {
            // Test 1: Shipping Form
            addLog('Test 1: Creating Shipping Form...');
            const { data: shippingData, error: shippingError } = await supabase
                .from('shipping_forms')
                .insert({
                    customer_name: 'Test User',
                    customer_phone: '1234567890',
                    vehicle_model: 'Test Car',
                    vin: 'TEST-VIN-123',
                    status: 'pending'
                })
                .select()
                .single();

            if (shippingError) throw new Error(`Shipping Error: ${shippingError.message}`);
            addLog(`✅ Shipping Form Created: ID ${shippingData.id}`);

            // Clean up Shipping
            await supabase.from('shipping_forms').delete().eq('id', shippingData.id);
            addLog('✅ Shipping Form Cleaned up');

        } catch (e: any) {
            addLog(`❌ Test 1 Failed: ${e.message}`);
        }

        try {
            // Test 2: Financial Transaction
            addLog('Test 2: Creating Financial Transaction...');
            const { data: financeData, error: financeError } = await supabase
                .from('financial_transactions')
                .insert({
                    type: 'expense',
                    amount: 100,
                    category: 'Test',
                    description: 'System Test Transaction',
                    transaction_date: new Date().toISOString().split('T')[0],
                    currency: 'DZD',
                    payment_status: 'paid'
                })
                .select()
                .single();

            if (financeError) throw new Error(`Finance Error: ${financeError.message}`);
            addLog(`✅ Transaction Created: ID ${financeData.id}`);

            // Clean up Finance
            await supabase.from('financial_transactions').delete().eq('id', financeData.id);
            addLog('✅ Transaction Cleaned up');

        } catch (e: any) {
            addLog(`❌ Test 2 Failed: ${e.message}`);
        }

        try {
            // Test 3: Order Create & Delete
            addLog('Test 3: Creating Order...');
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    reference_number: `TEST-${Date.now()}`,
                    status: 'pending',
                    customer_name: 'Test Customer',
                    customer_phone: '0000000000'
                })
                .select()
                .single();

            if (orderError) throw new Error(`Order Create Error: ${orderError.message}`);
            addLog(`✅ Order Created: ID ${orderData.id}`);

            addLog('Test 3b: Deleting Order...');
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderData.id);

            if (deleteError) throw new Error(`Order Delete Error: ${deleteError.message}`);
            addLog('✅ Order Deleted Successfully');

        } catch (e: any) {
            addLog(`❌ Test 3 Failed: ${e.message}`);
        }

        addLog('Tests Completed.');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ title: 'System Tests' }} />
            <ScrollView className="p-4">
                {logs.map((log, i) => (
                    <Text key={i} className={`mb-2 font-mono ${log.includes('❌') ? 'text-red-600' : log.includes('✅') ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        {log}
                    </Text>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
