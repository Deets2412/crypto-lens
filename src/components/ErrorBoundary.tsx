'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <div className="error-fallback-icon">
            <AlertTriangle size={28} />
          </div>
          <h2>Something went wrong</h2>
          <p>
            {this.props.fallbackMessage ||
              'The market data gremlins struck again. This happens sometimes when APIs are feeling dramatic. Try refreshing.'}
          </p>
          <button onClick={this.handleRetry}>
            <RefreshCw size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Standalone error fallback for data loading failures (not React errors)
export function DataErrorFallback({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-fallback">
      <div className="error-fallback-icon">
        <AlertTriangle size={28} />
      </div>
      <h2>Failed to Load Data</h2>
      <p>
        {message ||
          'Couldn\'t fetch the latest market data. CoinGecko might be rate-limiting us, or the internet is having one of its moments.'}
      </p>
      {onRetry && (
        <button onClick={onRetry}>
          <RefreshCw size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Retry
        </button>
      )}
    </div>
  );
}
