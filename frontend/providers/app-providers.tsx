'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from './auth-provider';
import { ThemeProvider } from './theme-provider';
import { NotificationProvider } from './notification-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return <ThemeProvider><QueryClientProvider client={queryClient}><NotificationProvider><AuthProvider>{children}</AuthProvider></NotificationProvider></QueryClientProvider></ThemeProvider>;
}
