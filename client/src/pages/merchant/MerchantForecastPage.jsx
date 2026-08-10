import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BrainCircuit, PackageSearch } from "lucide-react";
import { useForecast } from "../../api/hooks";

function MerchantForecastPage() {
  const { data, isLoading } = useForecast();

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", { children: [jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant analytics" }), jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Inventory forecast" }), jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Predicted leftovers based on recent sell-through and pace." })] }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading forecast..." }) : jsxs("div", {
        className: "grid gap-4 md:grid-cols-3",
        children: [
          jsx("div", { className: "card p-5", children: [jsx("p", { className: "text-xs uppercase tracking-wider text-surface-400 font-bold", children: "Expected leftover" }), jsx("p", { className: "mt-2 text-3xl font-bold text-surface-50", children: data?.expectedLeftover ?? 0 })] }),
          jsx("div", { className: "card p-5", children: [jsx("p", { className: "text-xs uppercase tracking-wider text-surface-400 font-bold", children: "Confidence" }), jsx("p", { className: "mt-2 text-3xl font-bold text-surface-50", children: `${data?.confidence ?? 0}%` })] }),
          jsx("div", { className: "card p-5", children: [jsx("p", { className: "text-xs uppercase tracking-wider text-surface-400 font-bold", children: "Suggested bundles" }), jsx("p", { className: "mt-2 text-sm text-surface-300", children: (data?.suggestedBundles || []).map((item) => `${item.name}: ${item.expectedLeftover}`).join(" · ") || "No forecast yet" })] }),
          jsx("div", { className: "card p-5 md:col-span-3", children: jsxs("div", { className: "flex items-center gap-2 text-sm text-surface-400", children: [jsx(BrainCircuit, { className: "w-4 h-4 text-brand-500" }), "Forecast uses recent listings and live sell-through rates."] }) }),
          jsx("div", { className: "card p-5 md:col-span-3", children: jsxs("div", { className: "flex items-center gap-2 text-sm text-surface-400", children: [jsx(PackageSearch, { className: "w-4 h-4 text-brand-500" }), "Use this to size your next end-of-day bundle faster."] }) })
        ]
      })
    ]
  });
}

export { MerchantForecastPage };
