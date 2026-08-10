import { jsx } from "react/jsx-runtime";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { useAuthStore } from "./store/authStore";
import { api } from "./lib/api";
function Root() {
  const { setLoading, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const isLoading = useAuthStore((s) => s.isLoading);
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (isAuthenticated) {
          const res = await api.get("/auth/me");
          setAuth(res.data, useAuthStore.getState().accessToken);
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
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-2 border-surface-600 border-t-brand-600 rounded-full animate-spin" }) });
  }
  return /* @__PURE__ */ jsx(App, {});
}
createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(Root, {}) })
);
