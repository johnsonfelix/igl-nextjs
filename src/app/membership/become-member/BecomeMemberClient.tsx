"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle,
  Tag,
  ShieldCheck,
  ArrowRight,
  Gift,
} from "lucide-react";

// Match OfferScope used in admin offers
type OfferScope =
  | "ALL"
  | "HOTELS"
  | "TICKETS"
  | "SPONSORS"
  | "BOOTHS"
  | "SUBSCRIPTIONS"
  | "CUSTOM";

type Plan = {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  description?: string | null;
  thumbnail?: string | null;
  paymentProtection?: string | null;
  discountPercentage?: number | null;
  features?: string[] | null;
};

type PaymentPayload = {
  provider?: string;
  transactionId?: string;
  amount?: number;
};

type MembershipOffer = {
  id: string;
  name: string;
  percentage: number;
  scope: OfferScope;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  membershipPlanIds?: string[];
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(text);
      if (!res.ok) {
        throw new Error(
          `${res.status} ${res.statusText}: ${JSON.stringify(data)}`
        );
      }
      return data;
    } catch (err: any) {
      throw new Error(`Invalid JSON from ${url}: ${err.message}`);
    }
  }
  if (!res.ok) {
    throw new Error(`Request to ${url} failed ${res.status} ${res.statusText}`);
  }
  throw new Error(
    `Expected JSON from ${url} but received non-JSON response`
  );
}

