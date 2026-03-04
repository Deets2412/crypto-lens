'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
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

// Pages that render without the sidebar/header shell
const SHELL_FREE_PATHS = ['/login', '/signup', '/pricing'];

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const isShellFreePage = SHELL_FREE_PATHS.includes(pathname);

  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
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
        setDataLoading(false);
      }
    }
    loadData();

    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Show nothing while auth is loading to prevent flash
  if (authLoading) {
    return null;
  }

  // For auth/public pages, render without the sidebar/header shell
  if (isShellFreePage && !isAuthenticated) {
    return (
      <AppDataContext.Provider value={{ coins, news, loading: dataLoading }}>
        {children}
      </AppDataContext.Provider>
    );
  }

  // If not authenticated on a protected page, middleware handles redirect
  // But just in case, show nothing
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppDataContext.Provider value={{ coins, news, loading: dataLoading }}>
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
