import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BarChart3, ChevronRight, Clock3, DollarSign, TrendingUp, Users } from "lucide-react";
import { useCharts } from "../../api/hooks";

function MerchantChartsPage() {
  const { data, isLoading, isError } = useCharts();
  const best = data?.bestSellingWindows || [];
  const byHour = Array.isArray(data?.byHour) ? data.byHour : [];
  const maxHour = Math.max(1, ...byHour);

  return jsxs("div", {
    className: "min-h-screen bg-[#f5f5f4] pb-16",
    children: [
      jsxs("main", {
        className: "mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8",
        children: [
          jsxs("section", {
            className: "rounded-2xl border border-surface-200 bg-white p-6 shadow-sm",
            children: [
              jsxs("div", {
                className: "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between",
                children: [
                  jsxs("div", {
                    children: [
                      jsxs("div", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-500", children: [jsx(BarChart3, { className: "h-3.5 w-3.5" }), "Merchant analytics"] }),
                      jsx("h1", { className: "mt-2 font-display text-4xl font-bold uppercase leading-none text-surface-900 sm:text-5xl", children: "Charts" }),
                      jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-surface-500", children: "Track recovered revenue, claim volume, and the time windows that move surplus fastest." })
                    ]
                  }),
                  jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm border border-surface-200 bg-white", children: "Dashboard" })
                ]
              }),
              jsxs("div", {
                className: "mt-6 grid gap-3 md:grid-cols-3",
                children: [
                  jsx(KpiCard, { icon: DollarSign, label: "Revenue recovered", value: `Rs ${data?.revenueRecovered ?? 0}`, note: "Collected claims only", tone: "brand" }),
                  jsx(KpiCard, { icon: Users, label: "Total claims", value: data?.totalClaims ?? 0, note: "All claims in range", tone: "blue" }),
                  jsx(KpiCard, { icon: Clock3, label: "Best window", value: best[0]?.hour ?? "--", note: "Top pickup hour", tone: "dark" })
                ]
              })
            ]
          }),

          isLoading ? jsx(StatePanel, { title: "Loading charts", subtitle: "Reading claim volume and recovered revenue." }) : null,
          isError ? jsx(StatePanel, { title: "Charts unavailable", subtitle: "Check the backend connection and refresh this page." }) : null,
          !isLoading && !isError ? jsxs("section", {
            className: "mt-5 grid gap-5 xl:grid-cols-[1fr_420px]",
            children: [
              jsxs("div", {
                className: "rounded-2xl border border-surface-200 bg-white p-5 shadow-sm",
                children: [
                  jsxs("div", { className: "mb-5 flex items-center justify-between gap-3", children: [
                    jsxs("div", { children: [jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: "Claims by hour" }), jsx("h2", { className: "mt-1 text-xl font-display font-bold uppercase text-surface-900", children: "Daily demand curve" })] }),
                    jsx(BarChart3, { className: "h-5 w-5 text-brand-500" })
                  ] }),
                  byHour.length ? jsx("div", {
                    className: "grid h-64 gap-2",
                    style: { gridTemplateColumns: `repeat(${byHour.length}, minmax(0, 1fr))` },
                    children: byHour.map((count, hour) => jsx(HourBar, { hour, count, maxHour }, hour))
                  }) : jsx(EmptyPanel, { title: "No claim data yet", subtitle: "Claims by hour will appear after customers start booking bundles." })
                ]
              }),
              jsxs("div", {
                className: "rounded-2xl border border-surface-200 bg-surface-900 p-5 text-white shadow-sm",
                children: [
                  jsxs("div", { className: "mb-5 flex items-center justify-between gap-3", children: [
                    jsxs("div", { children: [jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-white/45", children: "Best-selling windows" }), jsx("h2", { className: "mt-1 text-xl font-display font-bold uppercase text-white", children: "Peak pickup slots" })] }),
                    jsx(TrendingUp, { className: "h-5 w-5 text-brand-300" })
                  ] }),
                  best.length ? jsx("div", { className: "grid gap-3", children: best.map((item, index) => jsx(WindowRow, { item, index }, item.hour || index)) }) : jsx("div", { className: "rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60", children: "No best-selling window yet." })
                ]
              })
            ]
          }) : null
        ]
      })
    ]
  });
}

function KpiCard({ icon: Icon, label, value, note, tone }) {
  const tones = {
    brand: "border-brand-200 bg-brand-50 text-brand-500",
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    dark: "border-surface-300 bg-surface-900 text-white"
  };

  return jsxs("div", {
    className: `rounded-2xl border p-5 shadow-sm ${tones[tone]}`,
    children: [
      jsxs("div", { className: "flex items-center justify-between gap-3", children: [jsx("p", { className: "text-xs font-bold uppercase tracking-wider opacity-70", children: label }), jsx(Icon, { className: "h-5 w-5 opacity-70" })] }),
      jsx("div", { className: "mt-3 font-display text-4xl font-bold leading-none", children: value }),
      jsx("p", { className: "mt-2 text-xs font-medium opacity-70", children: note })
    ]
  });
}

function HourBar({ hour, count, maxHour }) {
  const height = `${Math.max(7, Math.round((count / maxHour) * 100))}%`;
  const showLabel = hour % 3 === 0;

  return jsxs("div", {
    className: "flex h-full min-w-0 flex-col items-center justify-end gap-2",
    title: `${hour}:00 - ${count} claims`,
    children: [
      jsx("div", { className: "flex w-full flex-1 items-end", children: jsx("div", { className: "w-full rounded-t-lg bg-brand-500 transition hover:bg-brand-600", style: { height } }) }),
      jsx("span", { className: "h-4 text-[10px] font-semibold text-surface-400", children: showLabel ? hour : "" })
    ]
  });
}

function WindowRow({ item, index }) {
  return jsxs("div", {
    className: "flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3",
    children: [
      jsxs("div", { className: "flex items-center gap-3", children: [
        jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white", children: index + 1 }),
        jsxs("div", { children: [jsx("div", { className: "font-semibold text-white", children: item.hour || "--" }), jsx("div", { className: "text-xs text-white/50", children: "Pickup hour" })] })
      ] }),
      jsxs("div", { className: "inline-flex items-center gap-2 font-display text-xl font-bold text-white", children: [item.count ?? 0, jsx(ChevronRight, { className: "h-4 w-4 text-brand-300" })] })
    ]
  });
}

function StatePanel({ title, subtitle }) {
  return jsx("section", {
    className: "mt-5 rounded-2xl border border-surface-200 bg-white p-10 text-center shadow-sm",
    children: jsx(EmptyPanel, { title, subtitle })
  });
}

function EmptyPanel({ title, subtitle }) {
  return jsxs("div", {
    className: "text-center",
    children: [
      jsx("div", { className: "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500", children: jsx(BarChart3, { className: "h-5 w-5" }) }),
      jsx("h2", { className: "text-lg font-semibold text-surface-900", children: title }),
      jsx("p", { className: "mt-1 text-sm text-surface-500", children: subtitle })
    ]
  });
}

export { MerchantChartsPage };
