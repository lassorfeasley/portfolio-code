import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
}


