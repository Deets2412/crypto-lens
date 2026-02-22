'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Coin, NewsArticle } from '@/lib/types';
import { fetchTopCoins, fetchNews } from '@/lib/api';

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

export default function AppShell({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [coins, setCoins] = useState<Coin[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

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
