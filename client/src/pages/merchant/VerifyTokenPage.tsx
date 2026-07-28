import { useState, type FormEvent } from 'react';
import { BadgeCheck, Camera, CircleCheck, KeyRound, ScanLine, ShieldCheck } from 'lucide-react';
import { useVerifyToken } from '../../api/hooks';
import { getErrorMessage } from '../../lib/api';

export function VerifyTokenPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const verifyMutation = useVerifyToken();

  const handleVerify = (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setResult({ type: 'error', message: 'Enter the complete 64-character pickup token.' });
      return;
    }
    verifyMutation.mutate(token, {
      onSuccess: (data) => { setResult({ type: 'success', message: data.message }); setToken(''); },
      onError: (err) => setResult({ type: 'error', message: getErrorMessage(err) }),
    });
  };

  return (
    <div className="page-container max-w-xl animate-fade-in py-12">
      <div className="text-center mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <ScanLine className="w-5 h-5 text-brand-600" />
        </div>
        <h1 className="text-xl font-semibold text-surface-50">Verify a pickup</h1>
        <p className="mt-1.5 text-sm text-surface-400">Scan the customer's QR code or paste their token.</p>
      </div>

      <div className="card p-6">
        <div className="flex justify-center gap-4 mb-6">
          <Step icon={Camera} title="Scan" copy="Read QR code" />
          <Step icon={KeyRound} title="Verify" copy="Token is single-use" />
          <Step icon={BadgeCheck} title="Collect" copy="Mark as handed over" />
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="label">Pickup token</label>
            <textarea
              value={token}
              onChange={(event) => setToken(event.target.value.toLowerCase().replace(/\s/g, ''))}
              className="input min-h-24 font-mono text-sm"
              placeholder="Paste the 64-character token"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-xs text-surface-400">
              <ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-brand-600" />
              Only valid, unexpired claims for your store can be collected.
            </p>
            <button type="submit" disabled={verifyMutation.isPending || !token} className="btn-primary">
              {verifyMutation.isPending ? 'Verifying...' : 'Verify & collect'}
            </button>
          </div>
        </form>

        {result && (
          <div role="status" className={`mt-6 rounded-xl border p-4 flex gap-3 ${
            result.type === 'success'
              ? 'border-brand-200 bg-brand-50 text-brand-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            <CircleCheck className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">{result.type === 'success' ? 'Pickup confirmed' : 'Verification failed'}</p>
              <p className="text-sm mt-0.5 opacity-90">{result.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ icon: Icon, title, copy }: { icon: typeof Camera; title: string; copy: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center mx-auto mb-1.5">
        <Icon className="w-4 h-4 text-surface-400" />
      </div>
      <div className="text-xs font-medium text-surface-300">{title}</div>
      <div className="text-2xs text-surface-400">{copy}</div>
    </div>
  );
}
