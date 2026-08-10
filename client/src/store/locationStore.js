import { create } from "zustand";
const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;
async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || "";
    const city = addr.city || addr.state || "";
    const postcode = addr.postcode || "";
    return area ? `${area}${postcode ? " · " + postcode : ""}` : `${city}${postcode ? " · " + postcode : ""}`;
  } catch {
    return "";
  }
}
async function fallbackIpLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const label = [data.city, data.region].filter(Boolean).join(", ");
    return {
      lat: Number(data.latitude) || DEFAULT_LAT,
      lng: Number(data.longitude) || DEFAULT_LNG,
      label: label || "Your Area"
    };
  } catch {
    return null;
  }
}
const useLocationStore = create((set, get) => ({
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  label: "Choose your area",
  status: "idle",
  error: "",
  isModalOpen: false,
  requestLocation: async () => {
    if (get().status === "requesting") return;
    set({ status: "requesting", error: "" });
    const geolocate = () => new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not available"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 1e4,
        maximumAge: 6e4
      });
    });
    try {
      const position = await geolocate();
      const { latitude, longitude, accuracy } = position.coords;
      const label = (await reverseGeocode(latitude, longitude)) || "Your Area";
      set({
        lat: latitude,
        lng: longitude,
        label,
        status: "granted",
        error: "",
        accuracyMeters: Math.round(accuracy || 0)
      });
      return;
    } catch {
      const fallback = await fallbackIpLocation();
      if (fallback) {
        set({
          lat: fallback.lat,
          lng: fallback.lng,
          label: fallback.label,
          status: "fallback",
          error: "Could not access precise device location. Showing approximate area instead."
        });
        return;
      }
      set({
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        label: "Choose your area",
        status: "denied",
        error: "Location access was denied or unavailable."
      });
    }
  },
  setLocation: (lat, lng, label) => {
    set({ lat, lng, label, status: "granted", isModalOpen: false, error: "" });
  },
  openLocationModal: () => set({ isModalOpen: true }),
  closeLocationModal: () => set({ isModalOpen: false }),
  resetLocation: () => set({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, label: "Choose your area", status: "idle", error: "" })
}));
export {
  useLocationStore
};
