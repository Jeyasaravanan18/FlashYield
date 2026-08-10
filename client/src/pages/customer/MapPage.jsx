import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useNearbyListings } from "../../api/hooks";
import { useCountdown } from "../../hooks/useCountdown";
import { useLocationStore } from "../../store/locationStore";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Clock, Tag, Navigation } from "lucide-react";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});
const activeMarkerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z" fill="#FF4500"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
    </svg>
  `),
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46]
});
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}
function MapPage() {
  const { lat, lng, requestLocation } = useLocationStore();
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const listingsQuery = useNearbyListings({ lng, lat, radius: 15 });
  const listings = listingsQuery.data?.data ?? [];
  const merchantGroups = useMemo(() => {
    const groups = {};
    for (const listing of listings) {
      if (!listing.merchant) continue;
      const mid = listing.merchant._id;
      if (!groups[mid]) {
        groups[mid] = {
          merchantId: mid,
          businessName: listing.merchant.businessName,
          address: listing.merchant.address,
          coordinates: listing.merchant.location.coordinates,
          listings: []
        };
      }
      groups[mid].listings.push(listing);
    }
    return Object.values(groups);
  }, [listings]);
  const activeDeals = listings.filter((l) => l.quantityAvailable > 0).length;
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface-100 min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-medium text-surface-400 mb-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" }),
        merchantGroups.length,
        " merchants \xB7 ",
        activeDeals,
        " active deals nearby"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-4xl sm:text-5xl", children: [
        "Nearby ",
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent", children: "Deals Map" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[1fr_380px] gap-6 h-[calc(100vh-220px)] min-h-[500px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "card overflow-hidden p-1.5 relative", children: [
        /* @__PURE__ */ jsxs(
          MapContainer,
          {
            center: [lat, lng],
            zoom: 14,
            style: { height: "100%", width: "100%", borderRadius: "0.75rem" },
            attributionControl: false,
            children: [
              /* @__PURE__ */ jsx(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" }),
              /* @__PURE__ */ jsx(RecenterMap, { center: [lat, lng] }),
              merchantGroups.map((merchant) => /* @__PURE__ */ jsx(
                Marker,
                {
                  position: [merchant.coordinates[1], merchant.coordinates[0]],
                  icon: activeMarkerIcon,
                  eventHandlers: {
                    click: () => setSelectedMerchant(merchant)
                  }
                },
                merchant.merchantId
              ))
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: requestLocation,
            className: "absolute bottom-6 right-6 z-[400] bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-brand-500 transition-colors border border-surface-200",
            children: [
              /* @__PURE__ */ jsx(Navigation, { className: "w-4 h-4" }),
              "My Location"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto space-y-4 pr-1", children: listingsQuery.isLoading ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { className: "card p-5 h-36 skeleton" }, i)) }) : selectedMerchant ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "card p-5 bg-gradient-to-br from-surface-900 to-surface-950 text-white", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 mb-1", children: "Selected Store" }),
              /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold uppercase", children: selectedMerchant.businessName })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedMerchant(null),
                className: "text-xs font-medium text-surface-400 hover:text-white transition-colors",
                children: "Clear \xD7"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-sm text-surface-400", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
            selectedMerchant.address
          ] })
        ] }),
        selectedMerchant.listings.map((listing) => /* @__PURE__ */ jsx(MerchantListingCard, { listing }, listing._id))
      ] }) : merchantGroups.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "card p-8 text-center", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-surface-300 mx-auto mb-3" }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-surface-900 mb-1", children: "No deals nearby" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400", children: "Check back later for flash sales near you." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-surface-400 uppercase tracking-wider px-1", children: [
          "All Merchants (",
          merchantGroups.length,
          ")"
        ] }),
        merchantGroups.map((merchant) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setSelectedMerchant(merchant),
            className: "card p-5 w-full text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-surface-900", children: merchant.businessName }),
                /* @__PURE__ */ jsxs("span", { className: "badge-success text-[10px]", children: [
                  merchant.listings.length,
                  " deal",
                  merchant.listings.length !== 1 ? "s" : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-sm text-surface-400 mb-3", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                merchant.address
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: merchant.listings.slice(0, 3).map((l) => {
                const disc = l.originalPrice > 0 ? Math.round((l.originalPrice - l.discountedPrice) / l.originalPrice * 100) : 0;
                return /* @__PURE__ */ jsxs("span", { className: "text-xs bg-brand-50 text-brand-600 font-medium px-2 py-1 rounded-lg", children: [
                  l.title,
                  " \xB7 -",
                  disc,
                  "%"
                ] }, l._id);
              }) })
            ]
          },
          merchant.merchantId
        ))
      ] }) })
    ] }) })
  ] });
}
function MerchantListingCard({ listing }) {
  const countdown = useCountdown(listing.claimWindowEnd);
  const discount = listing.originalPrice > 0 ? Math.round((listing.originalPrice - listing.discountedPrice) / listing.originalPrice * 100) : 0;
  const isClosed = listing.status === "sold_out" || countdown.label === "00m";
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/listings/${listing._id}`,
      className: `card p-5 block group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${isClosed ? "opacity-50" : ""}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-surface-900 text-sm group-hover:text-brand-500 transition-colors", children: listing.title }),
          /* @__PURE__ */ jsxs("span", { className: "bg-gradient-to-r from-brand-500 to-brand-400 text-white text-xs font-bold px-2 py-0.5 rounded-full", children: [
            "-",
            discount,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm mb-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-surface-900", children: [
            "$",
            listing.discountedPrice.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-surface-300 line-through text-xs", children: [
            "$",
            listing.originalPrice.toFixed(2)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-surface-400", children: [
            /* @__PURE__ */ jsx(Tag, { className: "w-3 h-3" }),
            listing.quantityAvailable,
            " left of ",
            listing.quantityTotal
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 text-xs font-semibold ${isClosed ? "text-surface-400" : "text-brand-500"}`, children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
            isClosed ? "Closed" : countdown.label
          ] })
        ] })
      ]
    }
  );
}
export {
  MapPage
};
