import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, X, Navigation, LogIn, Search, Loader2 } from "lucide-react";
import { useLocationStore } from "../../store/locationStore";
import { useAuthStore } from "../../store/authStore";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function MapPicker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export function LocationModal({ force = false }) {
  const { requestLocation, setLocation, isModalOpen, closeLocationModal, status, label, error, location } = useLocationStore();
  const { openAuthModal } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pin, setPin] = useState(null);

  const open = isModalOpen || force;
  const center = useMemo(() => {
    if (pin) return [pin.lat, pin.lng];
    if (location?.lat && location?.lng) return [location.lat, location.lng];
    return [12.9716, 77.5946];
  }, [location, pin]);

  useEffect(() => {
    if (!open) return;
    if (location?.lat && location?.lng) {
      setPin({ lat: location.lat, lng: location.lng });
    }
  }, [open, location?.lat, location?.lng]);

  if (!open) return null;

  const handleDismiss = () => {
    if (force) return;
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
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickResult = (result) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setPin({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

  const handleUsePin = async () => {
    if (!pin) return;
    await setLocation(pin.lat, pin.lng, searchQuery || label || "Selected area");
    if (!force) closeLocationModal();
  };

  const handleCurrentLocation = async () => {
    await requestLocation();
    if (location?.lat && location?.lng) {
      setPin({ lat: location.lat, lng: location.lng });
    }
  };

  return jsxs("div", {
    className: "fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in",
    children: [
      jsx("div", { className: "absolute inset-0 bg-black/40 backdrop-blur-sm", onClick: handleDismiss }),
      jsxs("div", {
        className: "relative max-h-[90vh] w-full max-w-[1024px] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-scale-in",
        children: [
          !force && jsx("button", {
            onClick: handleDismiss,
            className: "absolute right-4 top-4 rounded-xl p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600",
            children: jsx(X, { className: "h-5 w-5" })
          }),
          jsxs("div", {
            className: "grid gap-0 lg:grid-cols-[0.95fr_1.05fr]",
            children: [
              jsxs("div", {
                className: "bg-surface-950 p-8 text-white sm:p-10",
                children: [
                  jsx("div", {
                    className: "mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70",
                    children: "Set your area"
                  }),
                  jsxs("h2", {
                    className: "text-3xl font-black uppercase leading-[0.92] tracking-tight sm:text-5xl",
                    children: [
                      force ? "Choose location" : "Share location",
                      jsx("br", {}),
                      force ? "to continue" : "to find nearby deals"
                    ]
                  }),
                  jsx("p", {
                    className: "mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base",
                    children: force
                      ? "Set your area or pin your exact location before the feed unlocks."
                      : "Use your current location, search by pincode, or drop a pin on the map for precise nearby results."
                  }),
                  jsxs("div", {
                    className: "mt-8 grid gap-3 sm:grid-cols-3",
                    children: [
                      jsx("div", { className: "rounded-3xl border border-white/10 bg-white/5 p-4 text-sm", children: "Current location" }),
                      jsx("div", { className: "rounded-3xl border border-white/10 bg-white/5 p-4 text-sm", children: "Search by pincode" }),
                      jsx("div", { className: "rounded-3xl border border-white/10 bg-white/5 p-4 text-sm", children: "Pin on map" })
                    ]
                  })
                ]
              }),
              jsxs("div", {
                className: "p-6 sm:p-8",
                children: [
                  (status === "granted" || status === "fallback") && label ? jsx("div", {
                    className: "mb-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700",
                    children: jsxs(Fragment, { children: ["Current area: ", jsx("strong", { children: label })] })
                  }) : null,
                  error && jsx("div", { className: "mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700", children: error }),
                  jsx("button", {
                    onClick: handleCurrentLocation,
                    disabled: status === "requesting",
                    className: "btn-primary mb-4 flex w-full items-center justify-center gap-2 py-3.5 text-sm",
                    children: status === "requesting"
                      ? jsxs(Fragment, { children: [jsx("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" }), "Locating..."] })
                      : jsxs(Fragment, { children: [jsx(Navigation, { className: "h-4 w-4" }), "Use Current Location"] })
                  }),
                  jsxs("form", {
                    onSubmit: handleManualSearch,
                    className: "mb-4",
                    children: [
                      jsxs("div", {
                        className: "relative",
                        children: [
                          jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
                          jsx("input", {
                            type: "text",
                            placeholder: "Search city, area, or pincode...",
                            value: searchQuery,
                            onChange: (e) => setSearchQuery(e.target.value),
                            className: "input bg-surface-50 pl-9 pr-12"
                          }),
                          isSearching && jsx(Loader2, { className: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-500" })
                        ]
                      }),
                      jsx("button", { type: "submit", className: "mt-3 btn-secondary w-full", children: "Search area" })
                    ]
                  }),
                  searchResults.length > 0 && jsx("div", {
                    className: "mb-4 max-h-48 overflow-y-auto rounded-2xl border border-surface-200 bg-white",
                    children: searchResults.map((res, index) => jsx("button", {
                      type: "button",
                      onClick: () => handlePickResult(res),
                      className: "block w-full border-b border-surface-100 px-4 py-3 text-left text-sm hover:bg-surface-50 last:border-0",
                      children: res.display_name
                    }, `${res.place_id || index}`))
                  }),
                  jsx("div", { className: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-surface-400", children: "or drop a pin" }),
                  jsxs("div", {
                    className: "h-[320px] overflow-hidden rounded-3xl border border-surface-200",
                    children: [
                      jsxs(MapContainer, {
                        center,
                        zoom: pin ? 15 : 5,
                        className: "h-full w-full",
                        children: [
                          jsx(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" }),
                          jsx(MapPicker, { position: pin, onChange: setPin })
                        ]
                      }),
                      jsx("div", {
                        className: "pointer-events-none relative -mt-[320px] flex h-[320px] items-end justify-end p-3",
                        children: jsx("div", {
                          className: "rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-surface-600 shadow-sm",
                          children: "Click the map to place the pin precisely."
                        })
                      })
                    ]
                  }),
                  jsx("button", {
                    onClick: handleUsePin,
                    disabled: !pin,
                    className: "btn-primary mt-4 w-full py-3.5 text-sm",
                    children: "Use this pin"
                  }),
                  !force && jsxs(Fragment, {
                    children: [
                      jsxs("div", {
                        className: "my-5 flex items-center gap-4",
                        children: [
                          jsx("div", { className: "flex-1 border-t border-dashed border-surface-200" }),
                          jsx("span", { className: "text-xs font-medium uppercase text-surface-400", children: "already a user?" }),
                          jsx("div", { className: "flex-1 border-t border-dashed border-surface-200" })
                        ]
                      }),
                      jsx("div", {
                        className: "text-center",
                        children: jsx("button", {
                          onClick: () => {
                            handleDismiss();
                            openAuthModal();
                          },
                          className: "inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600",
                          children: jsxs(Fragment, { children: [jsx(LogIn, { className: "h-4 w-4" }), "Login to see your saved addresses"] })
                        })
                      }),
                      jsx("button", {
                        onClick: handleDismiss,
                        className: "mt-4 w-full py-1 text-center text-xs text-surface-400 transition-colors hover:text-surface-600",
                        children: "Skip for now"
                      })
                    ]
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

