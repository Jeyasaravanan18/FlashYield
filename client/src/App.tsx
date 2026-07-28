import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer Pages
import { BrowsePage } from './pages/customer/BrowsePage';
import { ListingDetailPage } from './pages/customer/ListingDetailPage';
import { MyClaimsPage } from './pages/customer/MyClaimsPage';
import { ClaimDetailPage } from './pages/customer/ClaimDetailPage';
import { MapPage } from './pages/customer/MapPage';
import { ProfilePage } from './pages/customer/ProfilePage';

// Merchant Pages
import { MerchantDashboard } from './pages/merchant/MerchantDashboard';
import { CreateListingPage } from './pages/merchant/CreateListingPage';
import { VerifyTokenPage } from './pages/merchant/VerifyTokenPage';
import { MerchantOnboarding } from './pages/merchant/MerchantOnboarding';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function HomeRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.role === 'merchant') {
    return <Navigate to="/merchant" replace />;
  }
  return <BrowsePage />;
}

function AppRoutes() {
  // Initialize Socket.IO connection
  useSocket();

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main app layout (Publicly accessible for browsing) */}
      <Route path="/" element={<AppLayout />}>
        
        {/* Publicly accessible pages */}
        <Route index element={<HomeRoute />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route path="map" element={<MapPage />} />

        {/* Customer Route (Handles its own auth rendering) */}
        <Route path="claims" element={<MyClaimsPage />} />
        <Route path="claims/:id" element={<ClaimDetailPage />} />
        
        {/* Profile / Settings */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Merchant Routes */}
        <Route
          path="merchant"
          element={
            <ProtectedRoute roles={['merchant']}>
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="merchant/onboarding"
          element={
            <ProtectedRoute roles={['merchant']}>
              <MerchantOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="merchant/listings/new"
          element={
            <ProtectedRoute roles={['merchant']}>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="merchant/verify"
          element={
            <ProtectedRoute roles={['merchant']}>
              <VerifyTokenPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOverview />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
