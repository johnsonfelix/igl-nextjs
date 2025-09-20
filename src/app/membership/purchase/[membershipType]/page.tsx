'use client';

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Calendar, Lock, Building } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext'; // Your authentication context

type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
};

const normalize = (s?: string) =>
  (s || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // remove spaces, hyphens, punctuation

const PurchasePage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const membershipType = (params.membershipType as string) || '';

  const { user } = useAuth();

  const [companyName, setCompanyName] = useState<string>('Loading company...');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [plan, setPlan] = useState<ApiPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  // Fetch membership plans from API
  useEffect(() => {
    let mounted = true;
    const fetchPlans = async () => {
      setLoadingPlans(true);
      setFetchError('');
      try {
        const res = await fetch('/api/admin/membership-plans');
        if (!res.ok) {
          throw new Error(`Failed to fetch plans: ${res.status}`);
        }
        const data: ApiPlan[] = await res.json();
        if (!mounted) return;
        setPlans(data);

        // find matched plan robustly by comparing normalized membershipType to normalized slug or name
        const normalizedParam = normalize(membershipType);
        const matched = data.find((p) => {
          return normalize(p.slug) === normalizedParam || normalize(p.name) === normalizedParam;
        });

        setPlan(matched ?? null);
      } catch (err) {
        console.error('Error fetching plans', err);
        if (!mounted) return;
        setFetchError((err as Error).message || 'Failed to load membership plans.');
        setPlans([]);
        setPlan(null);
      } finally {
        if (mounted) setLoadingPlans(false);
      }
    };

    fetchPlans();
    return () => {
      mounted = false;
    };
  }, [membershipType]);

  // --- Fetch the user's single company name ---
  useEffect(() => {
    const loadCompanyName = async (companyId: string) => {
      if (!companyId) {
        setCompanyName('No company associated with account.');
        return;
      }
      try {
        const response = await fetch(`/api/company/${companyId}/name`);
        if (!response.ok) {
          throw new Error('Failed to fetch company name.');
        }
        const data = await response.json();
        setCompanyName(data.name || 'Company name not found.');
      } catch (error) {
        console.error(error);
        setCompanyName('Error loading company.');
      }
    };

    if (user && user.companyId) {
      loadCompanyName(user.companyId);
    } else if (user) {
      setCompanyName('No company linked to your user profile.');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plan) {
      setErrorMessage('Selected membership plan not found.');
      return;
    }

    if (!user?.companyId) {
      setErrorMessage('Could not find your company. Please ensure you are logged in correctly.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/membership/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user.companyId,
          membershipPlanId: plan.id,
          membershipType: plan.name,
          amount: plan.price,
        }),
      });

      if (!response.ok) {
        let errorText = 'An unexpected error occurred.';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (_) {}
        throw new Error(errorText);
      }

      setStatus('success');
      // redirect after short delay so user can see the success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1800);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process payment.');
    }
  };

  // Loading / error states
  if (loadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">Loading plan...</div>
          <div className="animate-pulse h-3 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-xl text-center bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Failed to load membership plans</h2>
          <p className="text-sm text-gray-600 mb-4">{fetchError}</p>
          <p className="text-sm text-gray-600">Try again later or contact support.</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <h1 className="text-3xl font-bold">Membership Plan Not Found</h1>
        <p className="mt-4 text-gray-600">We couldn't find the membership plan you requested.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left Side: Order Summary */}
          <div className="bg-white p-8 rounded-xl shadow-lg order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <div className="flex items-center">
                    <ShieldCheck className="h-8 w-8 text-blue-500 mr-4" />
                    <div>
                        <p className="font-semibold text-gray-700">{plan.name}</p>
                        <p className="text-sm text-gray-500">Billed Annually</p>
                    </div>
                </div>
                <p className="font-bold text-lg text-gray-800">${plan.price}</p>
              </div>
              <ul className="space-y-2 pt-4 text-gray-600">
                {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center">
                        <ShieldCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
              </ul>
              <div className="flex justify-between items-center pt-6 border-t">
                <p className="text-lg font-semibold text-gray-800">Total</p>
                <p className="text-2xl font-bold text-blue-600">${plan.price}</p>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Purchase</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Display (Replaces Dropdown) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase For</label>
                        <div className="relative">
                            <div className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Building className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-800">{companyName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder for Payment Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Details</label>
                        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="relative">
                                <CreditCard className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Card Number" className="w-full pl-10 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div className="flex space-x-3">
                                <div className="relative w-1/2">
                                     <Calendar className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="MM / YY" className="w-full pl-10 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="relative w-1/2">
                                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="CVC" className="w-full pl-10 py-2 border border-gray-300 rounded-md" />
                                </div>
                            </div>
                        </div>
                         <p className="text-xs text-gray-500 mt-2">Your payment is securely processed.</p>
                    </div>

                    {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}
                    {status === 'success' && <p className="text-sm text-green-600">Payment successful! Redirecting...</p>}

                    <button type="submit" disabled={status === 'loading' || !user?.companyId} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                        {status === 'loading' ? 'Processing...' : `Pay $${plan.price}`}
                    </button>
                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
