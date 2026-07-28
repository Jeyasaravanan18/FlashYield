import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNearbyListings, useImpactStats, type Listing } from '../../api/hooks';
import { useCountdown } from '../../hooks/useCountdown';
import { useLocationStore } from '../../store/locationStore';
import { Search, Clock, MapPin, TrendingUp, Leaf } from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'prepared_meals', label: 'Meals' },
  { id: 'produce', label: 'Produce' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'mixed_bundle', label: 'Mixed' },
];

export function BrowsePage() {
  const { lat, lng } = useLocationStore();
  const [activeCategory, setActiveCategory] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const listingsQuery = useNearbyListings({ lng, lat, category: activeCategory || undefined, dietaryTags: activeTags });
  const { data: impactStats } = useImpactStats();
  
  const listings = useMemo(() => {
    const raw = listingsQuery.data?.data ?? [];
    return raw
      .filter(l => !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.merchant?.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [listingsQuery.data, searchQuery]);

  const liveBundles = listings.filter((listing) => listing.quantityAvailable > 0).length;
  const nearbyMerchantCount = new Set(listings.map(l => l.merchant?._id).filter(Boolean)).size;

  return (
    <div className="pb-24 pt-10 bg-surface-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-medium text-surface-400 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
            Synchronized with {nearbyMerchantCount} merchants · {liveBundles} bundles live
          </div>
          
          <h1 className="font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl max-w-4xl">
            Fresh Surplus<br />
            <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">Near You</span>
          </h1>
          
          <p className="mt-6 text-surface-500 max-w-xl text-base leading-relaxed">
            Fresh surplus from neighborhood kitchens, listed the moment it hits the counter. Claim a bundle and collect within the pickup window.
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  activeCategory === cat.id 
                    ? 'bg-surface-900 text-white shadow-md' 
                    : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
            {[
              { id: 'vegetarian', label: 'Vegetarian' },
              { id: 'vegan', label: 'Vegan' },
              { id: 'gluten-free', label: 'Gluten-Free' },
              { id: 'nut-free', label: 'Nut-Free' },
              { id: 'dairy-free', label: 'Dairy-Free' },
              { id: 'halal', label: 'Halal' }
            ].map(tag => {
              const isSelected = activeTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (isSelected) {
                      setActiveTags(activeTags.filter(t => t !== tag.id));
                    } else {
                      setActiveTags([...activeTags, tag.id]);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                    isSelected 
                      ? 'bg-brand-100 text-brand-700 shadow-sm' 
                      : 'bg-white text-surface-500 border border-surface-200 hover:bg-surface-50'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-80 mt-4 md:mt-0">
            <input 
              type="text" 
              placeholder="Search drops..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11 py-2.5"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          
          {/* Left Column: Listings */}
          <div className="flex flex-col gap-5">
            {listingsQuery.isLoading ? (
              <ListingSkeletons />
            ) : listings.length === 0 ? (
              <div className="card p-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-surface-400" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-1">No active drops</h3>
                <p className="text-surface-400 text-sm">Check back later or expand your search area.</p>
              </div>
            ) : (
              listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))
            )}
          </div>

          {/* Right Column: Static Panels */}
          <div className="flex flex-col gap-6 sticky top-24">
            
            {/* Impact Panel */}
            <div className="card p-7 bg-gradient-to-br from-white to-surface-50">
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-display text-2xl font-bold uppercase leading-tight text-surface-900">
                  Neighborhood<br />Impact
                </h2>
                <span className="badge-success">Live</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-xs font-medium text-surface-400 mb-1 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Meals Rescued
                  </div>
                  <div className="font-display text-4xl font-bold text-surface-900 leading-none">
                    {impactStats?.mealsRescued ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-surface-400 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Bundles At Risk
                  </div>
                  <div className="font-display text-4xl font-bold text-brand-500 leading-none">
                    {impactStats?.activeBundles ?? liveBundles}
                  </div>
                </div>
              </div>

              {(impactStats?.totalSaved ?? 0) > 0 && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700 font-medium mb-5">
                  ₹{impactStats?.totalSaved.toLocaleString()} saved by the community
                </div>
              )}

              <Link to="/register" className="btn-primary w-full py-3.5 text-sm flex justify-center">
                List Your Surplus →
              </Link>
            </div>

            {/* How It Works Panel */}
            <div className="card p-7">
              <h3 className="font-display text-xl font-bold uppercase mb-5 text-surface-900">How It Works</h3>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-surface-900 text-sm">Merchants post surplus</h4>
                    <p className="text-sm text-surface-400 mt-0.5">Kitchens list what's unsold with a live countdown.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-surface-900 text-sm">You claim a bundle</h4>
                    <p className="text-sm text-surface-400 mt-0.5">One tap decrements inventory in real time.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-surface-900 text-sm">Show token at counter</h4>
                    <p className="text-sm text-surface-400 mt-0.5">Present your alphanumeric ticket for pickup.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function formatDistance(meters?: number): string {
  if (!meters && meters !== 0) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function ListingCard({ listing }: { listing: Listing }) {
  const countdown = useCountdown(listing.claimWindowEnd);
  const discount = listing.originalPrice > 0 ? Math.round(((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100) : 0;
  const isClosed = listing.status === 'sold_out' || countdown.expired;

  return (
    <div className={`card flex flex-col sm:flex-row overflow-hidden group ${isClosed ? 'opacity-50' : ''}`}>
      {/* Left side: Image block */}
      <div className="w-full sm:w-56 h-48 sm:h-auto bg-surface-100 flex items-center justify-center text-5xl shrink-0 overflow-hidden relative">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span>{listing.category === 'bakery' ? '🥐' : listing.category === 'prepared_meals' ? '🥪' : '🍽️'}</span>
        )}
      </div>

      {/* Right side: Details */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
            <MapPin className="w-3 h-3" />
            {listing.merchant?.businessName ?? 'Local Partner'}{listing.distance != null ? ` · ${formatDistance(listing.distance)}` : ''}
          </div>
          <div className="bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold text-sm px-3 py-1 rounded-full leading-none shadow-sm">
            -{discount}%
          </div>
        </div>
        
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-surface-900 leading-tight mb-2 mt-1">
          {listing.title}
        </h3>
        
        {listing.dietaryTags && listing.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.dietaryTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-100 text-surface-500 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm font-medium text-surface-400 mb-6 mt-1">
          <span className="text-surface-900 text-lg font-bold">₹{listing.discountedPrice.toFixed(2)}</span>
          <span className="line-through text-surface-300">₹{listing.originalPrice.toFixed(2)}</span>
          <span className="text-surface-300">·</span>
          <span>{listing.quantityAvailable} of {listing.quantityTotal} left</span>
        </div>
        
        <div className="mt-auto flex justify-between items-end">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-surface-400 mb-1">
              <Clock className="w-3 h-3" />
              Pickup Window
            </div>
            <div className={`font-display text-3xl sm:text-4xl font-bold leading-none ${countdown.urgent ? 'text-red-500' : 'text-brand-500'}`}>
              {isClosed ? 'CLOSED' : countdown.label.replace('h ', ':').replace('m', '')}
            </div>
          </div>
          
          <Link
            to={`/listings/${listing._id}`}
            className={`btn ${isClosed ? 'bg-surface-100 text-surface-400 cursor-not-allowed' : 'btn-primary shadow-lg shadow-brand-500/20'} px-6 py-3 text-sm rounded-xl`}
            onClick={(e) => isClosed && e.preventDefault()}
          >
            Claim Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListingSkeletons() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="card flex flex-col sm:flex-row overflow-hidden h-56">
          <div className="w-full sm:w-56 skeleton shrink-0" />
          <div className="p-6 flex flex-col flex-1 space-y-4 justify-center">
            <div className="h-3 w-32 skeleton rounded-full" />
            <div className="h-8 w-3/4 skeleton rounded-lg" />
            <div className="h-3 w-48 skeleton rounded-full" />
            <div className="h-10 w-32 skeleton rounded-xl mt-auto" />
          </div>
        </div>
      ))}
    </>
  );
}
