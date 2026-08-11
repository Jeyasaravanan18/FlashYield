import { Link } from "react-router-dom";
import { BadgeCheck, Clock3, Languages, Store, MapPin, Loader2 } from "lucide-react";
import { useMerchantProfileTools, useUpdateProfileTools } from "../../api/hooks";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? <Marker position={position} /> : null;
}

export function MerchantProfileToolsPage() {
  const { data, isLoading } = useMerchantProfileTools();
  const updateMutation = useUpdateProfileTools();
  
  const [storeHours, setStoreHours] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [languages, setLanguages] = useState("");
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (data) {
      setStoreHours(data.storeHours || "");
      setPickupInstructions(data.pickupInstructions || "");
      setLanguages(data.languages || "Tamil, Hindi, Kannada, English");
      if (data.location?.coordinates) {
        // location.coordinates is [lng, lat]
        setPosition({ lat: data.location.coordinates[1], lng: data.location.coordinates[0] });
      } else {
        // Default to a central location if not set (e.g., somewhere in India)
        setPosition({ lat: 20.5937, lng: 78.9629 });
      }
    }
  }, [data]);

  const tools = data || {};

  const handleSave = () => {
    updateMutation.mutate({
      storeHours,
      pickupInstructions,
      languages: languages.split(",").map((s) => s.trim()),
      location: position ? { lat: position.lat, lng: position.lng } : undefined,
    });
  };

  return (
    <div className="page-container max-w-5xl pb-14">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">Merchant operations</p>
          <h1 className="text-3xl font-bold text-surface-50">Profile tools</h1>
          <p className="text-sm text-surface-400 mt-1">Edit store hours, pickup instructions, languages, and store location.</p>
        </div>
        <Link to="/merchant" className="btn-ghost btn-sm">
          Back to dashboard
        </Link>
      </div>
      
      {isLoading ? (
        <div className="card p-10 text-sm text-surface-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading profile tools...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
              <BadgeCheck className="w-4 h-4 text-brand-500" /> Verified badge
            </div>
            <p className="mt-2 text-lg font-semibold text-surface-50">
              {tools.verifiedBadge ? "Enabled" : "Not enabled"}
            </p>
          </div>
          
          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
              <Store className="w-4 h-4 text-brand-500" /> Store profile
            </div>
            <textarea
              className="input mt-3 min-h-24"
              value={storeHours}
              onChange={(e) => setStoreHours(e.target.value)}
              placeholder={tools.storeHours || "Store hours"}
            />
          </div>
          
          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
              <Clock3 className="w-4 h-4 text-brand-500" /> Pickup instructions
            </div>
            <textarea
              className="input mt-3 min-h-24"
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              placeholder={tools.pickupInstructions || "Pickup instructions"}
            />
          </div>
          
          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
              <Languages className="w-4 h-4 text-brand-500" /> Languages
            </div>
            <input
              className="input mt-3"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
            />
          </div>

          <div className="card p-5 md:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400 mb-4">
              <MapPin className="w-4 h-4 text-brand-500" /> Store Location (Precise)
            </div>
            <p className="text-xs text-surface-400 mb-4">Click anywhere on the map to place the pin precisely on your store location.</p>
            {position && (
              <div className="h-64 rounded-xl overflow-hidden border border-surface-200">
                <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
            )}
          </div>
          
          <div className="md:col-span-2 flex gap-2 items-center">
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save profile tools"}
            </button>
            <p className="text-xs text-surface-400">Changes update the merchant profile endpoint.</p>
          </div>
        </div>
      )}
    </div>
  );
}
