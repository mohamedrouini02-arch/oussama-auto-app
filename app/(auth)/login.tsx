import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const { signInWithEmail, saveCredentials, getCredentials } = useAuth();
    const router = useRouter();

    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        const { error } = await signInWithEmail(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            // Ask to enable biometric login if supported
            if (isBiometricSupported) {
                Alert.alert(
                    'Enable Biometric Login?',
                    'Would you like to use FaceID/TouchID for future logins?',
                    [
                        {
                            text: 'No',
                            style: 'cancel',
                        },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                await saveCredentials(email, password);
                            },
                        },
                    ]
                );
            }
        }
    };

    const handleBiometricLogin = async () => {
        const { email: savedEmail, password: savedPassword } = await getCredentials();

        if (!savedEmail || !savedPassword) {
            Alert.alert('No Credentials', 'Please log in with your password first to enable biometric login.');
            return;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Login with Biometrics',
            fallbackLabel: 'Use Password',
        });

        if (result.success) {
            setLoading(true);
            setEmail(savedEmail); // Pre-fill for visual feedback
            const { error } = await signInWithEmail(savedEmail, savedPassword);
            setLoading(false);

            if (error) {
                Alert.alert('Login Failed', 'Saved credentials might be invalid. Please login with password.');
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900 justify-center px-6">
            <StatusBar style="light" />

            <View className="items-center mb-10">
                {/* Placeholder for Logo */}
                <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4">
                    <Text className="text-3xl text-white font-bold">WA</Text>
                </View>
                <Text className="text-3xl font-bold text-white">Wahid Auto</Text>
                <Text className="text-gray-400 mt-2">Admin Dashboard</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-gray-400 mb-2 ml-1">Email</Text>
                    <TextInput
                        className="w-full bg-gray-800 text-white p-4 rounded-xl border border-gray-700 focus:border-blue-500"
                        placeholder="admin@wahidauto.com"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View>
                    <Text className="text-gray-400 mb-2 ml-1">Password</Text>
                    <TextInput
                        className="w-full bg-gray-800 text-white p-4 rounded-xl border border-gray-700 focus:border-blue-500"
                        placeholder="••••••••"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="w-full bg-blue-600 p-4 rounded-xl items-center mt-6"
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign In</Text>
                    )}
                </TouchableOpacity>

                {isBiometricSupported && (
                    <TouchableOpacity
                        className="w-full bg-gray-800 p-4 rounded-xl items-center mt-4 flex-row justify-center border border-gray-700"
                        onPress={handleBiometricLogin}
                        disabled={loading}
                    >
                        <Ionicons name="finger-print" size={24} color="#3B82F6" style={{ marginRight: 10 }} />
                        <Text className="text-white font-medium">Login with Biometrics</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity className="items-center mt-4">
                    <Text className="text-blue-400">Forgot Password?</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
