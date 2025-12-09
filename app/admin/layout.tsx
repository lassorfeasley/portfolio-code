import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// Disable pixel effect in admin area
const adminStyles = `
  .admin-root .pixel-loading-wrapper {
    display: contents !important;
  }
  .admin-root .pixel-loading-wrapper canvas {
    display: none !important;
  }
  .admin-root .pixel-loading-wrapper img {
    position: relative !important;
    width: auto !important;
    height: auto !important;
  }
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <style dangerouslySetInnerHTML={{ __html: adminStyles }} />
      <div className="admin-root">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}


