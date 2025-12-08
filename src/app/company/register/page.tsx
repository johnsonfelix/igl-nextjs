'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    'w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#5da765] focus:border-[#5da765] outline-none transition-all bg-white placeholder:text-gray-400';

  return (
    <div className="min-h-screen flex">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white items-center justify-center">
        <div className="absolute inset-0">
          <Image src="/images/bg-2.jpg" alt="Register Background" fill className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-[#5da765]/80 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 p-12 text-center">
          <h2 className="text-5xl font-bold mb-6">Join the Network</h2>
          <p className="text-xl max-w-md mx-auto">Connect with over 7,000+ logistics companies worldwide.</p>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10 animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800">Register Your Company</h1>
            <p className="text-gray-500 mt-2">Create your company account to get started</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
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
                  className="absolute right-3 top-3.5 text-xs font-semibold text-[#5da765] hover:underline"
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Use at least 8 characters, with a number and a symbol for best security.</p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={handleChange}
                className="mt-1 accent-[#5da765]"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-[#5da765] font-semibold hover:underline">
                  user agreement
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#5da765] font-semibold hover:underline">
                  privacy policy
                </Link>.
              </label>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !form.agreeToTerms}
              className="w-full flex items-center justify-center gap-2 bg-[#5da765] text-white font-bold py-3.5 rounded-full hover:bg-[#4a8a52] transition-colors shadow-lg hover:shadow-xl disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 text-center border-t pt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/company/login" className="text-[#5da765] font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
