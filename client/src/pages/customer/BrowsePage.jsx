import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNearbyListings } from "../../api/hooks";
import { useCountdown } from "../../hooks/useCountdown";
import { useLocationStore } from "../../store/locationStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useAuthStore } from "../../store/authStore";
import { Search, Clock, MapPin, Star, Heart } from "lucide-react";
const CATEGORIES = [
  { id: "", label: "All" },
  { id: "bakery", label: "Bakery" },
  { id: "prepared_meals", label: "Meals" },
  { id: "produce", label: "Produce" },
  { id: "dairy", label: "Dairy" },
  { id: "snacks", label: "Snacks" },
  { id: "mixed_bundle", label: "Mixed" }
];
function BrowsePage() {
  const { lat, lng } = useLocationStore();
  const { isFavorite } = useFavoritesStore();
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState("distance");
  const [maxDistance, setMaxDistance] = useState("");
  const listingsQuery = useNearbyListings({ 
    lng, 
    lat, 
    category: activeCategory || void 0, 
    dietaryTags: activeTags,
    radius: maxDistance ? maxDistance / 1000 : 50 
  });
  const listings = useMemo(() => {
    const raw = listingsQuery.data?.data ?? [];
    let filtered = raw.filter((l) => !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.merchant?.businessName.toLowerCase().includes(searchQuery.toLowerCase())).filter((l) => showFavorites ? l.merchant && isFavorite(l.merchant._id) : true).filter((l) => maxDistance ? (l.distance ?? 0) <= maxDistance : true);
    return filtered.sort((a, b) => {
      if (sortBy === "priceAsc") return a.discountedPrice - b.discountedPrice;
      if (sortBy === "priceDesc") return b.discountedPrice - a.discountedPrice;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (a.distance ?? 0) - (b.distance ?? 0);
    });
  }, [listingsQuery.data, searchQuery, showFavorites, maxDistance, sortBy, isFavorite]);
  const liveBundles = listings.filter((listing) => listing.quantityAvailable > 0).length;
  const nearbyMerchantCount = new Set(listings.map((l) => l.merchant?._id).filter(Boolean)).size;
  return /* @__PURE__ */ jsx("div", { className: "pb-24 pt-10 bg-surface-100 min-h-screen", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-medium text-surface-400 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" }),
        "Synchronized with ",
        nearbyMerchantCount,
        " merchants \xB7 ",
        liveBundles,
        " bundles live"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl max-w-4xl", children: [
        "Fresh Surplus",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent", children: "Near You" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 text-surface-500 max-w-xl text-base leading-relaxed", children: "Fresh surplus from neighborhood kitchens, listed the moment it hits the counter. Claim a bundle and collect within the pickup window." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: CATEGORIES.map((cat) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveCategory(cat.id),
          className: `px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${activeCategory === cat.id ? "bg-surface-900 text-white shadow-md" : "bg-white text-surface-600 border border-surface-200 hover:border-surface-300 hover:bg-surface-50"}`,
          children: cat.label
        },
        cat.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-3 md:mt-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowFavorites(!showFavorites),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 ${showFavorites ? "bg-red-50 text-red-500 border border-red-200 shadow-sm" : "bg-white text-surface-500 border border-surface-200 hover:bg-surface-50"}`,
            children: [
              /* @__PURE__ */ jsx(Heart, { className: `w-3.5 h-3.5 ${showFavorites ? "fill-red-500" : ""}` }),
              " Favorites"
            ]
          }
        ),
        [
          { id: "vegetarian", label: "Vegetarian" },
          { id: "vegan", label: "Vegan" },
          { id: "gluten-free", label: "Gluten-Free" },
          { id: "nut-free", label: "Nut-Free" },
          { id: "dairy-free", label: "Dairy-Free" },
          { id: "halal", label: "Halal" }
        ].map((tag) => {
          const isSelected = activeTags.includes(tag.id);
          return /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (isSelected) {
                  setActiveTags(activeTags.filter((t) => t !== tag.id));
                } else {
                  setActiveTags([...activeTags, tag.id]);
                }
              },
              className: `px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${isSelected ? "bg-brand-100 text-brand-700 shadow-sm" : "bg-white text-surface-500 border border-surface-200 hover:bg-surface-50"}`,
              children: tag.label
            },
            tag.id
          );
        })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row w-full md:w-auto gap-3 mt-4 md:mt-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: maxDistance,
              onChange: (e) => setMaxDistance(e.target.value ? Number(e.target.value) : ""),
              className: "input py-2 text-sm max-w-[120px]",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Any distance" }),
                /* @__PURE__ */ jsx("option", { value: "1000", children: "< 1 km" }),
                /* @__PURE__ */ jsx("option", { value: "3000", children: "< 3 km" }),
                /* @__PURE__ */ jsx("option", { value: "5000", children: "< 5 km" }),
                /* @__PURE__ */ jsx("option", { value: "10000", children: "< 10 km" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: sortBy,
              onChange: (e) => setSortBy(e.target.value),
              className: "input py-2 text-sm max-w-[140px]",
              children: [
                /* @__PURE__ */ jsx("option", { value: "distance", children: "Nearest" }),
                /* @__PURE__ */ jsx("option", { value: "priceAsc", children: "Price: Low to High" }),
                /* @__PURE__ */ jsx("option", { value: "priceDesc", children: "Price: High to Low" }),
                /* @__PURE__ */ jsx("option", { value: "newest", children: "Newest" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search drops...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "input pl-10 py-2 text-sm"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[1fr_360px] gap-10 items-start", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-5", children: listingsQuery.isLoading ? /* @__PURE__ */ jsx(ListingSkeletons, {}) : listings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card p-14 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Search, { className: "w-6 h-6 text-surface-400" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-surface-900 mb-1", children: "No active drops" }),
        /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm", children: "Check back later or expand your search area." })
      ] }) : listings.map((listing) => /* @__PURE__ */ jsx(ListingCard, { listing }, listing._id)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 sticky top-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "card p-7 bg-gradient-to-br from-white to-surface-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-6", children: [
            /* @__PURE__ */ jsxs("h2", { className: "font-display text-2xl font-bold uppercase leading-tight text-surface-900", children: [
              "Quick",
              /* @__PURE__ */ jsx("br", {}),
              "Pickup Guide"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "badge-success", children: "Live" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-surface-200 bg-white p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 mb-1", children: "1. Search nearby" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-600", children: "Filter by category, distance, dietary tags, or favorites." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-surface-200 bg-white p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 mb-1", children: "2. Choose quantity" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-600", children: "Book the whole bundle or reserve only the quantity you want." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-surface-200 bg-white p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 mb-1", children: "3. Pick up on time" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-600", children: "Your token expires 30 minutes after booking, so collect promptly." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => useAuthStore.getState().openAuthModal(), className: "btn-primary w-full py-3.5 text-sm flex justify-center", children: "Start claiming \u2192" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "card p-7", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold uppercase mb-5 text-surface-900", children: "How It Works" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0", children: "1" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-semibold text-surface-900 text-sm", children: "Merchants post surplus" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-0.5", children: "Kitchens list what's unsold with a live countdown." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0", children: "2" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-semibold text-surface-900 text-sm", children: "You claim a bundle" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-0.5", children: "One tap decrements inventory in real time." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0", children: "3" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-semibold text-surface-900 text-sm", children: "Show token at counter" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-0.5", children: "Present your alphanumeric ticket for pickup." })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
function formatDistance(meters) {
  if (!meters && meters !== 0) return "";
  if (meters < 1e3) return `${Math.round(meters)}m`;
  return `${(meters / 1e3).toFixed(1)} km`;
}
function ListingCard({ listing }) {
  const countdown = useCountdown(listing.claimWindowEnd);
  const discount = listing.originalPrice > 0 ? Math.round((listing.originalPrice - listing.discountedPrice) / listing.originalPrice * 100) : 0;
  const isClosed = listing.status === "sold_out" || countdown.expired;
  return /* @__PURE__ */ jsxs("div", { className: `card flex flex-col sm:flex-row overflow-hidden group ${isClosed ? "opacity-50" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "w-full sm:w-56 h-48 sm:h-auto bg-surface-100 flex items-center justify-center text-5xl shrink-0 overflow-hidden relative", children: listing.imageUrl ? /* @__PURE__ */ jsx("img", { src: listing.imageUrl, alt: listing.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" }) : /* @__PURE__ */ jsx("span", { children: listing.category === "bakery" ? "\u{1F950}" : listing.category === "prepared_meals" ? "\u{1F96A}" : "\u{1F37D}\uFE0F" }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-4 mb-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-medium text-surface-500", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-surface-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-surface-900 font-bold", children: listing.merchant?.businessName ?? "Local Partner" })
          ] }),
          listing.distance != null && /* @__PURE__ */ jsxs("span", { children: [
            "\xB7 ",
            formatDistance(listing.distance)
          ] }),
          listing.merchant && /* @__PURE__ */ jsx(MerchantRating, { merchantId: listing.merchant._id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          listing.merchant && /* @__PURE__ */ jsx(FavoriteButton, { merchantId: listing.merchant._id }),
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold text-sm px-3 py-1 rounded-full leading-none shadow-sm", children: [
            "-",
            discount,
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "font-display text-2xl sm:text-3xl font-bold text-surface-900 leading-tight mb-2 mt-1", children: listing.title }),
      listing.dietaryTags && listing.dietaryTags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mb-3", children: listing.dietaryTags.map((tag) => /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-100 text-surface-500 rounded-md", children: tag }, tag)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm font-medium text-surface-400 mb-6 mt-1", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-surface-900 text-lg font-bold", children: [
          "\u20B9",
          listing.discountedPrice.toFixed(2)
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "line-through text-surface-300", children: [
          "\u20B9",
          listing.originalPrice.toFixed(2)
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-surface-300", children: "\xB7" }),
        /* @__PURE__ */ jsxs("span", { children: [
          listing.quantityAvailable,
          " of ",
          listing.quantityTotal,
          " left"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-auto flex justify-between items-end", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-medium text-surface-400 mb-1", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
            "Pickup Window"
          ] }),
          /* @__PURE__ */ jsx("div", { className: `font-display text-3xl sm:text-4xl font-bold leading-none ${countdown.urgent ? "text-red-500" : "text-brand-500"}`, children: isClosed ? "CLOSED" : countdown.label })
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: `/listings/${listing._id}`,
            className: `btn ${isClosed ? "bg-surface-100 text-surface-400 cursor-not-allowed" : "btn-primary shadow-lg shadow-brand-500/20"} px-6 py-3 text-sm rounded-xl`,
            onClick: (e) => isClosed && e.preventDefault(),
            children: "Claim Ticket"
          }
        )
      ] })
    ] })
  ] });
}
function ListingSkeletons() {
  return /* @__PURE__ */ jsx(Fragment, { children: Array.from({ length: 3 }, (_, i) => /* @__PURE__ */ jsxs("div", { className: "card flex flex-col sm:flex-row overflow-hidden h-56", children: [
    /* @__PURE__ */ jsx("div", { className: "w-full sm:w-56 skeleton shrink-0" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col flex-1 space-y-4 justify-center", children: [
      /* @__PURE__ */ jsx("div", { className: "h-3 w-32 skeleton rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "h-8 w-3/4 skeleton rounded-lg" }),
      /* @__PURE__ */ jsx("div", { className: "h-3 w-48 skeleton rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "h-10 w-32 skeleton rounded-xl mt-auto" })
    ] })
  ] }, i)) });
}
import { useMerchantReviews } from "../../api/hooks";
function MerchantRating({ merchantId }) {
  const { data } = useMerchantReviews(merchantId, { limit: 1 });
  if (!data || data.meta.totalReviews === 0) return null;
  return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5 text-amber-500", children: [
    /* @__PURE__ */ jsx("span", { children: "\xB7" }),
    /* @__PURE__ */ jsx(Star, { className: "w-3 h-3 fill-current ml-1" }),
    /* @__PURE__ */ jsx("span", { children: data.meta.averageRating }),
    /* @__PURE__ */ jsxs("span", { className: "text-surface-400 font-normal", children: [
      "(",
      data.meta.totalReviews,
      ")"
    ] })
  ] });
}
function FavoriteButton({ merchantId }) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const active = isFavorite(merchantId);
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(merchantId);
      },
      className: `p-1.5 rounded-full border transition-colors ${active ? "bg-red-50 border-red-200 text-red-500" : "bg-surface-50 border-surface-200 text-surface-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200"}`,
      children: /* @__PURE__ */ jsx(Heart, { className: `w-3.5 h-3.5 ${active ? "fill-current" : ""}` })
    }
  );
}
export {
  BrowsePage
};
