'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';
import RetroWindow from '@/app/components/RetroWindow';
import { logError } from '@/lib/utils/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Catches React render/commit errors and displays a RetroWindow fallback.
 * Prevents the entire tree from crashing while giving users a recovery path.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    logError('React render error captured by ErrorBoundary', {
      error,
      context: { componentStack: errorInfo.componentStack },
    });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="windowcanvas">
          <div className="retro-window-placeholder">
            <RetroWindow title="Something went wrong" disableDrag disableResize>
              <div className="paragraph" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p>This window hit an unexpected error.</p>
                {process.env.NODE_ENV === 'development' && this.state.error ? (
                  <details style={{ fontSize: '0.875rem' }}>
                    <summary style={{ cursor: 'pointer' }}>Error details (dev only)</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {this.state.error.toString()}
                      {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                    </pre>
                  </details>
                ) : null}
                <Link href="/" className="link-block-4 w-inline-block" style={{ textDecoration: 'underline' }}>
                  Return to home →
                </Link>
              </div>
            </RetroWindow>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
