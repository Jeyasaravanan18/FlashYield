import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import {
  useMerchantDashboard,
  useMerchantListings,
  useCancelListing,
  useMerchantAnalytics,
  useMerchantQueue,
  useMerchantNotifications,
  useMerchantHandoffLog,
  useMerchantExports,
  useMerchantProfileTools,
  useForecast,
  useUpdateListing
} from "../../api/hooks";
import { useState } from "react";
import { useCountdown } from "../../hooks/useCountdown";
import {
  Bell,
  ChevronRight,
  Clock3,
  DollarSign,
  Edit2,
  FileText,
  PackageSearch,
  Plus,
  Rocket,
  ScanLine,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  X
} from "lucide-react";

function MerchantDashboard() {
  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useMerchantDashboard();
  const { data: listings, isLoading: listLoading, isError: listError } = useMerchantListings();
  const cancelMutation = useCancelListing();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useMerchantAnalytics();
  const { data: queueData } = useMerchantQueue();
  const { data: notificationsData } = useMerchantNotifications();
  const { data: handoffData } = useMerchantHandoffLog();
  const { data: exportsData } = useMerchantExports();
  const { data: profileToolsData } = useMerchantProfileTools();
  const { data: forecastData } = useForecast();
  const updateMutation = useUpdateListing();

  const [editingListing, setEditingListing] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  if (dashLoading || listLoading || analyticsLoading) {
    return jsx(StatePanel, {
      title: "Loading merchant console",
      subtitle: "Fetching listings, analytics, and operational summaries..."
    });
  }

  if (dashError || !dashboard?.profile) {
    return jsxs("div", {
      className: "min-h-screen bg-surface-100 flex items-center justify-center p-6",
      children: jsxs("div", {
        className: "card max-w-md w-full p-8 text-center animate-fade-in shadow-xl",
        children: [
          jsx("div", { className: "mx-auto mb-4 w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600", children: jsx(Store, { className: "w-7 h-7" }) }),
          jsx("h2", { className: "text-2xl font-bold text-surface-900", children: "Set Up Your Store Profile" }),
          jsx("p", { className: "mt-2 text-sm text-surface-500", children: "You're logged in as a merchant, but your store details haven't been registered yet. Complete your profile to start posting surplus food!" }),
          jsxs("div", {
            className: "mt-6 flex flex-col gap-3",
            children: [
              jsx(Link, { to: "/merchant/onboarding", className: "btn-primary w-full py-3", children: "Set Up Store Now" }),
              jsx(Link, { to: "/", className: "text-sm text-surface-400 hover:text-surface-600", children: "Back to Home" })
            ]
          })
        ]
      })
    });
  }

  const activeListings = listings?.data || [];
  const activeCount = activeListings.filter((listing) => listing.status !== "sold_out" && listing.status !== "expired" && new Date(listing.claimWindowEnd) > new Date()).length;
  const stats = dashboard.stats || {};
  const quickActions = [
    { to: "/merchant/listings/new", label: "Post Surplus", icon: Plus, note: "Create or schedule a new bundle.", primary: true },
    { to: "/merchant/verify", label: "Verify Pickup", icon: ScanLine, note: "Scan claim tokens at the counter.", dark: true },
    { to: "/merchant/schedule", label: "Scheduled Posting", icon: Clock3, note: "Manage auto-publish times." },
    { to: "/merchant/promotions", label: "Promotion Tools", icon: Rocket, note: "Push favorites, radius, or sell-fastest." },
    { to: "/merchant/forecast", label: "Inventory Forecast", icon: PackageSearch, note: "Estimate leftover stock." },
    { to: "/merchant/support", label: "Support Chat", icon: Bell, note: "Merchant and customer support helper." }
  ];
  const ops = [
    { label: "Pickup Queue", value: queueData?.queue?.length ?? 0, href: "/merchant/queue" },
    { label: "Notifications", value: notificationsData?.notifications?.length ?? 0, href: "/merchant/notifications" },
    { label: "Handoff Notes", value: handoffData?.logs?.length ?? 0, href: "/merchant/handoff-log" },
    { label: "Exports", value: exportsData?.revenueRecovered != null ? `₹${exportsData.revenueRecovered}` : "—", href: "/merchant/exports" }
  ];

  const handleCancel = (listingId, listingTitle) => {
    if (!confirm(`Cancel "${listingTitle}"? This listing will be removed from the feed.`)) return;
    cancelMutation.mutate(listingId);
  };

  const handleEditPriceSubmit = (e) => {
    e.preventDefault();
    if (!editingListing || !editPrice) return;
    
    updateMutation.mutate(
      { id: editingListing._id, data: { discountedPrice: Number(editPrice) } },
      {
        onSuccess: () => {
          setEditingListing(null);
          setEditPrice("");
        }
      }
    );
  };

  return jsxs("div", {
    className: "min-h-screen w-full bg-[#f5f5f4] pb-20",
    children: [
      jsxs("main", {
        className: "w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
        children: [
          jsxs("section", {
            className: "rounded-2xl border border-surface-200 bg-white p-6 shadow-sm",
            children: [
              jsxs("div", {
                className: "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between",
                children: [
                  jsxs("div", {
                    className: "min-w-0",
                    children: [
                      jsxs("div", {
                        className: "flex flex-wrap items-center gap-2",
                        children: [
                          jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-emerald-500" }),
                          jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-surface-500", children: "Merchant operations" })
                        ]
                      }),
                      jsx("h1", { className: "mt-2 font-display text-4xl font-bold uppercase leading-none text-surface-900 sm:text-5xl", children: "Flash console" }),
                      jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-surface-500", children: "Post bundles, verify pickups, monitor claims, and move today's surplus before closing." })
                    ]
                  }),
                  jsxs("div", {
                    className: "flex shrink-0 flex-wrap gap-3",
                    children: [
                      jsx(Link, { to: "/merchant/listings/new", className: "btn-primary px-5 py-3 text-sm inline-flex items-center gap-2 justify-center", children: jsxs(Fragment, { children: [jsx(Plus, { className: "w-4 h-4" }), "Post Surplus"] }) }),
                      jsx(Link, { to: "/merchant/verify", className: "btn-secondary px-5 py-3 text-sm inline-flex items-center gap-2 justify-center", children: jsxs(Fragment, { children: [jsx(ScanLine, { className: "w-4 h-4" }), "Verify Pickup"] }) })
                    ]
                  })
                ]
              }),
              jsxs("div", {
                className: "mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
                children: [
                  jsx(TopMetric, { label: "Live listings", value: stats.activeListings ?? activeCount, tone: "brand", icon: ShoppingBag }, "live-listings"),
                  jsx(TopMetric, { label: "Claims today", value: stats.todayClaims ?? 0, tone: "blue", icon: ScanLine }, "claims-today"),
                  jsx(TopMetric, { label: "Collected", value: analytics?.totalCollected ?? stats.collectedClaims ?? 0, tone: "green", icon: Users }, "collected"),
                  jsx(TopMetric, {
                    label: "Forecast",
                    value: forecastData?.hasHistory === false || forecastData?.expectedLeftover == null
                      ? "No data"
                      : `${forecastData.expectedLeftover} left`,
                    tone: "dark",
                    icon: PackageSearch,
                    note: forecastData?.hasHistory === false
                      ? "Based on your own listings after history builds"
                      : forecastData
                        ? `${forecastData.confidence ?? 0}% confidence`
                        : "Awaiting history"
                  })
                ]
              })
            ]
          }),

          jsxs("section", {
            className: "mt-4 grid gap-4 lg:grid-cols-[1fr_360px]",
            children: [
              jsxs("div", {
                children: [
                  jsx("div", { className: "mb-3 text-xs font-bold uppercase tracking-[0.18em] text-surface-500", children: "Actions" }),
                  jsx("div", {
                    className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
                    children: quickActions.map((action) => jsx(ActionTile, { action }, action.to))
                  })
                ]
              }),
              jsxs("div", {
                className: "rounded-2xl border border-surface-200 bg-surface-900 p-5 text-white shadow-sm",
                children: [
                  jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      jsxs("div", { children: [jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-white/45", children: "Pulse" }), jsx("h2", { className: "mt-1 text-xl font-display font-bold uppercase text-white", children: "Today" })] }),
                      jsx(Link, { to: "/merchant/charts", className: "inline-flex items-center gap-1 text-sm font-semibold text-brand-300", children: jsxs(Fragment, { children: ["Charts", jsx(ChevronRight, { className: "w-4 h-4" })] }) })
                    ]
                  }),
                  jsx("div", {
                    className: "mt-4 grid gap-2",
                    children: ops.map((item) => jsx(PulseRow, { item }, item.href))
                  })
                ]
              })
            ]
          }),

          jsx("section", {
            className: "mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4",
            children: [
              jsx(StatCard, { icon: jsx(DollarSign, { className: "w-4 h-4 text-green-500" }), label: "Revenue recovered", value: analytics ? `₹${analytics.revenueRecovered ?? 0}` : "—", accent: true }, "stat-revenue"),
              jsx(StatCard, { icon: jsx(Sparkles, { className: "w-4 h-4 text-brand-500" }), label: "Food saved", value: analytics ? `${analytics.foodSavedKg ?? 0} kg` : "—" }, "stat-food"),
              jsx(StatCard, { icon: jsx(TrendingUp, { className: "w-4 h-4 text-brand-500" }), label: "Claim conversion", value: analytics ? `${analytics.claimConversionRate ?? 0}%` : "—" }, "stat-conversion"),
              jsx(StatCard, { icon: jsx(Users, { className: "w-4 h-4 text-brand-500" }), label: "No-show rate", value: analytics ? `${analytics.noShowRate ?? 0}%` : "—" }, "stat-noshow")
            ]
          }),

          jsx("section", {
            className: "mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]",
            children: [
              jsxs("div", {
                className: "rounded-2xl border border-surface-200 bg-white p-5 shadow-sm",
                children: [
                  jsxs("div", { className: "flex items-center justify-between mb-5", children: [jsx("h2", { className: "text-2xl font-display font-bold uppercase text-surface-900", children: "Live inventory" }), jsx(Link, { to: "/merchant/listings/new", className: "text-sm font-semibold text-brand-500 hover:text-brand-600", children: "Post new" })] }),
                  jsx("div", {
                    children: !activeListings.length ? jsx(EmptyPanel, { title: "No active inventory yet", subtitle: "Create a listing to start clearing surplus." }) : activeListings.map((listing, idx) => jsx(ListingRow, { listing, onCancel: handleCancel, isCancelling: cancelMutation.isPending, onEdit: () => { setEditingListing(listing); setEditPrice(listing.discountedPrice); } }, listing._id || idx))
                  })
                ]
              }),
              jsx("div", {
                className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-1",
                children: [
                  jsx(MiniPanel, { title: "Queue", subtitle: "Pickup flow", body: `${queueData?.queue?.length ?? 0} claims waiting`, href: "/merchant/queue", icon: ScanLine }, "queue"),
                  jsx(MiniPanel, { title: "Forecast", subtitle: "Sell-through signal", body: forecastData ? `${forecastData.bestHour ?? "--"} is hottest` : "No forecast yet", href: "/merchant/forecast", icon: PackageSearch }, "forecast"),
                  jsx(MiniPanel, { title: "Exports", subtitle: "Accounting", body: exportsData ? `₹${exportsData.revenueRecovered ?? 0} recovered` : "Export summary ready", href: "/merchant/exports", icon: FileText }, "exports"),
                  jsx(MiniPanel, { title: "Profile tools", subtitle: "Merchant trust", body: profileToolsData?.verifiedBadge ? "Verified profile enabled" : "Manage store profile", href: "/merchant/profile-tools", icon: Users }, "profile-tools")
                ]
              })
            ]
          }),

          jsx("section", {
            className: "mt-4 grid gap-4 md:grid-cols-3",
            children: [
              jsx(VisualCard, { title: "Notifications", value: notificationsData?.notifications?.length ?? 0, body: "Open alerts center", href: "/merchant/notifications" }, "notifications"),
              jsx(VisualCard, { title: "Handoff log", value: handoffData?.logs?.length ?? 0, body: "Shift notes and issues", href: "/merchant/handoff-log" }, "handoff"),
              jsx(VisualCard, { title: "Support", value: 1, body: "Merchant and customer chatbot", href: "/merchant/support" }, "support")
            ]
          })
        ]
      }),
      editingListing && (
        jsxs("div", {
          className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
          children: [
            jsxs("div", {
              className: "w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl",
              children: [
                jsx("h3", { className: "text-lg font-bold text-surface-900", children: "Edit Rescue Price" }),
                jsx("p", { className: "text-sm text-surface-500 mt-1 mb-4", children: `Change price for "${editingListing.title}"` }),
                jsxs("form", {
                  onSubmit: handleEditPriceSubmit,
                  children: [
                    jsxs("div", {
                      className: "mb-4",
                      children: [
                        jsx("label", { className: "label", children: "New Price (Rs)" }),
                        jsx("input", { type: "number", className: "input", min: 0, required: true, value: editPrice, onChange: (e) => setEditPrice(e.target.value) })
                      ]
                    }),
                    jsxs("div", {
                      className: "flex gap-2 justify-end",
                      children: [
                        jsx("button", { type: "button", className: "btn-ghost btn-sm", onClick: () => setEditingListing(null), children: "Cancel" }),
                        jsx("button", { type: "submit", className: "btn-primary btn-sm", disabled: updateMutation.isPending, children: updateMutation.isPending ? "Saving..." : "Save Price" })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      )
    ]
  });
}

function StatePanel({ title, subtitle }) {
  return jsx("div", {
    className: "min-h-screen bg-surface-100 flex items-center justify-center p-6",
    children: jsxs("div", {
      className: "card max-w-xl w-full p-8 text-center",
      children: [
        jsx("div", { className: "mx-auto mb-4 w-10 h-10 rounded-full border-4 border-surface-200 border-t-brand-500 animate-spin" }),
        jsx("h2", { className: "text-2xl font-display font-bold text-surface-900", children: title }),
        jsx("p", { className: "mt-2 text-sm text-surface-500", children: subtitle })
      ]
    })
  });
}

function TopMetric({ label, value, tone, note, icon: Icon }) {
  const tones = {
    brand: "border-brand-200 bg-brand-50 text-brand-500",
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    green: "border-emerald-100 bg-emerald-50 text-emerald-600",
    dark: "border-surface-300 bg-surface-900 text-white"
  };

  return jsxs("div", {
    className: `rounded-2xl border p-5 shadow-sm ${tones[tone]}`,
    children: [
      jsxs("div", {
        className: "flex items-center justify-between gap-3",
        children: [
          jsx("div", { className: "text-xs font-bold uppercase tracking-wider opacity-70", children: label }),
          Icon ? jsx(Icon, { className: "h-5 w-5 opacity-70" }) : null
        ]
      }),
      jsx("div", { className: "mt-3 font-display text-4xl font-bold leading-none", children: value }),
      note ? jsx("div", { className: "mt-2 text-xs font-medium opacity-70", children: note }) : null
    ]
  });
}

function ActionTile({ action }) {
  const Icon = action.icon;
  const tileClass = action.primary
    ? "group rounded-2xl border border-brand-500 bg-brand-500 p-5 text-white shadow-sm shadow-brand-500/20 transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-md"
    : action.dark
      ? "group rounded-2xl border border-surface-900 bg-surface-900 p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-surface-800 hover:shadow-md"
      : "group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md";
  const iconClass = action.primary || action.dark
    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition group-hover:bg-white/20"
    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white";
  const titleClass = action.primary || action.dark ? "font-semibold text-white" : "font-semibold text-surface-900";
  const noteClass = action.primary || action.dark ? "mt-1 text-sm leading-5 text-white/70" : "mt-1 text-sm leading-5 text-surface-500";

  return jsx(Link, {
    to: action.to,
    className: tileClass,
    children: jsxs("div", {
      className: "flex items-start gap-4",
      children: [
        jsx("div", { className: iconClass, children: jsx(Icon, { className: "w-5 h-5" }) }),
        jsxs("div", {
          className: "min-w-0",
          children: [
            jsx("div", { className: titleClass, children: action.label }),
            jsx("div", { className: noteClass, children: action.note })
          ]
        })
      ]
    })
  });
}

function PulseRow({ item }) {
  return jsx(Link, {
    to: item.href,
    className: "flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-brand-400/40 hover:bg-white/10",
    children: jsxs(Fragment, { children: [jsx("span", { className: "text-sm font-semibold text-white/75", children: item.label }), jsxs("span", { className: "inline-flex items-center gap-2 font-display text-xl font-bold text-white", children: [item.value, jsx(ChevronRight, { className: "w-4 h-4 text-brand-300" })] })] })
  });
}

function StatCard({ icon, label, value, accent }) {
  return jsxs("div", {
    className: "card p-5",
    children: [
      jsxs("div", { className: "flex items-center gap-2 text-xs font-medium text-surface-400 mb-2", children: [icon, label] }),
      jsx("div", { className: `font-display text-3xl font-bold leading-none ${accent ? "text-brand-500" : "text-surface-900"}`, children: value })
    ]
  });
}

function MiniPanel({ title, subtitle, body, href, icon: Icon }) {
  return jsx(Link, {
    to: href,
    className: "card p-5 block hover:border-brand-300 hover:bg-brand-50 transition",
    children: jsxs("div", {
      className: "flex items-start gap-3",
      children: [
        jsx("div", { className: "rounded-xl bg-surface-50 p-2 text-brand-500", children: jsx(Icon, { className: "w-4 h-4" }) }),
        jsxs("div", { children: [jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: title }), jsx("div", { className: "mt-1 text-sm font-medium text-surface-900", children: body }), jsx("div", { className: "mt-1 text-xs text-surface-500", children: subtitle })] })
      ]
    })
  });
}

function VisualCard({ title, value, body, href }) {
  return jsx(Link, {
    to: href,
    className: "group rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
    children: jsxs("div", {
      className: "flex items-start justify-between gap-4",
      children: [
        jsxs("div", {
          children: [
            jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: title }),
            jsx("div", { className: "mt-2 text-4xl font-display font-bold text-surface-900", children: value }),
            jsx("div", { className: "mt-2 text-sm text-surface-500", children: body })
          ]
        }),
        jsx(ChevronRight, { className: "w-5 h-5 text-surface-300 group-hover:text-brand-500 transition" })
      ]
    })
  });
}

function EmptyPanel({ title, subtitle }) {
  return jsxs("div", {
    className: "p-10 text-center text-surface-400",
    children: [
      jsx("div", { className: "mx-auto mb-3 w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center", children: jsx(PackageSearch, { className: "w-5 h-5 text-brand-500" }) }),
      jsx("div", { className: "text-lg font-semibold text-surface-900", children: title }),
      jsx("div", { className: "mt-1 text-sm text-surface-500", children: subtitle })
    ]
  });
}

function ListingRow({ listing, onCancel, isCancelling, onEdit }) {
  const countdown = useCountdown(listing.claimWindowEnd);
  const isClosed = listing.status === "sold_out" || listing.status === "expired" || listing.status === "cancelled" || countdown.expired;
  const claimed = listing.quantityTotal - listing.quantityAvailable;
  const isActive = listing.status === "active" && !countdown.expired;
  const progress = Math.min(100, Math.max(0, (claimed / Math.max(1, listing.quantityTotal)) * 100));

  return jsxs("div", {
    className: `group grid grid-cols-[1fr_90px_110px_120px] gap-4 px-5 py-4 items-center border-b border-surface-100 transition-colors ${isClosed ? "opacity-55" : "hover:bg-surface-50"}`,
    children: [
      jsxs("div", {
        className: "min-w-0 pr-4",
        children: [
          jsx("h3", { className: "font-semibold text-surface-900 text-sm truncate", children: listing.title }),
          jsx("div", { className: "mt-1 text-xs text-surface-500 truncate", children: listing.category.replace("_", " ") })
        ]
      }),
      jsxs("div", {
        className: "flex flex-col items-center justify-center",
        children: [
          jsxs("div", { className: "font-semibold text-surface-900 text-sm", children: [claimed, "/", listing.quantityTotal] }),
          jsx("div", {
            className: "mt-2 h-2 w-16 rounded-full bg-surface-200 overflow-hidden",
            children: jsx("div", { className: "h-full rounded-full bg-brand-500", style: { width: `${progress}%` } })
          })
        ]
      }),
      jsx("div", {
        className: `text-center font-display text-base font-bold ${isClosed ? "text-surface-400" : "text-brand-500"}`,
        children: isClosed ? "CLOSED" : countdown.label.replace("h ", ":").replace("m", "")
      }),
      jsx("div", {
        className: "flex justify-end gap-2",
        children: isActive ? jsxs(Fragment, {
          children: [
            jsx("span", { className: "badge-success text-[10px]", children: "Live" }),
            jsx("button", {
              onClick: onEdit,
              className: "p-1.5 rounded-lg text-surface-400 hover:text-brand-500 hover:bg-brand-50 transition-colors",
              title: "Edit Price",
              children: jsx(Edit2, { className: "w-3.5 h-3.5" })
            }),
            jsx("button", {
              onClick: () => onCancel(listing._id, listing.title),
              disabled: isCancelling,
              className: "p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50",
              title: "Cancel listing",
              children: jsx(X, { className: "w-3.5 h-3.5" })
            })
          ]
        }) : jsx("span", { className: "badge-neutral text-[10px]", children: "End" })
      })
    ]
  });
}

export { MerchantDashboard };
