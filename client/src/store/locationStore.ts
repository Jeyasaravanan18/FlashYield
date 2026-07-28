import { create } from 'zustand';

interface LocationState {
  lat: number;
  lng: number;
  label: string;
  status: 'idle' | 'requesting' | 'granted' | 'denied';
  isModalOpen: boolean;
  requestLocation: () => void;
  setLocation: (lat: number, lng: number, label: string) => void;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  lat: 12.9716,
  lng: 77.5946,
  label: 'Locating...',
  status: 'idle',
  isModalOpen: false,

  requestLocation: () => {
    if (get().status === 'requesting') return;
    if (!('geolocation' in navigator)) {
      set({ status: 'denied', label: 'Location unavailable' });
      return;
    }

    set({ status: 'requesting' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        set({ lat: latitude, lng: longitude, status: 'granted' });

        // Reverse geocode for a readable label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address;
          // Build a short, friendly label
          const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
          const city = addr.city || addr.state || '';
          const postcode = addr.postcode || '';
          const label = area 
            ? `${area}${postcode ? ' · ' + postcode : ''}`
            : `${city}${postcode ? ' · ' + postcode : ''}`;
          set({ label: label || 'Your Area' });
        } catch {
          set({ label: 'Your Area' });
        }
      },
      () => {
        set({ status: 'denied', label: 'Location denied' });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  },

  setLocation: (lat, lng, label) => {
    set({ lat, lng, label, status: 'granted', isModalOpen: false });
  },

  openLocationModal: () => set({ isModalOpen: true }),
  closeLocationModal: () => set({ isModalOpen: false }),
}));
