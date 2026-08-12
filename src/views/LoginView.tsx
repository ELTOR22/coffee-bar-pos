import { useState } from 'react';
import { Coffee, Lock, Mail, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import type { UserRole } from '../types';

export function LoginView() {
  const { signIn, signUp } = useAuth();
  const { notify } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('cashier');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      notify('Email and password are required', 'error');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      notify('Name is required', 'error');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, role, fullName.trim());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-espresso-700 text-cream-50 mb-3 shadow-lg">
            <Coffee className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-espresso-800">Brewhouse</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-espresso-400 mt-1">Café &amp; Bar</p>
        </div>

        <div className="rounded-2xl bg-cream-50 shadow-xl border border-espresso-100 overflow-hidden">
          {/* Role tabs */}
          <div className="grid grid-cols-2 gap-1 p-1.5 bg-espresso-800">
            <button
              onClick={() => setRole('cashier')}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                role === 'cashier'
                  ? 'bg-gold-500 text-espresso-900'
                  : 'text-cream-200 hover:bg-espresso-700'
              }`}
            >
              Cashier
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                role === 'admin'
                  ? 'bg-espresso-600 text-cream-50'
                  : 'text-cream-200 hover:bg-espresso-700'
              }`}
            >
              Admin
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                role === 'admin' ? 'bg-espresso-700/10 text-espresso-700' : 'bg-gold-500/15 text-gold-600'
              }`}>
                {role}
              </span>
              <p className="text-sm text-espresso-500">
                {role === 'admin'
                  ? 'Full access: menu, inventory, reports, staff'
                  : 'Point of sale: browse menu, take orders'}
              </p>
            </div>

            {/* Sign in / Sign up toggle */}
            <div className="flex gap-1 mb-5 p-1 rounded-lg bg-espresso-100">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  mode === 'signin' ? 'bg-cream-50 text-espresso-700 shadow-sm' : 'text-espresso-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  mode === 'signup' ? 'bg-cream-50 text-espresso-700 shadow-sm' : 'text-espresso-400'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-espresso-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-espresso-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juan dela Cruz"
                      className="w-full rounded-lg border border-espresso-200 bg-cream-50 pl-10 pr-3 py-2.5 text-sm text-espresso-800 placeholder:text-espresso-300 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-espresso-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brewhouse.ph"
                    className="w-full rounded-lg border border-espresso-200 bg-cream-50 pl-10 pr-3 py-2.5 text-sm text-espresso-800 placeholder:text-espresso-300 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-espresso-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-espresso-200 bg-cream-50 pl-10 pr-10 py-2.5 text-sm text-espresso-800 placeholder:text-espresso-300 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-espresso-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-espresso-700 py-3 font-semibold text-cream-50 hover:bg-espresso-800 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === 'signin' ? (
                  `Sign in as ${role}`
                ) : (
                  `Create ${role} account`
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-espresso-400">
              {mode === 'signin'
                ? `New ${role} account? Click "Create Account" above.`
                : `Already have an account? Click "Sign In" above.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
