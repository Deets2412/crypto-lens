'use client';

import { ReactNode } from 'react';
import Header from './Header';

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="main-content" style={{ flex: 1, padding: '40px' }}>
                {children}
            </main>
        </div>
    );
}
