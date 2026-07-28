import { useState } from 'react';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { MapPin, X, Navigation, LogIn, Search, Loader2 } from 'lucide-react';

export function LocationModal() {
  const { requestLocation, setLocation, isModalOpen, closeLocationModal } = useLocationStore();
  const { openAuthModal } = useAuthStore();
  const [isRequesting, setIsRequesting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isModalOpen) return null;

  const handleShareLocation = () => {
    setIsRequesting(true);
    requestLocation();
    setTimeout(() => {
      closeLocationModal();
      setIsRequesting(false);
    }, 1500);
  };

  const handleDismiss = () => {
    closeLocationModal();
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const label = result.display_name.split(',')[0];
    setLocation(lat, lng, label);
    closeLocationModal();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400/10 to-brand-500/20 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-brand-500" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center shadow-md">
              <Navigation className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-surface-900 text-center mb-2">
          Share location to find<br />
          nearby flash deals
        </h2>
        <p className="text-sm text-surface-400 text-center mb-8 max-w-xs mx-auto">
          See surplus food from kitchens closest to you and never miss a deal in your neighborhood.
        </p>

        {/* Share Location Button */}
        <button
          onClick={handleShareLocation}
          disabled={isRequesting}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 mb-4"
        >
          {isRequesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Use Current Location
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 border-t border-dashed border-surface-200" />
          <span className="text-xs font-medium text-surface-400 uppercase">or enter manually</span>
          <div className="flex-1 border-t border-dashed border-surface-200" />
        </div>

        {/* Manual Search */}
        <form onSubmit={handleManualSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search city, area, or zip code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
            )}
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 border border-surface-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectLocation(res)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 border-b border-surface-100 last:border-0 truncate"
              >
                {res.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 border-t border-dashed border-surface-200" />
          <span className="text-xs font-medium text-surface-400 uppercase">already a user?</span>
          <div className="flex-1 border-t border-dashed border-surface-200" />
        </div>

        {/* Login link */}
        <div className="text-center">
          <button
            onClick={() => {
              handleDismiss();
              openAuthModal();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login to see your saved addresses
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={handleDismiss}
          className="w-full mt-4 text-xs text-surface-400 hover:text-surface-600 transition-colors text-center py-1"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
