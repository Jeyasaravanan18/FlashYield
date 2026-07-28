import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListingDetail, useCreateClaim } from '../../api/hooks';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Clock, MapPin, ArrowLeft, Store, Zap } from 'lucide-react';

/** Normalize merchant data — nearby API uses `merchant`, detail API uses `merchantId` */
function getMerchant(listing: any) {
  return listing.merchant || listing.merchantId || null;
}
import { useCountdown } from '../../hooks/useCountdown';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading, error } = useListingDetail(id!);
  const claimMutation = useCreateClaim();
  const { subscribeListing, unsubscribeListing } = useSocket();
  const { user, openAuthModal } = useAuthStore();
  const countdown = useCountdown(listing?.claimWindowEnd ?? new Date().toISOString());

  useEffect(() => {
    if (id) {
      subscribeListing(id);
      return () => unsubscribeListing(id);
    }
  }, [id, subscribeListing, unsubscribeListing]);

  if (isLoading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-surface-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-lg font-bold text-surface-900 mb-2">Listing not found</h2>
        <button onClick={() => navigate(-1)} className="btn-ghost mt-2">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const merchant = getMerchant(listing);

  const discount = Math.round(
    ((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100,
  );

  const isAvailable = listing.status === 'active' && listing.quantityAvailable > 0;
  const isExpired = countdown.expired;
  const stockRatio = Math.round((listing.quantityAvailable / listing.quantityTotal) * 100);

  const handleClaim = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    claimMutation.mutate(listing._id, {
      onSuccess: () => navigate('/claims'),
    });
  };

  return (
    <div className="page-container max-w-4xl animate-fade-in pb-14">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 md:h-full min-h-[280px] bg-surface-100">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent" />
            <span className="absolute top-3 left-3 bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold px-3 py-1.5 rounded-full text-sm shadow-md">
              -{discount}%
            </span>
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <h1 className="text-xl font-bold text-surface-900">{listing.title}</h1>
              <span className={`badge whitespace-nowrap ml-3 ${
                listing.status === 'active' ? 'badge-success' : listing.status === 'sold_out' ? 'badge-warning' : 'badge-danger'
              }`}>
                {listing.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-surface-400 mt-2">{listing.description}</p>

            {listing.dietaryTags && listing.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {listing.dietaryTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-surface-100 text-surface-500 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-4 p-4 bg-surface-50 rounded-xl border border-surface-200">
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-500">₹{listing.discountedPrice}</span>
                  <span className="text-sm text-surface-400 line-through">₹{listing.originalPrice}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-surface-200" />
              <div>
                <p className="text-xs text-surface-400 mb-0.5">Available</p>
                <p className="text-xl font-bold text-surface-900">
                  {listing.quantityAvailable}
                  <span className="text-surface-400 text-sm font-normal"> / {listing.quantityTotal}</span>
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-surface-400 mb-1.5">
                <span>Stock level</span>
                <span className={listing.quantityAvailable <= 2 ? 'text-red-500 font-medium' : ''}>
                  {listing.quantityAvailable <= 2 ? 'Almost gone' : 'Available'}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stockRatio < 35 ? 'bg-red-400' : 'bg-brand-500'}`}
                  style={{ width: `${stockRatio}%` }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm text-surface-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-surface-400" />
                <span>Pickup: {new Date(listing.claimWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(listing.claimWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center text-xs">🏷️</span>
                <span className="capitalize">{listing.category.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="mt-auto pt-5">
              {claimMutation.error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {(claimMutation.error as any).response?.data?.error?.message || 'Failed to claim'}
                </div>
              )}

              <button
                className={`w-full btn-lg ${isAvailable && !isExpired ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                disabled={!isAvailable || isExpired || claimMutation.isPending || user?.role === 'merchant'}
                onClick={handleClaim}
              >
                <Zap className="w-4 h-4" />
                {claimMutation.isPending
                  ? 'Claiming...'
                  : isExpired
                  ? 'Time window closed'
                  : !isAvailable
                  ? 'Sold out'
                  : 'Claim this bundle'}
              </button>

              {user?.role === 'merchant' && (
                <p className="text-center text-xs text-amber-500 mt-2">Merchants cannot claim listings</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Merchant Info & Map */}
      {merchant && (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-surface-900 mb-4">Pickup location</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <h4 className="font-medium text-surface-900">{merchant.businessName}</h4>
                <p className="text-sm text-surface-400 mt-0.5">{merchant.address}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-surface-500 bg-surface-50 rounded-xl p-3 border border-surface-200">
              <MapPin className="inline w-3.5 h-3.5 mr-1 text-brand-500" />
              Show your digital token at pickup before{' '}
              <strong className="text-surface-900">{new Date(listing.claimWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
            </div>
          </div>

          {merchant.location && (
            <div className="card p-1.5 h-56 overflow-hidden relative z-0">
              <MapContainer
                center={[merchant.location.coordinates[1], merchant.location.coordinates[0]]}
                zoom={15}
                style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker position={[merchant.location.coordinates[1], merchant.location.coordinates[0]]}>
                  <Popup>
                    <div className="font-medium text-surface-900 text-sm">{merchant.businessName}</div>
                    <div className="text-surface-500 text-xs">{merchant.address}</div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
