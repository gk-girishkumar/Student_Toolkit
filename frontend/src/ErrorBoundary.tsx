import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', background: '#f8fafc', color: '#111' }}>
          <h1 style={{ marginTop: 0 }}>Application error</h1>
          <p>{this.state.error.message}</p>
          <p>
            This usually means the Clerk publishable key is invalid or not configured correctly. Check <code>frontend/.env</code> and restart the dev server.
          </p>
          <p>
            If you need a valid key, get it from the Clerk dashboard under API keys.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
