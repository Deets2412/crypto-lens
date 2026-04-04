'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { Coin, NewsArticle } from '@/lib/types';
import { fetchTopCoins, fetchNews } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AppData {
    coins: Coin[];
    news: NewsArticle[];
    loading: boolean;
}

const AppDataContext = createContext<AppData>({
    coins: [],
    news: [],
    loading: true,
});

export function useAppData() {
    return useContext(AppDataContext);
}

// Pages that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup', '/pricing'];

export default function AppShell({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [coins, setCoins] = useState<Coin[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isPublicPage = PUBLIC_PATHS.includes(pathname);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [coinsData, newsData] = await Promise.all([
                    fetchTopCoins(100),
                    fetchNews(50),
                ]);
                setCoins(coinsData);
                setNews(newsData);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Refresh every 5 minutes
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Redirect unauthenticated users to login (except public pages)
    useEffect(() => {
        if (!isAuthenticated && !isPublicPage) {
            router.push('/login');
        }
    }, [isAuthenticated, isPublicPage, router]);

    // For auth pages (login/signup), render without the sidebar/header shell
    if (isPublicPage && !isAuthenticated) {
        return (
            <AppDataContext.Provider value={{ coins, news, loading }}>
                {children}
            </AppDataContext.Provider>
        );
    }

    // If not authenticated and not on a public page, show nothing while redirecting
    if (!isAuthenticated) {
        return null;
    }

    return (
        <AppDataContext.Provider value={{ coins, news, loading }}>
            <div className="app-layout">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <Header
                    topCoins={coins.slice(0, 10)}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className="main-content">{children}</main>
            </div>
        </AppDataContext.Provider>
    );
}
