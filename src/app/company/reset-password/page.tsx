'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!token) {
            setError('Invalid or missing token');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/company/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Password reset successfully. Redirecting to login...');
                setTimeout(() => {
                    router.push('/company/login');
                }, 2000);
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
                <p className="text-gray-600 mb-6">This password reset link is invalid or missing the token.</p>
                <Link href="/company/login" className="text-[#004aad] font-bold hover:underline">
                    Return to Login
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 animate-fadeIn">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">Set New Password</h1>
                <p className="text-gray-500 mt-2">Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            required
                            placeholder="Enter new password"
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad] outline-none transition-all placeholder:text-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                        />
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad] outline-none transition-all placeholder:text-gray-400"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                        />
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                {message && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                        {message}
                    </div>
                )}

                {error && (
                    <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || !!message}
                    className="w-full flex items-center justify-center gap-2 bg-[#004aad] text-white font-bold py-3.5 rounded-full hover:bg-[#4a8a52] transition-colors shadow-lg hover:shadow-xl disabled:opacity-70"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex">
            {/* Left Decoration Side */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white items-center justify-center">
                <div className="absolute inset-0">
                    <Image src="/images/bg-4.jpg" alt="Background" fill className="object-cover opacity-60" />
                    <div className="absolute inset-0 bg-[#004aad]/80 mix-blend-multiply"></div>
                </div>
                <div className="relative z-10 p-12 text-center">
                    <h2 className="text-5xl font-bold mb-6">Secure Your Account</h2>
                    <p className="text-xl max-w-md mx-auto">Create a strong password to protect your business data.</p>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <Suspense fallback={<div className="text-[#004aad]">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
