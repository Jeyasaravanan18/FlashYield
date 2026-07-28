import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { useLogout } from '../../api/hooks';
import { LocationModal } from '../modals/LocationModal';
import { AuthModal } from '../modals/AuthModal';
import { 
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function AppLayout() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { label: locationLabel, status: locationStatus, openLocationModal } = useLocationStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (locationStatus === 'idle') {
      openLocationModal();
    }
  }, [locationStatus, openLocationModal]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login'),
    });
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen flex flex-col bg-surface-100">
      <LocationModal />
      <AuthModal />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Section: Logo & Nav */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/" className="flex items-center group">
                <span className="text-2xl font-display font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight leading-none uppercase">
                  FlashYield
                </span>
              </Link>

              {/* Desktop Nav (RBAC enforced) */}
              <nav className="hidden md:flex items-center gap-1">
                {user?.role !== 'merchant' && (
                  <NavLink to="/" active={location.pathname === '/'}>
                    Live Feed
                  </NavLink>
                )}

                {user?.role !== 'merchant' && (
                  <NavLink to="/map" active={isActive('/map')}>
                    Map
                  </NavLink>
                )}
                
                {user?.role === 'merchant' && (
                  <NavLink to="/merchant" active={isActive('/merchant')}>
                    Dashboard
                  </NavLink>
                )}

                {user?.role !== 'merchant' && (
                  <NavLink to="/claims" active={isActive('/claims')}>
                    My Tickets
                  </NavLink>
                )}
              </nav>
            </div>

            {/* Right Section: Location & User */}
            <div className="flex items-center gap-4">
              {/* Location Indicator */}
              {/* Location Indicator */}
              <button 
                onClick={openLocationModal}
                className="hidden lg:flex items-center gap-2 text-xs font-medium text-surface-400 bg-surface-100 hover:bg-surface-200 transition-colors px-3 py-1.5 rounded-full"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${locationStatus === 'granted' ? 'bg-accent-500' : locationStatus === 'requesting' ? 'bg-amber-400 animate-pulse' : 'bg-surface-400'}`}></div>
                {locationLabel}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {user?.role === 'merchant' && (
                    <Link to="/merchant/listings/new" className="hidden md:block btn-primary px-4 py-2 text-xs rounded-lg">
                      Post Surplus
                    </Link>
                  )}
                  <Link to="/profile" className="hidden sm:flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm hover:shadow-md transition-shadow">
                      {user?.email.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex text-surface-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={openAuthModal} className="btn-primary px-5 py-2 text-xs rounded-lg">
                    Log In
                  </button>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-200/60 bg-white/95 backdrop-blur-xl p-4 space-y-2 animate-slide-down">
            {user?.role !== 'merchant' && (
              <MobileNavLink to="/" active={location.pathname === '/'} onClick={() => setMobileMenuOpen(false)}>
                Live Feed
              </MobileNavLink>
            )}

            {user?.role !== 'merchant' && (
              <MobileNavLink to="/map" active={isActive('/map')} onClick={() => setMobileMenuOpen(false)}>
                Map
              </MobileNavLink>
            )}
            
            {user?.role === 'merchant' && (
              <MobileNavLink to="/merchant" active={isActive('/merchant')} onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
            )}

            {user?.role !== 'merchant' && (
              <MobileNavLink to="/claims" active={isActive('/claims')} onClick={() => setMobileMenuOpen(false)}>
                My Tickets
              </MobileNavLink>
            )}

            {isAuthenticated && (
              <MobileNavLink to="/profile" active={isActive('/profile')} onClick={() => setMobileMenuOpen(false)}>
                Profile & Settings
              </MobileNavLink>
            )}

            {isAuthenticated ? (
              <>
                {user?.role === 'merchant' && (
                  <Link to="/merchant/listings/new" className="block w-full text-center btn-primary py-3 rounded-xl">
                    Post Surplus
                  </Link>
                )}
                <button onClick={handleLogout} className="block w-full text-center btn text-red-500 bg-red-50 py-3 rounded-xl">
                  Log Out
                </button>
              </>
            ) : (
              <button onClick={() => { setMobileMenuOpen(false); openAuthModal(); }} className="block w-full text-center btn-primary py-3 rounded-xl">
                Log In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-200/60 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent uppercase">FLASHYIELD</h2>
            <p className="text-sm text-surface-400 mt-2 max-w-xs">
              Direct-connect surplus liquidation for neighborhood kitchens.
            </p>
          </div>
          <div className="text-xs text-surface-400">
            © 2026 FlashYield · Prototype
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active
          ? 'text-brand-500 bg-brand-50'
          : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, active, onClick, children }: { to: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
        active
          ? 'bg-brand-50 text-brand-600'
          : 'text-surface-600 hover:bg-surface-100'
      }`}
    >
      {children}
    </Link>
  );
}
