'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { Loader, Check, ArrowLeft, LockKeyhole } from 'lucide-react';
import { useCart } from '@/app/event/[id]/CartContext';
import { useAuth } from '@/app/context/AuthContext';

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
  discountAmount: number;   // fixed amount
  discountPercent: number;  // %
};

/** ---------- UI subcomponents (module scope to keep focus stable) ---------- */

function StepDot({ state }: { state: 'completed' | 'active' | 'upcoming' }) {
  if (state === 'completed') {
    return (
      <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 grid place-items-center text-white shadow-sm">
        <Check className="w-3.5 h-3.5" />
      </div>
    );
  }
  if (state === 'active') {
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
  discountCode,
  discountValue,
  total,
}: {
  subtotal: number;
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
      {discountCode && discountValue > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount ({discountCode})</span>
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

function CartSummary({
  cart,
  couponCode,
  setCouponCode,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  couponBusy,
  subtotal,
  discountValue,
  total,
}: {
  cart: Array<any>;
  couponCode: string;
  setCouponCode: (s: string) => void;
  appliedCoupon: { code?: string | null };
  applyCoupon: () => void;
  removeCoupon: () => void;
  couponBusy: boolean;
  subtotal: number;
  discountValue: number;
  total: number;
}) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800">PRODUCT SUMMARY</h3>

      <div className="mt-3 space-y-3">
        {cart.length === 0 && (
          <p className="text-slate-500 text-sm">No items in cart.</p>
        )}
        {cart.map((item, idx) => (
          <div
            key={`${item.productId}-${item.roomTypeId || item.boothSubTypeId || ''}`}
            className="flex items-center gap-3 border-b pb-3"
          >
            <img
              src={item.image || '/placeholder.png'}
              alt={item.name}
              className="w-12 h-12 rounded-md object-cover border"
            />
            <div className="flex-1">
              <div className="font-medium">
                {idx + 1}. {item.name}
              </div>
              <div className="text-sm text-slate-500">
                Qty: {item.quantity} • ${item.price.toFixed(2)}
              </div>
            </div>
            <div className="font-semibold">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
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
            <button
              onClick={applyCoupon}
              disabled={couponBusy || !couponCode.trim()}
              className="px-4 py-2 rounded bg-indigo-600 text-white disabled:bg-slate-400"
            >
              {couponBusy ? 'Applying…' : 'Apply'}
            </button>
          ) : (
            <button onClick={removeCoupon} className="px-4 py-2 rounded border">
              Remove
            </button>
          )}
        </div>

        <Totals
          subtotal={subtotal}
          discountCode={appliedCoupon.code}
          discountValue={discountValue}
          total={total}
        />
      </div>
    </div>
  );
}

function AccountForm({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: React.Dispatch<React.SetStateAction<Account>>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800">ACCOUNT DETAILS</h3>
      <input
        value={account.name}
        onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))}
        placeholder="Name"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={account.email}
        onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
        placeholder="Email"
        type="email"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={account.phone}
        onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))}
        placeholder="Phone"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={account.address1}
        onChange={(e) => setAccount((a) => ({ ...a, address1: e.target.value }))}
        placeholder="Address 1"
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={account.address2}
        onChange={(e) => setAccount((a) => ({ ...a, address2: e.target.value }))}
        placeholder="Address 2"
        className="w-full rounded border px-3 py-2"
      />
    </div>
  );
}

