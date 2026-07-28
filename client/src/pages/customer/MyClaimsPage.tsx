import { useMyClaims, type Claim } from '../../api/hooks';
import { useCountdown } from '../../hooks/useCountdown';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { Lock, Ticket, ArrowRight } from 'lucide-react';

export function MyClaimsPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const { data, isLoading, error } = useMyClaims({ enabled: isAuthenticated });
  
  if (!isAuthenticated) {
    return (
      <div className="bg-surface-100 min-h-screen pb-24 pt-12">
        <div className="max-w-md mx-auto px-4">
          <div className="card p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-surface-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Sign in required</h2>
            <p className="text-surface-400 text-sm mb-8 max-w-xs mx-auto">
              Your pickup tokens live here once you claim a bundle from the feed.
            </p>
            <button onClick={openAuthModal} className="btn-primary px-8 py-3 inline-flex">
              Log In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = data?.data.filter((claim) => claim.status === 'reserved').length ?? 0;

  return (
    <div className="bg-surface-100 min-h-screen pb-24 pt-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-medium text-surface-400 mb-3">
            {activeCount} active ticket{activeCount !== 1 ? 's' : ''}
          </div>
          <h1 className="font-display font-bold text-surface-900 uppercase leading-[0.88] tracking-tight text-5xl sm:text-6xl">
            My <span className="bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">Tickets</span>
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 h-28 skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="card p-10 text-center">
              <h2 className="text-lg font-bold text-surface-900 mb-1">Error loading tickets</h2>
              <p className="text-surface-400 text-sm">Please try again later.</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-6 h-6 text-surface-400" />
              </div>
              <h2 className="text-lg font-bold text-surface-900 mb-1">No tickets yet</h2>
              <p className="text-surface-400 text-sm">Your claimed bundles will appear here.</p>
            </div>
          ) : (
            data?.data.map((claim) => (
              <ClaimRow key={claim._id} claim={claim} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

function ClaimRow({ claim }: { claim: Claim }) {
  const listing = typeof claim.listingId === 'object' ? claim.listingId : null;
  const isReserved = claim.status === 'reserved';
  const countdown = useCountdown(claim.expiresAt);

  return (
    <Link 
      to={`/claims/${claim._id}`}
      className={`block card p-5 group transition-all duration-200 ${
        isReserved ? 'hover:shadow-lg hover:-translate-y-0.5' : 'opacity-50'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-surface-400 mb-1">
            {listing?.merchant?.businessName ?? 'Local Partner'}
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-surface-900 leading-tight mb-1.5 truncate">
            {listing?.title ?? 'Bundle'}
          </h3>
          <div className="flex items-center gap-3">
            <code className="text-xs font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-md">
              {claim.token.length > 12 ? `${claim.token.slice(0, 8)}…` : claim.token}
            </code>
            {isReserved && <span className="badge-success text-[10px]">Active</span>}
            {claim.status === 'collected' && <span className="badge-neutral text-[10px]">Collected</span>}
            {claim.status === 'expired' && <span className="badge-danger text-[10px]">Expired</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="text-right">
            <div className="text-xs font-medium text-surface-400 mb-0.5">
              {isReserved ? 'Expires' : 'Status'}
            </div>
            <div className={`font-display text-2xl sm:text-3xl font-bold leading-none ${isReserved ? (countdown.urgent ? 'text-red-500' : 'text-brand-500') : 'text-surface-300'}`}>
              {isReserved ? countdown.label.replace('h ', ':').replace('m', '') : '—'}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-brand-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
