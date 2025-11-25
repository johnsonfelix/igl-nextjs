"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader, Check, ArrowLeft, LockKeyhole } from "lucide-react";
import { useCart } from "@/app/event/[id]/CartContext";
import { useAuth } from "@/app/context/AuthContext";

/** ---------- Types ---------- */

type Params = { id: string };

type Account = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
};

type CouponApplied = {
  id?: string | null;
  code?: string | null;
  discountAmount: number; // fixed amount
  discountPercent: number; // %
};

type OfferScope = "ALL" | "HOTELS" | "TICKETS" | "SPONSORS" | "CUSTOM";

type Offer = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  percentage: number | string;
  scope: OfferScope;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  hotelIds?: string[];
  ticketIds?: string[];
  sponsorTypeIds?: string[];
  boothIds?: string[]; // support booths
};

/** ---------- Small UI helpers ---------- */

function StepDot({ state }: { state: "completed" | "active" | "upcoming" }) {
  if (state === "completed") {
    return (
      <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 grid place-items-center text-white shadow-sm">
        <Check className="w-3.5 h-3.5" />
      </div>
    );
  }
  if (state === "active") {
    return <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 shadow-sm" />;
  }
  return <div className="w-[22px] h-[22px] rounded-full border-2 border-indigo-300" />;
}

function Dashed() {
  return (
    <div className="flex-1 h-[22px] flex items-center">
      <div className="w-full h-[2px] border-t-2 border-dashed border-indigo-300" />
    </div>
  );
}

function HeaderLabels() {
  return (
    <div className="flex justify-between text-xs text-slate-600">
      <span>Cart</span>
      <span>Conditions/Payment method</span>
      <span>Payment</span>
    </div>
  );
}

