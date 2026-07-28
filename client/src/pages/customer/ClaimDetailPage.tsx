import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useMyClaims, useCancelClaim } from '../../api/hooks';
import { useCountdown } from '../../hooks/useCountdown';
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';

/** Show a human-readable snippet of a long hex token */
function shortToken(token: string): string {
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}···${token.slice(-4)}`;
}

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyClaims();
  const cancelMutation = useCancelClaim();
  const [copied, setCopied] = useState(false);
  
  const claim = data?.data.find(c => c._id === id);
  const listing = typeof claim?.listingId === 'object' ? claim.listingId : null;
  
  const countdown = useCountdown(claim?.expiresAt || new Date().toISOString());
  const isReserved = claim?.status === 'reserved';

  const handleCopy = async () => {
    if (!claim?.token) return;
    await navigator.clipboard.writeText(claim.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = () => {
    if (!claim || !confirm('Cancel this pickup? The bundle will be released back to inventory.')) return;
    cancelMutation.mutate(claim._id, {
      onSuccess: () => navigate('/claims'),
    });
  };

  if (isLoading) {
    return (
      <div className="bg-surface-100 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-surface-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="bg-surface-100 min-h-screen pb-24 pt-12">
        <div className="max-w-md mx-auto px-4 text-center py-20">
          <h2 className="text-xl font-bold text-surface-900 mb-2">Ticket not found</h2>
          <p className="text-surface-400 text-sm mb-6">This ticket may have expired or doesn't exist.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary px-6 py-2.5">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-100 min-h-screen pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="btn-ghost text-sm px-3 py-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
          <Link to="/claims" className="btn-ghost text-sm px-3 py-1.5">
            All Tickets
          </Link>
        </div>

        {/* Ticket Card */}
        <div className="bg-gradient-to-br from-surface-900 to-surface-950 text-white rounded-3xl overflow-hidden relative shadow-2xl">
          
          {/* Edge cutouts for ticket look */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-surface-100"></div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 rounded-full bg-surface-100"></div>
          
          <div className="p-8 sm:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b border-white/10 pb-10 mb-10">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium mb-4">
                  <div className={`w-2 h-2 rounded-full ${isReserved ? 'bg-accent-500 animate-pulse' : 'bg-surface-500'}`}></div>
                  <span className="text-surface-400">
                    {isReserved ? 'Confirmed Pickup' : claim.status === 'collected' ? 'Collected' : claim.status === 'cancelled' ? 'Cancelled' : 'Expired'}
                  </span>
                </div>
                
                <h1 className="font-display text-4xl sm:text-5xl font-bold uppercase leading-none tracking-tight mb-3 truncate">
                  {listing?.title ?? 'Bundle'}
                </h1>
                
                <div className="flex items-center gap-2 text-surface-400 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  {listing?.merchant?.businessName ?? 'Local Partner'} · {listing?.merchant?.address ?? 'See store'}
                </div>
              </div>

              {/* QR Section */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg mb-3">
                  {isReserved ? (
                    <QRCodeSVG value={claim.token} size={130} />
                  ) : (
                    <div className="w-[130px] h-[130px] flex items-center justify-center bg-surface-100 rounded-lg">
                      <CheckCircle className={`w-10 h-10 ${claim.status === 'collected' ? 'text-accent-500' : 'text-surface-400'}`} />
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium text-surface-400 text-center">
                  Scan or show ID
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-10 sm:gap-20">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-surface-500 mb-1.5">Token ID</div>
                <div className="flex items-center gap-3">
                  <div className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider truncate">
                    {shortToken(claim.token)}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Copy full token"
                  >
                    {copied ? (
                      <CheckCheck className="w-4 h-4 text-accent-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-surface-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-surface-500 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expires In
                </div>
                <div className={`font-display text-3xl sm:text-4xl font-bold ${isReserved ? (countdown.urgent ? 'text-red-400' : 'text-brand-400') : 'text-surface-600'}`}>
                  {isReserved ? countdown.label.replace('h ', ':').replace('m', '') : '—'}
                </div>
              </div>
            </div>

            {/* Cancel Button — only for reserved claims */}
            {isReserved && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl border border-red-400/30 text-red-400 hover:bg-red-400/10 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Pickup'}
                </button>
                {cancelMutation.error && (
                  <p className="text-red-400 text-sm mt-2">
                    {(cancelMutation.error as any).response?.data?.error?.message || 'Failed to cancel'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pickup Instructions */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { step: '01', title: 'Head to counter', desc: listing?.merchant?.address ?? 'Your Storefront' },
            { step: '02', title: 'Show your token', desc: `Present: ${shortToken(claim.token)}` },
            { step: '03', title: 'Collect bundle', desc: 'Cashier confirms and hands over' },
          ].map((item) => (
            <div key={item.step} className="card p-6">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold mb-3">{item.step}</div>
              <h3 className="font-semibold text-surface-900 text-sm mb-1">{item.title}</h3>
              <p className="text-surface-400 text-sm break-all">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
