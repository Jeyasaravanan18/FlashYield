import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Image, Package, Percent, Sparkles } from 'lucide-react';
import { useCreateListing } from '../../api/hooks';
import { getErrorMessage } from '../../lib/api';

const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';
const toInputValue = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function CreateListingPage() {
  const navigate = useNavigate();
  const createMutation = useCreateListing();
  const now = useMemo(() => new Date(), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bakery');
  const [imageUrl, setImageUrl] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [claimWindowStart, setClaimWindowStart] = useState(toInputValue(now));
  const [claimWindowEnd, setClaimWindowEnd] = useState(toInputValue(new Date(now.getTime() + 2 * 60 * 60 * 1000)));
  const [error, setError] = useState('');
  const original = Number(originalPrice) || 0;
  const discounted = Number(discountedPrice) || 0;
  const discount = original > 0 && discounted < original ? Math.round(((original - discounted) / original) * 100) : 0;

  const setWindow = (hours: number) => {
    const start = new Date();
    setClaimWindowStart(toInputValue(start));
    setClaimWindowEnd(toInputValue(new Date(start.getTime() + hours * 60 * 60 * 1000)));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (discounted >= original) return setError('Rescue price must be lower than original price.');
    if (new Date(claimWindowEnd) <= new Date(claimWindowStart)) return setError('Pickup must end after claims open.');
    if (new Date(claimWindowEnd) <= new Date()) return setError('Choose a future pickup time.');
    createMutation.mutate({
      title: title.trim(), description: description.trim(), category,
      imageUrl: imageUrl.trim() || fallbackImage,
      originalPrice: original, discountedPrice: discounted,
      quantityTotal: Number(quantity),
      claimWindowStart: new Date(claimWindowStart).toISOString(),
      claimWindowEnd: new Date(claimWindowEnd).toISOString(),
    }, {
      onSuccess: () => navigate('/merchant'),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <div className="page-container max-w-4xl animate-fade-in pb-14">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-brand-600 uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          New listing
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">Create a rescue bundle</h1>
            <p className="text-sm text-surface-400 mt-1">Set your stock and pickup window. Customers see it live immediately.</p>
          </div>
          <button onClick={() => navigate('/merchant')} className="btn-ghost btn-sm">Cancel</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="card p-6 space-y-6">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-surface-50">Details</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Today's artisan pastry box" maxLength={200} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input min-h-24 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included?" maxLength={2000} required />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="bakery">Bakery</option>
                  <option value="prepared_meals">Prepared meals</option>
                  <option value="produce">Produce</option>
                  <option value="dairy">Dairy</option>
                  <option value="beverages">Beverages</option>
                  <option value="snacks">Snacks</option>
                  <option value="mixed_bundle">Mixed bundle</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input className="input" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" step="1" placeholder="e.g. 6" required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Photo URL (optional)</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
                  <input className="input pl-9" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>
          </section>

          <div className="divider" />

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Percent className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-surface-50">Pricing</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Original price (₹)</label>
                <input className="input" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} min="1" placeholder="e.g. 450" required />
              </div>
              <div>
                <label className="label">Rescue price (₹)</label>
                <input className="input" type="number" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} min="0" placeholder="e.g. 149" required />
              </div>
            </div>
            {original > 0 && discounted >= 0 && (
              <div className={`mt-3 rounded-lg px-3.5 py-2.5 text-sm ${
                discount > 0 ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {discount > 0
                  ? `Customers save ₹${original - discounted} (${discount}% off)`
                  : 'Enter a rescue price lower than the original value'}
              </div>
            )}
          </section>

          <div className="divider" />

          <section>
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-surface-50">Pickup window</h2>
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((h) => (
                <button key={h} type="button" onClick={() => setWindow(h)} className="btn-ghost btn-sm border border-surface-700">
                  {h} hour{h > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Claims open</label>
                <input className="input" type="datetime-local" value={claimWindowStart} onChange={(e) => setClaimWindowStart(e.target.value)} required />
              </div>
              <div>
                <label className="label">Pickup closes</label>
                <input className="input" type="datetime-local" value={claimWindowEnd} onChange={(e) => setClaimWindowEnd(e.target.value)} required />
              </div>
            </div>
          </section>

          <div className="divider" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/merchant')} className="btn-ghost">Discard</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Publishing...' : 'Publish listing'}
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card overflow-hidden">
            <div className="h-36 bg-surface-800">
              <img
                src={imageUrl || fallbackImage}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
              />
            </div>
            <div className="p-4">
              <p className="text-2xs text-surface-400 uppercase tracking-wider font-medium">{category.replace('_', ' ')}</p>
              <h3 className="font-semibold text-surface-100 mt-0.5">{title || 'Your bundle'}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-lg font-bold text-brand-600">₹{discounted || '—'}</span>
                {original > 0 && <span className="text-xs text-surface-400 line-through">₹{original}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-surface-700 flex justify-between text-sm text-surface-400">
                <span>Available</span>
                <span className="font-medium text-surface-200">{quantity || '0'}</span>
              </div>
            </div>
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-700">
            <p className="font-medium mb-1">💡 Tip</p>
            <p className="text-xs">Use a clear title and a realistic pickup window. Customers get a QR code after claiming.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
