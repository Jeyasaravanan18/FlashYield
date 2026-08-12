import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BadgeCheck, Clock3, Languages, Store, MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMerchantProfileTools, useUpdateProfileTools } from "../../api/hooks";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

function PinPicker({ position, onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          onMapClick({ lat: latlng.lat, lng: latlng.lng });
        }
      }
    }),
    [onMapClick]
  );

  return position ? (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
    />
  ) : null;
}

export function MerchantProfileToolsPage() {
  const { data, isLoading } = useMerchantProfileTools();
  const updateMutation = useUpdateProfileTools();

  const [storeHours, setStoreHours] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [languages, setLanguages] = useState("");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  useEffect(() => {
    if (!data) return;
    setStoreHours(data.storeHours || "");
    setPickupInstructions(data.pickupInstructions || "");
    setLanguages(data.languages || "Tamil, Hindi, Kannada, English");
    setAddress(data.address || "");
    if (data.location?.coordinates) {
      setPosition({ lat: data.location.coordinates[1], lng: data.location.coordinates[0] });
    } else {
      setPosition(null);
    }
  }, [data]);

  const center = useMemo(() => {
    if (position) return [position.lat, position.lng];
    return [12.9716, 77.5946];
  }, [position]);

  // Reverse geocode a lat/lng into an address string
  const reverseGeocode = async (lat, lng) => {
    try {
      setIsReversing(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const result = await res.json();
      if (result?.display_name) {
        setAddress(result.display_name);
        setSearchQuery(result.display_name);
      } else {
        // Fallback if no address found at this location
        const fallback = `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        setAddress(fallback);
        setSearchQuery(fallback);
      }
    } catch {
      // Fallback if geocoding API fails (e.g. rate limit)
      const fallback = `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      setAddress(fallback);
      setSearchQuery(fallback);
    } finally {
      setIsReversing(false);
    }
  };

  // Called when user clicks the map to drop a pin
  const handleMapClick = (coords) => {
    setPosition(coords);
    setSearchResults([]);
    reverseGeocode(coords.lat, coords.lng);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { "Accept-Language": "en" }
      });
      const results = await res.json();
      setSearchResults(Array.isArray(results) ? results : []);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setPosition({ lat, lng });
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          await reverseGeocode(latitude, longitude);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false)
    );
  };

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateMutation.mutate({
      storeHours,
      pickupInstructions,
      languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
      address,
      location: position ? { lat: position.lat, lng: position.lng } : undefined
    }, {
      onSuccess: () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    });
  };

  return jsxs("div", {
    className: "page-container max-w-7xl pb-14",
    children: [
      jsxs("div", {
        className: "mb-6 flex items-end justify-between gap-4",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-brand-600", children: "Merchant operations" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "Profile tools" }),
              jsx("p", { className: "mt-1 text-sm text-surface-500", children: "Change store details and pin the exact pickup location." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      isLoading
        ? jsx("div", { className: "card p-10 text-sm text-surface-400 flex items-center justify-center gap-2", children: jsxs("span", { children: [jsx(Loader2, { className: "inline-block h-5 w-5 animate-spin" }), " Loading profile tools..."] }) })
        : jsxs("div", {
            className: "grid gap-4 lg:grid-cols-[0.9fr_1.1fr]",
            children: [
              jsxs("div", {
                className: "grid gap-4",
                children: [
                  jsx("div", {
                    className: "card p-5",
                    children: jsxs("div", {
                      className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400",
                      children: [jsx(BadgeCheck, { className: "h-4 w-4 text-brand-500" }), "Verified badge"]
                    })
                  }, "badge"),
                  jsxs("div", {
                    className: "card p-5",
                    children: [
                      jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(Store, { className: "h-4 w-4 text-brand-500" }), "Store hours"] }),
                      jsx("textarea", { className: "input mt-3 min-h-28 resize-none", value: storeHours, onChange: (e) => setStoreHours(e.target.value), placeholder: data?.storeHours || "Mon-Sun 6am-10pm" })
                    ]
                  }, "hours"),
                  jsxs("div", {
                    className: "card p-5",
                    children: [
                      jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(Clock3, { className: "h-4 w-4 text-brand-500" }), "Pickup instructions"] }),
                      jsx("textarea", { className: "input mt-3 min-h-28 resize-none", value: pickupInstructions, onChange: (e) => setPickupInstructions(e.target.value), placeholder: data?.pickupInstructions || "Show token at the counter." })
                    ]
                  }, "pickup"),
                  jsxs("div", {
                    className: "card p-5",
                    children: [
                      jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(Languages, { className: "h-4 w-4 text-brand-500" }), "Languages"] }),
                      jsx("input", { className: "input mt-3", value: languages, onChange: (e) => setLanguages(e.target.value), placeholder: "Tamil, Hindi, Kannada, English" })
                    ]
                  }, "languages")
                ]
              }),
              jsxs("div", {
                className: "card p-5",
                children: [
                  jsxs("div", {
                    className: "mb-4 flex flex-wrap items-center justify-between gap-3",
                    children: [
                      jsxs("div", {
                        children: [
                          jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: [jsx(MapPin, { className: "h-4 w-4 text-brand-500" }), "Exact store location"] }),
                          jsx("p", { className: "mt-1 text-sm text-surface-500", children: "Merchant location is fixed for nearby customer searches, but you can edit it here." })
                        ]
                      }),
                      jsx("button", {
                        type: "button",
                        onClick: handleCurrentLocation,
                        disabled: isLocating,
                        className: "btn-ghost inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider",
                        children: isLocating ? "Locating..." : jsxs("span", { children: [jsx(Navigation, { className: "inline-block h-3 w-3" }), "Use current location"] })
                      })
                    ]
                  }),
                  jsx("form", {
                    onSubmit: handleSearch,
                    children: jsxs("div", {
                      className: "relative",
                      children: [
                        jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
                        jsx("input", { className: "input pl-9 pr-32", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search area, city, or pincode" }),
                        jsx("button", { type: "submit", className: "absolute right-2 top-1/2 -translate-y-1/2 btn-secondary px-3 py-1.5 text-xs", children: isSearching ? "Searching..." : "Search" })
                      ]
                    })
                  }),
                  searchResults.length > 0 && jsx("div", {
                    className: "mt-3 max-h-48 overflow-y-auto rounded-2xl border border-surface-200 bg-white",
                    children: searchResults.map((result, index) => jsx("button", {
                      type: "button",
                      onClick: () => handleSelect(result),
                      className: "block w-full border-b border-surface-100 px-4 py-3 text-left text-sm hover:bg-surface-50 last:border-0",
                      children: result.display_name
                    }, `${result.place_id || index}`))
                  }),
                  jsx("div", {
                    className: "mt-4 h-[420px] overflow-hidden rounded-3xl border border-surface-200",
                    children: jsxs(MapContainer, {
                      center,
                      zoom: position ? 15 : 5,
                      className: "h-full w-full",
                      children: [
                        jsx(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" }),
                        jsx(MapUpdater, { center: position ? [position.lat, position.lng] : null, zoom: 15 }),
                        jsx(PinPicker, { position, onMapClick: handleMapClick })
                      ]
                    })
                  }),
                  jsx("div", {
                    className: "mt-3 rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-xs text-surface-500",
                    children: isReversing ? "📍 Resolving address from pin..." : "Click the map to refine the pin exactly on your storefront."
                  }),
                  jsx("div", {
                    className: "mt-4 grid gap-4 md:grid-cols-2",
                    children: [
                      jsx("div", {
                        children: [
                          jsx("label", { className: "label", children: "Store address" }),
                          jsx("textarea", { className: "input min-h-24 resize-none", value: address, onChange: (e) => setAddress(e.target.value), placeholder: data?.address || "Full street address" })
                        ]
                      }),
                      jsx("div", {
                        className: "flex items-end",
                        children: jsx("button", {
                          type: "button",
                          onClick: handleSave,
                          disabled: updateMutation.isPending || !position || !address.trim() || isSaved,
                          className: `btn-primary w-full py-3.5 ${isSaved ? "bg-green-600 hover:bg-green-600" : ""}`,
                          children: isSaved ? "Saved!" : updateMutation.isPending ? "Saving..." : "Save merchant location"
                        })
                      })
                    ]
                  })
                ]
              })
            ]
          })
    ]
  });
}

