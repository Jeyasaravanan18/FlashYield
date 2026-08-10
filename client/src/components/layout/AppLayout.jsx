import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useLocationStore } from "../../store/locationStore";
import { useLogout } from "../../api/hooks";
import { LocationModal } from "../modals/LocationModal";
import { AuthModal } from "../modals/AuthModal";
import { CustomerAssistant } from "../chat/CustomerAssistant";
import { CustomerNotificationBridge } from "../notifications/CustomerNotificationBridge";
import {
  LogOut,
  Menu,
  X,
  Bell,
  CheckCheck
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNotificationStore } from "../../store/notificationStore";
function AppLayout() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { label: locationLabel, status: locationStatus, openLocationModal } = useLocationStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const notificationsRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (locationStatus === "idle") {
      openLocationModal();
    }
  }, [locationStatus, openLocationModal]);
  const handleLogout = () => {
    logout.mutate(void 0, {
      onSettled: () => navigate("/login")
    });
  };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col bg-surface-100", children: [
    /* @__PURE__ */ jsx(LocationModal, {}),
    /* @__PURE__ */ jsx(AuthModal, {}),
    /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 shadow-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-8", children: [
          /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center group", children: /* @__PURE__ */ jsx("span", { className: "text-2xl font-display font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight leading-none uppercase", children: "FlashYield" }) }),
          /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex items-center gap-1", children: [
            user?.role !== "merchant" && /* @__PURE__ */ jsx(NavLink, { to: "/", active: location.pathname === "/", children: "Live Feed" }),
            user?.role !== "merchant" && /* @__PURE__ */ jsx(NavLink, { to: "/map", active: isActive("/map"), children: "Map" }),
            user?.role !== "merchant" && isAuthenticated && /* @__PURE__ */ jsx(NavLink, { to: "/favorites", active: isActive("/favorites"), children: "Favorites" }),
            user?.role === "merchant" && jsxs(Fragment, { children: [
              jsx(NavLink, { to: "/merchant", active: isActive("/merchant") && location.pathname === "/merchant", children: "Dashboard" }),
              jsx(NavLink, { to: "/merchant/listings/new", active: isActive("/merchant/listings/new"), children: "Post Surplus" }),
              jsx(NavLink, { to: "/merchant/schedule", active: isActive("/merchant/schedule"), children: "Schedule" }),
              jsx(NavLink, { to: "/merchant/charts", active: isActive("/merchant/charts"), children: "Charts" }),
              jsx(NavLink, { to: "/merchant/support", active: isActive("/merchant/support"), children: "Support" })
            ] }),
            user?.role !== "merchant" && /* @__PURE__ */ jsx(NavLink, { to: "/claims", active: isActive("/claims"), children: "My Tickets" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: openLocationModal,
              className: "hidden lg:flex items-center gap-2 text-xs font-medium text-surface-400 bg-surface-100 hover:bg-surface-200 transition-colors px-3 py-1.5 rounded-full",
              children: [
                /* @__PURE__ */ jsx("div", { className: `w-1.5 h-1.5 rounded-full ${locationStatus === "granted" ? "bg-accent-500" : locationStatus === "requesting" ? "bg-amber-400 animate-pulse" : "bg-surface-400"}` }),
                locationLabel
              ]
            }
          ),
          isAuthenticated ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            user?.role === "merchant" && /* @__PURE__ */ jsx(Link, { to: "/merchant/listings/new", className: "hidden md:block btn-primary px-4 py-2 text-xs rounded-lg", children: "Post Surplus" }),
            /* @__PURE__ */ jsx(Link, { to: user?.role === "merchant" ? "/merchant/profile" : "/profile", className: "hidden sm:flex items-center", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm hover:shadow-md transition-shadow", children: user?.email.charAt(0).toUpperCase() }) }),
            /* @__PURE__ */ jsxs("div", { className: "relative", ref: notificationsRef, children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setNotificationsOpen(!notificationsOpen),
                  className: "relative p-2 text-surface-500 hover:text-surface-900 transition-colors rounded-full hover:bg-surface-100",
                  children: [
                    /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5" }),
                    unreadCount() > 0 && /* @__PURE__ */ jsx("span", { className: "absolute top-1 right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white" })
                  ]
                }
              ),
              notificationsOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 mt-2 w-80 bg-white border border-surface-200 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-down", children: [
                /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-surface-100 flex justify-between items-center bg-surface-50", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-surface-900 text-sm", children: "Notifications" }),
                  unreadCount() > 0 && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => markAllRead(),
                      className: "text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(CheckCheck, { className: "w-3 h-3" }),
                        " Mark all read"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto", children: notifications.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-surface-400 text-sm", children: "No notifications yet" }) : notifications.map((notif) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: `p-3 border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer ${notif.read ? "opacity-60" : "bg-brand-50/30"}`,
                    onClick: () => !notif.read && markRead(notif.id),
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-2 mb-1", children: [
                        /* @__PURE__ */ jsx("h4", { className: "font-semibold text-surface-900 text-sm line-clamp-1", children: notif.title }),
                        !notif.read && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-surface-500 line-clamp-2", children: notif.message }),
                      /* @__PURE__ */ jsx("div", { className: "text-[10px] text-surface-400 mt-1.5 font-medium", children: new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
                    ]
                  },
                  notif.id
                )) })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleLogout,
                className: "hidden md:flex text-surface-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50",
                children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" })
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center gap-2", children: /* @__PURE__ */ jsx("button", { onClick: openAuthModal, className: "btn-primary px-5 py-2 text-xs rounded-lg", children: "Log In" }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setMobileMenuOpen(!mobileMenuOpen),
              className: "md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors",
              children: mobileMenuOpen ? /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Menu, { className: "w-5 h-5" })
            }
          )
        ] })
      ] }) }),
      mobileMenuOpen && /* @__PURE__ */ jsxs("div", { className: "md:hidden border-t border-surface-200/60 bg-white/95 backdrop-blur-xl p-4 space-y-2 animate-slide-down", children: [
        user?.role !== "merchant" && /* @__PURE__ */ jsx(MobileNavLink, { to: "/", active: location.pathname === "/", onClick: () => setMobileMenuOpen(false), children: "Live Feed" }),
        user?.role !== "merchant" && /* @__PURE__ */ jsx(MobileNavLink, { to: "/map", active: isActive("/map"), onClick: () => setMobileMenuOpen(false), children: "Map" }),
        user?.role !== "merchant" && isAuthenticated && /* @__PURE__ */ jsx(MobileNavLink, { to: "/favorites", active: isActive("/favorites"), onClick: () => setMobileMenuOpen(false), children: "Favorites" }),
        user?.role === "merchant" && jsxs(Fragment, { children: [
          jsx(MobileNavLink, { to: "/merchant", active: isActive("/merchant") && location.pathname === "/merchant", onClick: () => setMobileMenuOpen(false), children: "Dashboard" }),
          jsx(MobileNavLink, { to: "/merchant/listings/new", active: isActive("/merchant/listings/new"), onClick: () => setMobileMenuOpen(false), children: "Post Surplus" }),
          jsx(MobileNavLink, { to: "/merchant/schedule", active: isActive("/merchant/schedule"), onClick: () => setMobileMenuOpen(false), children: "Schedule" }),
          jsx(MobileNavLink, { to: "/merchant/charts", active: isActive("/merchant/charts"), onClick: () => setMobileMenuOpen(false), children: "Charts" }),
          jsx(MobileNavLink, { to: "/merchant/support", active: isActive("/merchant/support"), onClick: () => setMobileMenuOpen(false), children: "Support" })
        ] }),
        user?.role !== "merchant" && /* @__PURE__ */ jsx(MobileNavLink, { to: "/claims", active: isActive("/claims"), onClick: () => setMobileMenuOpen(false), children: "My Tickets" }),
        isAuthenticated && /* @__PURE__ */ jsx(MobileNavLink, { to: user?.role === "merchant" ? "/merchant/profile" : "/profile", active: isActive(user?.role === "merchant" ? "/merchant/profile" : "/profile"), onClick: () => setMobileMenuOpen(false), children: "Profile & Settings" }),
        isAuthenticated ? /* @__PURE__ */ jsxs(Fragment, { children: [
          user?.role === "merchant" && /* @__PURE__ */ jsx(Link, { to: "/merchant/listings/new", className: "block w-full text-center btn-primary py-3 rounded-xl", children: "Post Surplus" }),
          /* @__PURE__ */ jsx("button", { onClick: handleLogout, className: "block w-full text-center btn text-red-500 bg-red-50 py-3 rounded-xl", children: "Log Out" })
        ] }) : /* @__PURE__ */ jsx("button", { onClick: () => {
          setMobileMenuOpen(false);
          openAuthModal();
        }, className: "block w-full text-center btn-primary py-3 rounded-xl", children: "Log In" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 w-full", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    isAuthenticated && user?.role === "customer" && /* @__PURE__ */ jsx(CustomerAssistant, {}),
    isAuthenticated && user?.role === "customer" && /* @__PURE__ */ jsx(CustomerNotificationBridge, {}),
    /* @__PURE__ */ jsx("footer", { className: "bg-white border-t border-surface-200/60 py-12 mt-auto", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-display font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent uppercase", children: "FLASHYIELD" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-2 max-w-xs", children: "Direct-connect surplus liquidation for neighborhood kitchens." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-surface-400", children: "\xA9 2026 FlashYield \xB7 Prototype" })
    ] }) })
  ] });
}
function NavLink({ to, active, children }) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      to,
      className: `px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? "text-brand-500 bg-brand-50" : "text-surface-500 hover:text-surface-900 hover:bg-surface-100"}`,
      children
    }
  );
}
function MobileNavLink({ to, active, onClick, children }) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      to,
      onClick,
      className: `block px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${active ? "bg-brand-50 text-brand-600" : "text-surface-600 hover:bg-surface-100"}`,
      children
    }
  );
}
export {
  AppLayout
};
