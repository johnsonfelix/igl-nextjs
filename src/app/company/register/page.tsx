'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, MapPin, Globe, Loader2, ShieldCheck } from 'lucide-react';

export default function RegisterCompanyPage() {
  const [form, setForm] = useState({
    name: '',
    sector: 'Freight Forwarder',
    city: '',
    country: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setForm(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong');
      }

      // ✅ Send user to login (your login page lives at /company/login)
      router.push('/company/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/90';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 px-4">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-slate-800">Register Your Company</h1>
          <p className="text-slate-500 mt-2">Create your company account to get started</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Building2 size={18} />
              </span>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Cillapris Incorporated"
                className={`${inputBase} pl-10`}
              />
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
            <select
              name="sector"
              value={form.sector}
              onChange={handleChange}
              className={inputBase}
            >
              <option value="Freight Forwarder">Freight Forwarder</option>
              <option value="Vendor">Vendor</option>
              <option value="Trader">Trader</option>
            </select>
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <MapPin size={18} />
                </span>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g., Chennai"
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Globe size={18} />
                </span>
                <input
                  name="country"
                  required
                  value={form.country}
                  onChange={handleChange}
                  placeholder="e.g., India"
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Mail size={18} />
              </span>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={`${inputBase} pl-10`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                className={`${inputBase} pl-10 pr-24`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-2.5 text-xs font-semibold text-indigo-600 hover:underline"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Use at least 8 characters, with a number and a symbol for best security.</p>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={handleChange}
              className="mt-1"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-slate-700">
              I agree to the{' '}
              <Link href="/terms" className="text-indigo-600 underline">
                user agreement
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-indigo-600 underline">
                privacy policy
              </Link>.
            </label>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !form.agreeToTerms}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 text-sm">
            Already have an account?{' '}
            <Link href="/company/login" className="text-indigo-600 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
