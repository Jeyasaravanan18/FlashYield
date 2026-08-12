import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BrainCircuit, PackageSearch, Sparkles } from "lucide-react";
import { useForecast } from "../../api/hooks";

export function MerchantForecastPage() {
  const { data, isLoading } = useForecast();
  const hasHistory = data?.hasHistory !== false && data?.expectedLeftover !== null && data?.expectedLeftover !== undefined;

  return jsxs("div", {
    className: "page-container max-w-6xl pb-14",
    children: [
      jsxs("div", {
        className: "mb-6 flex items-end justify-between gap-4",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-brand-600", children: "Merchant analytics" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "Inventory forecast" }),
              jsx("p", { className: "mt-1 text-sm text-surface-500", children: "Predicted leftovers based on your own recent listings and claim history." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      isLoading
        ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading forecast..." })
        : hasHistory
          ? jsxs("div", {
              className: "grid gap-4 md:grid-cols-3",
              children: [
                jsxs("div", {
                  className: "card p-5",
                  children: [
                    jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: "Expected leftover" }),
                    jsx("p", { className: "mt-2 text-3xl font-bold text-surface-900", children: data.expectedLeftover })
                  ]
                }),
                jsxs("div", {
                  className: "card p-5",
                  children: [
                    jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: "Confidence" }),
                    jsx("p", { className: "mt-2 text-3xl font-bold text-surface-900", children: `${data.confidence ?? 0}%` })
                  ]
                }),
                jsxs("div", {
                  className: "card p-5",
                  children: [
                    jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: "Best hour" }),
                    jsx("p", { className: "mt-2 text-3xl font-bold text-surface-900", children: data.bestHour === null ? "—" : `${data.bestHour}:00` })
                  ]
                }),
                jsx("div", {
                  className: "card p-5 md:col-span-3",
                  children: jsxs("div", {
                    className: "flex items-center gap-2 text-sm text-surface-400",
                    children: [
                      jsx(BrainCircuit, { className: "h-4 w-4 text-brand-500" }),
                      "Forecast uses your merchant history only. It will not reuse another store’s numbers."
                    ]
                  })
                }),
                jsx("div", {
                  className: "card p-5 md:col-span-3",
                  children: jsxs("div", {
                    children: [
                      jsxs("div", {
                        className: "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400",
                        children: [jsx(Sparkles, { className: "h-4 w-4 text-brand-500" }), "Suggested bundles"]
                      }),
                      jsx("div", {
                        className: "mt-4 grid gap-3 md:grid-cols-2",
                        children: (data.suggestedBundles || []).map((item) => jsxs("div", {
                          className: "rounded-2xl border border-surface-200 bg-surface-50 p-4",
                          children: [
                            jsx("div", { className: "font-semibold text-surface-900", children: item.name }),
                            jsxs("div", {
                              className: "mt-1 text-sm text-surface-500",
                              children: [
                                "Expected leftover: ",
                                item.expectedLeftover ?? 0,
                                " · Recommended discount: ",
                                item.recommendedDiscountPct ?? 0,
                                "%"
                              ]
                            })
                          ]
                        }, item.name))
                      })
                    ]
                  })
                }),
                jsx("div", {
                  className: "card p-5 md:col-span-3",
                  children: jsxs("div", {
                    className: "flex items-center gap-2 text-sm text-surface-400",
                    children: [
                      jsx(PackageSearch, { className: "h-4 w-4 text-brand-500" }),
                      "Signal summary: ",
                      `sold-out ${data.signalSummary?.soldOutRate ?? 0}%`,
                      " · ",
                      `take rate ${data.signalSummary?.avgTakeRate ?? 0}%`,
                      " · ",
                      `avg discount ${data.signalSummary?.avgDiscountPct ?? 0}%`
                    ]
                  })
                })
              ]
            })
          : jsxs("div", {
              className: "card border-dashed p-10 text-center",
              children: [
                jsx("div", { className: "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-50", children: jsx(PackageSearch, { className: "h-5 w-5 text-brand-500" }) }),
                jsxs("div", {
                  className: "text-center",
                  children: [
                    jsx("div", { className: "text-lg font-semibold text-surface-900", children: "No forecast yet for this merchant" }),
                    jsx("div", { className: "mt-1 text-sm text-surface-500", children: "Create and complete a few listings first. The forecast is merchant-specific and only appears once your own history exists." })
                  ]
                })
              ]
            })
    ]
  });
}
