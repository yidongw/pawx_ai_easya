'use client';

import type { ReactNode } from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketProvider';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: ReactNode; cookies: string | null }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <WebSocketProvider>
            {mounted && children}
          </WebSocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
  );
}
