import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useLogout, useMyClaims } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import { User, Mail, Shield, MapPin, Bell, LogOut, Ticket, Clock, ChevronRight } from 'lucide-react';

export function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: profile } = useProfile();
  const { data: claims } = useMyClaims({ enabled: isAuthenticated });
  const logout = useLogout();
  const navigate = useNavigate();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login'),
    });
  };

  const totalClaims = claims?.data.length ?? 0;
  const activeClaims = claims?.data.filter(c => c.status === 'reserved').length ?? 0;
  const collectedClaims = claims?.data.filter(c => c.status === 'collected').length ?? 0;

  return (
    <div className="bg-surface-100 min-h-screen pb-24 pt-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Profile Header */}
        <div className="card p-8 mb-6 text-center bg-gradient-to-br from-white to-surface-50">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <span className="text-3xl font-bold">{user.email.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-1">{user.email}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`badge ${user.role === 'merchant' ? 'badge-warning' : user.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="font-display text-2xl font-bold text-surface-900">{totalClaims}</div>
            <div className="text-xs text-surface-400 mt-0.5">Total Claims</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-display text-2xl font-bold text-brand-500">{activeClaims}</div>
            <div className="text-xs text-surface-400 mt-0.5">Active</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-display text-2xl font-bold text-accent-500">{collectedClaims}</div>
            <div className="text-xs text-surface-400 mt-0.5">Collected</div>
          </div>
        </div>

        {/* Impact Badges Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-1 mb-3">Impact Badges</h2>
          <div className="card p-6 flex flex-col items-center justify-center text-center">
            {collectedClaims === 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-3">
                  <span className="text-2xl opacity-50">🌱</span>
                </div>
                <h3 className="font-bold text-surface-900 mb-1">Begin Your Journey</h3>
                <p className="text-sm text-surface-500">Collect your first bundle to earn the Seedling badge!</p>
              </>
            ) : collectedClaims < 10 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3 shadow-inner shadow-green-500/20">
                  <span className="text-3xl">🌱</span>
                </div>
                <h3 className="font-bold text-green-700 mb-1">Seedling</h3>
                <p className="text-sm text-surface-500">You've started making an impact. Keep it up!</p>
                <div className="mt-4 w-full max-w-[200px]">
                  <div className="flex justify-between text-[10px] text-surface-400 font-bold mb-1">
                    <span>{collectedClaims}</span>
                    <span>10 for next</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(collectedClaims / 10) * 100}%` }}></div>
                  </div>
                </div>
              </>
            ) : collectedClaims < 50 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 shadow-inner shadow-blue-500/20 border border-blue-200">
                  <span className="text-3xl">🦸</span>
                </div>
                <h3 className="font-bold text-blue-700 mb-1">Food Saver</h3>
                <p className="text-sm text-surface-500">A true champion of sustainability. Amazing work!</p>
                <div className="mt-4 w-full max-w-[200px]">
                  <div className="flex justify-between text-[10px] text-surface-400 font-bold mb-1">
                    <span>{collectedClaims}</span>
                    <span>50 for next</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(collectedClaims / 50) * 100}%` }}></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30 border border-purple-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent"></div>
                  <span className="text-3xl relative z-10">👑</span>
                </div>
                <h3 className="font-bold text-purple-700 mb-1">Waste Hero</h3>
                <p className="text-sm text-surface-500">You are a legend in the local community!</p>
              </>
            )}
          </div>
        </div>

        {/* Account Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-1 mb-3">Account</h2>
          <div className="card overflow-hidden divide-y divide-surface-100">
            <SettingsRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
            <SettingsRow icon={<Shield className="w-4 h-4" />} label="Role" value={user.role} />
            <SettingsRow icon={<Ticket className="w-4 h-4" />} label="Total Claims" value={String(totalClaims)} />
            <SettingsRow icon={<Clock className="w-4 h-4" />} label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'} />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-1 mb-3">Preferences</h2>
          <div className="card overflow-hidden divide-y divide-surface-100">
            <ToggleRow
              icon={<Bell className="w-4 h-4" />}
              label="Push Notifications"
              description="Get alerts when new deals drop nearby"
              enabled={notificationsEnabled}
              onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <ToggleRow
              icon={<MapPin className="w-4 h-4" />}
              label="Location Sharing"
              description="Show deals based on your current location"
              enabled={locationSharing}
              onToggle={() => setLocationSharing(!locationSharing)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-1 mb-3">Actions</h2>
          <div className="card overflow-hidden divide-y divide-surface-100">
            <button
              onClick={() => navigate('/claims')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-surface-900">View My Tickets</span>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-300" />
            </button>
            
            {user.role === 'merchant' && (
              <button
                onClick={() => navigate('/merchant')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-surface-900">Merchant Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-300" />
              </button>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full card flex items-center justify-center gap-2 px-5 py-4 text-red-500 hover:bg-red-50 font-medium text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-surface-100 text-surface-500 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium text-surface-600">{label}</span>
      </div>
      <span className="text-sm text-surface-900 font-medium">{value}</span>
    </div>
  );
}

function ToggleRow({ icon, label, description, enabled, onToggle }: { 
  icon: React.ReactNode; 
  label: string; 
  description: string;
  enabled: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-surface-100 text-surface-500 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <span className="text-sm font-medium text-surface-900 block">{label}</span>
          <span className="text-xs text-surface-400">{description}</span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-brand-500' : 'bg-surface-300'
        }`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}
