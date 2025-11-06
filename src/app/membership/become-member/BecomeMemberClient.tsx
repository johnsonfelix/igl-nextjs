"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { CreditCard, CheckCircle, Tag, ShieldCheck, ArrowRight } from "lucide-react";

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

export default function BecomeMemberClient({ plans }: { plans: Plan[] }) {
  const { user } = useAuth();

  // --- companyId resolution (auto-detect or fallback input) ---
  const inferredCompanyId = useMemo(() => {
    if (!user) return null;
    if ((user as any).companyId) return (user as any).companyId as string;
    if (Array.isArray((user as any).companies) && (user as any).companies.length > 0) {
      return (user as any).companies[0].id as string;
    }
    return null;
  }, [user]);

  const [companyId, setCompanyId] = useState<string | null>(inferredCompanyId);
  useEffect(() => setCompanyId(inferredCompanyId), [inferredCompanyId]);

  // --- selection & form state ---
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans?.[0]?.id ?? null);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "PAYPAL" | "OFFLINE">("RAZORPAY");
  const [coupon, setCoupon] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount?: number } | null>(null);
  const [account, setAccount] = useState<string>("");
  const [durationDays, setDurationDays] = useState<number | "">(365);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptPolicy, setAcceptPolicy] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCompany, setSuccessCompany] = useState<any | null>(null);

  const previewPrice = selectedPlan ? selectedPlan.price : 0;
  const finalPrice = couponApplied ? Math.max(0, previewPrice - (couponApplied.discount ?? 0)) : previewPrice;

  // --- simple color mapping for plan cards (can be extended) ---
  const planColor = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes("gold")) return "from-yellow-100 to-amber-200 text-amber-800";
    if (key.includes("platinum") || key.includes("diamond")) return "from-violet-100 to-indigo-200 text-indigo-800";
    if (key.includes("silver")) return "from-purple-100 to-pink-100 text-pink-800";
    return "from-slate-50 to-slate-100 text-slate-800";
  };

  // --- coupon apply (mock) ---
  const applyCoupon = () => {
    setError(null);
    setCouponApplied(null);
    if (!coupon) {
      setError("Enter a coupon code to apply.");
      return;
    }
    // mock: coupon "SAVE10" gives $10 off, "HALF" gives 50% off (demonstration)
    if (coupon.trim().toUpperCase() === "SAVE10") {
      setCouponApplied({ code: coupon.trim().toUpperCase(), discount: 10 });
    } else if (coupon.trim().toUpperCase() === "HALF") {
      setCouponApplied({ code: coupon.trim().toUpperCase(), discount: previewPrice / 2 });
    } else {
      setError("Coupon not valid (demo). Your backend should verify coupons securely.");
    }
  };

  // --- submit handler (unchanged external contract) ---
  async function handleSubmit() {
    setError(null);
    setSuccessCompany(null);

    if (!companyId) {
      setError("Company ID required. Ensure your auth context has a company or paste the company id.");
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
        amount: finalPrice,
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
          durationDays: typeof durationDays === "number" && durationDays > 0 ? durationDays : null,
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
          {/* <h1 className="text-2xl md:text-3xl font-extrabold">Become a Member</h1> */}
          <p className="mt-1 text-slate-600">Choose a plan, pay securely and unlock benefits for your company.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-800">{(user as any)?.email ?? (user as any)?.name ?? "Guest"}</span>
            <div className="text-xs mt-1 text-slate-400">Company {inferredCompanyId ? "auto-detected" : "not detected"}</div>
          </div>

          {/* Company ID fallback input */}
          <div className="flex items-center gap-2">
            <input
              aria-label="company id"
              value={companyId ?? ""}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder={inferredCompanyId ? "Company detected" : "Paste company id"}
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
                {/* top gradient / thumbnail */}
                <div className={`rounded-xl overflow-hidden p-3 bg-gradient-to-br ${planColor(p.name)}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-white/30 flex items-center justify-center">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <div className="text-sm text-white/90 font-semibold">{p.name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold tracking-wide">{p.name}</div>
                      {/* <div className="text-xs text-slate-700/80">{p.description ?? "Annual membership"}</div> */}
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-lg font-bold">${p.price.toFixed(2)}</div>
                      <div className="text-xs text-slate-700">/ year</div>
                    </div>
                  </div>
                </div>

                {/* features & CTA */}
                <div className="mt-3 flex items-center justify-between">
                  <ul className="text-sm text-slate-700 space-y-1">
                    {(p.features ?? []).slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {(!p.features || p.features.length === 0) && <li className="text-slate-500">No features listed</li>}
                  </ul>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanId(p.id);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold ${
                        active ? "bg-indigo-700 text-white" : "bg-white border text-indigo-700"
                      }`}
                    >
                      {active ? "Selected" : "Select"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {/* {active && <div className="text-xs text-green-600 font-medium">Recommended</div>} */}
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
                    onClick={() => setPaymentMethod(method as any)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg border shadow-sm text-sm transition ${
                      paymentMethod === method ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200"
                    }`}
                    type="button"
                  >
                    <div className="font-medium">{method}</div>
                    <div className="text-xs text-slate-500">Pay with {method === "OFFLINE" ? "bank transfer" : method}</div>
                  </button>
                ))}
              </div>
            </label>

            {/* <label>
              <span className="text-sm text-slate-600">Transaction / Account (optional)</span>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Txn id / ref"
                className="mt-2 block w-full px-3 py-2 border rounded-md text-sm"
              />
            </label> */}

            {/* <label className="md:col-span-2">
              <span className="text-sm text-slate-600">Duration (days)</span>
              <input
                type="number"
                value={durationDays as any}
                onChange={(e) => setDurationDays(Number(e.target.value) || "")}
                className="mt-2 block w-48 px-3 py-2 border rounded-md text-sm"
                min={1}
              />
              <p className="text-xs text-slate-400 mt-1">Leave empty to use server default expiry.</p>
            </label> */}
          </div>

          {/* coupon & summary */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-3 items-center">
              {/* <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md">
                <Tag className="h-4 w-4 text-slate-600" />
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  className="bg-transparent outline-none text-sm"
                />
                <button onClick={applyCoupon} className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm">
                  Apply
                </button>
              </div> */}

              {couponApplied && (
                <div className="text-sm text-green-700 font-medium">{couponApplied.code} applied — -${(couponApplied.discount ?? 0).toFixed(2)}</div>
              )}
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Subtotal</div>
              <div className="text-xl font-extrabold">${previewPrice.toFixed(2)}</div>
              {couponApplied && <div className="text-sm text-slate-600">Final: ${finalPrice.toFixed(2)}</div>}
            </div>
          </div>
        </div>

        {/* terms & CTA */}
        <aside className="p-6 bg-white rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <div className="font-semibold">Terms & policies</div>
              <div className="mt-1 text-sm text-slate-600">You must agree before purchasing.</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-3">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">I agree to the <a className="text-indigo-600 underline">Terms & Conditions</a></span>
            </label>

            <label className="inline-flex items-center gap-3">
              <input type="checkbox" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">I agree to the <a className="text-indigo-600 underline">Privacy Policy</a></span>
            </label>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !acceptTerms}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold transition ${
                loading || !acceptTerms ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Processing..." : `Become a Member — $${finalPrice.toFixed(2)}`}
            </button>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {successCompany && (
            <div className="p-3 bg-green-50 rounded text-sm text-green-800">
              <div className="font-semibold">Success!</div>
              <div className="mt-1">Membership updated for company <span className="font-medium">{successCompany.id ?? ""}</span>.</div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
