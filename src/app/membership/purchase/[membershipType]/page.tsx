'use client';

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Calendar, Lock, Building, Check, LockKeyhole, Loader, LogIn } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext'; // Your authentication context
import Link from 'next/link';

type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: string[];
  paymentProtection?: string | null;
  discountPercentage?: number | null;
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

  const { user, loading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState<string>('Loading company...');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [plan, setPlan] = useState<ApiPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  // Payment UI state
  const [paymentMethod, setPaymentMethod] = useState<'offline'>('offline');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePolicies, setAgreePolicies] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

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

    if (!authLoading) {
      if (user && user.companyId) {
        loadCompanyName(user.companyId);
      } else if (user) {
        setCompanyName('No company linked to your user profile.');
      }
    }
  }, [user, authLoading]);

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
          isOffline: true,
          payment: {
            provider: 'OFFLINE',
            amount: plan.price
          }
        }),
      });

      if (!response.ok) {
        let errorText = 'An unexpected error occurred.';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (_) { }
        throw new Error(errorText);
      }

      setStatus('success');
      setOrderConfirmed(true);
      // Removed auto-redirect to show bank details
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process payment.');
    }
  };

  // Loading / error states
  if (loadingPlans || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">Loading...</div>
          <div className="animate-pulse h-3 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }



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

              {plan.paymentProtection && (
                <div className="mb-4 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                  🛡️ {plan.paymentProtection}
                </div>
              )}
              <br />
              {/* {plan.discountPercentage && plan.discountPercentage > 0 && (
                <div className="mb-4 text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg inline-block">
                  🏷️ {plan.discountPercentage}% Discount
                </div>
              )} */}

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
            {!user ? (
              <div className="bg-white p-8 rounded-xl shadow-lg text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
                <p className="text-gray-600 mb-8 max-w-xs mx-auto">
                  Please login to your company account to complete your membership purchase.
                </p>
                <Link href="/company/login" className="w-full">
                  <button className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" /> Login to Continue
                  </button>
                </Link>
                <p className="mt-6 text-sm text-gray-500">
                  Don't have an account? <Link href="/company/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
                </p>
              </div>
            ) : (
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

                  {/* Payment Selection & Form */}
                  {!orderConfirmed ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Offline */}
                          <label className={`relative cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${paymentMethod === 'offline' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input
                              type="radio"
                              name="pm"
                              value="offline"
                              checked={paymentMethod === 'offline'}
                              onChange={() => setPaymentMethod('offline')}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-800">Offline Payment</span>
                              <div className="w-5 h-5 rounded-full border border-blue-600 flex items-center justify-center">
                                {paymentMethod === 'offline' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Bank Transfer. Details shown after confirmation.</p>
                          </label>

                          {/* Online (Disabled) */}
                          <label className="relative cursor-not-allowed border rounded-xl p-4 flex flex-col gap-2 border-gray-100 bg-gray-50 opacity-60">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-400">Online Payment</span>
                              <span className="text-[10px] bg-gray-200 text-gray-500 font-bold px-2 py-1 rounded">UNAVAILABLE</span>
                            </div>
                            <p className="text-xs text-gray-400">Credit Card, Debit Card, Net Banking</p>
                          </label>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                            I agree to the <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms & Conditions</Link>
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="privacy"
                            checked={agreePolicies}
                            onChange={(e) => setAgreePolicies(e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor="privacy" className="text-sm text-gray-600 cursor-pointer">
                            I agree to the <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>
                          </label>
                        </div>
                      </div>

                      {status === 'error' && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{errorMessage}</p>}

                      <button
                        type="submit"
                        disabled={status === 'loading' || !user?.companyId || !agreeTerms || !agreePolicies}
                        className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                      >
                        {status === 'loading' ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" /> Processing...
                          </>
                        ) : (
                          `Confirm Purchase`
                        )}
                      </button>
                    </div>
                  ) : (
                    // Success State - Show Bank Details
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                          <Check className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-green-800 mb-2">Order Confirmed!</h2>
                        <p className="text-sm text-green-700">Thank you for your purchase. Please complete your payment below.</p>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 shadow-sm">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                          <LockKeyhole className="w-5 h-5" />
                          Bank Transfer Details
                        </h3>

                        <div className="space-y-4 text-sm text-blue-900">
                          <div className="bg-white p-4 rounded border border-blue-200 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <span className="text-gray-500 font-medium">Bank Name:</span>
                              <span className="col-span-2 font-bold text-gray-800 select-all">HDFC Bank Limited</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <span className="text-gray-500 font-medium">Branch:</span>
                              <span className="col-span-2 font-bold text-gray-800 select-all">G N Chetty rd Branch, TNagar</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <span className="text-gray-500 font-medium">Account Name:</span>
                              <span className="col-span-2 font-bold text-gray-800 select-all">INNOVATIVE GLOBAL LOGISTICS ALLIANZ</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <span className="text-gray-500 font-medium">Account No:</span>
                              <span className="col-span-2 font-bold text-gray-800 select-all">50200035538980</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <span className="text-gray-500 font-medium">SWIFT Code:</span>
                              <span className="col-span-2 font-bold text-gray-800 select-all">HDFCINBBCHE</span>
                            </div>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                            <p className="font-semibold mb-1">⚠️ Important:</p>
                            <p>
                              After creating the payment, please email the transaction details / proof of payment to{" "}
                              <a href="mailto:sales@igla.asia" className="font-bold underline hover:text-yellow-900">
                                sales@igla.asia
                              </a>
                              . Your membership will be activated once we verify the payment.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center pt-4">
                        <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
                          Go to Dashboard
                        </Link>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
