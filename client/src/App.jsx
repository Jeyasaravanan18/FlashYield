import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useSocket } from "./hooks/useSocket";
import { AppLayout } from "./components/layout/AppLayout";
import { BrowsePage } from "./pages/customer/BrowsePage";
import { ListingDetailPage } from "./pages/customer/ListingDetailPage";
import { MyClaimsPage } from "./pages/customer/MyClaimsPage";
import { ClaimDetailPage } from "./pages/customer/ClaimDetailPage";
import { MapPage } from "./pages/customer/MapPage";
import { ProfilePage } from "./pages/customer/ProfilePage";
import { FavoritesPage } from "./pages/customer/FavoritesPage";
import { MerchantDashboard } from "./pages/merchant/MerchantDashboard";
import { CreateListingPage } from "./pages/merchant/CreateListingPage";
import { VerifyTokenPage } from "./pages/merchant/VerifyTokenPage";
import { MerchantOnboarding } from "./pages/merchant/MerchantOnboarding";
import { MerchantQueuePage } from "./pages/merchant/MerchantQueuePage";
import { MerchantNotificationsPage } from "./pages/merchant/MerchantNotificationsPage";
import { MerchantHandoffLogPage } from "./pages/merchant/MerchantHandoffLogPage";
import { MerchantExportsPage } from "./pages/merchant/MerchantExportsPage";
import { MerchantProfileToolsPage } from "./pages/merchant/MerchantProfileToolsPage";
import { MerchantBatchPostPage } from "./pages/merchant/MerchantBatchPostPage";
import { MerchantSchedulePage } from "./pages/merchant/MerchantSchedulePage";
import { MerchantNoShowsPage } from "./pages/merchant/MerchantNoShowsPage";
import { MerchantChartsPage } from "./pages/merchant/MerchantChartsPage";
import { MerchantForecastPage } from "./pages/merchant/MerchantForecastPage";
import { MerchantPromotionPage } from "./pages/merchant/MerchantPromotionPage";
import { SupportPage } from "./pages/merchant/SupportPage";
import { AdminOverview } from "./pages/admin/AdminOverview";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1e3 * 60,
      // 1 minute
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
function ProtectedRoute({
  children,
  roles
}) {
  const { isAuthenticated, user, openAuthModal } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true });
  }
  if (roles && user && !roles.includes(user.role)) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function HomeRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.role === "merchant") {
    return /* @__PURE__ */ jsx(Navigate, { to: "/merchant", replace: true });
  }
  return /* @__PURE__ */ jsx(BrowsePage, {});
}
function AppRoutes() {
  useSocket();
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/register", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) }),
    /* @__PURE__ */ jsxs(Route, { path: "/", element: /* @__PURE__ */ jsx(AppLayout, {}), children: [
      /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(HomeRoute, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "listings/:id", element: /* @__PURE__ */ jsx(ListingDetailPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "map", element: /* @__PURE__ */ jsx(MapPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "claims", element: /* @__PURE__ */ jsx(MyClaimsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "claims/:id", element: /* @__PURE__ */ jsx(ClaimDetailPage, {}) }),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "favorites",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["customer", "admin"], children: /* @__PURE__ */ jsx(FavoritesPage, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "profile",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { children: /* @__PURE__ */ jsx(ProfilePage, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "merchant/profile",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(ProfilePage, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "merchant",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantDashboard, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "merchant/onboarding",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantOnboarding, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "merchant/listings/new",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(CreateListingPage, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "merchant/verify",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(VerifyTokenPage, {}) })
        }
      ),
      /* @__PURE__ */ jsx(Route, { path: "merchant/queue", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantQueuePage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/notifications", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantNotificationsPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/handoff-log", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantHandoffLogPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/exports", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantExportsPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/profile-tools", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantProfileToolsPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/batch-post", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantBatchPostPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/schedule", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantSchedulePage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/no-shows", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantNoShowsPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/charts", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantChartsPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/forecast", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantForecastPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/promotions", element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["merchant"], children: /* @__PURE__ */ jsx(MerchantPromotionPage, {}) }) }),
      /* @__PURE__ */ jsx(Route, { path: "merchant/support", element: /* @__PURE__ */ jsx(ProtectedRoute, { children: /* @__PURE__ */ jsx(SupportPage, {}) }) }),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "admin",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { roles: ["admin"], children: /* @__PURE__ */ jsx(AdminOverview, {}) })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(BrowserRouter, { children: /* @__PURE__ */ jsx(AppRoutes, {}) }) });
}
export {
  App as default
};
