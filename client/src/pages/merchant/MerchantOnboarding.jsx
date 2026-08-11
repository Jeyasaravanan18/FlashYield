import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCreateMerchantProfile } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Store, MapPin, Search, Navigation } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function PinPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return value ? /* @__PURE__ */ jsx(Marker, { position: [value.lat, value.lng] }) : null;
}

function MerchantOnboarding() {
  const navigate = useNavigate();
  const createMutation = useCreateMerchantProfile();
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const center = useMemo(() => location ? [location.lat, location.lng] : [12.9716, 77.5946], [location]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { "Accept-Language": "en" }
          });
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          if (data?.display_name) {
            setAddress(data.display_name);
            setLocation({ lat: latitude, lng: longitude });
          } else {
            setError("Could not resolve address from coordinates");
          }
        } catch (err) {
          setError(err.message || "Failed to fetch address");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError("Location access denied or unavailable");
        setIsLocating(false);
      }
    );
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setIsSearching(true);
    setError("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=6`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await res.json();
      setLocationResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to search location");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickLocation = (result) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setLocation({ lat, lng });
    setAddress(result.display_name);
    setLocationQuery("");
    setLocationResults([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(
      {
        businessName,
        description,
        address,
        phone,
        location: location ? { lat: location.lat, lng: location.lng } : undefined
      },
      {
        onSuccess: () => navigate("/merchant"),
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  return /* @__PURE__ */ jsx("div", {
    className: "min-h-[calc(100vh-4rem)] bg-surface-100 px-4 py-10 sm:px-6 lg:px-8",
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]",
      children: [
        /* @__PURE__ */ jsxs("div", {
          className: "rounded-[28px] bg-surface-950 p-8 text-white shadow-2xl sm:p-10",
          children: [
            /* @__PURE__ */ jsx("div", {
              className: "mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70",
              children: "Merchant location"
            }),
            /* @__PURE__ */ jsxs("h1", {
              className: "font-display text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-6xl",
              children: [
                "Pin your ",
                /* @__PURE__ */ jsx("br", {}),
                "store location"
              ]
            }),
            /* @__PURE__ */ jsx("p", {
              className: "mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base",
              children: "Old merchant accounts must add a real store pin before they can post surplus. This location is fixed and used for every nearby customer search."
            }),
            /* @__PURE__ */ jsxs("div", {
              className: "mt-8 grid gap-3 sm:grid-cols-2",
              children: [
                /* @__PURE__ */ jsx("div", {
                  className: "rounded-3xl border border-white/10 bg-white/5 p-4",
                  children: /* @__PURE__ */ jsxs("div", {
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "text-white/50 text-sm", children: "Merchant radius" }),
                      /* @__PURE__ */ jsx("div", { className: "mt-2 text-lg font-semibold", children: "Fixed store pin + 5 km customer radius" })
                    ]
                  })
                }),
                /* @__PURE__ */ jsx("div", {
                  className: "rounded-3xl border border-white/10 bg-white/5 p-4",
                  children: /* @__PURE__ */ jsxs("div", {
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "text-white/50 text-sm", children: "Customer feed" }),
                      /* @__PURE__ */ jsx("div", { className: "mt-2 text-lg font-semibold", children: "Only shows bundles near the chosen area" })
                    ]
                  })
                })
              ]
            })
          ]
        }),
        /* @__PURE__ */ jsxs("form", {
          onSubmit: handleSubmit,
          className: "rounded-[28px] border border-surface-200 bg-white p-6 shadow-sm sm:p-8",
          children: [
            /* @__PURE__ */ jsxs("div", {
              className: "mb-6",
              children: [
                /* @__PURE__ */ jsx("div", {
                  className: "text-xs font-semibold uppercase tracking-[0.2em] text-surface-400",
                  children: "Step 1"
                }),
                /* @__PURE__ */ jsx("h2", {
                  className: "mt-2 text-2xl font-black uppercase tracking-tight text-surface-900",
                  children: "Complete merchant setup"
                }),
                /* @__PURE__ */ jsx("p", {
                  className: "mt-2 text-sm leading-6 text-surface-500",
                  children: "Add your business details and pin the exact store location on the map."
                })
              ]
            }),
            error && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: error }),
            /* @__PURE__ */ jsxs("div", {
              className: "space-y-4",
              children: [
                /* @__PURE__ */ jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsx("label", { className: "label", children: "Business name" }),
                    /* @__PURE__ */ jsx("input", {
                      type: "text",
                      className: "input",
                      value: businessName,
                      onChange: (e) => setBusinessName(e.target.value),
                      placeholder: "e.g. The Daily Bakery",
                      required: true
                    })
                  ]
                }),
                /* @__PURE__ */ jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsxs("div", {
                      className: "mb-1 flex items-center justify-between gap-3",
                      children: [
                        /* @__PURE__ */ jsx("label", { className: "label mb-0", children: "Address" }),
                        /* @__PURE__ */ jsxs("button", {
                          type: "button",
                          onClick: handleUseCurrentLocation,
                          disabled: isLocating,
                          className: "btn-ghost flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider",
                          children: [
                            /* @__PURE__ */ jsx(Navigation, { className: "h-3 w-3" }),
                            isLocating ? "Locating..." : "Use current location"
                          ]
                        })
                      ]
                    }),
                    /* @__PURE__ */ jsx("textarea", {
                      className: "input min-h-[84px] resize-none",
                      value: address,
                      onChange: (e) => setAddress(e.target.value),
                      placeholder: "Full street address for pickup",
                      required: true
                    })
                  ]
                }),
                /* @__PURE__ */ jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsx("label", { className: "label", children: "Search pincode or area" }),
                    /* @__PURE__ */ jsx("form", {
                      onSubmit: handleSearchLocation,
                      children: /* @__PURE__ */ jsxs("div", {
                        className: "relative",
                        children: [
                          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
                          /* @__PURE__ */ jsx("input", {
                            type: "text",
                            className: "input pl-10 pr-12",
                            value: locationQuery,
                            onChange: (e) => setLocationQuery(e.target.value),
                            placeholder: "Search pincode or locality"
                          }),
                          isSearching && /* @__PURE__ */ jsx("div", {
                            className: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-surface-200 border-t-brand-500"
                          })
                        ]
                      })
                    }),
                    locationResults.length > 0 && /* @__PURE__ */ jsx("div", {
                      className: "mt-3 max-h-56 overflow-y-auto rounded-2xl border border-surface-200 bg-white",
                      children: locationResults.map((res, idx) => /* @__PURE__ */ jsx("button", {
                        type: "button",
                        onClick: () => handlePickLocation(res),
                        className: "block w-full border-b border-surface-100 px-4 py-3 text-left text-sm hover:bg-surface-50 last:border-0",
                        children: res.display_name
                      }, res.place_id || idx))
                    })
                  ]
                }),
                /* @__PURE__ */ jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsx("label", { className: "label", children: "Store pin" }),
                    /* @__PURE__ */ jsxs("div", {
                      className: "mt-2 h-80 overflow-hidden rounded-3xl border border-surface-200",
                      children: [
                        /* @__PURE__ */ jsxs(MapContainer, {
                          center,
                          zoom: location ? 15 : 5,
                          className: "h-full w-full",
                          children: [
                            /* @__PURE__ */ jsx(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" }),
                            /* @__PURE__ */ jsx(PinPicker, { value: location, onChange: setLocation })
                          ]
                        }),
                        /* @__PURE__ */ jsx("div", {
                          className: "pointer-events-none relative -mt-80 flex h-80 items-end justify-end p-3",
                          children: /* @__PURE__ */ jsx("div", {
                            className: "rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-surface-600 shadow-sm",
                            children: "Click the map to place the store pin."
                          })
                        })
                      ]
                    })
                  ]
                }),
                /* @__PURE__ */ jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsx("label", { className: "label", children: "Phone" }),
                    /* @__PURE__ */ jsx("input", {
                      type: "tel",
                      className: "input",
                      value: phone,
                      onChange: (e) => setPhone(e.target.value),
                      placeholder: "+1 234 567 8900",
                      required: true
                    })
                  ]
                }),
                /* @__PURE__ */ jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsx("label", { className: "label", children: "Description (optional)" }),
                    /* @__PURE__ */ jsx("textarea", {
                      className: "input min-h-[84px] resize-none",
                      value: description,
                      onChange: (e) => setDescription(e.target.value),
                      placeholder: "Tell customers about your store..."
                    })
                  ]
                }),
                /* @__PURE__ */ jsx("button", {
                  type: "submit",
                  className: "btn-primary w-full",
                  disabled: createMutation.isPending || !location,
                  children: createMutation.isPending ? "Setting up..." : "Complete setup"
                })
              ]
            })
          ]
        })
      ]
    })
  });
}

export {
  MerchantOnboarding
};