function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  agreeTerms,
  setAgreeTerms,
  agreePolicies,
  setAgreePolicies,
}: {
  paymentMethod: 'razorpay' | 'paypal';
  setPaymentMethod: (p: 'razorpay' | 'paypal') => void;
  agreeTerms: boolean;
  setAgreeTerms: (v: boolean) => void;
  agreePolicies: boolean;
  setAgreePolicies: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold mb-2">PAYMENT METHOD :</div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="payment"
              value="razorpay"
              checked={paymentMethod === 'razorpay'}
              onChange={() => setPaymentMethod('razorpay')}
            />
            <span className="font-medium">Razorpay</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="payment"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={() => setPaymentMethod('paypal')}
            />
            <span className="font-medium">PayPal</span>
          </label>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-2">TERMS & CONDITIONS:</div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <span>Agree to Terms & Conditions:</span>
          <Link href="/terms" className="text-indigo-700 underline">
            Condition Name
          </Link>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={agreePolicies}
            onChange={(e) => setAgreePolicies(e.target.checked)}
          />
          <span>Agree to Policies:</span>
          <Link href="/privacy" className="text-indigo-700 underline">
            Policy Name
          </Link>
        </label>
      </div>
    </div>
  );
}

/** ---------- Page ---------- */

export default function CheckoutPage({ params }: { params: Promise<Params> }) {
  const { id: eventId } = use(params);
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';

  const { cart, clearCart } = useCart();

  // steps: 0 = cart, 1 = account, 2 = payment
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setSubmitting] = useState(false);

  // account
  const [account, setAccount] = useState<Account>({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
  });

  // coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplied>({
    id: null,
    code: null,
    discountAmount: 0,
    discountPercent: 0,
  });

  // payment
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePolicies, setAgreePolicies] = useState(false);

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
        const name = userObj?.name?.toString?.() || data?.name?.toString?.() || '';
        const email = userObj?.email?.toString?.() || '';
        const phone = userObj?.phone?.toString?.() || '';

        const parts: string[] = [];
        const a = (location.address || '').toString().trim();
        const c = (location.city || '').toString().trim();
        const s = (location.state || '').toString().trim();
        const co = (location.country || '').toString().trim();
        if (a) parts.push(a);
        if (c) parts.push(c);
        if (s) parts.push(s);
        if (co) parts.push(co);
        const address1 = parts.join(', ');

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

  // totals
  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart]
  );

  const discountValue = useMemo(() => {
    if (appliedCoupon.discountPercent > 0) {
      return subtotal * (appliedCoupon.discountPercent / 100);
    }
    return Math.min(appliedCoupon.discountAmount, subtotal);
  }, [subtotal, appliedCoupon]);

  const total = useMemo(() => Math.max(0, subtotal - discountValue), [subtotal, discountValue]);

  /** Coupon handling:
   * 1) Try event-level validation: POST /api/events/:id/apply-coupon  (optional backend)
   * 2) Fallback: GET /api/admin/coupons  then match by code (case-insensitive)
   */
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const input = couponCode.trim();
    setCouponBusy(true);
    try {
      // ---- Try event-level endpoint first (if you add it later, this will be used) ----
      try {
        const res = await fetch(`/api/events/${eventId}/apply-coupon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            code: input,
            cartItems: cart,
          }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({} as any));
          const dt = `${data?.discountType ?? data?.type ?? ''}`.toUpperCase();
          const raw = data?.discountValue ?? data?.discount ?? data?.amount ?? data?.percent ?? 0;

          let fixed = 0;
          let percent = 0;

          if (typeof raw === 'object' && raw) {
            if (raw.amount != null) fixed = Number(raw.amount) || 0;
            if (raw.percent != null) percent = Number(raw.percent) || 0;
          } else {
            const s = String(raw ?? '');
            if (dt === 'FIXED' || dt === 'AMOUNT') fixed = Number(s) || 0;
            else if (dt === 'PERCENTAGE' || dt === 'PERCENT') percent = Number(s) || 0;
            else if (s.includes('%')) percent = Number(s.replace('%', '')) || 0;
            else fixed = Number(s) || 0;
          }

          percent = Math.max(0, Math.min(100, percent)); // clamp

          setAppliedCoupon({
            id: data?.id ?? null,
            code: data?.code ?? input,
            discountAmount: percent > 0 ? 0 : fixed,
            discountPercent: percent > 0 ? percent : 0,
          });
          return;
        }
        // If not found, fall through to admin list
      } catch {
        // ignore and try admin list
      }

      // ---- Fallback: fetch admin coupons and match ----
      const listRes = await fetch(`/api/admin/coupons`, { method: 'GET' });
      if (!listRes.ok) {
        const ee = await listRes.json().catch(() => ({}));
        alert(ee?.message || 'Failed to fetch coupons');
        return;
      }
      const list = await listRes.json();
      if (!Array.isArray(list)) {
        alert('Invalid coupon list response');
        return;
      }
      const norm = input.toLowerCase();
      const match = list.find((c: any) => c?.code?.toString?.().toLowerCase() === norm);

      if (!match) {
        alert('Coupon not found');
        return;
      }

      const type = String(match.discountType || '').toUpperCase(); // 'FIXED' | 'PERCENTAGE'
      const value = Number(match.discountValue || 0);

      let fixed = 0;
      let percent = 0;

      if (type === 'PERCENTAGE') {
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
    setCouponCode('');
  };

  // submit
  const submitCheckout = async () => {
    if (!companyId) {
      alert('You must be logged in to check out.');
      return;
    }
    if (!cart.length) {
      alert('Cart is empty.');
      return;
    }
    if (!agreeTerms || !agreePolicies) {
      alert('You must agree to the Terms & Policies.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        companyId,
        account,
        paymentMethod,
        coupon: {
          ...(appliedCoupon.id ? { id: appliedCoupon.id } : {}),
          ...(appliedCoupon.code ? { code: appliedCoupon.code } : {}),
        },
        discount: {
          amount: appliedCoupon.discountAmount,
          percent: appliedCoupon.discountPercent,
        },
        cartItems: cart.map((i) => ({
          productId: String(i.productId),
          productType: String(i.productType ?? 'TICKET').toUpperCase(),
          quantity: i.quantity,
          price: i.price,
          name: i.name,
          ...(i.roomTypeId ? { roomTypeId: String(i.roomTypeId) } : {}),
          ...(i.boothSubTypeId ? { boothSubTypeId: String(i.boothSubTypeId) } : {}),
        })),
        total,
      };

      const res = await fetch(`/api/events/${eventId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201 || res.ok) {
        alert('Checkout successful!');
        clearCart();
        window.location.href = `/event/${eventId}`;
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e?.error || e?.message || 'Checkout failed');
      }
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  };

  // helper: step state for StepDot
  const stepState = (index: 0 | 1 | 2): 'completed' | 'active' | 'upcoming' => {
    if (step > index) return 'completed';
    if (step === index) return 'active';
    return 'upcoming';
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
              subtotal={subtotal}
              discountValue={discountValue}
              total={total}
            />
            <button
              onClick={() => setStep(1)}
              disabled={cart.length === 0}
              className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 rounded-md disabled:bg-slate-400"
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <AccountForm account={account} setAccount={setAccount} />
            {/* Totals below account */}
            <Totals
              subtotal={subtotal}
              discountCode={appliedCoupon.code}
              discountValue={discountValue}
              total={total}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md"
              >
                Proceed Payment
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <PaymentStep
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              agreeTerms={agreeTerms}
              setAgreeTerms={setAgreeTerms}
              agreePolicies={agreePolicies}
              setAgreePolicies={setAgreePolicies}
            />
            <Totals
              subtotal={subtotal}
              discountCode={appliedCoupon.code}
              discountValue={discountValue}
              total={total}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-[52px] h-[52px] rounded-full border text-indigo-700 border-indigo-300 grid place-items-center"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={submitCheckout}
                disabled={isSubmitting || !agreeTerms || !agreePolicies}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-md disabled:bg-slate-400 inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <LockKeyhole className="w-5 h-5" />}
                {isSubmitting ? 'Processing…' : 'Proceed Payment'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!companyId && (
        <p className="text-xs text-center text-red-600 mt-3">
          Please log in to check out.
        </p>
      )}
    </div>
  );
}
