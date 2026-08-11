import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useLocationStore } from "../../store/locationStore";
import { useLogout } from "../../api/hooks";
import { LocationModal } from "../modals/LocationModal";
import { AuthModal } from "../modals/AuthModal";
import { CompleteProfileModal } from "../modals/CompleteProfileModal";
import { CustomerAssistant } from "../chat/CustomerAssistant";
import { CustomerNotificationBridge } from "../notifications/CustomerNotificationBridge";
import {
  LogOut,
  Menu,
  X,
  Bell,
  CheckCheck,
  ChevronDown,
  Percent,
  Search,
  Heart,
  Ticket,
  User,
  LayoutDashboard,
  PlusCircle,
  Calendar,
  BarChart,
  HelpCircle,
  Map as MapIcon,
  Shield
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNotificationStore } from "../../store/notificationStore";

export function AppLayout() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { label: locationLabel, status: locationStatus, openLocationModal, requestLocation } = useLocationStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [completeProfileOpen, setCompleteProfileOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "customer" && !user?.firstName) {
      setCompleteProfileOpen(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user?.role === "merchant") return;
    
    if (locationStatus === "idle") {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
          if (result.state === "granted") {
            requestLocation();
          } else {
            openLocationModal();
          }
        }).catch(() => openLocationModal());
      } else {
        openLocationModal();
      }
    }
  }, [locationStatus, user, openLocationModal, requestLocation]);

  const handleLogout = () => {
    logout.mutate(void 0, {
      onSettled: () => navigate("/")
    });
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen flex flex-col bg-surface-100">
      <LocationModal />
      <AuthModal />
      <CompleteProfileModal isOpen={completeProfileOpen} onClose={() => setCompleteProfileOpen(false)} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-surface-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Section: Logo + Location */}
            <div className="flex items-center gap-8 md:gap-12 lg:gap-16">
              <Link to="/" className="flex items-center group">
                <span className="text-2xl font-display font-bold text-brand-500 tracking-tight leading-none uppercase">
                  FlashYield
                </span>
              </Link>
              
              {user?.role !== "merchant" && user?.role !== "admin" && (
                <button
                  onClick={openLocationModal}
                  className="hidden lg:flex items-center gap-1.5 group hover:text-brand-500 transition-colors"
                >
                  <span className="text-sm font-bold text-surface-900 group-hover:text-brand-500 border-b-2 border-surface-900 group-hover:border-brand-500 pb-0.5 max-w-[150px] truncate">
                    {locationLabel === "Set Location" ? "Other" : locationLabel}
                  </span>
                  <ChevronDown className="w-4 h-4 text-brand-500" />
                </button>
              )}
            </div>

            {/* Right Section: Navigation Links */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-8">
                {user?.role !== "merchant" && user?.role !== "admin" && (
                  <>
                    <IconNavLink to="/" icon={Percent} label="Live Feed" active={location.pathname === "/"} />
                    <IconNavLink to="/map" icon={MapIcon} label="Map" active={isActive("/map")} />
                    {isAuthenticated && <IconNavLink to="/favorites" icon={Heart} label="Favorites" active={isActive("/favorites")} />}
                    {isAuthenticated && <IconNavLink to="/claims" icon={Ticket} label="My Tickets" active={isActive("/claims")} />}
                  </>
                )}

                {user?.role === "merchant" && (
                  <>
                    <IconNavLink to="/merchant" icon={LayoutDashboard} label="Dashboard" active={isActive("/merchant") && location.pathname === "/merchant"} />
                    <IconNavLink to="/merchant/listings/new" icon={PlusCircle} label="Post Surplus" active={isActive("/merchant/listings/new")} />
                    <IconNavLink to="/merchant/schedule" icon={Calendar} label="Schedule" active={isActive("/merchant/schedule")} />
                    <IconNavLink to="/merchant/charts" icon={BarChart} label="Charts" active={isActive("/merchant/charts")} />
                    <IconNavLink to="/merchant/support" icon={HelpCircle} label="Support" active={isActive("/merchant/support")} />
                  </>
                )}
                
                {user?.role === "admin" && (
                  <>
                    <IconNavLink to="/admin" icon={Shield} label="Admin Panel" active={isActive("/admin")} />
                  </>
                )}
                
                {isAuthenticated ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 text-surface-900 hover:text-brand-500 font-medium text-[15px] transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>{user.firstName || "Profile"}</span>
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-3 w-48 bg-white border border-surface-200 rounded-xl shadow-sm z-50 overflow-hidden animate-slide-down py-1">
                        {user?.role !== "admin" && (
                          <Link
                            to={user?.role === "merchant" ? "/merchant/profile" : "/profile"}
                            onClick={() => setProfileOpen(false)}
                            className="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 hover:text-brand-600 transition-colors"
                          >
                            Profile & Settings
                          </Link>
                        )}
                        {user?.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="block px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 hover:text-brand-600 transition-colors"
                          >
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-surface-100 my-1"></div>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={openAuthModal}
                    className="flex items-center gap-2 text-surface-900 hover:text-brand-500 font-medium text-[15px] transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                )}
              </nav>

              {/* Notifications and Mobile Menu */}
              <div className="flex items-center gap-4">
                {isAuthenticated && (
                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2 text-surface-600 hover:text-brand-500 transition-colors"
                    >
                      <Bell className="w-6 h-6" />
                      {unreadCount() > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white" />
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-surface-200 rounded-2xl shadow-elevated z-50 overflow-hidden animate-slide-down">
                        <div className="p-3 border-b border-surface-100 flex justify-between items-center bg-surface-50">
                          <h3 className="font-bold text-surface-900 text-sm">Notifications</h3>
                          {unreadCount() > 0 && (
                            <button
                              onClick={() => markAllRead()}
                              className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                            >
                              <CheckCheck className="w-3 h-3" /> Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-surface-400 text-sm">No notifications yet</div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-3 border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer ${notif.read ? "opacity-60" : "bg-brand-50/30"}`}
                                onClick={() => !notif.read && markRead(notif.id)}
                              >
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <h4 className="font-semibold text-surface-900 text-sm line-clamp-1">{notif.title}</h4>
                                  {!notif.read && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
                                </div>
                                <p className="text-xs text-surface-500 line-clamp-2">{notif.message}</p>
                                <div className="text-[10px] text-surface-400 mt-1.5 font-medium">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-200 bg-white p-4 space-y-2 animate-slide-down shadow-lg">
            {user?.role !== "merchant" && user?.role !== "admin" && (
              <>
                <MobileNavLink to="/" active={location.pathname === "/"} onClick={() => setMobileMenuOpen(false)}>Live Feed</MobileNavLink>
                <MobileNavLink to="/map" active={isActive("/map")} onClick={() => setMobileMenuOpen(false)}>Map</MobileNavLink>
                {isAuthenticated && <MobileNavLink to="/favorites" active={isActive("/favorites")} onClick={() => setMobileMenuOpen(false)}>Favorites</MobileNavLink>}
                {isAuthenticated && <MobileNavLink to="/claims" active={isActive("/claims")} onClick={() => setMobileMenuOpen(false)}>My Tickets</MobileNavLink>}
              </>
            )}

            {user?.role === "merchant" && (
              <>
                <MobileNavLink to="/merchant" active={isActive("/merchant") && location.pathname === "/merchant"} onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                <MobileNavLink to="/merchant/listings/new" active={isActive("/merchant/listings/new")} onClick={() => setMobileMenuOpen(false)}>Post Surplus</MobileNavLink>
                <MobileNavLink to="/merchant/schedule" active={isActive("/merchant/schedule")} onClick={() => setMobileMenuOpen(false)}>Schedule</MobileNavLink>
                <MobileNavLink to="/merchant/charts" active={isActive("/merchant/charts")} onClick={() => setMobileMenuOpen(false)}>Charts</MobileNavLink>
                <MobileNavLink to="/merchant/support" active={isActive("/merchant/support")} onClick={() => setMobileMenuOpen(false)}>Support</MobileNavLink>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <MobileNavLink to="/admin" active={isActive("/admin")} onClick={() => setMobileMenuOpen(false)}>Admin Panel</MobileNavLink>
              </>
            )}

            {isAuthenticated && (
              <MobileNavLink 
                to={user?.role === "merchant" ? "/merchant/profile" : user?.role === "admin" ? "/admin" : "/profile"} 
                active={isActive(user?.role === "merchant" ? "/merchant/profile" : user?.role === "admin" ? "/admin" : "/profile")} 
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile & Settings
              </MobileNavLink>
            )}

            {isAuthenticated ? (
              <button onClick={handleLogout} className="block w-full text-center font-bold text-red-500 bg-red-50 hover:bg-red-100 py-3 rounded-xl transition-colors mt-4">
                Log Out
              </button>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); openAuthModal(); }} className="block w-full text-center btn-primary py-3 rounded-xl mt-4">
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {isAuthenticated && user?.role === "customer" && <CustomerAssistant />}
      {isAuthenticated && user?.role === "customer" && <CustomerNotificationBridge />}

      {/* Footer */}
      <footer className="bg-white border-t border-surface-200/60 py-12 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-brand-500 tracking-tight uppercase">FLASHYIELD</h2>
            <p className="text-sm text-surface-400 mt-2 max-w-xs">Direct-connect surplus liquidation for neighborhood kitchens.</p>
          </div>
          <div className="text-xs text-surface-400">&copy; 2026 FlashYield &middot; Prototype</div>
        </div>
      </footer>
    </div>
  );
}

function IconNavLink({ to, active, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 font-medium text-[15px] transition-colors ${
        active ? "text-brand-500" : "text-surface-900 hover:text-brand-500"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({ to, active, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
        active ? "bg-brand-50 text-brand-600" : "text-surface-600 hover:bg-surface-100"
      }`}
    >
      {children}
    </Link>
  );
}
