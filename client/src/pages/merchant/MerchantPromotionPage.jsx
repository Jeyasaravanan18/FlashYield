import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Heart, MapPinned, Rocket, CheckCircle2 } from "lucide-react";
import { useMerchantListings, usePromotionTargeting } from "../../api/hooks";
import { useState } from "react";

function MerchantPromotionPage() {
  const { data } = useMerchantListings();
  const promotion = usePromotionTargeting();
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState("sell_fastest");
  const [successMsg, setSuccessMsg] = useState("");
  
  const listings = data?.data?.filter(l => l.status === "active") || [];
  const promotedListings = data?.data?.filter(l => l.promotionMode && l.promotionMode !== "standard") || [];

  const handleApply = () => {
    promotion.mutate({ id: selectedId, promotionMode: mode }, {
      onSuccess: () => {
        setSelectedId("");
        setSuccessMsg("Promotion applied successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      },
      onError: (err) => {
        alert(err?.response?.data?.error || "Error applying promotion");
      }
    });
  };

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", { className: "flex items-end justify-between gap-4 mb-6", children: [jsxs("div", { children: [jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant tools" }), jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "Promotion tools" }), jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Push bundles to favorites, nearby radius, or sell-fastest mode." })] }), jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })] }),
      
      successMsg && jsxs("div", { className: "mb-6 p-4 rounded-xl bg-green-50 text-green-700 flex items-center gap-3", children: [jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" }), successMsg] }),

      jsxs("div", { className: "card p-5 grid gap-4 md:grid-cols-[1fr_220px_auto]", children: [
        jsx("select", { className: "input", value: selectedId, onChange: (e) => setSelectedId(e.target.value), children: [jsx("option", { value: "", children: "Select active listing" }), listings.map((listing) => jsx("option", { value: listing._id, children: listing.title }, listing._id))] }),
        jsx("select", { className: "input", value: mode, onChange: (e) => setMode(e.target.value), children: [jsx("option", { value: "favorites", children: "Push to favorites" }), jsx("option", { value: "radius", children: "Nearby radius" }), jsx("option", { value: "sell_fastest", children: "Sell fastest" })] }),
        jsx("button", { type: "button", className: "btn-primary btn-sm inline-flex items-center gap-2", disabled: promotion.isPending || !selectedId, onClick: handleApply, children: [jsx(Rocket, { className: "w-4 h-4" }), "Apply promotion"] })
      ] }),
      jsxs("div", { className: "grid gap-4 md:grid-cols-3 mt-4", children: [
        jsx("div", { className: "card p-5", children: jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider", children: [jsx(Heart, { className: "w-4 h-4 text-brand-500" }), "Favorites targeting"] }) }),
        jsx("div", { className: "card p-5", children: jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider", children: [jsx(MapPinned, { className: "w-4 h-4 text-brand-500" }), "Nearby radius"] }) }),
        jsx("div", { className: "card p-5", children: jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider", children: [jsx(Rocket, { className: "w-4 h-4 text-brand-500" }), "Sell fastest"] }) })
      ] }),
      
      jsxs("div", { className: "mt-10", children: [
        jsx("h2", { className: "text-lg font-bold text-surface-900 mb-4", children: "Active Promotions" }),
        promotedListings.length === 0 ? jsx("div", { className: "card p-10 text-center text-surface-400", children: "No promotions currently active." }) : jsx("div", { className: "grid gap-3", children: promotedListings.map(listing => jsxs("div", { className: "card p-4 flex items-center justify-between", children: [jsxs("div", { children: [jsx("h3", { className: "font-semibold text-surface-900", children: listing.title }), jsx("p", { className: "text-xs text-surface-500 mt-0.5", children: `Status: ${listing.status.replace("_", " ")}` })] }), jsx("span", { className: "bg-brand-50 text-brand-600 font-bold uppercase tracking-wider text-[10px] px-2 py-1 rounded", children: listing.promotionMode.replace("_", " ") })] }, listing._id)) })
      ] })
    ]
  });
}

export { MerchantPromotionPage };
