'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { ErrorBoundary, DataErrorFallback } from './ErrorBoundary';
import { Coin, NewsArticle } from '@/lib/types';
import { fetchTopCoins, fetchNews } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AppData {
  coins: Coin[];
  news: NewsArticle[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}

const AppDataContext = createContext<AppData>({
  coins: [],
  news: [],
  loading: true,
  error: false,
  retry: () => {},
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
  const [dataError, setDataError] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const isShellFreePage = SHELL_FREE_PATHS.includes(pathname);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(false);
    try {
      const [coinsData, newsData] = await Promise.all([
        fetchTopCoins(100),
        fetchNews(50),
      ]);
      if (coinsData.length === 0 && newsData.length === 0) {
        setDataError(true);
      }
      setCoins(coinsData);
      setNews(newsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setDataError(true);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Show nothing while auth is loading to prevent flash
  if (authLoading) {
    return null;
  }

  // For auth/public pages, render without the sidebar/header shell
  if (isShellFreePage && !isAuthenticated) {
    return (
      <AppDataContext.Provider value={{ coins, news, loading: dataLoading, error: dataError, retry: loadData }}>
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
    <AppDataContext.Provider value={{ coins, news, loading: dataLoading, error: dataError, retry: loadData }}>
      <ErrorBoundary>
        <div className="app-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <Header
            topCoins={coins.slice(0, 10)}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="main-content">
            {dataError && !dataLoading && coins.length === 0 ? (
              <DataErrorFallback onRetry={loadData} />
            ) : (
              children
            )}
          </main>
        </div>
      </ErrorBoundary>
    </AppDataContext.Provider>
  );
}
