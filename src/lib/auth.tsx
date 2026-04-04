'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from './supabase';

// ============================================================
// CoinDebrief — Auth & Subscription System (Supabase)
// ============================================================

export type UserTier = 'normie' | 'night_owl' | 'coin_sense';

const TIER_HIERARCHY: UserTier[] = ['normie', 'night_owl', 'coin_sense'];
const TRIAL_DAYS = 14;

// Default admin credentials
const ADMIN_EMAIL = 'admin@coindebrief.com';

export interface User {
    id: string; // Add Supabase UUID
    email: string;
    tier: UserTier;
    trialStartDate: string; // ISO date string
    createdAt: string;
    isAdmin?: boolean;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isTrialActive: boolean;
    trialDaysRemaining: number;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string, tier?: UserTier) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    upgradeTier: (tier: UserTier) => Promise<void>;
    hasAccess: (requiredTier: UserTier) => boolean;
}

const AuthContext = createContext<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isTrialActive: false,
    trialDaysRemaining: 0,
    login: async () => ({ success: false }),
    signup: async () => ({ success: false }),
    logout: async () => { },
    upgradeTier: async () => { },
    hasAccess: () => false,
});

export function useAuth() {
    return useContext(AuthContext);
}

function getTrialDaysRemaining(trialStartDate: string): number {
    const start = new Date(trialStartDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, TRIAL_DAYS - elapsed);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState(false);

    // We create a supabase client inside the provider
    const supabase = createClient();

    const fetchProfile = useCallback(async (email: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            tier: data.tier as UserTier,
            trialStartDate: data.trial_start_date,
            createdAt: data.created_at,
            isAdmin: data.email === ADMIN_EMAIL,
        } as User;
    }, [supabase]);

    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                const profile = await fetchProfile(session.user.email);
                setUser(profile);
            }
            setLoaded(true);

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user?.email) {
                    const profile = await fetchProfile(session.user.email);
                    setUser(profile);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            initSession();
        } else {
            console.warn('Supabase keys not found. Auth will not work until .env.local is configured.');
            setLoaded(true);
        }
    }, [supabase, fetchProfile]);

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }, [supabase]);

    const signup = useCallback(async (email: string, password: string, tier: UserTier = 'normie'): Promise<{ success: boolean; error?: string }> => {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Supabase Auth Error:', authError);
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            console.error('Signup returned no user object:', authData);
            return { success: false, error: 'Signup failed. Please check your email configuration.' };
        }

        if (authData.user) {
            // 2. Create the user profile in our public.users table
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: email.toLowerCase(),
                        tier: tier,
                    }
                ]);

            if (dbError) {
                console.error('Error creating profile:', dbError);
                // Return success anyway, as the auth succeeded, but profile creation failed. 
                // We should ideally clean this up or handle better in a production app.
            }
        }

        return { success: true };
    }, [supabase]);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
    }, [supabase]);

    const upgradeTier = useCallback(async (tier: UserTier) => {
        if (!user) return;

        const { error } = await supabase
            .from('users')
            .update({ tier })
            .eq('email', user.email);

        if (!error) {
            setUser({ ...user, tier });
        } else {
            console.error('Failed to update tier:', error);
        }
    }, [user, supabase]);

    const hasAccess = useCallback((requiredTier: UserTier): boolean => {
        if (!user) return false;
        // Admins bypass all tier restrictions
        if (user.isAdmin) return true;

        const userLevel = TIER_HIERARCHY.indexOf(user.tier);
        const requiredLevel = TIER_HIERARCHY.indexOf(requiredTier);
        if (userLevel < 0) return false;

        // Check if trial is expired for normie tier
        if (user.tier === 'normie') {
            const daysLeft = getTrialDaysRemaining(user.trialStartDate);
            if (daysLeft <= 0) return false;
        }

        return userLevel >= requiredLevel;
    }, [user]);

    const isTrialActive = user?.tier === 'normie' && !user?.isAdmin && getTrialDaysRemaining(user.trialStartDate) > 0;
    const trialDaysRemaining = user ? getTrialDaysRemaining(user.trialStartDate) : 0;

    // Don't render children until we've loaded to avoid hydration flicker
    if (!loaded) {
        return null;
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isAdmin: !!user?.isAdmin,
                isTrialActive: !!isTrialActive,
                trialDaysRemaining,
                login,
                signup,
                logout,
                upgradeTier,
                hasAccess,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
