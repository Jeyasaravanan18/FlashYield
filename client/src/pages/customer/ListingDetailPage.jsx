import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useListingDetail, useCreateClaim, useJoinWaitlist, useMerchantReviews } from "../../api/hooks";
import { useSocket } from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Clock, MapPin, ArrowLeft, Store, Zap, Star, ShieldCheck, AlertTriangle, BellRing } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown";
function getMerchant(listing) {
  return listing.merchant || listing.merchantId || null;
}
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});
function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: listing, isLoading, error } = useListingDetail(id);
  const claimMutation = useCreateClaim();
  const waitlistMutation = useJoinWaitlist();
  const { subscribeListing, unsubscribeListing } = useSocket();
  const { user, openAuthModal } = useAuthStore();
  const countdown = useCountdown(listing?.claimWindowEnd ?? (/* @__PURE__ */ new Date()).toISOString());
  const [waitlisted, setWaitlisted] = useState(false);
  const [claimQuantity, setClaimQuantity] = useState(1);
  useEffect(() => {
    if (id) {
      subscribeListing(id);
      return () => unsubscribeListing(id);
    }
  }, [id, subscribeListing, unsubscribeListing]);
  useEffect(() => {
    const maxQuantity = Math.max(1, listing?.quantityAvailable || 1);
    setClaimQuantity((current) => Math.min(Math.max(1, current || 1), maxQuantity));
  }, [listing?.quantityAvailable]);
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "page-container flex justify-center py-20", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-2 border-surface-200 border-t-brand-500 rounded-full animate-spin" }) });
  }
  if (error || !listing) {
    return /* @__PURE__ */ jsxs("div", { className: "page-container text-center py-20", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-surface-900 mb-2", children: "Listing not found" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => navigate(-1), className: "btn-ghost mt-2", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Go back"
      ] })
    ] });
  }
  const merchant = getMerchant(listing);
  const discount = Math.round(
    (listing.originalPrice - listing.discountedPrice) / listing.originalPrice * 100
  );
  const isAvailable = listing.status === "active" && listing.quantityAvailable > 0;
  const isExpired = countdown.expired;
  const stockRatio = Math.round(listing.quantityAvailable / listing.quantityTotal * 100);
  const handleClaim = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    claimMutation.mutate({ listingId: listing._id, quantity: claimQuantity }, {
      onSuccess: () => navigate("/claims")
    });
  };
    const isUnsplash = listing.imageUrl && listing.imageUrl.includes("unsplash.com");
    const displayImageUrl = isUnsplash 
      ? "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food%20and%20Drink/Takeout%20Box.png" 
      : listing.imageUrl;

  return /* @__PURE__ */ jsxs("div", { className: "page-container max-w-4xl animate-fade-in pb-14", children: [
    /* @__PURE__ */ jsxs("button", { onClick: () => navigate(-1), className: "btn-ghost mb-6 text-sm", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Back"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "card overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative h-64 md:h-full min-h-[280px] bg-surface-100", children: [
        displayImageUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            src: displayImageUrl,
            alt: listing.title,
            className: "w-full h-full object-cover",
            onError: (e) => {
              e.target.src = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food%20and%20Drink/Takeout%20Box.png";
            }
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-8xl", children: listing.category === "bakery" ? "🥐" : listing.category === "prepared_meals" ? "🥘" : "🍽️" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent" }),
        /* @__PURE__ */ jsxs("span", { className: "absolute top-3 left-3 bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold px-3 py-1.5 rounded-full text-sm shadow-md", children: [
          "-",
          discount,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-1", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-surface-900", children: listing.title }),
          /* @__PURE__ */ jsx("span", { className: `badge whitespace-nowrap ml-3 ${listing.status === "active" ? "badge-success" : listing.status === "sold_out" ? "badge-warning" : "badge-danger"}`, children: listing.status.replace("_", " ") })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-2", children: listing.description }),
        listing.dietaryTags && listing.dietaryTags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: listing.dietaryTags.map((tag) => /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-surface-100 text-surface-500 rounded-md", children: tag }, tag)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-center gap-4 p-4 bg-surface-50 rounded-xl border border-surface-200", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-surface-400 mb-0.5", children: "Price" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-2xl font-bold text-brand-500", children: [
                "\u20B9",
                listing.discountedPrice
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-surface-400 line-through", children: [
                "\u20B9",
                listing.originalPrice
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-surface-200" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-surface-400 mb-0.5", children: "Available" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-surface-900", children: [
              listing.quantityAvailable,
              /* @__PURE__ */ jsxs("span", { className: "text-surface-400 text-sm font-normal", children: [
                " / ",
                listing.quantityTotal
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-surface-400 mb-1.5", children: [
            /* @__PURE__ */ jsx("span", { children: "Stock level" }),
            /* @__PURE__ */ jsx("span", { className: listing.quantityAvailable <= 2 ? "text-red-500 font-medium" : "", children: listing.quantityAvailable <= 2 ? "Almost gone" : "Available" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-surface-200 overflow-hidden", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: `h-full rounded-full transition-all duration-500 ${stockRatio < 35 ? "bg-red-400" : "bg-brand-500"}`,
              style: { width: `${stockRatio}%` }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-2 text-sm text-surface-500", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-surface-400" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Pickup: ",
              new Date(listing.claimWindowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              " - ",
              new Date(listing.claimWindowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-4 h-4 flex items-center justify-center text-xs", children: "\u{1F3F7}\uFE0F" }),
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: listing.category.replace("_", " ") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-5", children: [
          claimMutation.error && /* @__PURE__ */ jsx("div", { className: "mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200", children: claimMutation.error.response?.data?.error?.message || "Failed to claim" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-2xl border border-surface-200 bg-surface-50 p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-surface-400 mb-0.5", children: "Booking quantity" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-surface-900", children: "Choose full bundle or a smaller quantity" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setClaimQuantity(Math.max(1, listing.quantityAvailable)), className: "text-xs font-semibold text-brand-500 hover:text-brand-600", children: "Full bundle" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setClaimQuantity((value) => Math.max(1, (value || 1) - 1)), disabled: claimQuantity <= 1, className: "h-10 w-10 rounded-xl border border-surface-200 bg-white text-lg font-bold text-surface-700 disabled:opacity-40", children: "−" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: String(listing.quantityAvailable), value: claimQuantity, onChange: (e) => setClaimQuantity(Math.min(Math.max(1, Number(e.target.value) || 1), listing.quantityAvailable)), className: "input text-center font-semibold" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setClaimQuantity((value) => Math.min(listing.quantityAvailable, (value || 1) + 1)), disabled: claimQuantity >= listing.quantityAvailable, className: "h-10 w-10 rounded-xl border border-surface-200 bg-white text-lg font-bold text-surface-700 disabled:opacity-40", children: "+" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-surface-400", children: `${claimQuantity} of ${listing.quantityAvailable} available will be reserved under one pickup token.` })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `w-full btn-lg ${isAvailable && !isExpired ? "btn-primary" : "btn-secondary opacity-50 cursor-not-allowed"}`,
              disabled: !isAvailable || isExpired || claimMutation.isPending || user?.role === "merchant",
              onClick: handleClaim,
              children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4" }),
                claimMutation.isPending ? "Claiming..." : isExpired ? "Time window closed" : !isAvailable ? "Sold out" : claimQuantity === listing.quantityAvailable ? "Claim full bundle" : `Claim ${claimQuantity}`
              ]
            }
          ),
          !isAvailable && !isExpired && user?.role === "customer" && /* @__PURE__ */ jsxs(
            "button",
            {
              className: "w-full btn-ghost mt-3 border border-brand-200 text-brand-600",
              disabled: waitlistMutation.isPending || waitlisted,
              onClick: () => waitlistMutation.mutate(listing._id, { onSuccess: () => setWaitlisted(true) }),
              children: [
                /* @__PURE__ */ jsx(BellRing, { className: "w-4 h-4" }),
                waitlisted ? "You\u2019re on the waitlist" : waitlistMutation.isPending ? "Joining waitlist..." : "Notify me if stock returns"
              ]
            }
          ),
          waitlistMutation.error && /* @__PURE__ */ jsx("p", { className: "mt-2 text-center text-xs text-red-500", children: waitlistMutation.error.response?.data?.error?.message || "Unable to join the waitlist" }),
          user?.role === "merchant" && /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-amber-500 mt-2", children: "Merchants cannot claim listings" })
        ] })
      ] })
    ] }) }),
    merchant && /* @__PURE__ */ jsxs("div", { className: "mt-6 grid md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-surface-900 mb-4", children: "Pickup location" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Store, { className: "w-5 h-5 text-surface-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-medium text-surface-900 flex items-center gap-2", children: [
              merchant.businessName,
              /* @__PURE__ */ jsx(MerchantRatingBadge, { merchantId: merchant._id })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-0.5", children: merchant.address })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 text-sm text-surface-500 bg-surface-50 rounded-xl p-3 border border-surface-200", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "inline w-3.5 h-3.5 mr-1 text-brand-500" }),
          "Show your digital token at pickup before",
          " ",
          /* @__PURE__ */ jsx("strong", { className: "text-surface-900", children: new Date(listing.claimWindowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 grid gap-2 text-xs text-surface-500", children: [
          merchant.verificationStatus === "approved" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-accent-50 p-2.5 text-accent-600", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4" }),
            "Verified local business"
          ] }),
          listing.allergenInfo && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-amber-700", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Allergens:" }),
              " ",
              listing.allergenInfo
            ] })
          ] }),
          listing.handlingNotes && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-surface-50 p-2.5", children: [
            /* @__PURE__ */ jsx("strong", { className: "text-surface-700", children: "Food handling:" }),
            " ",
            listing.handlingNotes
          ] })
        ] })
      ] }),
      merchant.location && /* @__PURE__ */ jsx("div", { className: "card p-1.5 h-56 overflow-hidden relative z-0", children: /* @__PURE__ */ jsxs(
        MapContainer,
        {
          center: [merchant.location.coordinates[1], merchant.location.coordinates[0]],
          zoom: 15,
          style: { height: "100%", width: "100%", borderRadius: "0.75rem" },
          attributionControl: false,
          children: [
            /* @__PURE__ */ jsx(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" }),
            /* @__PURE__ */ jsx(Marker, { position: [merchant.location.coordinates[1], merchant.location.coordinates[0]], children: /* @__PURE__ */ jsxs(Popup, { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-surface-900 text-sm", children: merchant.businessName }),
              /* @__PURE__ */ jsx("div", { className: "text-surface-500 text-xs", children: merchant.address })
            ] }) })
          ]
        }
      ) })
    ] })
  ] });
}
function MerchantRatingBadge({ merchantId }) {
  const { data } = useMerchantReviews(merchantId, { limit: 1 });
  if (!data || data.meta.totalReviews === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-semibold border border-amber-100", children: [
    /* @__PURE__ */ jsx(Star, { className: "w-3 h-3 fill-current" }),
    /* @__PURE__ */ jsx("span", { children: data.meta.averageRating })
  ] });
}
export {
  ListingDetailPage
};
