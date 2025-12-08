"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
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
  const { user } = useAuth();

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
  const [durationDays, setDurationDays] = useState<number | "">(365);
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

  // --- simple color mapping for plan cards ---
  const planColor = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes("gold"))
      return "from-yellow-100 to-amber-200 text-amber-800";
    if (key.includes("platinum") || key.includes("diamond"))
      return "from-violet-100 to-indigo-200 text-indigo-800";
    if (key.includes("silver"))
      return "from-purple-100 to-pink-100 text-pink-800";
    return "from-slate-50 to-slate-100 text-slate-800";
  };

  // --- submit handler ---
  async function handleSubmit() {
    setError(null);
    setSuccessCompany(null);

    if (!companyId) {
      setError(
        "Company ID required. Ensure your auth context has a company or paste the company id."
      );
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
        provider: paymentMethod,
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
          durationDays:
            typeof durationDays === "number" && durationDays > 0
              ? durationDays
              : null,
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

  return (
    <div className="space-y-8">
      {/* Header / summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="mt-1 text-slate-600">
            Choose a plan, pay securely and unlock benefits for your company.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-slate-500">
            Signed in as{" "}
            <span className="font-medium text-slate-800">
              {(user as any)?.email ??
                (user as any)?.name ??
                "Guest"}
            </span>
            <div className="text-xs mt-1 text-slate-400">
              Company {inferredCompanyId ? "auto-detected" : "not detected"}
            </div>
          </div>

          {/* Company ID fallback input */}
          <div className="flex items-center gap-2">
            <input
              aria-label="company id"
              value={companyId ?? ""}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder={
                inferredCompanyId ? "Company detected" : "Paste company id"
              }
              className="px-3 py-2 border rounded-md text-sm w-60"
            />
          </div>
        </div>
      </div>

      {/* Membership grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Choose membership</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const active = p.id === selectedPlanId;
            const {
              offer: planOffer,
              finalPrice: planFinalPrice,
            } = getBestOfferForPlan(p);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-transform transform hover:-translate-y-1 shadow-sm ${
                  active ? "ring-4 ring-indigo-200" : "hover:shadow-md"
                }`}
                role="button"
                aria-pressed={active}
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
                        <div className="text-sm text-white/90 font-semibold">
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
                            / year
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div className="text-lg font-bold">
                            ${p.price.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-700">
                            / year
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* features & CTA */}
                <div className="mt-3 flex items-center justify-between">
                  <ul className="text-sm text-slate-700 space-y-1">
                    {(p.features ?? [])
                      .slice(0, 3)
                      .map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    {(!p.features || p.features.length === 0) && (
                      <li className="text-slate-500">No features listed</li>
                    )}
                  </ul>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanId(p.id);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold ${
                        active
                          ? "bg-indigo-700 text-white"
                          : "bg-white border text-indigo-700"
                      }`}
                    >
                      {active ? "Selected" : "Select"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment & details */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" /> Payment & details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="col-span-2">
              <span className="text-sm text-slate-600">Payment method</span>
              <div className="mt-2 flex gap-3">
                {["RAZORPAY", "PAYPAL", "OFFLINE"].map((method) => (
                  <button
                    key={method}
                    onClick={() =>
                      setPaymentMethod(method as any)
                    }
                    className={`flex-1 text-left px-3 py-2 rounded-lg border shadow-sm text-sm transition ${
                      paymentMethod === method
                        ? "bg-indigo-50 border-indigo-300"
                        : "bg-white border-slate-200"
                    }`}
                    type="button"
                  >
                    <div className="font-medium">{method}</div>
                    <div className="text-xs text-slate-500">
                      Pay with{" "}
                      {method === "OFFLINE"
                        ? "bank transfer"
                        : method}
                    </div>
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* coupon & summary */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-2">
              {/* Coupon input (optional – uncomment when needed) */}
              {/* <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md">
                <Tag className="h-4 w-4 text-slate-600" />
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  className="bg-transparent outline-none text-sm flex-1"
                />
                <button
                  onClick={applyCoupon}
                  className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                >
                  Apply
                </button>
              </div> */}

              {bestOfferForSelected && (
                <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-100">
                  <Gift className="h-4 w-4" />
                  <span>
                    Membership offer{" "}
                    <span className="font-semibold">
                      {bestOfferForSelected.name}
                    </span>{" "}
                    applied: {bestOfferForSelected.percentage}% off
                  </span>
                </div>
              )}

              {couponApplied && (
                <div className="text-sm text-green-700 font-medium">
                  {couponApplied.code} applied — -$
                  {(couponApplied.discount ?? 0).toFixed(2)}
                </div>
              )}

              {offersLoading && (
                <div className="text-xs text-slate-400">
                  Checking membership offers…
                </div>
              )}
              {offersError && (
                <div className="text-xs text-red-500">
                  {offersError}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Subtotal</div>
              <div className="text-xl font-extrabold">
                ${previewPrice.toFixed(2)}
              </div>
              {(membershipDiscountAmount > 0 ||
                couponDiscount > 0) && (
                <>
                  <div className="text-xs text-slate-500">
                    Membership discount: -$
                    {membershipDiscountAmount.toFixed(2)}
                  </div>
                  {couponDiscount > 0 && (
                    <div className="text-xs text-slate-500">
                      Coupon discount: -$
                      {couponDiscount.toFixed(2)}
                    </div>
                  )}
                  <div className="text-sm text-slate-700 mt-1">
                    Final:{" "}
                    <span className="font-bold">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* terms & CTA */}
        <aside className="p-6 bg-white rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <div className="font-semibold">Terms & policies</div>
              <div className="mt-1 text-sm text-slate-600">
                You must agree before purchasing.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) =>
                  setAcceptTerms(e.target.checked)
                }
                className="h-4 w-4"
              />
              <span className="text-sm">
                I agree to the{" "}
                <a className="text-indigo-600 underline">
                  Terms & Conditions
                </a>
              </span>
            </label>

            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={acceptPolicy}
                onChange={(e) =>
                  setAcceptPolicy(e.target.checked)
                }
                className="h-4 w-4"
              />
              <span className="text-sm">
                I agree to the{" "}
                <a className="text-indigo-600 underline">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !acceptTerms}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold transition ${
                loading || !acceptTerms
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading
                ? "Processing..."
                : `Become a Member — $${finalPrice.toFixed(
                    2
                  )}`}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {successCompany && (
            <div className="p-3 bg-green-50 rounded text-sm text-green-800">
              <div className="font-semibold">Success!</div>
              <div className="mt-1">
                Membership updated for company{" "}
                <span className="font-medium">
                  {successCompany.id ?? ""}
                </span>
                .
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
