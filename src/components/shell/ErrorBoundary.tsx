import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught', error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div
        role="alert"
        className="mx-auto max-w-3xl rounded-lg border border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950"
      >
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-red-800 dark:text-red-200">{error.message}</p>
        <p className="mt-2 text-xs text-red-700 dark:text-red-300">
          Reloading the page usually fixes this. If it keeps happening, the file may be in a format
          this tool doesn't support.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={this.reset} variant="destructive" size="sm">
            Try again
          </Button>
          <Button onClick={() => window.location.reload()} variant="ghost" size="sm">
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
