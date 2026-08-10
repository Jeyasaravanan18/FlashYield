import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useNearbyListings } from "../../api/hooks";
import { useLocationStore } from "../../store/locationStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { Heart, Search } from "lucide-react";
import { useMemo } from "react";
function FavoritesPage() {
  const { lat, lng } = useLocationStore();
  const { favorites } = useFavoritesStore();
  const listingsQuery = useNearbyListings({ lng, lat });
  const favoriteListings = useMemo(() => {
    if (!listingsQuery.data?.data) return [];
    return listingsQuery.data.data.filter(
      (listing) => listing.merchant && favorites.includes(listing.merchant._id)
    );
  }, [listingsQuery.data, favorites]);
  return /* @__PURE__ */ jsx("div", { className: "pb-24 pt-10 bg-surface-100 min-h-screen", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
      /* @__PURE__ */ jsxs("h1", { className: "font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-4xl sm:text-5xl md:text-6xl mb-4", children: [
        "Saved ",
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent", children: "Merchants" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-500 max-w-xl text-base leading-relaxed", children: "Quickly check active surplus deals from your favorite neighborhood kitchens." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-5 max-w-3xl", children: listingsQuery.isLoading ? /* @__PURE__ */ jsx("div", { className: "card p-14 text-center", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-3 border-surface-200 border-t-brand-500 rounded-full animate-spin mx-auto" }) }) : favorites.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card p-14 text-center border-dashed", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Heart, { className: "w-6 h-6 text-red-400" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-surface-900 mb-1", children: "No favorites yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm mb-6", children: "Tap the heart icon on any listing to save a merchant." }),
      /* @__PURE__ */ jsx(Link, { to: "/", className: "btn-primary", children: "Browse Deals" })
    ] }) : favoriteListings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card p-14 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Search, { className: "w-6 h-6 text-surface-400" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-surface-900 mb-1", children: "No active deals right now" }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm", children: "Your favorite merchants haven't posted any surplus at the moment." })
    ] }) : (
      // Since BrowsePage uses a local component for ListingCard, we'd normally extract it.
      // For now, we rely on the user to see favorites filtering in BrowsePage directly, 
      // or we can implement a generic List view.
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2", children: "Live Deals from Favorites" }),
        favoriteListings.map((listing) => /* @__PURE__ */ jsxs(Link, { to: `/listings/${listing._id}`, className: "card p-6 flex flex-col sm:flex-row gap-6 hover:border-brand-300 transition-colors group", children: [
          listing.imageUrl ? /* @__PURE__ */ jsx("div", { className: "w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0", children: /* @__PURE__ */ jsx("img", { src: listing.imageUrl, alt: listing.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform" }) }) : /* @__PURE__ */ jsx("div", { className: "w-full sm:w-32 h-32 rounded-xl bg-surface-100 flex items-center justify-center text-4xl shrink-0", children: listing.category === "bakery" ? "\u{1F950}" : "\u{1F37D}\uFE0F" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-xl text-surface-900", children: listing.title }),
              /* @__PURE__ */ jsxs("span", { className: "bg-brand-50 text-brand-600 font-bold text-xs px-2 py-1 rounded", children: [
                "-",
                listing.discountPercentage,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-500 mb-4", children: listing.merchant?.businessName }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-center", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-lg text-surface-900", children: [
                "\u20B9",
                listing.discountedPrice
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-surface-400 line-through", children: [
                "\u20B9",
                listing.originalPrice
              ] })
            ] })
          ] })
        ] }, listing._id))
      ] })
    ) })
  ] }) });
}
export {
  FavoritesPage
};