export default function BecomeMemberClient({ plans }: { plans: Plan[] }) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  // --- companyId resolution (auto-detect or fallback input) ---
  const inferredCompanyId = useMemo(() => {
    if (!user) return null;
    if ((user as any).companyId) return (user as any).companyId as string;
    if (
      Array.isArray((user as any).companies) &&
      (user as any).companies.length > 0
    ) {
      return (user as any).companies[0].id as string;
    }
    return null;
  }, [user]);

  const [companyId, setCompanyId] = useState<string | null>(inferredCompanyId);
  useEffect(() => setCompanyId(inferredCompanyId), [inferredCompanyId]);

  // --- selection & form state ---
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans?.[0]?.id ?? null
  );
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  const [paymentMethod, setPaymentMethod] = useState<
    "RAZORPAY" | "PAYPAL" | "OFFLINE"
  >("RAZORPAY");

  const [coupon, setCoupon] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discount?: number;
  } | null>(null);

  const [account, setAccount] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptPolicy, setAcceptPolicy] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCompany, setSuccessCompany] = useState<any | null>(null);

  // --- membership offers state ---
  const [offers, setOffers] = useState<MembershipOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  // Fetch offers once (admin offers endpoint reused)
  useEffect(() => {
    const loadOffers = async () => {
      setOffersLoading(true);
      setOffersError(null);
      try {
        const data = await fetchJson<
          {
            id: string;
            name: string;
            percentage: number;
            scope: OfferScope;
            isActive: boolean;
            startsAt?: string | null;
            endsAt?: string | null;
            membershipPlanIds?: string[];
          }[]
        >("/api/admin/offers");

        // Only keep scopes relevant to membership
        const membershipOffers = (data || []).filter((o) =>
          ["ALL", "SUBSCRIPTIONS", "CUSTOM"].includes(o.scope)
        );
        setOffers(membershipOffers);
      } catch (err: any) {
        console.error("Failed to load offers:", err);
        setOffersError(err.message ?? "Failed to load offers");
      } finally {
        setOffersLoading(false);
      }
    };

    loadOffers();
  }, []);

  // Helper: is offer active now (date + isActive)
  const isOfferActive = (o: MembershipOffer): boolean => {
    if (!o.isActive) return false;
    const now = new Date();
    if (o.startsAt) {
      const start = new Date(o.startsAt);
      if (start > now) return false;
    }
    if (o.endsAt) {
      const end = new Date(o.endsAt);
      if (end < now) return false;
    }
    return true;
  };

  // Helper: compute best offer & discounted price FOR A GIVEN PLAN
  const getBestOfferForPlan = (
    plan: Plan | null
  ): {
    offer: MembershipOffer | null;
    discountAmount: number;
    finalPrice: number;
  } => {
    if (!plan || offers.length === 0) {
      return {
        offer: null,
        discountAmount: 0,
        finalPrice: plan ? plan.price : 0,
      };
    }

    let best: MembershipOffer | null = null;

    for (const o of offers) {
      if (!isOfferActive(o)) continue;

      let applies = false;

      if (o.scope === "ALL" || o.scope === "SUBSCRIPTIONS") {
        applies = true;
      } else if (
        o.scope === "CUSTOM" &&
        o.membershipPlanIds &&
        o.membershipPlanIds.includes(plan.id)
      ) {
        applies = true;
      }

      if (!applies) continue;

      if (!best || o.percentage > best.percentage) {
        best = o;
      }
    }

    const discountAmount = best
      ? (plan.price * best.percentage) / 100
      : 0;

    const finalPrice = Math.max(0, plan.price - discountAmount);

    return { offer: best, discountAmount, finalPrice };
  };

  // Selected plan: compute best offer and discounted price (for summary + payment)
  const {
    offer: bestOfferForSelected,
    discountAmount: membershipDiscountAmount,
    finalPrice: selectedPlanPriceAfterOffer,
  } = useMemo(
    () => getBestOfferForPlan(selectedPlan),
    [selectedPlan, offers]
  );

  // Base price
  const previewPrice = selectedPlan ? selectedPlan.price : 0;

  // Coupon logic (demo)
  const applyCoupon = () => {
    setError(null);
    setCouponApplied(null);
    if (!coupon) {
      setError("Enter a coupon code to apply.");
      return;
    }
    if (coupon.trim().toUpperCase() === "SAVE10") {
      setCouponApplied({
        code: coupon.trim().toUpperCase(),
        discount: 10,
      });
    } else if (coupon.trim().toUpperCase() === "HALF") {
      setCouponApplied({
        code: coupon.trim().toUpperCase(),
        discount: previewPrice / 2,
      });
    } else {
      setError(
        "Coupon not valid (demo). Your backend should verify coupons securely."
      );
    }
  };

  const couponDiscount = couponApplied?.discount ?? 0;
  const finalPrice = Math.max(
    0,
    selectedPlanPriceAfterOffer - couponDiscount
  );

  // Determine duration based on plan name (Diamond/Lifetime logic)
  const durationDays = useMemo(() => {
    if (selectedPlan?.name?.toLowerCase().includes("diamond")) return null; // Lifetime
    return 365; // Default 1 year
  }, [selectedPlan]);


  // --- simple color mapping for plan cards ---
  const planColor = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes("gold"))
      return "from-yellow-100 to-amber-200 text-amber-800";
    if (key.includes("platinum"))
      return "from-slate-200 to-slate-400 text-slate-800"; // Platinum color
    if (key.includes("diamond"))
      return "from-cyan-100 to-blue-200 text-blue-900"; // Diamond color
    if (key.includes("silver"))
      return "from-gray-100 to-gray-300 text-gray-800";
    if (key.includes("free"))
      return "from-green-50 to-emerald-100 text-emerald-800";
    return "from-slate-50 to-slate-100 text-slate-800";
  };

  // --- submit handler ---
  async function handleSubmit() {
    setError(null);
    setSuccessCompany(null);

    if (!user) {
      setError("Login before checkout");
      return;
    }

    if (!companyId) {
      // Try refreshing user to see if company was just added
      await refreshUser();
      // If still no company, prompt to create
      setError("Company profile required. Redirecting to registration...");
      setTimeout(() => router.push("/company/register"), 1500);
      return;
    }
    if (!selectedPlanId) {
      setError("Please select a membership plan.");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the Terms & Conditions.");
      return;
    }

    setLoading(true);
    try {
      const payment: PaymentPayload = {
        provider: finalPrice === 0 ? "FREE" : paymentMethod,
        transactionId: account ?? undefined,
        amount: finalPrice, // includes membership offer + coupon
      };

      const res = await fetch("/api/membership/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          membershipPlanId: selectedPlanId,
          payment,
          coupon: couponApplied?.code ?? null,
          account: account || null,
          durationDays, // Passed explicitly (null for lifetime)
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Purchase failed. Please try again.");
      } else {
        setSuccessCompany(data.company ?? data);
      }
    } catch (err: any) {
      setError(err?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  const toUrlSegment = (s?: string | null) =>
    (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSelectPlan = (plan: Plan) => {
    if (!user || !user.companyId) {
      // Optional: Redirect to login or register first?
      // The layout likely handles auth, but for companyId:
    }
    const segment = toUrlSegment(plan.slug || plan.name);
    router.push(`/membership/purchase/${segment}`);
  };

  return (
    <div className="space-y-8">
      {/* Header / summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="mt-1 text-slate-600">
            Choose a plan, pay securely and unlock benefits for your company.
          </p>
          {user && !companyId && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-amber-800 font-semibold">Missing Company Profile</h3>
                <p className="text-sm text-amber-700">You need a company profile to purchase a membership.</p>
              </div>
              <Link
                href="/company/register"
                className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700"
              >
                Register Company
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Membership grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Choose membership</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const {
              offer: planOffer,
              finalPrice: planFinalPrice,
            } = getBestOfferForPlan(p);

            return (
              <div
                key={p.id}
                onClick={() => handleSelectPlan(p)}
                className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-transform transform hover:-translate-y-1 shadow-sm hover:shadow-md bg-white border border-slate-100`}
                role="button"
              >
                {/* offer badge */}
                {planOffer && (
                  <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <Gift className="h-3 w-3" />
                    {planOffer.percentage}% OFF
                  </div>
                )}

                {/* top gradient / thumbnail */}
                <div
                  className={`rounded-xl overflow-hidden p-3 bg-gradient-to-br ${planColor(
                    p.name
                  )}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-white/30 flex items-center justify-center">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-xl font-bold text-white/90">
                          {/* Short initial or icon if no image */}
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-wide">
                        {p.name}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      {planOffer ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-700 line-through">
                            ${p.price.toFixed(2)}
                          </span>
                          <span className="text-lg font-bold">
                            ${planFinalPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-700">
                            {p.name.toLowerCase().includes("diamond") ? "/ one-time" : "/ year"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div className="text-lg font-bold">
                            ${p.price.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-700">
                            {p.name.toLowerCase().includes("diamond") ? "/ one-time" : "/ year"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* content body */}
                <div className="mt-3">
                  {p.paymentProtection && (
                    <div className="mb-2 text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded inline-block">
                      🛡️ {p.paymentProtection}
                    </div>
                  )}

                  {p.discountPercentage !== undefined && p.discountPercentage !== null && p.discountPercentage > 0 && (
                    <div className="mb-2 ml-2 text-xs font-semibold text-purple-800 bg-purple-100 px-2 py-1 rounded inline-block">
                      🏷️ {p.discountPercentage}% OFF
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <ul className="text-sm text-slate-700 space-y-1 w-full mb-2">
                      {(p.features ?? [])
                        .slice(0, 3)
                        .map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="line-clamp-2 text-xs">{f}</span>
                          </li>
                        ))}
                      {(!p.features || p.features.length === 0) && (
                        <li className="text-slate-500">No features listed</li>
                      )}
                    </ul>

                    <div className="w-full flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(p);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700`}
                      >
                        Select & Pay
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
