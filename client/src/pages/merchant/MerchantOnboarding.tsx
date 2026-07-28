import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMerchantProfile } from '../../api/hooks';
import { getErrorMessage } from '../../lib/api';
import { Store } from 'lucide-react';

export function MerchantOnboarding() {
  const navigate = useNavigate();
  const createMutation = useCreateMerchantProfile();
  const [error, setError] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({
      businessName,
      description,
      address,
      phone,
    }, {
      onSuccess: () => navigate('/merchant'),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
            <Store className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-surface-50">Set up your business</h1>
          <p className="mt-1.5 text-sm text-surface-400">Complete your profile to start listing</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Business name</label>
            <input
              type="text"
              className="input"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. The Daily Bakery"
              required
            />
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              className="input resize-none min-h-[80px]"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Full street address for pickup"
              required
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              required
            />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input resize-none min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell customers about your store..."
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Setting up...' : 'Complete setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
