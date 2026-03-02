'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ============================================================
// CoinDebrief — Auth & Subscription System (Supabase + Stripe)
// ============================================================

export type UserTier = 'normie' | 'night_owl' | 'coin_sense';

const TIER_HIERARCHY: UserTier[] = ['normie', 'night_owl', 'coin_sense'];
const TRIAL_DAYS = 14;

export interface User {
  id: string;
  email: string;
  tier: UserTier;
  trialStartDate: string;
  createdAt: string;
  isAdmin?: boolean;
  stripeCustomerId?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  loading: boolean;
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
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  upgradeTier: async () => {},
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

async function fetchUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  if (error || !profile) {
    console.error('Failed to fetch profile:', error);
    return null;
  }

  // Check if user has an active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', supabaseUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const tier: UserTier = subscription?.tier || profile.tier || 'normie';

  return {
    id: profile.id,
    email: supabaseUser.email || profile.email,
    tier,
    trialStartDate: profile.trial_start_date || profile.created_at,
    createdAt: profile.created_at,
    isAdmin: profile.role === 'admin',
    stripeCustomerId: profile.stripe_customer_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          const profile = await fetchUserProfile(supabaseUser);
          setUser(profile);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user);
        setUser(profile);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, [supabase.auth]);

  const signup = useCallback(async (email: string, password: string, tier: UserTier = 'normie'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            tier,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Profile is created automatically via database trigger
        // But we set user state here for immediate UI update
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          tier,
          trialStartDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isAdmin: false,
          stripeCustomerId: null,
        });
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, [supabase.auth]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase.auth]);

  const upgradeTier = useCallback(async (tier: UserTier) => {
    if (!user) return;

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  }, [user]);

  const hasAccess = useCallback((requiredTier: UserTier): boolean => {
    if (!user) return false;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        isTrialActive: !!isTrialActive,
        trialDaysRemaining,
        loading,
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
