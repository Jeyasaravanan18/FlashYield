import { jsx, jsxs } from "react/jsx-runtime";
import { useMyClaims } from "../../api/hooks";
import { useCountdown } from "../../hooks/useCountdown";
import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import { Lock, Ticket, ArrowRight } from "lucide-react";
function MyClaimsPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const { data, isLoading, error } = useMyClaims({ enabled: isAuthenticated });
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsx("div", { className: "bg-surface-100 min-h-screen pb-24 pt-12", children: /* @__PURE__ */ jsx("div", { className: "max-w-md mx-auto px-4", children: /* @__PURE__ */ jsxs("div", { className: "card p-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5", children: /* @__PURE__ */ jsx(Lock, { className: "w-6 h-6 text-surface-400", strokeWidth: 1.5 }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-surface-900 mb-2", children: "Sign in required" }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm mb-8 max-w-xs mx-auto", children: "Your pickup tokens live here once you claim a bundle from the feed." }),
      /* @__PURE__ */ jsx("button", { onClick: openAuthModal, className: "btn-primary px-8 py-3 inline-flex", children: "Log In to Continue" })
    ] }) }) });
  }
  const activeCount = data?.data.filter((claim) => claim.status === "reserved").length ?? 0;
  return /* @__PURE__ */ jsx("div", { className: "bg-surface-100 min-h-screen pb-24 pt-10", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-surface-400 mb-3", children: [
        activeCount,
        " active ticket",
        activeCount !== 1 ? "s" : ""
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-5xl sm:text-6xl", children: [
        "My ",
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent", children: "Tickets" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { className: "card p-6 h-28 skeleton" }, i)) }) : error ? /* @__PURE__ */ jsxs("div", { className: "card p-10 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-surface-900 mb-1", children: "Error loading tickets" }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm", children: "Please try again later." })
    ] }) : data?.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card p-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Ticket, { className: "w-6 h-6 text-surface-400" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-surface-900 mb-1", children: "No tickets yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm", children: "Your claimed bundles will appear here." })
    ] }) : data?.data.map((claim) => /* @__PURE__ */ jsx(ClaimRow, { claim }, claim._id)) })
  ] }) });
}
function ClaimRow({ claim }) {
  const listing = typeof claim.listingId === "object" ? claim.listingId : null;
  const isReserved = claim.status === "reserved";
  const countdown = useCountdown(claim.expiresAt);
  return /* @__PURE__ */ jsx(
    Link,
    {
      to: `/claims/${claim._id}`,
      className: `block card p-5 group transition-all duration-200 ${isReserved ? "hover:shadow-lg hover:-translate-y-0.5" : "opacity-50"}`,
      children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 mb-1", children: listing?.merchant?.businessName ?? "Local Partner" }),
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl sm:text-2xl font-bold text-surface-900 leading-tight mb-1.5 truncate", children: listing?.title ?? "Bundle" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("code", { className: "text-xs font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-md", children: claim.token.length > 12 ? `${claim.token.slice(0, 8)}\u2026` : claim.token }),
            isReserved && /* @__PURE__ */ jsx("span", { className: "badge-success text-[10px]", children: "Active" }),
            claim.status === "collected" && /* @__PURE__ */ jsx("span", { className: "badge-neutral text-[10px]", children: "Collected" }),
            claim.status === "expired" && /* @__PURE__ */ jsx("span", { className: "badge-danger text-[10px]", children: "Expired" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 shrink-0 ml-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 mb-0.5", children: isReserved ? "Expires" : "Status" }),
            /* @__PURE__ */ jsx("div", { className: `font-display text-2xl sm:text-3xl font-bold leading-none ${isReserved ? countdown.urgent ? "text-red-500" : "text-brand-500" : "text-surface-300"}`, children: isReserved ? countdown.label.replace("h ", ":").replace("m", "") : "\u2014" })
          ] }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-surface-300 group-hover:text-brand-500 transition-colors" })
        ] })
      ] })
    }
  );
}
export {
  MyClaimsPage
};
