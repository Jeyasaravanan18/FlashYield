import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../api/hooks';
import { getErrorMessage } from '../../lib/api';
import { Loader2, Leaf, Store, ShoppingBag } from 'lucide-react';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [error, setError] = useState('');
  const register = useRegister();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    register.mutate(
      { email, password, role },
      {
        onSuccess: (data) => {
          const r = data.user.role;
          if (r === 'merchant') navigate('/merchant/onboarding');
          else navigate('/');
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-surface-100 via-white to-brand-500/5">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20">
            <Leaf className="w-6 h-6 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-surface-900">Create an account</h1>
          <p className="mt-1.5 text-sm text-surface-400">Join the community</p>
        </div>

        {/* Form */}
        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="label">Account type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    role === 'customer'
                      ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy food
                </button>
                <button
                  type="button"
                  onClick={() => setRole('merchant')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    role === 'merchant'
                      ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Sell food
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
