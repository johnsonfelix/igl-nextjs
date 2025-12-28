"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader, Check, ArrowLeft, LockKeyhole, Plus, Minus, Trash2 } from "lucide-react";
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
    <div className="flex justify-between text-xs text-slate-500 font-medium tracking-wide uppercase px-1">
      <span>Cart</span>
      <span>Account</span>
      <span>Details</span>
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
  updateQuantity,
  removeFromCart,
}: {
  cart: Array<any>;
  couponCode: string;
  setCouponCode: (s: string) => void;
  appliedCoupon: { code?: string | null };
  applyCoupon: () => void;
  removeCoupon: () => void;
  couponBusy: boolean;
  linesWithOffers: Array<any>;
  updateQuantity: (pid: string, qty: number, rtid?: string) => void;
  removeFromCart: (pid: string, rtid?: string) => void;
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
            <img src={item.image || "/placeholder.png"} alt={item.name} className="w-16 h-16 rounded-md object-cover border" />
            <div className="flex-1">
              <div className="font-medium text-slate-900">
                {idx + 1}. {item.name}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.roomTypeId)}
                    className="p-1 px-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.roomTypeId)}
                    className="p-1 px-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.roomTypeId)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Price Breakdown */}
              <div className="mt-1 text-sm text-slate-500">
                {item.appliedOfferPercent ? (
                  <>
                    <span className="line-through mr-2 text-gray-400">${Number(item.original).toFixed(2)}</span>
                    <span className="font-semibold text-indigo-600">${Number(item.effective).toFixed(2)}</span>
                    <span className="ml-2 text-xs bg-rose-100 text-rose-600 font-medium px-1.5 py-0.5 rounded">-{Math.round(item.appliedOfferPercent)}%</span>
                  </>
                ) : (
                  <span className="font-semibold text-gray-600">${Number(item.original).toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-slate-800">${Number(item.lineTotal).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon - Concise & Good looking */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Discount Code</label>
        <div className="flex items-center gap-2 max-w-sm">
          <div className="flex-1 relative">
            <input
              value={appliedCoupon.code ? appliedCoupon.code : couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={!!appliedCoupon.code}
              placeholder="Enter code"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:opacity-60"
            />
            {appliedCoupon.code && <Check className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-green-500" />}
          </div>

          {!appliedCoupon.code ? (
            <button
              onClick={applyCoupon}
              disabled={couponBusy || !couponCode.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition-all shadow-sm active:scale-95"
            >
              {couponBusy ? "..." : "Apply"}
            </button>
          ) : (
            <button
              onClick={removeCoupon}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm font-bold hover:bg-red-100 transition-all"
            >
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

  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();

  // steps: 0 = cart, 1 = account, 2 = details, 3 = payment
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // New state for additional info
  const [companyName, setCompanyName] = useState("");
  const [tshirtSize, setTshirtSize] = useState("");
  const [referralSource, setReferralSource] = useState("");

  const tshirtOptions = ["S", "M", "L", "XL", "XL1", "XL2"];
  const referralOptions = ["Reference", "Word of Mouth", "Website", "Others"];

  // account
  const [account, setAccount] = useState<Account>({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
  });

  // Addresses
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Effect to copy billing to shipping when checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress);
    }
  }, [billingAddress, sameAsBilling]);

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
  const [paymentMethod, setPaymentMethod] = useState<"offline">("offline");
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

          // Prefill Billing Address
          setBillingAddress({
            line1: (location.address || "").toString(),
            line2: "",
            city: (location.city || "").toString(),
            state: (location.state || "").toString(),
            zip: (location.zipCode || "").toString(),
            country: (location.country || "").toString(),
          });
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

  // Update the submitCheckout function in your checkout page

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
        additionalDetails: {
          companyName,
          tshirtSize,
          referralSource,
        },
        paymentMethod,
        // Pass addresses
        billingAddress,
        shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
        coupon: appliedCoupon.code ? {
          ...(appliedCoupon.id ? { id: appliedCoupon.id } : {}),
          code: appliedCoupon.code
        } : undefined,
        discount: {
          amount: appliedCoupon.discountAmount,
          percent: appliedCoupon.discountPercent,
        },
        appliedOffers: appliedOffersPayload, // which offers were applied

        // ✅ FIX: Send computed lines with effective (discounted) prices
        cartItems: computed.lines.map((line) => ({
          productId: String(line.productId),
          productType: String(line.productType ?? "TICKET").toUpperCase(),
          quantity: line.qty,
          price: line.effective, // ✅ Use effective price (after offers)
          name: line.name,
          ...(line.roomTypeId ? { roomTypeId: String(line.roomTypeId) } : {}),
          ...(line.boothSubTypeId ? { boothSubTypeId: String(line.boothSubTypeId) } : {}),
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
        setOrderConfirmed(true);
        clearCart();
        // Don't redirect, show success state with bank details
        // window.location.href = `/event/${eventId}`;
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
  const stepState = (index: 0 | 1 | 2 | 3): "completed" | "active" | "upcoming" => {
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
          <Dashed />
          <StepDot state={stepState(3)} />
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
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
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

            {/* Address Details */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-slate-800">BILLING ADDRESS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={billingAddress.line1} onChange={(e) => setBillingAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Address Line 1" className="w-full rounded border px-3 py-2" />
                <input value={billingAddress.line2} onChange={(e) => setBillingAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Address Line 2 (Optional)" className="w-full rounded border px-3 py-2" />
                <input value={billingAddress.city} onChange={(e) => setBillingAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" className="w-full rounded border px-3 py-2" />
                <input value={billingAddress.state} onChange={(e) => setBillingAddress(p => ({ ...p, state: e.target.value }))} placeholder="State" className="w-full rounded border px-3 py-2" />
                <input value={billingAddress.zip} onChange={(e) => setBillingAddress(p => ({ ...p, zip: e.target.value }))} placeholder="ZIP / Postal Code" className="w-full rounded border px-3 py-2" />
                <input value={billingAddress.country} onChange={(e) => setBillingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country" className="w-full rounded border px-3 py-2" />
              </div>

              <div className="flex items-center gap-2 mt-4 mb-2">
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="sameAsBilling" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Shipping address is same as billing address
                </label>
              </div>

              {!sameAsBilling && (
                <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg animate-fadeIn">
                  <h3 className="font-semibold text-slate-800">SHIPPING ADDRESS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={shippingAddress.line1} onChange={(e) => setShippingAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Address Line 1" className="w-full rounded border px-3 py-2" />
                    <input value={shippingAddress.line2} onChange={(e) => setShippingAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Address Line 2 (Optional)" className="w-full rounded border px-3 py-2" />
                    <input value={shippingAddress.city} onChange={(e) => setShippingAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" className="w-full rounded border px-3 py-2" />
                    <input value={shippingAddress.state} onChange={(e) => setShippingAddress(p => ({ ...p, state: e.target.value }))} placeholder="State" className="w-full rounded border px-3 py-2" />
                    <input value={shippingAddress.zip} onChange={(e) => setShippingAddress(p => ({ ...p, zip: e.target.value }))} placeholder="ZIP / Postal Code" className="w-full rounded border px-3 py-2" />
                    <input value={shippingAddress.country} onChange={(e) => setShippingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country" className="w-full rounded border px-3 py-2" />
                  </div>
                </div>
              )}
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
              <button onClick={() => setStep(0)} className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center hover:bg-slate-50 transition-colors" title="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!account.name || !account.email || !billingAddress.line1) {
                    alert("Please fill in required fields");
                    return;
                  }
                  setStep(2);
                }}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Continue to Details
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-800 border-b pb-4">Additional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  className="w-full rounded-lg border-gray-300 border px-4 py-3 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>

              {/* T-Shirt Size */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">T-Shirt Size</label>
                <select
                  value={tshirtSize}
                  onChange={(e) => setTshirtSize(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-3 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                >
                  <option value="">Select Size</option>
                  {tshirtOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referral Source */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-semibold text-slate-700 block">How did you know about our website?</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {referralOptions.map((opt) => (
                  <label key={opt} className={`cursor-pointer border rounded-lg p-3 text-sm font-medium text-center transition-all ${referralSource === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300 text-slate-600'}`}>
                    <input
                      type="radio"
                      name="referral"
                      value={opt}
                      checked={referralSource === opt}
                      onChange={(e) => setReferralSource(e.target.value)}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t mt-4">
              <button onClick={() => setStep(1)} className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center hover:bg-slate-50 transition-colors" title="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!tshirtSize || !referralSource) {
                    alert("Please select your T-Shirt size and tell us how you heard about us.");
                    return;
                  }
                  setStep(3);
                }}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">

            {/* Show Payment Methods & Confirm IF not confirmed yet */}
            {!orderConfirmed && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-xl font-bold text-slate-800 border-b pb-4">Payment Method</h3>

                {/* Method Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Offline */}
                  <label className={`relative cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${paymentMethod === 'offline' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="pm"
                      value="offline"
                      checked={paymentMethod === 'offline'}
                      onChange={() => setPaymentMethod('offline')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Offline Payment</span>
                      <div className="w-5 h-5 rounded-full border border-indigo-600 flex items-center justify-center">
                        {paymentMethod === 'offline' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">Bank Transfer or Cheque payment. Details shown after confirmation.</p>
                  </label>

                  {/* Online (Disabled) */}
                  <label className="relative cursor-not-allowed border rounded-xl p-4 flex flex-col gap-2 border-gray-100 bg-gray-50 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400">Online Payment</span>
                      <span className="text-[10px] bg-gray-200 text-gray-500 font-bold px-2 py-1 rounded">UNAVAILABLE</span>
                    </div>
                    <p className="text-sm text-slate-400">Credit Card, Debit Card, Net Banking</p>
                  </label>
                </div>

                {/* Terms and Totals */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                      I agree to the <Link href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms & Conditions</Link>
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={agreePolicies}
                      onChange={(e) => setAgreePolicies(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="privacy" className="text-sm text-slate-600 cursor-pointer">
                      I agree to the <Link href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                </div>

                <Totals
                  subtotal={computed.subtotalBeforeOffers}
                  offerLabel={offerLabel}
                  offerValue={computed.offerDiscountTotal}
                  discountCode={appliedCoupon.code}
                  discountValue={couponDiscountValue}
                  total={finalTotal}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center hover:bg-indigo-50 transition-colors"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={submitCheckout}
                    disabled={isSubmitting || !agreeTerms || !agreePolicies}
                    className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" /> Processing...
                      </>
                    ) : (
                      "Confirm Order"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success State - Show Bank Details ONLY Here */}
            {orderConfirmed && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <Check className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Order Confirmed!</h2>
                  <p className="text-green-700">Thank you for your registration. Please complete your payment using the details below.</p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <LockKeyhole className="w-5 h-5" />
                    Bank Transfer Details
                  </h3>

                  <div className="space-y-4 text-sm text-indigo-900">
                    <div className="bg-white p-4 rounded border border-indigo-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Bank Name:</span>
                        <span className="col-span-2 font-bold select-all">HDFC Bank Limited</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Branch:</span>
                        <span className="col-span-2 font-bold select-all">G N Chetty rd Branch, TNagar</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Account Name:</span>
                        <span className="col-span-2 font-bold select-all">INNOVATIVE GLOBAL LOGISTICS ALLIANZ</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Account No:</span>
                        <span className="col-span-2 font-bold select-all">50200035538980</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">SWIFT Code:</span>
                        <span className="col-span-2 font-bold select-all">HDFCINBBCHE</span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
                      <p className="font-semibold mb-1">⚠️ Important:</p>
                      <p>
                        After creating the payment, please email the transaction details / proof of payment to{" "}
                        <a href="mailto:sales@igla.asia" className="font-bold underline hover:text-yellow-900">
                          sales@igla.asia
                        </a>
                        . Your order will be confirmed once we verify the payment.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Link href={`/event/${eventId}`} className="text-indigo-600 font-semibold hover:underline">
                    Return to Event Page
                  </Link>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {!companyId && <p className="text-xs text-center text-red-600 mt-3">Please log in to check out.</p>}
      {offersLoading && <div className="mt-3 text-sm text-slate-500">Loading offers…</div>}
      {offersError && <div className="mt-3 text-sm text-amber-700">Offers error: {offersError}</div>}
    </div>
  );
}
