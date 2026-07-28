import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMerchantDashboard, useMerchantListings, useCreateListing, useCancelListing } from '../../api/hooks';
import { useCountdown } from '../../hooks/useCountdown';
import { Zap, Clock, ScanLine, BarChart3, ShoppingBag, TrendingUp, CheckCircle2, X } from 'lucide-react';

export function MerchantDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useMerchantDashboard();
  const { data: listings, isLoading: listLoading } = useMerchantListings();
  const createMutation = useCreateListing();
  const cancelMutation = useCancelListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [quantityTotal, setQuantityTotal] = useState('');
  const [category, setCategory] = useState('bakery');
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [claimWindowMins, setClaimWindowMins] = useState('60');

  if (dashLoading || listLoading) {
    return (
      <div className="flex justify-center py-32 bg-surface-100 min-h-screen">
        <div className="w-8 h-8 border-3 border-surface-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="py-20 text-center bg-surface-100 min-h-screen">
        <div className="card inline-flex items-center gap-2 px-6 py-4 text-red-600 font-semibold">
          Failed to load dashboard.
        </div>
      </div>
    );
  }

  const activeCount = listings?.data.filter(l => l.status !== 'sold_out' && new Date(l.claimWindowEnd) > new Date()).length || 0;
  const stats = dashboard.stats;

  const handleCreate = () => {
    if (!title || !originalPrice || !discountedPrice || !quantityTotal) return;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + parseInt(claimWindowMins) * 60000);
    const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';

    createMutation.mutate({
      title,
      description: description.trim() || `Surplus bundle from ${dashboard.profile.businessName}`,
      imageUrl: imageUrl.trim() || fallbackImage,
      category,
      dietaryTags,
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      quantityTotal: parseInt(quantityTotal),
      claimWindowStart: now.toISOString(),
      claimWindowEnd: endTime.toISOString(),
    }, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        setImageUrl('');
        setOriginalPrice('');
        setDiscountedPrice('');
        setQuantityTotal('');
      }
    });
  };

  const handleCancel = (listingId: string, listingTitle: string) => {
    if (!confirm(`Cancel "${listingTitle}"? This listing will be removed from the feed.`)) return;
    cancelMutation.mutate(listingId);
  };

  const discountPercent = (originalPrice && discountedPrice) 
    ? Math.round(((parseFloat(originalPrice) - parseFloat(discountedPrice)) / parseFloat(originalPrice)) * 100) 
    : 0;

  return (
    <div className="bg-surface-100 min-h-screen pb-24">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-surface-400 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
              Console Connected · Realtime Sync
            </div>
            <h1 className="font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-5xl sm:text-6xl md:text-7xl max-w-4xl">
              Merchant<br />
              <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">Flash Console</span>
            </h1>
          </div>
          <Link
            to="/merchant/verify"
            className="hidden md:flex items-center gap-2 btn-secondary px-5 py-3 text-sm"
          >
            <ScanLine className="w-4 h-4" />
            Verify Pickup
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Active Listings"
              value={stats.activeListings ?? activeCount}
              accent
            />
            <StatCard
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Today's Claims"
              value={stats.todayClaims ?? 0}
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Collected"
              value={stats.collectedClaims ?? 0}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Collection Rate"
              value={stats.collectionRate != null ? `${Math.round(stats.collectionRate)}%` : '—'}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-[400px_1fr] gap-10 items-start">
          
          {/* Left Column - Form Panel */}
          <div className="card p-7 sticky top-24">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-display text-2xl font-bold uppercase leading-tight text-surface-900">
                New Flash Drop
              </h2>
              <span className="badge-success">Connected</span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label">Merchant</label>
                <div className="px-4 py-3 bg-surface-50 border border-surface-200 text-surface-900 font-semibold rounded-xl">
                  {dashboard.profile.businessName}
                </div>
              </div>
              
              <div>
                <label className="label">Bundle Name</label>
                <input 
                  type="text" 
                  placeholder="E.g. Bagel Dozen" 
                  className="input" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea 
                  placeholder="What's in this bundle? E.g. 6 croissants, 4 muffins..." 
                  className="input min-h-20 resize-y" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Image URL (optional)</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  className="input" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Original ₹</label>
                  <input 
                    type="number" 
                    placeholder="20" 
                    className="input" 
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Sale ₹</label>
                  <input 
                    type="number" 
                    placeholder="6" 
                    className="input"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantity</label>
                  <input 
                    type="number" 
                    placeholder="5" 
                    className="input"
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-brand-500">Discount</label>
                  <div className="px-4 py-3 bg-brand-50 border border-brand-200 text-brand-500 font-display text-xl font-bold leading-none flex items-center rounded-xl">
                    -{discountPercent}%
                  </div>
                </div>
              </div>
              
              <div>
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'bakery', label: 'Bakery' },
                    { id: 'prepared_meals', label: 'Meals' },
                    { id: 'produce', label: 'Produce' },
                    { id: 'dairy', label: 'Dairy' },
                    { id: 'snacks', label: 'Snacks' },
                    { id: 'mixed_bundle', label: 'Mixed' }
                  ].map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                        category === c.id 
                          ? 'bg-surface-900 text-white shadow-sm' 
                          : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Dietary Tags</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'gluten-free', label: 'Gluten-Free' },
                    { id: 'nut-free', label: 'Nut-Free' },
                    { id: 'dairy-free', label: 'Dairy-Free' },
                    { id: 'halal', label: 'Halal' }
                  ].map(tag => {
                    const isSelected = dietaryTags.includes(tag.id);
                    return (
                      <button 
                        key={tag.id}
                        onClick={() => {
                          if (isSelected) {
                            setDietaryTags(dietaryTags.filter(t => t !== tag.id));
                          } else {
                            setDietaryTags([...dietaryTags, tag.id]);
                          }
                        }}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                          isSelected 
                            ? 'bg-brand-100 text-brand-700 border-brand-200 shadow-sm' 
                            : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="label mb-0 text-surface-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Expiry
                  </label>
                  <div className="font-display text-xl font-bold text-brand-500">{claimWindowMins} min</div>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max="240" 
                  step="15" 
                  value={claimWindowMins}
                  onChange={(e) => setClaimWindowMins(e.target.value)}
                  className="w-full h-2 bg-surface-200 rounded-full appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              {createMutation.error && (
                <div className="text-sm font-medium text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                  {(createMutation.error as any).response?.data?.error?.message || 'Error launching flash sale'}
                </div>
              )}

              <button 
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className={`btn-primary w-full py-4 text-base ${createMutation.isPending ? 'opacity-50' : ''}`}
              >
                <Zap className="w-4 h-4" />
                {createMutation.isPending ? 'Launching...' : 'Launch Flash Sale'}
              </button>
            </div>
          </div>

          {/* Right Column - Inventory List */}
          <div>
            <div className="flex justify-between items-end mb-5">
              <h2 className="font-display text-3xl font-bold text-surface-900 uppercase leading-none">
                Active Inventory
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-surface-400">
                  {activeCount} live
                </div>
                <Link to="/merchant/verify" className="md:hidden btn-ghost text-sm px-3 py-1.5 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4" />
                  Verify
                </Link>
              </div>
            </div>

            <div className="card overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_100px_100px_120px] gap-4 px-6 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider bg-surface-50 border-b border-surface-200">
                <div>Bundle</div>
                <div className="text-center">Claims</div>
                <div className="text-center">Time Left</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div>
                {!listings?.data || listings.data.length === 0 ? (
                  <div className="py-14 text-center text-surface-400 text-sm">
                    No active inventory yet
                  </div>
                ) : (
                  listings?.data.map((listing) => (
                    <ListingRow
                      key={listing._id}
                      listing={listing}
                      onCancel={handleCancel}
                      isCancelling={cancelMutation.isPending}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-surface-400 mb-2">
        {icon}
        {label}
      </div>
      <div className={`font-display text-3xl font-bold leading-none ${accent ? 'text-brand-500' : 'text-surface-900'}`}>
        {value}
      </div>
    </div>
  );
}

function ListingRow({ listing, onCancel, isCancelling }: { listing: any; onCancel: (id: string, title: string) => void; isCancelling: boolean }) {
  const countdown = useCountdown(listing.claimWindowEnd);
  const isClosed = listing.status === 'sold_out' || listing.status === 'expired' || listing.status === 'cancelled' || countdown.expired;
  const claimed = listing.quantityTotal - listing.quantityAvailable;
  const isActive = listing.status === 'active' && !countdown.expired;

  return (
    <div className={`grid grid-cols-[1fr_100px_100px_120px] gap-4 px-6 py-4 items-center border-b border-surface-100 transition-colors ${isClosed ? 'opacity-40' : 'hover:bg-surface-50'}`}>
      <div className="min-w-0 pr-4">
        <h3 className="font-semibold text-surface-900 text-sm truncate">{listing.title}</h3>
        <div className="text-xs text-surface-400 mt-0.5 truncate">
          ₹{listing.originalPrice} → ₹{listing.discountedPrice}
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <div className="font-semibold text-surface-900 text-sm">{claimed}/{listing.quantityTotal}</div>
        <div className="w-14 h-1 bg-surface-200 mt-1 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(claimed / listing.quantityTotal) * 100}%` }}></div>
        </div>
      </div>
      
      <div className={`font-display text-base font-bold text-center ${isClosed ? 'text-surface-400' : 'text-brand-500'}`}>
        {isClosed ? 'CLOSED' : countdown.label.replace('h ', ':').replace('m', '')}
      </div>
      
      <div className="flex justify-end gap-2">
        {isActive ? (
          <>
            <span className="badge-success text-[10px]">Live</span>
            <button
              onClick={() => onCancel(listing._id, listing.title)}
              disabled={isCancelling}
              className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Cancel listing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span className="badge-neutral text-[10px]">End</span>
        )}
      </div>
    </div>
  );
}
