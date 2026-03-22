import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60_000,
      gcTime:               5 * 60_000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── App খোলার সাথে সাথে server wake-up request পাঠাও ──────────────────────
const API = import.meta.env.VITE_API_BASE_URL || '';
fetch(`${API}/health`).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);