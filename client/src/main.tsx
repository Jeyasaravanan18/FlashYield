import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useAuthStore } from './store/authStore';
import { api } from './lib/api';

function Root() {
  const { setLoading, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const isLoading = useAuthStore(s => s.isLoading);

  useEffect(() => {
    // Initial auth check on mount
    const verifyAuth = async () => {
      try {
        if (isAuthenticated) {
          const res = await api.get('/auth/me');
          // Update user object if it changed
          setAuth(res.data, useAuthStore.getState().accessToken!);
        }
      } catch (err) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, setAuth, clearAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-surface-600 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
