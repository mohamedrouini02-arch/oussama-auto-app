import { Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const SECURE_STORE_EMAIL_KEY = 'wahid_auto_email';
const SECURE_STORE_PASSWORD_KEY = 'wahid_auto_password';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    userRole: string | null;
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    saveCredentials: (email: string, password: string) => Promise<void>;
    getCredentials: () => Promise<{ email: string | null; password: string | null }>;
    deleteCredentials: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    isAdmin: false,
    userRole: null,
    signInWithEmail: async () => ({ error: null }),
    signOut: async () => { },
    saveCredentials: async () => { },
    getCredentials: async () => ({ email: null, password: null }),
    deleteCredentials: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkUserRole(session?.user);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkUserRole(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserRole = async (user: User | null | undefined) => {
        if (!user) {
            setUserRole(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching role:', error);
                setUserRole('staff');
                return;
            }

            if (!data) {
                // Profile doesn't exist, create it
                console.log('No profile found, creating one...');
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        role: 'staff'
                    } as any)
                    .select('role')
                    .single();

                if (insertError) {
                    console.error('Error creating profile:', insertError);
                    setUserRole('staff');
                } else if (newProfile) {
                    console.log('Profile created successfully');
                    setUserRole((newProfile as any).role);
                }
            } else {
                setUserRole((data as any).role);
            }
        } catch (e) {
            console.error('Error checking user role:', e);
            setUserRole('staff');
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserRole(null);
    };

    const setStorageItem = async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(key, value);
                }
            } catch (e) {
                console.error('Local storage is unavailable:', e);
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    };

    const getStorageItem = async (key: string) => {
        if (Platform.OS === 'web') {
            try {
                if (typeof localStorage !== 'undefined') {
                    return localStorage.getItem(key);
                }
            } catch (e) {
                console.error('Local storage is unavailable:', e);
            }
            return null;
        } else {
            return await SecureStore.getItemAsync(key);
        }
    };

    const removeStorageItem = async (key: string) => {
        if (Platform.OS === 'web') {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error('Local storage is unavailable:', e);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    };

    const saveCredentials = async (email: string, password: string) => {
        try {
            await setStorageItem(SECURE_STORE_EMAIL_KEY, email);
            await setStorageItem(SECURE_STORE_PASSWORD_KEY, password);
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    };

    const getCredentials = async () => {
        try {
            const email = await getStorageItem(SECURE_STORE_EMAIL_KEY);
            const password = await getStorageItem(SECURE_STORE_PASSWORD_KEY);
            return { email, password };
        } catch (error) {
            console.error('Error getting credentials:', error);
            return { email: null, password: null };
        }
    };

    const deleteCredentials = async () => {
        try {
            await removeStorageItem(SECURE_STORE_EMAIL_KEY);
            await removeStorageItem(SECURE_STORE_PASSWORD_KEY);
        } catch (error) {
            console.error('Error deleting credentials:', error);
        }
    };

    const isAdmin = userRole === 'admin';

    return (
        <AuthContext.Provider value={{ session, user, loading, isAdmin, userRole, signInWithEmail, signOut, saveCredentials, getCredentials, deleteCredentials }}>
            {children}
        </AuthContext.Provider>
    );
}
