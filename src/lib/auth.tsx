'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ============================================================
// CoinDebrief — Auth & Subscription System
// ============================================================

export type UserTier = 'normie' | 'night_owl' | 'coin_sense';

const TIER_HIERARCHY: UserTier[] = ['normie', 'night_owl', 'coin_sense'];
const TRIAL_DAYS = 14;
const STORAGE_KEY = 'coindebrief_auth';

// Default admin credentials
const ADMIN_EMAIL = 'admin@coindebrief.com';
const ADMIN_PASSWORD = 'admin123';

export interface User {
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
    login: (email: string, password: string) => { success: boolean; error?: string };
    signup: (email: string, password: string, tier?: UserTier) => { success: boolean; error?: string };
    logout: () => void;
    upgradeTier: (tier: UserTier) => void;
    hasAccess: (requiredTier: UserTier) => boolean;
}

const AuthContext = createContext<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isTrialActive: false,
    trialDaysRemaining: 0,
    login: () => ({ success: false }),
    signup: () => ({ success: false }),
    logout: () => { },
    upgradeTier: () => { },
    hasAccess: () => false,
});

export function useAuth() {
    return useContext(AuthContext);
}

// Simple hash simulation for demo passwords
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'hash_' + Math.abs(hash).toString(36);
}

function getTrialDaysRemaining(trialStartDate: string): number {
    const start = new Date(trialStartDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, TRIAL_DAYS - elapsed);
}

interface StoredData {
    users: Record<string, { user: User; passwordHash: string }>;
    currentUser: string | null; // email of logged-in user
}

function loadStorage(): StoredData {
    if (typeof window === 'undefined') return { users: {}, currentUser: null };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw) as StoredData;
            // Ensure admin account always exists
            seedAdmin(data);
            return data;
        }
    } catch { }
    const fresh: StoredData = { users: {}, currentUser: null };
    seedAdmin(fresh);
    return fresh;
}

function seedAdmin(data: StoredData) {
    if (!data.users[ADMIN_EMAIL]) {
        data.users[ADMIN_EMAIL] = {
            user: {
                email: ADMIN_EMAIL,
                tier: 'coin_sense',
                trialStartDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                isAdmin: true,
            },
            passwordHash: simpleHash(ADMIN_PASSWORD),
        };
    }
}

function saveStorage(data: StoredData) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Load session on mount + seed admin
    useEffect(() => {
        const data = loadStorage();
        saveStorage(data); // persist the seeded admin
        if (data.currentUser && data.users[data.currentUser]) {
            setUser(data.users[data.currentUser].user);
        }
        setLoaded(true);
    }, []);

    const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
        const data = loadStorage();
        const normalizedEmail = email.toLowerCase().trim();
        const entry = data.users[normalizedEmail];
        if (!entry) {
            return { success: false, error: 'No account found with this email.' };
        }
        if (entry.passwordHash !== simpleHash(password)) {
            return { success: false, error: 'Incorrect password.' };
        }
        data.currentUser = normalizedEmail;
        saveStorage(data);
        setUser(entry.user);
        return { success: true };
    }, []);

    const signup = useCallback((email: string, password: string, tier: UserTier = 'normie'): { success: boolean; error?: string } => {
        const data = loadStorage();
        const normalizedEmail = email.toLowerCase().trim();
        if (data.users[normalizedEmail]) {
            return { success: false, error: 'An account with this email already exists.' };
        }
        const newUser: User = {
            email: normalizedEmail,
            tier,
            trialStartDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
        data.users[normalizedEmail] = {
            user: newUser,
            passwordHash: simpleHash(password),
        };
        data.currentUser = normalizedEmail;
        saveStorage(data);
        setUser(newUser);
        return { success: true };
    }, []);

    const logout = useCallback(() => {
        const data = loadStorage();
        data.currentUser = null;
        saveStorage(data);
        setUser(null);
    }, []);

    const upgradeTier = useCallback((tier: UserTier) => {
        if (!user) return;
        const data = loadStorage();
        const entry = data.users[user.email];
        if (entry) {
            entry.user.tier = tier;
            data.users[user.email] = entry;
            saveStorage(data);
            setUser({ ...entry.user });
        }
    }, [user]);

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

    // Don't render children until we've loaded from localStorage to avoid hydration flicker
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
