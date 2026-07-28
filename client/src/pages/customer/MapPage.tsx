import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useNearbyListings, type Listing } from '../../api/hooks';
import { useCountdown } from '../../hooks/useCountdown';
import { useLocationStore } from '../../store/locationStore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Clock, Tag, Navigation } from 'lucide-react';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon for active merchants
const activeMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z" fill="#FF4500"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
    </svg>
  `),
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46],
});

interface MerchantGroup {
  merchantId: string;
  businessName: string;
  address: string;
  coordinates: [number, number];
  listings: Listing[];
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

export function MapPage() {
  const { lat, lng, requestLocation } = useLocationStore();
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantGroup | null>(null);

  const listingsQuery = useNearbyListings({ lng, lat, radius: 15 });
  const listings = listingsQuery.data?.data ?? [];

  // Group listings by merchant
  const merchantGroups = useMemo(() => {
    const groups: Record<string, MerchantGroup> = {};
    for (const listing of listings) {
      if (!listing.merchant) continue;
      const mid = listing.merchant._id;
      if (!groups[mid]) {
        groups[mid] = {
          merchantId: mid,
          businessName: listing.merchant.businessName,
          address: listing.merchant.address,
          coordinates: listing.merchant.location.coordinates,
          listings: [],
        };
      }
      groups[mid].listings.push(listing);
    }
    return Object.values(groups);
  }, [listings]);

  const activeDeals = listings.filter(l => l.quantityAvailable > 0).length;

  return (
    <div className="bg-surface-100 min-h-screen flex flex-col">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <div className="flex items-center gap-2 text-xs font-medium text-surface-400 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
          {merchantGroups.length} merchants · {activeDeals} active deals nearby
        </div>
        <h1 className="font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-4xl sm:text-5xl">
          Nearby <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">Deals Map</span>
        </h1>
      </div>

      {/* Map & Sidebar */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 h-[calc(100vh-220px)] min-h-[500px]">
          
          {/* Map */}
          <div className="card overflow-hidden p-1.5 relative">
            <MapContainer
              center={[lat, lng]}
              zoom={14}
              style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <RecenterMap center={[lat, lng]} />
              
              {merchantGroups.map((merchant) => (
                <Marker
                  key={merchant.merchantId}
                  position={[merchant.coordinates[1], merchant.coordinates[0]]}
                  icon={activeMarkerIcon}
                  eventHandlers={{
                    click: () => setSelectedMerchant(merchant),
                  }}
                />
              ))}
            </MapContainer>

            {/* Re-center button */}
            <button
              onClick={requestLocation}
              className="absolute bottom-6 right-6 z-[400] bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-brand-500 transition-colors border border-surface-200"
            >
              <Navigation className="w-4 h-4" />
              My Location
            </button>
          </div>

          {/* Sidebar */}
          <div className="overflow-y-auto space-y-4 pr-1">
            {listingsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-5 h-36 skeleton" />
                ))}
              </div>
            ) : selectedMerchant ? (
              <>
                {/* Selected merchant header */}
                <div className="card p-5 bg-gradient-to-br from-surface-900 to-surface-950 text-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-medium text-surface-400 mb-1">Selected Store</div>
                      <h3 className="font-display text-xl font-bold uppercase">{selectedMerchant.businessName}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedMerchant(null)}
                      className="text-xs font-medium text-surface-400 hover:text-white transition-colors"
                    >
                      Clear ×
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-surface-400">
                    <MapPin className="w-3 h-3" />
                    {selectedMerchant.address}
                  </div>
                </div>

                {/* Selected merchant listings */}
                {selectedMerchant.listings.map(listing => (
                  <MerchantListingCard key={listing._id} listing={listing} />
                ))}
              </>
            ) : merchantGroups.length === 0 ? (
              <div className="card p-8 text-center">
                <MapPin className="w-8 h-8 text-surface-300 mx-auto mb-3" />
                <h3 className="font-semibold text-surface-900 mb-1">No deals nearby</h3>
                <p className="text-sm text-surface-400">Check back later for flash sales near you.</p>
              </div>
            ) : (
              <>
                <div className="text-xs font-medium text-surface-400 uppercase tracking-wider px-1">
                  All Merchants ({merchantGroups.length})
                </div>
                {merchantGroups.map(merchant => (
                  <button
                    key={merchant.merchantId}
                    onClick={() => setSelectedMerchant(merchant)}
                    className="card p-5 w-full text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-surface-900">{merchant.businessName}</h3>
                      <span className="badge-success text-[10px]">
                        {merchant.listings.length} deal{merchant.listings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-surface-400 mb-3">
                      <MapPin className="w-3 h-3" />
                      {merchant.address}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {merchant.listings.slice(0, 3).map(l => {
                        const disc = l.originalPrice > 0 ? Math.round(((l.originalPrice - l.discountedPrice) / l.originalPrice) * 100) : 0;
                        return (
                          <span key={l._id} className="text-xs bg-brand-50 text-brand-600 font-medium px-2 py-1 rounded-lg">
                            {l.title} · -{disc}%
                          </span>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchantListingCard({ listing }: { listing: Listing }) {
  const countdown = useCountdown(listing.claimWindowEnd);
  const discount = listing.originalPrice > 0 ? Math.round(((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100) : 0;
  const isClosed = listing.status === 'sold_out' || countdown.label === '00m';

  return (
    <Link
      to={`/listings/${listing._id}`}
      className={`card p-5 block group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${isClosed ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-surface-900 text-sm group-hover:text-brand-500 transition-colors">{listing.title}</h4>
        <span className="bg-gradient-to-r from-brand-500 to-brand-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </span>
      </div>
      
      <div className="flex items-center gap-3 text-sm mb-3">
        <span className="font-bold text-surface-900">${listing.discountedPrice.toFixed(2)}</span>
        <span className="text-surface-300 line-through text-xs">${listing.originalPrice.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-xs text-surface-400">
          <Tag className="w-3 h-3" />
          {listing.quantityAvailable} left of {listing.quantityTotal}
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isClosed ? 'text-surface-400' : 'text-brand-500'}`}>
          <Clock className="w-3 h-3" />
          {isClosed ? 'Closed' : countdown.label}
        </div>
      </div>
    </Link>
  );
}
