import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';
import ErrorBoundary from './ErrorBoundary';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family:Inter, system-ui, sans-serif; padding:2rem; background:#f8fafc; color:#111;">
        <h1 style="margin-top:0;">Missing environment configuration</h1>
        <p>The frontend could not find <code>VITE_CLERK_PUBLISHABLE_KEY</code>.</p>
        <p>Please add it to <code>frontend/.env</code> and restart the dev server.</p>
      </div>
    `;
  }
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <App />
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ClerkProviderWithRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
