import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useProfile,
  useLogout,
  useMyClaims,
  useCustomerAnalytics,
  useMerchantProfile,
  useMerchantDashboard,
  useMerchantProfileTools
} from "../../api/hooks";
import { useAuthStore } from "../../store/authStore";
import {
  User,
  Mail,
  Shield,
  MapPin,
  Bell,
  LogOut,
  Ticket,
  Clock,
  ChevronRight,
  TrendingDown,
  Store,
  BadgeCheck,
  CalendarDays,
  BarChart3,
  Sparkles,
  Settings2,
  Phone,
  Languages,
  ScanFace,
  ReceiptText,
  HeartHandshake,
  Globe,
  MapPinned
} from "lucide-react";

function formatDisplayValue(value) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return value.label || value.name || value.title || JSON.stringify(value);
  return String(value);
}

function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const logout = useLogout();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  const isMerchant = user?.role === "merchant";
  const isCustomer = user?.role === "customer";

  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const { data: claims, isLoading: claimsLoading } = useMyClaims({ enabled: isAuthenticated && isCustomer });
  const { data: analytics, isLoading: analyticsLoading } = useCustomerAnalytics({ enabled: isAuthenticated && isCustomer });
  const { data: merchantProfile, isLoading: merchantProfileLoading } = useMerchantProfile({ enabled: isAuthenticated && isMerchant });
  const { data: merchantDashboard, isLoading: merchantDashboardLoading } = useMerchantDashboard({ enabled: isAuthenticated && isMerchant });
  const { data: merchantTools, isLoading: merchantToolsLoading } = useMerchantProfileTools({ enabled: isAuthenticated && isMerchant });

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout.mutate(void 0, {
      onSettled: () => navigate("/login")
    });
  };

  const summary = useMemo(() => {
    const claimData = claims?.data ?? [];
    const collectedClaims = claimData.filter((c) => c.status === "collected").length;
    const activeClaims = claimData.filter((c) => c.status === "reserved" || c.status === "claimed").length;
    return {
      totalClaims: claimData.length,
      activeClaims,
      collectedClaims
    };
  }, [claims]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const roleLabel = isMerchant ? "Merchant" : isCustomer ? "Customer" : user.role;
  const avatarInitial = (profile?.name || user.email || roleLabel || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-surface-100 pb-24 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] border border-surface-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-lg shadow-brand-500/20">
                  {avatarInitial}
                </div>
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                    {roleLabel} profile
                  </div>
                  <h1 className="text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl">
                    {isMerchant ? "Merchant control panel" : "Customer profile"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                    {isMerchant
                      ? "Manage store identity, pickup workflow, merchant tools, verification settings, and operational preferences from one profile."
                      : "Manage your account details, claim history, savings insights, preferences, and support settings in one place."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(isMerchant ? "/merchant" : "/claims")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
                >
                  <Store className="h-4 w-4" />
                  {isMerchant ? "Open merchant dashboard" : "View my claims"}
                </button>
                <button
                  onClick={() => navigate("/merchant/support")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <HeartHandshake className="h-4 w-4" />
                  Support
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={isMerchant ? "Store status" : "Total claims"}
              value={isMerchant ? (merchantProfile?.verifiedBadge ? "Verified" : "Pending") : summary.totalClaims}
              subtitle={isMerchant ? "Verification and listing trust" : "All-time bundles claimed"}
              icon={isMerchant ? BadgeCheck : Ticket}
            />
            <MetricCard
              title={isMerchant ? "Listings live" : "Active claims"}
              value={
                isMerchant
                  ? merchantDashboard?.summary?.liveListings ?? merchantDashboard?.liveListings ?? 0
                  : summary.activeClaims
              }
              subtitle={isMerchant ? "Current live inventory" : "Reserved and awaiting pickup"}
              icon={isMerchant ? CalendarDays : Clock}
            />
            <MetricCard
              title={isMerchant ? "Collected today" : "Collected"}
              value={isMerchant ? merchantDashboard?.summary?.todayCollected ?? merchantDashboard?.todayCollected ?? 0 : summary.collectedClaims}
              subtitle={isMerchant ? "Verified handoffs" : "Completed pickups"}
              icon={ScanFace}
            />
            <MetricCard
              title={isMerchant ? "Revenue recovered" : "Estimated savings"}
              value={
                isMerchant
                  ? `₹${merchantDashboard?.summary?.revenueRecovered ?? merchantDashboard?.revenueRecovered ?? 0}`
                  : `₹${analytics?.totalSaved ?? 0}`
              }
              subtitle={isMerchant ? "Collected bundles only" : "Your sustainability impact"}
              icon={isMerchant ? ReceiptText : TrendingDown}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            {isCustomer && (
              <>
                <SectionCard title="Customer analytics" subtitle="Your claim behavior and savings">
                  {analyticsLoading ? (
                    <LoadingBlock />
                  ) : analytics ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <MiniStat label="Savings" value={`₹${analytics.totalSaved ?? 0}`} tone="text-emerald-600" />
                        <MiniStat label="Claims" value={summary.totalClaims} tone="text-surface-900" />
                        <MiniStat label="Collected" value={summary.collectedClaims} tone="text-brand-600" />
                      </div>
                      {analytics.categoryBreakdown?.length > 0 ? (
                        <div className="mt-5">
                          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-surface-400">
                            Favorite categories
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analytics.categoryBreakdown.map((item) => (
                              <span
                                key={item.category}
                                className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1.5 text-sm font-medium text-surface-700"
                              >
                                {item.category}
                                <span className="text-surface-400">{item.count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <EmptyState title="No category data yet" description="Claim a few bundles and category insights will appear here." />
                      )}
                    </>
                  ) : (
                    <EmptyState title="No analytics yet" description="Your savings and preferences will appear once you claim bundles." />
                  )}
                </SectionCard>

                <SectionCard title="Impact badges" subtitle="Milestones unlocked by collected bundles">
                  <BadgePanel collectedClaims={summary.collectedClaims} />
                </SectionCard>
              </>
            )}

            {isMerchant && (
              <>
                <SectionCard title="Merchant overview" subtitle="Store profile and trust controls">
                  {merchantProfileLoading || merchantToolsLoading ? (
                    <LoadingBlock />
                  ) : merchantProfile || merchantTools ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoTile
                        icon={Store}
                        label="Store name"
                        value={formatDisplayValue(merchantProfile?.storeName || merchantProfile?.name || profile?.name || user.email)}
                      />
                      <InfoTile
                        icon={BadgeCheck}
                        label="Verified badge"
                        value={merchantTools?.verifiedBadge || merchantProfile?.verifiedBadge ? "Enabled" : "Pending review"}
                      />
                      <InfoTile
                        icon={Clock}
                        label="Pickup instructions"
                        value={formatDisplayValue(merchantTools?.pickupInstructions || merchantProfile?.pickupInstructions || "Show token at counter")}
                      />
                      <InfoTile
                        icon={Languages}
                        label="Languages"
                        value={formatDisplayValue(merchantProfile?.languages || "English")}
                      />
                    </div>
                  ) : (
                    <EmptyState title="Merchant profile unavailable" description="Create or complete your merchant profile to unlock store tools." />
                  )}
                </SectionCard>

                <SectionCard title="Merchant performance" subtitle="Live business snapshot">
                  {merchantDashboardLoading ? (
                    <LoadingBlock />
                  ) : merchantDashboard ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <MiniStat label="Live listings" value={merchantDashboard.summary?.liveListings ?? merchantDashboard.liveListings ?? 0} tone="text-surface-900" />
                      <MiniStat label="Today claims" value={merchantDashboard.summary?.todayClaims ?? merchantDashboard.todayClaims ?? 0} tone="text-brand-600" />
                      <MiniStat label="Collected" value={merchantDashboard.summary?.todayCollected ?? merchantDashboard.todayCollected ?? 0} tone="text-emerald-600" />
                    </div>
                  ) : (
                    <EmptyState title="No merchant metrics yet" description="Post a bundle to begin tracking merchant analytics." />
                  )}
                </SectionCard>
              </>
            )}

            <SectionCard
              title={isMerchant ? "Account and operations" : "Account"}
              subtitle={isMerchant ? "Store identity, support, and operational profile" : "Core account details"}
            >
              {profileLoading && !profileError ? (
                <LoadingBlock />
              ) : (
                <div className="divide-y divide-surface-100 overflow-hidden rounded-3xl border border-surface-200">
                  <SettingsRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                  <SettingsRow icon={<Shield className="h-4 w-4" />} label="Role" value={user.role} />
                  <SettingsRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Member since"
                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  />
                  {isMerchant ? (
                    <>
                      <SettingsRow icon={<MapPinned className="h-4 w-4" />} label="Store location" value={formatDisplayValue(merchantProfile?.location || merchantProfile?.address || "Not set")} />
                      <SettingsRow icon={<Phone className="h-4 w-4" />} label="Phone" value={formatDisplayValue(merchantProfile?.phone || "Not set")} />
                    </>
                  ) : (
                    <>
                      <SettingsRow icon={<Ticket className="h-4 w-4" />} label="Total claims" value={String(summary.totalClaims)} />
                      <SettingsRow icon={<TrendingDown className="h-4 w-4" />} label="Collected claims" value={String(summary.collectedClaims)} />
                    </>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Preferences" subtitle="Personalized controls">
              <div className="divide-y divide-surface-100 overflow-hidden rounded-3xl border border-surface-200">
                <ToggleRow
                  icon={<Bell className="h-4 w-4" />}
                  label="Push notifications"
                  description={isMerchant ? "Alerts for low pickup rate, expiring bundles, and queue updates" : "Get notified about nearby deals and claim updates"}
                  enabled={notificationsEnabled}
                  onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
                />
                <ToggleRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location sharing"
                  description={isMerchant ? "Improve nearby targeting and store radius promotions" : "Show deals based on your current location"}
                  enabled={locationSharing}
                  onToggle={() => setLocationSharing(!locationSharing)}
                />
              </div>
            </SectionCard>

            <SectionCard title={isMerchant ? "Merchant tools" : "Actions"} subtitle={isMerchant ? "Fast links to operational pages" : "Quick account actions"}>
              <div className="divide-y divide-surface-100 overflow-hidden rounded-3xl border border-surface-200">
                {!isMerchant && (
                  <ActionRow icon={Ticket} label="View my tickets" onClick={() => navigate("/claims")} />
                )}
                {isMerchant && (
                  <>
                    <ActionRow icon={Store} label="Merchant dashboard" onClick={() => navigate("/merchant")} />
                    <ActionRow icon={Settings2} label="Profile tools" onClick={() => navigate("/merchant/profile-tools")} />
                    <ActionRow icon={BarChart3} label="Performance charts" onClick={() => navigate("/merchant/charts")} />
                    <ActionRow icon={CalendarDays} label="Scheduled postings" onClick={() => navigate("/merchant/schedule")} />
                    <ActionRow icon={MapPinned} label="No-show management" onClick={() => navigate("/merchant/no-shows")} />
                  </>
                )}
              </div>
            </SectionCard>

            <SectionCard title={isMerchant ? "Merchant setup" : "Support" } subtitle={isMerchant ? "Operational details and onboarding state" : "Help and account support"}>
              <div className="space-y-3">
                {isMerchant ? (
                  <>
                    <QuickChip label="Verified badge" value={merchantTools?.verifiedBadge ? "Enabled" : "Disabled"} />
                    <QuickChip label="Hours" value={merchantTools?.storeHours ? "Configured" : "Not configured"} />
                    <QuickChip label="Pickup notes" value={merchantTools?.pickupInstructions ? "Ready" : "Missing"} />
                  </>
                ) : (
                  <>
                    <QuickChip label="Saved deals" value="Available in feed" />
                    <QuickChip label="Favorites" value="Personalized" />
                    <QuickChip label="Chat support" value="Enabled" />
                  </>
                )}
              </div>
            </SectionCard>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-3xl border border-red-200 bg-white px-5 py-4 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[28px] border border-surface-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-400">{subtitle}</div>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-surface-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-surface-200 bg-surface-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-surface-500">{title}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-surface-950">{value}</div>
          <div className="mt-2 text-xs text-surface-500">{subtitle}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  return (
    <div className="rounded-3xl border border-surface-200 bg-surface-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-400">{label}</div>
      <div className={`mt-2 text-3xl font-black tracking-tight ${tone}`}>{value}</div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-surface-200 bg-surface-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-400">{label}</div>
          <div className="mt-1 text-sm font-semibold text-surface-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-surface-50">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-surface-900">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-surface-300" />
    </button>
  );
}

function SettingsRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-100 text-surface-500">{icon}</div>
        <span className="text-sm font-medium text-surface-600">{label}</span>
      </div>
      <span className="max-w-[55%] truncate text-sm font-semibold text-surface-900">{value}</span>
    </div>
  );
}

function ToggleRow({ icon, label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-100 text-surface-500">{icon}</div>
        <div>
          <span className="block text-sm font-semibold text-surface-900">{label}</span>
          <span className="block text-xs leading-5 text-surface-400">{description}</span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${enabled ? "bg-brand-500" : "bg-surface-300"}`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function BadgePanel({ collectedClaims }) {
  return (
    <div className="rounded-3xl border border-surface-200 bg-surface-50 p-5 text-center">
      {collectedClaims === 0 ? (
        <Fragment>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-2xl">🌱</div>
          <h3 className="font-bold text-surface-900">Begin your journey</h3>
          <p className="mt-1 text-sm text-surface-500">Collect your first bundle to earn the Seedling badge.</p>
        </Fragment>
      ) : collectedClaims < 10 ? (
        <Fragment>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">🌱</div>
          <h3 className="font-bold text-green-700">Seedling</h3>
          <p className="mt-1 text-sm text-surface-500">You have started making an impact.</p>
        </Fragment>
      ) : collectedClaims < 50 ? (
        <Fragment>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-3xl">🦸</div>
          <h3 className="font-bold text-blue-700">Food Saver</h3>
          <p className="mt-1 text-sm text-surface-500">A strong sustainability streak is in progress.</p>
        </Fragment>
      ) : (
        <Fragment>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-3xl">👑</div>
          <h3 className="font-bold text-purple-700">Waste Hero</h3>
          <p className="mt-1 text-sm text-surface-500">You are a legend in the local community.</p>
        </Fragment>
      )}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-surface-200 bg-surface-50 px-5 py-8 text-center">
      <div className="text-sm font-semibold text-surface-900">{title}</div>
      <div className="mt-1 text-sm text-surface-500">{description}</div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-1/3 animate-pulse rounded-full bg-surface-200" />
      <div className="h-24 animate-pulse rounded-3xl bg-surface-100" />
    </div>
  );
}

function QuickChip({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3">
      <span className="text-sm font-medium text-surface-500">{label}</span>
      <span className="text-sm font-semibold text-surface-900">{value}</span>
    </div>
  );
}

export { ProfilePage };
