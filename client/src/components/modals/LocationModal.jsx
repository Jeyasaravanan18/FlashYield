import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useLocationStore } from "../../store/locationStore";
import { useAuthStore } from "../../store/authStore";
import { MapPin, X, Navigation, LogIn, Search, Loader2 } from "lucide-react";
function LocationModal() {
  const { requestLocation, setLocation, isModalOpen, closeLocationModal, status, label, error } = useLocationStore();
  const { openAuthModal } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  if (!isModalOpen) return null;
  const handleShareLocation = async () => {
    await requestLocation();
  };
  const handleDismiss = () => {
    closeLocationModal();
  };
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };
  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name.split(",")[0];
    setLocation(lat, lng, label);
    closeLocationModal();
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 backdrop-blur-sm", onClick: handleDismiss }),
    /* @__PURE__ */ jsxs("div", { className: "relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDismiss,
          className: "absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors",
          children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400/10 to-brand-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(MapPin, { className: "w-10 h-10 text-brand-500", strokeWidth: 1.5 }) }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center shadow-md", children: /* @__PURE__ */ jsx(Navigation, { className: "w-3.5 h-3.5 text-white" }) })
      ] }) }),
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-surface-900 text-center mb-2", children: [
        "Share location to find",
        /* @__PURE__ */ jsx("br", {}),
        "nearby flash deals"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 text-center mb-8 max-w-xs mx-auto", children: "See surplus food from kitchens closest to you and never miss a deal in your neighborhood." }),
      (status === "granted" || status === "fallback") && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700", children: [
        "Current area: ",
        jsx("strong", { children: label })
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700", children: error }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleShareLocation,
          disabled: status === "requesting",
          className: "btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 mb-4",
          children: status === "requesting" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
            "Locating..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Navigation, { className: "w-4 h-4" }),
            "Use Current Location"
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 my-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-dashed border-surface-200" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-surface-400 uppercase", children: "or enter manually" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-dashed border-surface-200" })
      ] }),
      /* @__PURE__ */ jsx("form", { onSubmit: handleManualSearch, className: "mb-4", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Search city, area, or zip code...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "w-full pl-9 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          }
        ),
        isSearching && /* @__PURE__ */ jsx(Loader2, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" })
      ] }) }),
      searchResults.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-4 border border-surface-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto", children: searchResults.map((res, i) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleSelectLocation(res),
          className: "w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 border-b border-surface-100 last:border-0 truncate",
          children: res.display_name
        },
        i
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 my-5", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-dashed border-surface-200" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-surface-400 uppercase", children: "already a user?" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-dashed border-surface-200" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            handleDismiss();
            openAuthModal();
          },
          className: "inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4" }),
            "Login to see your saved addresses"
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDismiss,
          className: "w-full mt-4 text-xs text-surface-400 hover:text-surface-600 transition-colors text-center py-1",
          children: "Skip for now"
        }
      )
    ] })
  ] });
}
export {
  LocationModal
};