function Totals({
  subtotal,
  offerLabel,
  offerValue,
  discountCode,
  discountValue,
  total,
}: {
  subtotal: number;
  offerLabel?: string | null;
  offerValue: number;
  discountCode?: string | null;
  discountValue: number;
  total: number;
}) {
  return (
    <div className="mt-3 space-y-1 text-sm">
      <div className="flex justify-between">
        <span>Sub Total</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {offerValue > 0 && (
        <div className="flex justify-between text-rose-700">
          <span>Offer {offerLabel ? `(${offerLabel})` : ""}</span>
          <span>- ${offerValue.toFixed(2)}</span>
        </div>
      )}

      {discountCode && discountValue > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Coupon ({discountCode})</span>
          <span>- ${discountValue.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between">
        <span>Tax</span>
        <span>$0.00</span>
      </div>
      <div className="flex justify-between font-semibold pt-1">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

/** ---------- Cart summary UI ---------- */

function CartSummary({
  cart,
  couponCode,
  setCouponCode,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  couponBusy,
  linesWithOffers,
}: {
  cart: Array<any>;
  couponCode: string;
  setCouponCode: (s: string) => void;
  appliedCoupon: { code?: string | null };
  applyCoupon: () => void;
  removeCoupon: () => void;
  couponBusy: boolean;
  linesWithOffers: Array<any>; // items augmented with offers & computed prices
}) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800">PRODUCT SUMMARY</h3>

      <div className="mt-3 space-y-3">
        {cart.length === 0 && <p className="text-slate-500 text-sm">No items in cart.</p>}
        {linesWithOffers.map((item, idx) => (
          <div
            key={`${item.productId}-${item.roomTypeId || item.boothSubTypeId || ""}`}
            className="flex items-center gap-3 border-b pb-3"
          >
            <img src={item.image || "/placeholder.png"} alt={item.name} className="w-12 h-12 rounded-md object-cover border" />
            <div className="flex-1">
              <div className="font-medium">
                {idx + 1}. {item.name}
              </div>
              <div className="text-sm text-slate-500">
                Qty: {item.quantity} •{" "}
                {item.appliedOfferPercent ? (
                  <>
                    <span className="line-through mr-2">${Number(item.original).toFixed(2)}</span>
                    <span className="font-semibold">${Number(item.effective).toFixed(2)}</span>
                    <span className="ml-2 text-xs text-rose-600 font-medium">-{Math.round(item.appliedOfferPercent)}%</span>
                  </>
                ) : (
                  <span className="font-semibold">${Number(item.original).toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="font-semibold">${Number(item.lineTotal).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="mt-4 space-y-2">
        <div className="font-semibold">Have a coupon?</div>
        <div className="flex gap-2">
          <input
            value={appliedCoupon.code ? `Applied: ${appliedCoupon.code}` : couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={!!appliedCoupon.code}
            placeholder="Enter coupon code"
            className="flex-1 rounded border px-3 py-2"
          />
          {!appliedCoupon.code ? (
            <button onClick={applyCoupon} disabled={couponBusy || !couponCode.trim()} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:bg-slate-400">
              {couponBusy ? "Applying…" : "Apply"}
            </button>
          ) : (
            <button onClick={removeCoupon} className="px-4 py-2 rounded border">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** ---------- Checkout Page (main) ---------- */

export default function CheckoutPage({ params }: { params: Promise<Params> }) {
  const { id: eventId } = use(params);
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const { cart, clearCart } = useCart();

  // steps: 0 = cart, 1 = account, 2 = payment
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setSubmitting] = useState(false);

  // account
  const [account, setAccount] = useState<Account>({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
  });

  // coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplied>({
    id: null,
    code: null,
    discountAmount: 0,
    discountPercent: 0,
  });

  // payment
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "paypal">("razorpay");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePolicies, setAgreePolicies] = useState(false);

  // offers
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  // Prefill from company
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!companyId) return;
      try {
        const res = await fetch(`/api/companies/${companyId}`);
        if (!res.ok) return;
        const data = await res.json();

        const userObj = data?.user ?? {};
        const location = data?.location ?? {};
        const name = userObj?.name?.toString?.() || data?.name?.toString?.() || "";
        const email = userObj?.email?.toString?.() || "";
        const phone = userObj?.phone?.toString?.() || "";

        const parts: string[] = [];
        const a = (location.address || "").toString().trim();
        const c = (location.city || "").toString().trim();
        const s = (location.state || "").toString().trim();
        const co = (location.country || "").toString().trim();
        if (a) parts.push(a);
        if (c) parts.push(c);
        if (s) parts.push(s);
        if (co) parts.push(co);
        const address1 = parts.join(", ");

        if (!ignore) {
          setAccount((prev) => ({
            ...prev,
            name: name || prev.name,
            email: email || prev.email,
            phone: phone || prev.phone,
            address1: address1 || prev.address1,
          }));
        }
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [companyId]);

  /** ---------- Offers loader & helpers ---------- */

  useEffect(() => {
    let mounted = true;
    const loadOffers = async () => {
      setOffersLoading(true);
      setOffersError(null);
      try {
        const res = await fetch("/api/admin/offers");
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Offers fetch failed: ${res.status} ${res.statusText} ${txt}`);
        }
        const data = (await res.json()) as Offer[];
        if (!mounted) return;
        setOffers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("loadOffers error", err);
        if (!mounted) return;
        setOffers([]);
        setOffersError(err?.message || "Failed to load offers");
      } finally {
        if (!mounted) return;
        setOffersLoading(false);
      }
    };
    loadOffers();
    return () => {
      mounted = false;
    };
  }, []);

  const toFiniteNumber = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const getOriginalPriceFromCartItem = (item: any): number => {
    // prefer explicit originalPrice then other fields
    const keys = ["originalPrice", "basePrice", "listPrice", "price"];
    for (const k of keys) {
      const n = toFiniteNumber(item?.[k]);
      if (n !== null) return n;
    }
    if (item?.product && typeof item.product === "object") {
      const n = toFiniteNumber(item.product.price);
      if (n !== null) return n;
    }
    return 0;
  };

  const parseOfferPercent = (o: Offer): number | null => {
    const raw = (o as any).percentage;
    const n = toFiniteNumber(raw);
    if (n === null) return null;
    if (n <= 0) return null;
    return Math.min(100, n);
  };

  function getBestOfferForItem(productType: string, productId: string): { offer?: Offer | null; percent?: number | null } {
    if (!offers || offers.length === 0) return { offer: null, percent: null };
    const now = new Date();
    const applicable: { offer: Offer; pct: number }[] = [];

    for (const o of offers) {
      try {
        if (!o.isActive) continue;
        if (o.startsAt && new Date(o.startsAt) > now) continue;
        if (o.endsAt && new Date(o.endsAt) < now) continue;
        const pct = parseOfferPercent(o);
        if (pct === null) continue;

        if (o.scope === "ALL") {
          applicable.push({ offer: o, pct });
          continue;
        }
        if (productType === "TICKET" && o.scope === "TICKETS") {
          applicable.push({ offer: o, pct });
          continue;
        }
        if (productType === "HOTEL" && o.scope === "HOTELS") {
          applicable.push({ offer: o, pct });
          continue;
        }
        if (productType === "SPONSOR" && o.scope === "SPONSORS") {
          applicable.push({ offer: o, pct });
          continue;
        }
        if (o.scope === "CUSTOM") {
          if (productType === "TICKET" && Array.isArray(o.ticketIds) && o.ticketIds.includes(productId)) {
            applicable.push({ offer: o, pct });
            continue;
          }
          if (productType === "HOTEL" && Array.isArray(o.hotelIds) && o.hotelIds.includes(productId)) {
            applicable.push({ offer: o, pct });
            continue;
          }
          if (productType === "SPONSOR" && Array.isArray(o.sponsorTypeIds) && o.sponsorTypeIds.includes(productId)) {
            applicable.push({ offer: o, pct });
            continue;
          }
          if (productType === "BOOTH" && Array.isArray(o.boothIds) && o.boothIds.includes(productId)) {
            applicable.push({ offer: o, pct });
            continue;
          }
        }
      } catch (err) {
        console.warn("Offer check error", err, o);
      }
    }

    if (applicable.length === 0) return { offer: null, percent: null };
    // choose highest percentage
    const best = applicable.reduce((a, b) => (b.pct > a.pct ? b : a), applicable[0]);
    return { offer: best.offer, percent: best.pct };
  }

  const getDiscountedPrice = (original: number, percent?: number | null) => {
    if (!percent || percent <= 0) return original;
    return Math.max(0, Number((original * (1 - percent / 100)).toFixed(2)));
  };

  /** ---------- Compose computed lines & totals ----------
   * Algorithm:
   *  - For each cart item, determine original price (from known keys).
   *  - Find best offer (if any) and compute effective price & line total.
   *  - subtotalBeforeOffers = sum(original * qty)
   *  - offerDiscountTotal = sum((original - effective) * qty)
   *  - subtotalAfterOffers = subtotalBeforeOffers - offerDiscountTotal
   *  - apply coupon (fixed or percent) to subtotalAfterOffers -> couponValue
   *  - final total = subtotalAfterOffers - couponValue
   */

  const computed = useMemo(() => {
    // lines with computed fields
    const lines: Array<any> = [];
    let subtotalBeforeOffers = 0;
    let offerDiscountTotal = 0;

    for (const i of cart) {
      const productId = String(i.productId ?? "");
      const productType = String((i.productType ?? "TICKET")).toUpperCase();
      const qty = Number.isFinite(Number(i.quantity)) ? Number(i.quantity) : 1;
      const original = getOriginalPriceFromCartItem(i);
      subtotalBeforeOffers += original * qty;

      const best = getBestOfferForItem(productType, productId);
      const effective = getDiscountedPrice(original, best.percent ?? null);
      const lineOfferDiscount = Number(((original - effective) * qty).toFixed(2));
      offerDiscountTotal += lineOfferDiscount;

      const lineTotal = Number((effective * qty).toFixed(2));

      lines.push({
        ...i,
        original,
        appliedOfferPercent: best.percent ?? null,
        appliedOffer: best.offer ?? null,
        effective,
        lineOfferDiscount,
        lineTotal,
        qty,
      });
    }

    const subtotalAfterOffers = Number((subtotalBeforeOffers - offerDiscountTotal).toFixed(2));

    // coupon calculation is computed later (needs subtotalAfterOffers)
    return {
      lines,
      subtotalBeforeOffers: Number(subtotalBeforeOffers.toFixed(2)),
      offerDiscountTotal: Number(offerDiscountTotal.toFixed(2)),
      subtotalAfterOffers,
    };
  }, [cart, offers]);

  // coupon calculations: coupon is applied after offers
  const couponDiscountValue = useMemo(() => {
    const subtotal = computed.subtotalAfterOffers ?? 0;
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent && appliedCoupon.discountPercent > 0) {
      const val = Number((subtotal * (appliedCoupon.discountPercent / 100)).toFixed(2));
      return Math.min(val, subtotal);
    }
    const val = Number(appliedCoupon.discountAmount || 0);
    return Math.min(val, subtotal);
  }, [computed.subtotalAfterOffers, appliedCoupon]);

  const finalTotal = Math.max(0, Number((computed.subtotalAfterOffers - couponDiscountValue).toFixed(2)));

  // produce a user-facing label for offers in totals:
  const offerLabel = useMemo(() => {
    // if no offer discount -> null
    if (!computed.offerDiscountTotal || computed.offerDiscountTotal <= 0) return null;
    // collect unique offer names used
    const used = new Map<string, { id: string; name: string; pct: number }>();
    for (const l of computed.lines) {
      if (l.appliedOffer && l.appliedOffer.id) {
        used.set(l.appliedOffer.id, { id: l.appliedOffer.id, name: l.appliedOffer.name || "Offer", pct: l.appliedOfferPercent ?? 0 });
      }
    }
    if (used.size === 0) {
      // maybe global ALL offer without id? fallback to first line's offer name
      const candidate = computed.lines.find((l) => l.appliedOffer);
      return candidate?.appliedOffer?.name ?? "Offer";
    }
    if (used.size === 1) {
      return Array.from(used.values())[0].name ?? "Offer";
    }
    return "Multiple offers";
  }, [computed.lines, computed.offerDiscountTotal]);

  // Offer payload for checkout: unique offers used
  const appliedOffersPayload = useMemo(() => {
    const map = new Map<string, { id: string; name?: string; percent?: number }>();
    for (const l of computed.lines) {
      if (l.appliedOffer && l.appliedOffer.id) {
        map.set(l.appliedOffer.id, { id: l.appliedOffer.id, name: l.appliedOffer.name, percent: l.appliedOfferPercent });
      }
    }
    return Array.from(map.values());
  }, [computed.lines]);

  /** ---------- Coupon handling (same flow but now uses offers-aware subtotal) ---------- */

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const input = couponCode.trim();
    setCouponBusy(true);
    try {
      // Attempt server-side event coupon endpoint first
      try {
        const res = await fetch(`/api/events/${eventId}/apply-coupon`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, code: input, cartItems: cart }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({} as any));
          const dt = `${data?.discountType ?? data?.type ?? ""}`.toUpperCase();
          const raw = data?.discountValue ?? data?.discount ?? data?.amount ?? data?.percent ?? 0;

          let fixed = 0;
          let percent = 0;

          if (typeof raw === "object" && raw) {
            if (raw.amount != null) fixed = Number(raw.amount) || 0;
            if (raw.percent != null) percent = Number(raw.percent) || 0;
          } else {
            const s = String(raw ?? "");
            if (dt === "FIXED" || dt === "AMOUNT") fixed = Number(s) || 0;
            else if (dt === "PERCENTAGE" || dt === "PERCENT") percent = Number(s) || 0;
            else if (s.includes("%")) percent = Number(s.replace("%", "")) || 0;
            else fixed = Number(s) || 0;
          }

          percent = Math.max(0, Math.min(100, percent));
          setAppliedCoupon({
            id: data?.id ?? null,
            code: data?.code ?? input,
            discountAmount: percent > 0 ? 0 : fixed,
            discountPercent: percent > 0 ? percent : 0,
          });
          return;
        }
      } catch {
        // ignore and fallback
      }

      // Fallback: admin coupons list
      const listRes = await fetch(`/api/admin/coupons`, { method: "GET" });
      if (!listRes.ok) {
        const ee = await listRes.json().catch(() => ({}));
        alert(ee?.message || "Failed to fetch coupons");
        return;
      }
      const list = await listRes.json();
      if (!Array.isArray(list)) {
        alert("Invalid coupon list response");
        return;
      }
      const norm = input.toLowerCase();
      const match = list.find((c: any) => c?.code?.toString?.().toLowerCase() === norm);

      if (!match) {
        alert("Coupon not found");
        return;
      }

      const type = String(match.discountType || "").toUpperCase(); // 'FIXED' | 'PERCENTAGE'
      const value = Number(match.discountValue || 0);

      let fixed = 0;
      let percent = 0;

      if (type === "PERCENTAGE") {
        percent = Math.max(0, Math.min(100, value));
      } else {
        fixed = Math.max(0, value);
      }

      setAppliedCoupon({
        id: match.id ?? null,
        code: match.code ?? input,
        discountAmount: percent > 0 ? 0 : fixed,
        discountPercent: percent > 0 ? percent : 0,
      });
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon({ id: null, code: null, discountAmount: 0, discountPercent: 0 });
    setCouponCode("");
  };

  /** ---------- Submit checkout ---------- */

  const submitCheckout = async () => {
    if (!companyId) {
      alert("You must be logged in to check out.");
      return;
    }
    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }
    if (!agreeTerms || !agreePolicies) {
      alert("You must agree to the Terms & Policies.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        companyId,
        account,
        paymentMethod,
        coupon: appliedCoupon.code ? { ...(appliedCoupon.id ? { id: appliedCoupon.id } : {}), code: appliedCoupon.code } : undefined,
        discount: {
          amount: appliedCoupon.discountAmount,
          percent: appliedCoupon.discountPercent,
        },
        appliedOffers: appliedOffersPayload, // which offers were applied
        cartItems: cart.map((i) => ({
          productId: String(i.productId),
          productType: String(i.productType ?? "TICKET").toUpperCase(),
          quantity: i.quantity,
          price: i.price,
          name: i.name,
          ...(i.roomTypeId ? { roomTypeId: String(i.roomTypeId) } : {}),
          ...(i.boothSubTypeId ? { boothSubTypeId: String(i.boothSubTypeId) } : {}),
        })),
        totals: {
          subtotalBeforeOffers: computed.subtotalBeforeOffers,
          offerDiscountTotal: computed.offerDiscountTotal,
          subtotalAfterOffers: computed.subtotalAfterOffers,
          couponDiscountValue,
          total: finalTotal,
        },
      };

      const res = await fetch(`/api/events/${eventId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201 || res.ok) {
        alert("Checkout successful!");
        clearCart();
        window.location.href = `/event/${eventId}`;
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e?.error || e?.message || "Checkout failed");
      }
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  };

  // helper: step state for StepDot
  const stepState = (index: 0 | 1 | 2): "completed" | "active" | "upcoming" => {
    if (step > index) return "completed";
    if (step === index) return "active";
    return "upcoming";
  };

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/event/${eventId}`} className="text-indigo-600 hover:underline">
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="mb-3">
        <div className="flex items-center">
          <StepDot state={stepState(0)} />
          <Dashed />
          <StepDot state={stepState(1)} />
          <Dashed />
          <StepDot state={stepState(2)} />
        </div>
        <div className="mt-2">
          <HeaderLabels />
        </div>
      </div>

      {/* Single-column content */}
      <div className="bg-white p-4 rounded-lg shadow">
        {step === 0 && (
          <div className="space-y-4">
            <CartSummary
              cart={cart}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              appliedCoupon={appliedCoupon}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              couponBusy={couponBusy}
              linesWithOffers={computed.lines}
            />

            <div className="mt-4">
              <Totals
                subtotal={computed.subtotalBeforeOffers}
                offerLabel={offerLabel}
                offerValue={computed.offerDiscountTotal}
                discountCode={appliedCoupon.code}
                discountValue={couponDiscountValue}
                total={finalTotal}
              />
            </div>

            <button onClick={() => setStep(1)} disabled={cart.length === 0} className="w-full mt-4 bg-indigo-600 text-white font-semibold py-3 rounded-md disabled:bg-slate-400">
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* Account form */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">ACCOUNT DETAILS</h3>
              <input value={account.name} onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))} placeholder="Name" className="w-full rounded border px-3 py-2" />
              <input value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} placeholder="Email" type="email" className="w-full rounded border px-3 py-2" />
              <input value={account.phone} onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))} placeholder="Phone" className="w-full rounded border px-3 py-2" />
              <input value={account.address1} onChange={(e) => setAccount((a) => ({ ...a, address1: e.target.value }))} placeholder="Address 1" className="w-full rounded border px-3 py-2" />
              <input value={account.address2} onChange={(e) => setAccount((a) => ({ ...a, address2: e.target.value }))} placeholder="Address 2" className="w-full rounded border px-3 py-2" />
            </div>

            {/* Totals below account */}
            <div>
              <Totals
                subtotal={computed.subtotalBeforeOffers}
                offerLabel={offerLabel}
                offerValue={computed.offerDiscountTotal}
                discountCode={appliedCoupon.code}
                discountValue={couponDiscountValue}
                total={finalTotal}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center" title="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setStep(2)} className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md">
                Proceed Payment
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-2">PAYMENT METHOD :</div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} />
                  <span className="font-medium">Razorpay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payment" value="paypal" checked={paymentMethod === "paypal"} onChange={() => setPaymentMethod("paypal")} />
                  <span className="font-medium">PayPal</span>
                </label>
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">TERMS & CONDITIONS:</div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                <span>Agree to Terms & Conditions:</span>
                <Link href="/terms" className="text-indigo-700 underline">
                  Condition Name
                </Link>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={agreePolicies} onChange={(e) => setAgreePolicies(e.target.checked)} />
                <span>Agree to Policies:</span>
                <Link href="/privacy" className="text-indigo-700 underline">
                  Policy Name
                </Link>
              </label>
            </div>

            <Totals
              subtotal={computed.subtotalBeforeOffers}
              offerLabel={offerLabel}
              offerValue={computed.offerDiscountTotal}
              discountCode={appliedCoupon.code}
              discountValue={couponDiscountValue}
              total={finalTotal}
            />

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center" title="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={submitCheckout} disabled={isSubmitting || !agreeTerms || !agreePolicies} className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md disabled:bg-slate-400 inline-flex items-center justify-center gap-2">
                {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <LockKeyhole className="w-5 h-5" />}
                {isSubmitting ? "Processing…" : "Proceed Payment"}
              </button>
            </div>
          </div>
        )}
      </div>

      {!companyId && <p className="text-xs text-center text-red-600 mt-3">Please log in to check out.</p>}
      {offersLoading && <div className="mt-3 text-sm text-slate-500">Loading offers…</div>}
      {offersError && <div className="mt-3 text-sm text-amber-700">Offers error: {offersError}</div>}
    </div>
  );
}
