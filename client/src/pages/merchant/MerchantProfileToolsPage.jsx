import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BadgeCheck, Clock3, Languages, Store } from "lucide-react";
import { useMerchantProfileTools, useUpdateProfileTools } from "../../api/hooks";
import { useState } from "react";

function MerchantProfileToolsPage() {
  const { data, isLoading } = useMerchantProfileTools();
  const updateMutation = useUpdateProfileTools();
  const [storeHours, setStoreHours] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [languages, setLanguages] = useState("Tamil, Hindi, Kannada, English");
  const tools = data || {};

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", { className: "flex items-end justify-between gap-4 mb-6", children: [jsxs("div", { children: [jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }), jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Profile tools" }), jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Edit store hours, pickup instructions, and languages." })] }), jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })] }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading profile tools..." }) : jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        jsxs("div", { className: "card p-5", children: [jsx("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(BadgeCheck, { className: "w-4 h-4 text-brand-500" }), "Verified badge"] }), jsx("p", { className: "mt-2 text-lg font-semibold text-surface-50", children: tools.verifiedBadge ? "Enabled" : "Not enabled" })] }),
        jsxs("div", { className: "card p-5", children: [jsx("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(Store, { className: "w-4 h-4 text-brand-500" }), "Store profile"] }), jsx("textarea", { className: "input mt-3 min-h-24", value: storeHours, onChange: (e) => setStoreHours(e.target.value), placeholder: tools.storeHours || "Store hours" })] }),
        jsxs("div", { className: "card p-5", children: [jsx("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(Clock3, { className: "w-4 h-4 text-brand-500" }), "Pickup instructions"] }), jsx("textarea", { className: "input mt-3 min-h-24", value: pickupInstructions, onChange: (e) => setPickupInstructions(e.target.value), placeholder: tools.pickupInstructions || "Pickup instructions" })] }),
        jsxs("div", { className: "card p-5", children: [jsx("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(Languages, { className: "w-4 h-4 text-brand-500" }), "Languages"] }), jsx("input", { className: "input mt-3", value: languages, onChange: (e) => setLanguages(e.target.value) })] }),
        jsxs("div", { className: "md:col-span-2 flex gap-2", children: [jsx("button", { type: "button", className: "btn-primary btn-sm", onClick: () => updateMutation.mutate({ storeHours, pickupInstructions, languages: languages.split(",").map((s) => s.trim()) }), children: "Save profile tools" }), jsx("p", { className: "text-xs text-surface-400 self-center", children: "Changes update the merchant profile endpoint." })] })
      ] })
    ]
  });
}

export { MerchantProfileToolsPage };
