import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BadgeCheck, TriangleAlert } from "lucide-react";
import { useMerchantQueue, useVerifyQueueClaim, useNoShowQueueClaim } from "../../api/hooks";

function MerchantQueuePage() {
  const { data, isLoading } = useMerchantQueue();
  const verifyMutation = useVerifyQueueClaim();
  const noShowMutation = useNoShowQueueClaim();
  const queue = data?.queue || [];

  return jsxs("div", {
    className: "page-container max-w-6xl pb-14",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "Pickup queue" }),
              jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Verify pickup tokens or mark a no-show directly." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading queue..." }) : jsxs("div", {
        className: "grid gap-4",
        children: queue.length === 0 ? jsx("div", { className: "card p-10 text-center text-surface-400", children: "No queued claims right now." }) : queue.map((item) => jsxs("div", {
          className: "card p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
          children: [
            jsxs("div", {
              children: [
                jsx("h2", { className: "text-lg font-semibold text-surface-900", children: item.listingTitle || item.title || "Claim" }),
                jsx("p", { className: "text-sm text-surface-400 mt-1", children: item.customerName || item.customerPhone || "Customer verified at counter" }),
                jsx("p", { className: "text-xs text-surface-500 mt-1", children: `Token: ${item.claimToken || "—"} · Order #${item.pickupOrder || 0}` })
              ]
            }),
            jsx("div", {
              className: "flex flex-wrap gap-2",
              children: item.status === "reserved" ? jsxs(Fragment, {
                children: [
                  jsx("button", { type: "button", className: "btn-primary btn-sm inline-flex items-center gap-2", disabled: verifyMutation.isPending, onClick: () => verifyMutation.mutate(item._id), children: [jsx(BadgeCheck, { className: "w-4 h-4" }), "Mark collected"] }),
                  jsx("button", { type: "button", className: "btn-ghost btn-sm inline-flex items-center gap-2", disabled: noShowMutation.isPending, onClick: () => noShowMutation.mutate(item._id), children: [jsx(TriangleAlert, { className: "w-4 h-4" }), "Mark no-show"] })
                ]
              }) : item.status === "collected" ? jsxs("span", { className: "inline-flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200", children: [jsx(BadgeCheck, { className: "w-4 h-4" }), "Collected"] }) : (item.status === "missed" || item.status === "expired") ? jsxs("span", { className: "inline-flex items-center gap-1 text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200", children: [jsx(TriangleAlert, { className: "w-4 h-4" }), "No-show"] }) : null
            })
          ]
        }, item._id || item.id))
      })
    ]
  });
}

export { MerchantQueuePage };
