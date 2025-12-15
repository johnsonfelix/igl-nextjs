'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/company/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',                 // important
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // success — navigate based on role
        if (data.role === 'ADMIN') {
          window.location.assign('/admin/dashboard');
          return;
        }
        window.location.assign('/dashboard');
        return;
      } else {
        setError(data?.error || 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white items-center justify-center">
        <div className="absolute inset-0">
          <Image src="/images/bg-4.jpg" alt="Login Background" fill className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-[#5da765]/80 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 p-12 text-center">
          <h2 className="text-5xl font-bold mb-6">Welcome Back</h2>
          <p className="text-xl max-w-md mx-auto">Access your global logistics network and manage your partnerships.</p>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800">Company Login</h1>
            <p className="text-gray-500 mt-2">Access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#5da765] focus:border-[#5da765] outline-none transition-all placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#5da765] focus:border-[#5da765] outline-none transition-all placeholder:text-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#5da765] text-white font-bold py-3.5 rounded-full hover:bg-[#4a8a52] transition-colors shadow-lg hover:shadow-xl disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center border-t pt-6">
            <p className="text-gray-600 text-sm">
              Don’t have an account?{' '}
              <Link
                href="/company/register"
                className="text-[#5da765] font-bold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
