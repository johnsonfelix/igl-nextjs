'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/company/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('If an account exists with this email, you will receive a password reset link.');
                setEmail('');
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Decoration Side (Same as login) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white items-center justify-center">
                <div className="absolute inset-0">
                    <Image src="/images/bg-4.jpg" alt="Background" fill className="object-cover opacity-60" />
                    <div className="absolute inset-0 bg-[#004aad]/80 mix-blend-multiply"></div>
                </div>
                <div className="relative z-10 p-12 text-center">
                    <h2 className="text-5xl font-bold mb-6">Forgot Password?</h2>
                    <p className="text-xl max-w-md mx-auto">Don't worry, we'll help you get back on track.</p>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 animate-fadeIn">
                    <Link href="/company/login" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Link>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-800">Reset Password</h1>
                        <p className="text-gray-500 mt-2">Enter your email to receive a reset link</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad] outline-none transition-all placeholder:text-gray-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
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
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[#004aad] text-white font-bold py-3.5 rounded-full hover:bg-[#4a8a52] transition-colors shadow-lg hover:shadow-xl disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
