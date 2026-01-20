"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader, Check, ArrowLeft, LockKeyhole, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/app/event/[id]/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { InvoiceTemplate } from "@/app/components/InvoiceTemplate";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";

/** ---------- Types ---------- */

type Params = { id: string };

type Account = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  companyName: string;
  designation: string;
  memberId: string;
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
          <span>Earlybird offer</span>
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
  updateQuantity: (pid: string, qty: number, rtid?: string, isComplimentary?: boolean, linkedSponsorId?: string) => void;
  removeFromCart: (pid: string, rtid?: string, isComplimentary?: boolean, linkedSponsorId?: string) => void;
}) {
  // Group items
  const registrationItems = linesWithOffers.filter(
    (item) => String(item.productType || "").toUpperCase() !== "SPONSOR" && !item.isComplimentary && !item.linkedSponsorId
  );

  const sponsorshipItems = linesWithOffers.filter(
    (item) => String(item.productType || "").toUpperCase() === "SPONSOR" || item.isComplimentary || item.linkedSponsorId
  );

  const renderItem = (item: any, idx: number, groupIndex: number) => (
    <div
      key={`${item.productId}-${item.roomTypeId || ""}-${item.isComplimentary ? "comp" : ""}-${item.linkedSponsorId || ""}`}
      className="flex items-center gap-3 border-b pb-3"
    >
      <img src={item.image || "/placeholder.png"} alt={item.name} className="w-16 h-16 rounded-md object-cover border" />
      <div className="flex-1">
        <div className="font-medium text-slate-900">
          {groupIndex}. {item.name.replace(/^Hotel - /, "")}
        </div>

        {/* Quantity Controls */}
        {String(item.productType || "").toUpperCase() === "HOTEL" ? (
          <div className="mt-2 text-sm text-gray-500 font-medium">
            Qty: {item.quantity} (Linked to Ticket)
          </div>
        ) : item.isComplimentary ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">
              🎁 COMPLIMENTARY
            </span>
            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
          </div>
        ) : String(item.productType || "").toUpperCase() === "SPONSOR" ? (
          <div className="flex items-center gap-3 mt-2">
            <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
              Qty: {item.quantity}
            </div>
            <button
              onClick={() => removeFromCart(item.productId, item.roomTypeId, item.isComplimentary, item.linkedSponsorId)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.roomTypeId, item.isComplimentary, item.linkedSponsorId)}
                className="p-1 px-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                disabled={item.quantity <= 1 && false} // Let updateQuantity handle removal if qty=0 or handle externally
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-gray-700">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.roomTypeId, item.isComplimentary, item.linkedSponsorId)}
                className="p-1 px-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-r-lg transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <button
              onClick={() => removeFromCart(item.productId, item.roomTypeId, item.isComplimentary, item.linkedSponsorId)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="mt-1 text-sm text-slate-500">
          {(item.appliedOfferPercent || (item.original > item.effective && !item.isComplimentary)) ? (
            <>
              <span className="line-through mr-2 text-gray-400">${Number(item.original).toFixed(2)}</span>
              <span className="font-semibold text-indigo-600">${Number(item.effective).toFixed(2)}</span>
              {item.appliedOfferPercent ? <span className="ml-2 text-xs bg-rose-100 text-rose-600 font-medium px-1.5 py-0.5 rounded">-{Math.round(item.appliedOfferPercent)}%</span> : null}
            </>
          ) : (
            <span className="font-semibold text-gray-600">${Number(item.effective ?? item.original).toFixed(2)}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-bold text-slate-800">${Number(item.lineTotal).toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="font-semibold text-slate-800 hidden">PRODUCT SUMMARY</h3>

      <div className="space-y-6 mt-2">
        {cart.length === 0 && <p className="text-slate-500 text-sm">No items in cart.</p>}

        {registrationItems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-2">Product Summary</h4>
            <div className="space-y-3">
              {registrationItems.map((item, idx) => renderItem(item, idx, idx + 1))}
            </div>
          </div>
        )}

        {sponsorshipItems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-2">Sponsorships & Benefits</h4>
            <div className="space-y-3">
              {sponsorshipItems.map((item, idx) => renderItem(item, idx, idx + 1))}
            </div>
          </div>
        )}
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

  const handleUpdateQuantity = (productId: string, newQty: number, roomTypeId?: string, isComplimentary?: boolean, linkedSponsorId?: string) => {
    // Validate: Accompanying <= Ticket
    let ticketCount = 0;
    let accompanyingCount = 0;

    cart.forEach(item => {
      // is this the item being changed?
      let qty = Number(item.quantity) || 0;
      const isTarget =
        item.productId === productId &&
        item.roomTypeId === roomTypeId &&
        item.isComplimentary === isComplimentary &&
        item.linkedSponsorId === linkedSponsorId;

      if (isTarget) {
        qty = newQty;
      }

      const nameLower = (item.name || "").toLowerCase();
      // Logic matching page.tsx:
      if (nameLower.includes("meeting package")) return;

      if (nameLower.includes("accompanying")) {
        accompanyingCount += qty;
      } else if (nameLower.includes("ticket") || nameLower.includes("regular")) {
        ticketCount += qty;
      }
    });

    if (accompanyingCount > ticketCount) {
      toast.error("Accompanying members cannot exceed the number of tickets.");
      return; // Block update
    }

    updateQuantity(productId, newQty, roomTypeId, isComplimentary, linkedSponsorId);
  };

  // Calculate total attendees from cart (all TICKET items)
  const totalAttendeeCount = useMemo(() => {
    return cart.reduce((count, item) => {
      const nameLower = (item.name || "").toLowerCase();
      const productType = String(item.productType || "").toUpperCase();

      // Exclude meeting packages and hotels
      if (nameLower.includes("meeting package")) return count;
      if (productType === "HOTEL") return count;

      // Count all tickets (regular, accompanying, complimentary)
      if (productType === "TICKET" || nameLower.includes("ticket") || nameLower.includes("accompanying")) {
        return count + (Number(item.quantity) || 0);
      }

      return count;
    }, 0);
  }, [cart]);

  // Generate attendee labels (Attendee vs Accompanying Member)
  const attendeeLabels = useMemo(() => {
    const labels: string[] = [];
    let attendeeIndex = 1;
    let accompanyingIndex = 1;

    cart.forEach(item => {
      const nameLower = (item.name || "").toLowerCase();
      const productType = String(item.productType || "").toUpperCase();
      const quantity = Number(item.quantity) || 0;

      // Skip meeting packages and hotels
      if (nameLower.includes("meeting package") || productType === "HOTEL") return;

      // Determine if this is an accompanying member ticket
      const isAccompanying = nameLower.includes("accompanying");

      for (let i = 0; i < quantity; i++) {
        if (isAccompanying) {
          labels.push(`Accompanying Member ${accompanyingIndex++}`);
        } else {
          labels.push(`Attendee ${attendeeIndex++}`);
        }
      }
    });

    return labels;
  }, [cart]);

  // Initialize attendees array when count changes
  useEffect(() => {
    setAttendees(prev => {
      const newAttendees: AttendeeDetails[] = [];
      for (let i = 0; i < totalAttendeeCount; i++) {
        // Preserve existing data or create new with type and label
        newAttendees[i] = prev[i] || {
          name: "",
          designation: "",
          mobile: "",
          email: "",
          tshirtSize: "",
          type: attendeeLabels[i]?.includes("Accompanying") ? "accompanying" : "regular",
          label: attendeeLabels[i] || `Attendee ${i + 1}`
        };
      }
      return newAttendees;
    });
  }, [totalAttendeeCount, attendeeLabels]);




  const [isSubmitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // New state for additional info
  const [companyName, setCompanyName] = useState("");
  const [referralSource, setReferralSource] = useState("");

  const tshirtOptions = ["S", "M", "L", "XL", "XL1", "XL2"];
  const referralOptions = ["Social Media", "Word of Mouth", "Website", "Others"];

  // account
  const [account, setAccount] = useState<Account>({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    companyName: "",
    designation: "",
    memberId: "",
  });

  // State for all attendees (one per ticket)
  type AttendeeDetails = {
    name: string;
    designation: string;
    mobile: string;
    email: string;
    tshirtSize: string;
    type?: string; // "regular" or "accompanying"
    label?: string; // Display label like "Attendee 1" or "Accompanying Member 1"
  };
  const [attendees, setAttendees] = useState<AttendeeDetails[]>([]);

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
        const directors = data?.directors?.toString?.() || "";
        const companyName = data?.name?.toString?.() || "";

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
            name: directors || name || prev.name,
            email: email || prev.email,
            phone: phone || prev.phone,
            address1: address1 || prev.address1,
            companyName: companyName || name || prev.companyName,
            memberId: data?.memberId || prev.memberId,
            designation: data?.designation || prev.designation,
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

      const displayOriginal = getOriginalPriceFromCartItem(i);
      const calculationBase = Number(i.price) || 0; // Use the stored price (sellingPrice) as base for offers

      subtotalBeforeOffers += displayOriginal * qty;

      const best = getBestOfferForItem(productType, productId);
      const effective = getDiscountedPrice(calculationBase, best.percent ?? null);

      // Savings = difference between what it "was" and what it "is"
      const totalSavingsPerUnit = displayOriginal - effective;
      const lineOfferDiscount = Number((totalSavingsPerUnit * qty).toFixed(2));
      offerDiscountTotal += lineOfferDiscount;

      const lineTotal = Number((effective * qty).toFixed(2));

      lines.push({
        ...i,
        original: displayOriginal,
        appliedOfferPercent: best.percent ?? null,
        appliedOffer: best.offer ?? null,
        effective,
        lineOfferDiscount,
        lineTotal,
        qty,
      });
    }

    // Wait, subtotalAfterOffers logic needs to be careful.
    // subtotalBeforeOffers is sum(original * qty) = e.g. 1000
    // offerDiscountTotal is sum((original - effective) * qty) = e.g. 200
    // subtotalAfterOffers = 1000 - 200 = 800. Correct.
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
    if (!appliedCoupon.code) return 0; // Fix: check code existence
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
    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }

    // Final Validation: Accompanying <= Ticket
    let ticketCount = 0;
    let accompanyingCount = 0;
    cart.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const nameLower = (item.name || "").toLowerCase();
      if (nameLower.includes("meeting package")) return;
      if (nameLower.includes("accompanying")) {
        accompanyingCount += qty;
      } else if (nameLower.includes("ticket") || nameLower.includes("regular")) {
        ticketCount += qty;
      }
    });
    if (accompanyingCount > ticketCount) {
      toast.error("Accompanying members cannot exceed the number of tickets.");
      alert("Validation Error: Accompanying members cannot exceed the number of tickets.");
      return;
    }

    if (!agreeTerms || !agreePolicies) {
      alert("You must agree to the Terms & Policies.");
      return;
    }

    // Validate Account
    if (!account.companyName || !billingAddress.line1) {
      alert("Please fill in Company Name and Billing Address.");
      return;
    }

    if (!companyId && !account.companyName) {
      alert("Company Name is required for new accounts.");
      return;
    }

    // Validate Referral Source
    if (!referralSource) {
      alert("Please tell us how you heard about us.");
      return;
    }

    // Validate All Attendee Details
    if (totalAttendeeCount > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (let i = 0; i < totalAttendeeCount; i++) {
        const attendee = attendees[i];
        if (!attendee || !attendee.name || !attendee.designation || !attendee.mobile || !attendee.email || !attendee.tshirtSize) {
          alert(`Please fill in all details for Attendee ${i + 1}.`);
          return;
        }
        // Validate email format
        if (!emailRegex.test(attendee.email)) {
          alert(`Please enter a valid email address for Attendee ${i + 1}.`);
          return;
        }
        // Validate mobile (at least 10 digits)
        const digitsOnly = attendee.mobile.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
          alert(`Please enter a valid mobile number for Attendee ${i + 1} (at least 10 digits).`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Populate account with first attendee's details for backend compatibility
      const accountWithDetails = {
        ...account,
        name: attendees[0]?.name || account.name || "",
        email: attendees[0]?.email || account.email || "",
        phone: attendees[0]?.mobile || account.phone || "",
        designation: attendees[0]?.designation || account.designation || "",
      };

      const payload: any = {
        companyId,
        account: accountWithDetails,
        additionalDetails: {
          referralSource,
          attendees: totalAttendeeCount > 0 ? attendees : undefined,
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
        const data = await res.json();
        setOrderData(data);
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



  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/event/${eventId}`} className="text-indigo-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Event
        </Link>
        {/* <h1 className="text-3xl font-bold text-slate-800">Checkout</h1> */}
      </div>

      {!orderConfirmed ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. Cart Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center text-sm">1</span>
                Your Cart
              </h2>
              <CartSummary
                cart={cart}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                appliedCoupon={appliedCoupon}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
                couponBusy={couponBusy}
                linesWithOffers={computed.lines}
                updateQuantity={handleUpdateQuantity}
                removeFromCart={removeFromCart}
              />
            </div>

            {/* 2. Account Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center text-sm">2</span>
                Account Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Company Name *</label>
                  <input value={account.companyName} onChange={(e) => setAccount((a) => ({ ...a, companyName: e.target.value }))} placeholder="Enter company name" className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
              </div>

              {/* Billing Address */}
              <h3 className="font-semibold text-slate-800 mt-6 mb-3">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Address Line 1 *</label>
                  <input value={billingAddress.line1} onChange={(e) => setBillingAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Enter address line 1" className="w-full rounded-lg border px-4 py-3" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Address Line 2</label>
                  <input value={billingAddress.line2} onChange={(e) => setBillingAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Enter address line 2" className="w-full rounded-lg border px-4 py-3" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">City</label>
                  <input value={billingAddress.city} onChange={(e) => setBillingAddress(p => ({ ...p, city: e.target.value }))} placeholder="Enter city" className="w-full rounded-lg border px-4 py-3" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">State</label>
                  <input value={billingAddress.state} onChange={(e) => setBillingAddress(p => ({ ...p, state: e.target.value }))} placeholder="Enter state" className="w-full rounded-lg border px-4 py-3" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ZIP Code</label>
                  <input value={billingAddress.zip} onChange={(e) => setBillingAddress(p => ({ ...p, zip: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="Enter ZIP code" className="w-full rounded-lg border px-4 py-3" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Country</label>
                  <input value={billingAddress.country} onChange={(e) => setBillingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Enter country" className="w-full rounded-lg border px-4 py-3" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
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
                <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-fadeIn">
                  <h3 className="font-semibold text-slate-800 mb-3">Shipping Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Address Line 1</label>
                      <input value={shippingAddress.line1} onChange={(e) => setShippingAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Enter address line 1" className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Address Line 2</label>
                      <input value={shippingAddress.line2} onChange={(e) => setShippingAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Enter address line 2" className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">City</label>
                      <input value={shippingAddress.city} onChange={(e) => setShippingAddress(p => ({ ...p, city: e.target.value }))} placeholder="Enter city" className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">State</label>
                      <input value={shippingAddress.state} onChange={(e) => setShippingAddress(p => ({ ...p, state: e.target.value }))} placeholder="Enter state" className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">ZIP Code</label>
                      <input value={shippingAddress.zip} onChange={(e) => setShippingAddress(p => ({ ...p, zip: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="Enter ZIP code" className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Country</label>
                      <input value={shippingAddress.country} onChange={(e) => setShippingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Enter country" className="w-full rounded-lg border px-4 py-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Attendee Details (for all ticket holders) */}
            {totalAttendeeCount > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center text-sm">3</span>
                  Attendee Details
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Please provide details for each attendee ({totalAttendeeCount} attendee{totalAttendeeCount > 1 ? 's' : ''})
                </p>

                <div className="space-y-6">
                  {Array.from({ length: totalAttendeeCount }).map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-4">
                        {attendeeLabels[index] || `Attendee ${index + 1}`}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Name *
                          </label>
                          <input
                            value={attendees[index]?.name || ""}
                            onChange={(e) =>
                              setAttendees((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              })
                            }
                            placeholder="Enter full name"
                            className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-indigo-200 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Designation *
                          </label>
                          <input
                            value={attendees[index]?.designation || ""}
                            onChange={(e) =>
                              setAttendees((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], designation: e.target.value };
                                return updated;
                              })
                            }
                            placeholder="Enter designation"
                            className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-indigo-200 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Mobile *
                          </label>
                          <input
                            value={attendees[index]?.mobile || ""}
                            onChange={(e) =>
                              setAttendees((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  mobile: e.target.value.replace(/[^0-9+\-() ]/g, ""),
                                };
                                return updated;
                              })
                            }
                            placeholder="Enter mobile number"
                            className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-indigo-200 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={attendees[index]?.email || ""}
                            onChange={(e) =>
                              setAttendees((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], email: e.target.value };
                                return updated;
                              })
                            }
                            placeholder="Enter email address"
                            className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-indigo-200 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            T-Shirt Size *
                          </label>
                          <select
                            value={attendees[index]?.tshirtSize || ""}
                            onChange={(e) =>
                              setAttendees((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], tshirtSize: e.target.value };
                                return updated;
                              })
                            }
                            className="w-full rounded-lg border-gray-300 border px-4 py-3 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                          >
                            <option value="">Select Size</option>
                            {tshirtOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Additional Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center text-sm">{totalAttendeeCount > 0 ? '4' : '3'}</span>
                Additional Information
              </h2>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 block">How did you know about our website? *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {referralOptions.map((opt) => (
                    <label key={opt} className={`cursor-pointer border rounded-lg p-3 text-sm font-medium text-center transition-all ${referralSource === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300 text-slate-600'}`}>
                      <input type="radio" name="referral" value={opt} checked={referralSource === opt} onChange={(e) => setReferralSource(e.target.value)} className="sr-only" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Payment Method */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center text-sm">4</span>
                Payment Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${paymentMethod === 'offline' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="pm" value="offline" checked={paymentMethod === 'offline'} onChange={() => setPaymentMethod('offline')} className="sr-only" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Offline Payment</span>
                    <div className="w-5 h-5 rounded-full border border-indigo-600 flex items-center justify-center">
                      {paymentMethod === 'offline' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">Bank Transfer or Cheque payment. Details shown after confirmation.</p>
                </label>
                <label className="relative cursor-not-allowed border rounded-xl p-4 flex flex-col gap-2 border-gray-100 bg-gray-50 opacity-60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Online Payment</span>
                    <span className="text-[10px] bg-gray-200 text-gray-500 font-bold px-2 py-1 rounded">UNAVAILABLE</span>
                  </div>
                  <p className="text-sm text-slate-400">Credit Card, Debit Card, Net Banking</p>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Order Summary</h2>

              {/* Totals */}
              <Totals
                subtotal={computed.subtotalBeforeOffers}
                offerLabel={offerLabel}
                offerValue={computed.offerDiscountTotal}
                discountCode={appliedCoupon.code}
                discountValue={couponDiscountValue}
                total={finalTotal}
              />

              {/* Coupon Section */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Discount Code / Membership Code</label>
                <div className="flex items-center gap-2">
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

              {/* Terms Checkboxes */}
              <div className="space-y-3 mt-6 pt-6 border-t border-gray-100">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm text-slate-600">I agree to the <Link href="/by-laws" target="_blank" className="text-indigo-600 hover:underline">By-Laws</Link></span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreePolicies} onChange={(e) => setAgreePolicies(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm text-slate-600">I agree to the <Link href="/payment-protection" target="_blank" className="text-indigo-600 hover:underline">Payment Protection Plan</Link></span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitCheckout}
                disabled={isSubmitting || cart.length === 0}
                className="w-full mt-6 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader className="w-5 h-5 animate-spin" /> Processing...</> : "Confirm Order"}
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                Secure checkout. Your information is protected.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="animate-fadeIn max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 bg-green-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center gap-4 text-green-800">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl">Order Confirmed!</h2>
                <p className="text-green-700">Thank you for your purchase. Please save your invoice.</p>
              </div>
            </div>
            <div className="flex gap-3">
              {/* <Link href={`/event/${eventId}`} className="px-5 py-2.5 text-indigo-600 font-semibold hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-indigo-100">
                Return to Event
              </Link> */}
              <button
                onClick={async () => {
                  const element = document.getElementById('invoice-component');
                  if (!element) return;
                  const html2pdf = (await import('html2pdf.js')).default;
                  const opt = {
                    margin: 0,
                    filename: `Invoice_${orderData.invoiceNumber ? `IGLA${10000 + orderData.invoiceNumber}` : orderData.id}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                  } as any;
                  html2pdf().set(opt).from(element).save();
                }}
                className="flex items-center gap-2 bg-[#004aad] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#00317a] shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-2xl print:shadow-none overflow-hidden">
            {orderData && (
              <InvoiceTemplate
                orderId={orderData.invoiceNumber ? `IGLA${10000 + orderData.invoiceNumber}` : orderData.id}
                date={orderData.createdAt || new Date()}
                customerDetails={{
                  name: account.name,
                  email: account.email,
                  companyName: account.companyName,
                  designation: account.designation,
                  address: [account.address1, account.address2, billingAddress.city, billingAddress.country].filter(Boolean).join(", "),
                  memberId: account.memberId || 'N/A'
                }}
                items={orderData.items.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  total: Number((item.price * item.quantity).toFixed(2))
                }))}
                totalAmount={orderData.totalAmount}
              />
            )}
          </div>
        </div>
      )}

      {offersLoading && <div className="mt-3 text-sm text-slate-500">Loading offers…</div>}
      {offersError && <div className="mt-3 text-sm text-amber-700">Offers error: {offersError}</div>}
    </div>
  );
}
