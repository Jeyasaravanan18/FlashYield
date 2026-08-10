import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Heart, MapPinned, Rocket } from "lucide-react";
import { useMerchantListings, usePromotionTargeting } from "../../api/hooks";
import { useState } from "react";

function MerchantPromotionPage() {
  const { data } = useMerchantListings();
  const promotion = usePromotionTargeting();
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState("sell_fastest");
  const listings = data?.data || [];

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", { className: "flex items-end justify-between gap-4 mb-6", children: [jsxs("div", { children: [jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant tools" }), jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Promotion tools" }), jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Push bundles to favorites, nearby radius, or sell-fastest mode." })] }), jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })] }),
      jsxs("div", { className: "card p-5 grid gap-4 md:grid-cols-[1fr_220px_auto]", children: [
        jsx("select", { className: "input", value: selectedId, onChange: (e) => setSelectedId(e.target.value), children: [jsx("option", { value: "", children: "Select listing" }), listings.map((listing) => jsx("option", { value: listing._id, children: listing.title }, listing._id))] }),
        jsx("select", { className: "input", value: mode, onChange: (e) => setMode(e.target.value), children: [jsx("option", { value: "favorites", children: "Push to favorites" }), jsx("option", { value: "radius", children: "Nearby radius" }), jsx("option", { value: "sell_fastest", children: "Sell fastest" })] }),
        jsx("button", { type: "button", className: "btn-primary btn-sm inline-flex items-center gap-2", disabled: promotion.isPending || !selectedId, onClick: () => promotion.mutate({ id: selectedId, promotionMode: mode }), children: [jsx(Rocket, { className: "w-4 h-4" }), "Apply promotion"] })
      ] }),
      jsxs("div", { className: "grid gap-4 md:grid-cols-3 mt-4", children: [
        jsx("div", { className: "card p-5", children: jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider", children: [jsx(Heart, { className: "w-4 h-4 text-brand-500" }), "Favorites targeting"] }) }),
        jsx("div", { className: "card p-5", children: jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider", children: [jsx(MapPinned, { className: "w-4 h-4 text-brand-500" }), "Nearby radius"] }) }),
        jsx("div", { className: "card p-5", children: jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider", children: [jsx(Rocket, { className: "w-4 h-4 text-brand-500" }), "Sell fastest"] }) })
      ] })
    ]
  });
}

export { MerchantPromotionPage };
