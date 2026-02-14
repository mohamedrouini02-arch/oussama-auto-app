import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';

export default function AddTransaction() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Transaction Information
        type: 'Income' as 'Income' | 'Expense',
        category: 'Car Sale', // Default
        description: '',

        // Payment Details
        currency: 'DZD',
        amount: '',
        paidAmount: '', // For partial payments
        paymentStatus: 'pending',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],

        // Car Details (Conditional)
        carModel: '',
        carYear: '',
        carVin: '',

        // Seller, Buyer & Commissions
        sellerName: '',
        sellerCommission: '',
        buyerName: '',
        buyerCommission: '',
        bureauCommission: '',

        // Additional Information
        relatedOrderNumber: '',
        notes: ''
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculateTotalCommissions = () => {
        const seller = parseFloat(formData.sellerCommission) || 0;
        const buyer = parseFloat(formData.buyerCommission) || 0;
        const bureau = parseFloat(formData.bureauCommission) || 0;
        return seller + buyer + bureau;
    };

    const calculateRemaining = () => {
        const total = parseFloat(formData.amount) || 0;
        const paid = parseFloat(formData.paidAmount) || 0;
        return Math.max(0, total - paid);
    };

    const handleSaveTransaction = async () => {
        if (!formData.amount || !formData.description) {
            Alert.alert('Error', 'Please fill in Amount and Description');
            return;
        }

        setLoading(true);
        try {
            // Sanitize and prepare data
            const type = formData.type.toLowerCase(); // income / expense
            const amount = parseFloat(formData.amount);

            if (isNaN(amount) || amount <= 0) {
                Alert.alert('Error', 'Please enter a valid amount greater than 0');
                setLoading(false);
                return;
            }

            // Append related order number to description
            let finalDescription = formData.description;
            if (formData.relatedOrderNumber) {
                finalDescription += `\n(Related Order: ${formData.relatedOrderNumber})`;
            }
            if (formData.notes) {
                finalDescription += `\nNotes: ${formData.notes}`;
            }
            if (formData.sellerName) {
                finalDescription += `\nSeller: ${formData.sellerName}`;
            }
            if (formData.buyerName) {
                finalDescription += `\nBuyer: ${formData.buyerName}`;
            }

            const newTransaction: Database['public']['Tables']['financial_transactions']['Insert'] = {
                type: type,
                amount: amount,
                category: formData.category,
                description: finalDescription,
                transaction_date: formData.date,
                currency: formData.currency,
                payment_method: formData.paymentMethod || null,
                payment_status: formData.paymentStatus,
                paid_amount: formData.paymentStatus === 'partial' ? (parseFloat(formData.paidAmount) || 0) : (formData.paymentStatus === 'paid' ? amount : 0),

                // Commissions (send null if 0 or empty)
                seller_commission: formData.sellerCommission ? parseFloat(formData.sellerCommission) : null,
                buyer_commission: formData.buyerCommission ? parseFloat(formData.buyerCommission) : null,
                bureau_commission: formData.bureauCommission ? parseFloat(formData.bureauCommission) : null,

                // Car Details (send null if empty)
                car_model: formData.carModel || null,
                car_year: formData.carYear || null,
                car_vin: formData.carVin || null,

                // Explicitly set foreign keys to null
                related_order_id: null,
                related_car_id: null
            };

            console.log('Sending Transaction:', JSON.stringify(newTransaction, null, 2));

            const { data, error } = await (supabase
                .from('financial_transactions') as any)
                .insert(newTransaction)
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            Alert.alert('Success', 'Transaction recorded successfully', [
                { text: 'OK', onPress: () => router.replace('/finance') }
            ]);
        } catch (error: any) {
            console.error('Transaction Save Error:', error);
            Alert.alert('Error', error.message || 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    const isCarTransaction = formData.category === 'Car Sale' || formData.category === 'Buying Car';

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{
                headerShown: true,
                title: 'New Transaction',
                headerBackTitle: 'Cancel',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="px-4">
                        <Text className="text-blue-600 font-medium text-lg">Cancel</Text>
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1 px-4 py-4">
                {/* Transaction Information */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Transaction Info</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Type *</Text>
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => updateField('type', 'Income')}
                                className={`flex-1 py-3 rounded-lg items-center border-2 ${formData.type === 'Income' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <Text className={`font-bold ${formData.type === 'Income' ? 'text-green-600' : 'text-gray-500'}`}>Income</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => updateField('type', 'Expense')}
                                className={`flex-1 py-3 rounded-lg items-center border-2 ${formData.type === 'Expense' ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <Text className={`font-bold ${formData.type === 'Expense' ? 'text-red-600' : 'text-gray-500'}`}>Expense</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Category *</Text>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Picker
                                selectedValue={formData.category}
                                onValueChange={(value) => updateField('category', value)}
                            >
                                <Picker.Item label="Car Sale (بيع سيارة)" value="Car Sale" />
                                <Picker.Item label="Buying Car (شراء سيارة)" value="Buying Car" />
                                <Picker.Item label="Shipping (شحن)" value="Shipping" />
                                <Picker.Item label="Customs (جمارك)" value="Customs" />
                                <Picker.Item label="Commission (عمولة)" value="Commission" />
                                <Picker.Item label="Salaries (رواتب)" value="Salaries" />
                                <Picker.Item label="Rent (إيجار)" value="Rent" />
                                <Picker.Item label="Maintenance (صيانة)" value="Maintenance" />
                                <Picker.Item label="Marketing (تسويق)" value="Marketing" />
                                <Picker.Item label="Other (أخرى)" value="Other" />
                            </Picker>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Description *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="Details about the transaction..."
                            value={formData.description}
                            onChangeText={(text) => updateField('description', text)}
                        />
                    </View>
                </View>

                {/* Car Details (Conditional) */}
                {isCarTransaction && (
                    <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="car-sport" size={20} color="#F59E0B" />
                            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Car Details</Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Car Model</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                placeholder="e.g. Kia Sportage"
                                value={formData.carModel}
                                onChangeText={(text) => updateField('carModel', text)}
                            />
                        </View>

                        <View className="flex-row gap-4">
                            <View className="flex-1 mb-4">
                                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Year</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    placeholder="2023"
                                    keyboardType="numeric"
                                    value={formData.carYear}
                                    onChangeText={(text) => updateField('carYear', text)}
                                />
                            </View>
                            <View className="flex-1 mb-4">
                                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">VIN (Optional)</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    placeholder="Chassis Number"
                                    value={formData.carVin}
                                    onChangeText={(text) => updateField('carVin', text)}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment Details */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="wallet" size={20} color="#10B981" />
                        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Payment Details</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Currency</Text>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Picker
                                selectedValue={formData.currency}
                                onValueChange={(value) => updateField('currency', value)}
                            >
                                <Picker.Item label="Algerian Dinar (DZD)" value="DZD" />
                                <Picker.Item label="Euro (EUR)" value="EUR" />
                                <Picker.Item label="US Dollar (USD)" value="USD" />
                                <Picker.Item label="South Korean Won (KRW)" value="KRW" />
                                <Picker.Item label="Tether (USDT)" value="USDT" />
                            </Picker>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Total Amount *</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xl font-bold"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={formData.amount}
                            onChangeText={(text) => updateField('amount', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Payment Status</Text>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Picker
                                selectedValue={formData.paymentStatus}
                                onValueChange={(value) => updateField('paymentStatus', value)}
                            >
                                <Picker.Item label="Fully Paid" value="paid" />
                                <Picker.Item label="Partially Paid" value="partial" />
                                <Picker.Item label="Pending" value="pending" />
                            </Picker>
                        </View>
                    </View>

                    {formData.paymentStatus === 'partial' && (
                        <View className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Paid Amount</Text>
                            <TextInput
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-2"
                                placeholder="Amount paid so far"
                                keyboardType="numeric"
                                value={formData.paidAmount}
                                onChangeText={(text) => updateField('paidAmount', text)}
                            />
                            <Text className="text-gray-500 text-sm">
                                Remaining: {calculateRemaining().toLocaleString()} {formData.currency}
                            </Text>
                        </View>
                    )}

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Payment Method</Text>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Picker
                                selectedValue={formData.paymentMethod}
                                onValueChange={(value) => updateField('paymentMethod', value)}
                            >
                                <Picker.Item label="Cash" value="cash" />
                                <Picker.Item label="Bank Transfer" value="bank_transfer" />
                                <Picker.Item label="Check" value="check" />
                                <Picker.Item label="Credit Card" value="credit_card" />
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Commissions (Only for Car Transactions) */}
                {isCarTransaction && (
                    <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-4">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="people" size={20} color="#8B5CF6" />
                            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Commissions & Parties</Text>
                        </View>

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Seller Name</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    value={formData.sellerName}
                                    onChangeText={(text) => updateField('sellerName', text)}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Buyer Name</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    value={formData.buyerName}
                                    onChangeText={(text) => updateField('buyerName', text)}
                                />
                            </View>
                        </View>

                        <View className="mb-2">
                            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">Seller Commission</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                keyboardType="numeric"
                                value={formData.sellerCommission}
                                onChangeText={(text) => updateField('sellerCommission', text)}
                            />
                        </View>
                        <View className="mb-2">
                            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">Buyer Commission</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                keyboardType="numeric"
                                value={formData.buyerCommission}
                                onChangeText={(text) => updateField('buyerCommission', text)}
                            />
                        </View>
                        <View className="mb-4">
                            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">Bureau Commission</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                keyboardType="numeric"
                                value={formData.bureauCommission}
                                onChangeText={(text) => updateField('bureauCommission', text)}
                            />
                        </View>

                        <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <Text className="text-blue-800 dark:text-blue-200 font-bold text-center">
                                Total Commissions: {calculateTotalCommissions().toLocaleString()} {formData.currency}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Additional Info */}
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-24">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="document-text" size={20} color="#6B7280" />
                        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-2">Additional Info</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Related Order Number</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            placeholder="e.g. WA-2025-..."
                            value={formData.relatedOrderNumber}
                            onChangeText={(text) => updateField('relatedOrderNumber', text)}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Notes</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                            multiline
                            numberOfLines={3}
                            value={formData.notes}
                            onChangeText={(text) => updateField('notes', text)}
                        />
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-xl items-center"
                    disabled={loading}
                >
                    <Text className="text-gray-700 dark:text-white font-bold text-lg">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSaveTransaction}
                    className={`flex-1 py-3 rounded-xl items-center ${formData.type === 'Income' ? 'bg-green-600' : 'bg-red-600'} ${loading ? 'opacity-70' : ''}`}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Save</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
