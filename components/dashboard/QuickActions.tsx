import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

export function QuickActions() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const actions = [
        {
            label: 'Add New Order',
            icon: 'add-circle-outline',
            color: '#F59E0B',
            route: '/orders/new',
        },
        {
            label: 'Add New Car',
            icon: 'car-sport-outline',
            color: '#3B82F6',
            route: '/inventory/new',
        },
        {
            label: 'Record Transaction',
            icon: 'wallet-outline',
            color: '#10B981',
            route: '/finance/new',
        },
    ];

    return (
        <>
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg z-50"
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            <Modal
                transparent
                visible={isOpen}
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-end items-end p-6"
                    onPress={() => setIsOpen(false)}
                >
                    <View className="mb-16 items-end">
                        {actions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setIsOpen(false);
                                    router.push(action.route as any);
                                }}
                                className="flex-row items-center mb-4"
                            >
                                <View className="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm mr-3">
                                    <Text className="font-medium text-gray-900 dark:text-white">
                                        {action.label}
                                    </Text>
                                </View>
                                <View
                                    className="w-12 h-12 rounded-full items-center justify-center shadow-sm"
                                    style={{ backgroundColor: action.color }}
                                >
                                    <Ionicons name={action.icon as any} size={24} color="white" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}
