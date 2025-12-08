"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Loader, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/app/event/[id]/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

type OfferScope = "ALL" | "HOTELS" | "TICKETS" | "SPONSORS" | "CUSTOM";

interface Offer {
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
  boothIds?: string[];
}

export default function CartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isCheckingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();
  const companyId = user?.companyId;

  // offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  // fetch offers once
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setOffersLoading(true);
      setOffersError(null);
      try {
        const res = await fetch("/api/admin/offers");
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Failed to load offers: ${res.status} ${res.statusText} ${text}`
          );
        }
        const data = (await res.json()) as Offer[];
        if (!mounted) return;
        setOffers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("offers load error:", err);
        if (!mounted) return;
        setOffersError(err.message || "Failed to load offers");
        setOffers([]);
      } finally {
        if (!mounted) return;
        setOffersLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // helpers
  function toFiniteNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function getOriginalPriceFromCartItem(item: any): number {
    const candidates = ["originalPrice", "basePrice", "listPrice", "price"];
    for (const key of candidates) {
      const v = toFiniteNumber(item?.[key]);
      if (v !== null) return v;
    }
    if (item?.product && typeof item.product === "object") {
      const v = toFiniteNumber(item.product.price);
      if (v !== null) return v;
    }
    return 0;
  }

  function parseOfferPercent(o: Offer): number | null {
    const raw = (o as any).percentage;
    const n = toFiniteNumber(raw);
    if (n === null) return null;
    if (n <= 0) return null;
    if (n > 100) return 100;
    return n;
  }

  function getDiscountedPrice(original: number, percent?: number | null) {
    if (typeof original !== "number" || !Number.isFinite(original)) return 0;
    if (!percent || percent <= 0) return original;
    const discounted = original * (1 - percent / 100);
    return Math.max(0, Number(discounted.toFixed(2)));
  }

  // Find best offer for given product
  function getBestOfferForItem(
    productType: string,
    productId: string
  ): { percent: number | null; name?: string | null } {
    if (!offers || offers.length === 0) return { percent: null };

    const now = new Date();
    const applicable: { offer: Offer; pct: number }[] = [];

    for (const o of offers) {
      try {
        if (!o || !o.isActive) continue;
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
          if (
            productType === "TICKET" &&
            Array.isArray(o.ticketIds) &&
            o.ticketIds.includes(productId)
          ) {
            applicable.push({ offer: o, pct });
            continue;
          }
          if (
            productType === "HOTEL" &&
            Array.isArray(o.hotelIds) &&
            o.hotelIds.includes(productId)
          ) {
            applicable.push({ offer: o, pct });
            continue;
          }
          if (
            productType === "SPONSOR" &&
            Array.isArray(o.sponsorTypeIds) &&
            o.sponsorTypeIds.includes(productId)
          ) {
            applicable.push({ offer: o, pct });
            continue;
          }
          if (
            productType === "BOOTH" &&
            Array.isArray(o.boothIds) &&
            o.boothIds.includes(productId)
          ) {
            applicable.push({ offer: o, pct });
            continue;
          }
        }
      } catch (err) {
        console.warn("Offer check error", err, o);
        continue;
      }
    }

    if (applicable.length === 0) return { percent: null };

    const best = applicable.reduce((acc, cur) =>
      cur.pct > acc.pct ? cur : acc
    );
    return { percent: best.pct, name: best.offer?.name ?? null };
  }

  // Compute totals using offers (do not mutate cart)
  const computed = React.useMemo(() => {
    let subTotal = 0;
    const lines = cart.map((item: any) => {
      const productId = String(item.productId ?? "");
      const productType = String(
        (item.productType || "").toString().toUpperCase()
      ); // 'TICKET','BOOTH','HOTEL','SPONSOR'
      const original = getOriginalPriceFromCartItem(item);
      const best = getBestOfferForItem(productType, productId);
      const effective = getDiscountedPrice(original, best.percent);
      const qty = Number.isFinite(Number(item.quantity))
        ? Number(item.quantity)
        : 1;
      const lineTotal = Number((effective * qty).toFixed(2));
      subTotal += lineTotal;
      return {
        ...item,
        original,
        appliedOfferPercent: best.percent,
        appliedOfferName: best.name,
        effective,
        lineTotal,
        qty,
      };
    });
    return { lines, subTotal: Number(subTotal.toFixed(2)) };
  }, [cart, offers]);

  const total = computed.subTotal;

  const handleGoToCheckout = () => {
    if (!companyId) {
      alert("You must be logged in to check out.");
      return;
    }
    if (cart.length === 0) return;
    setCheckingOut(true);
    router.push(`/event/${eventId}/checkout`);
  };

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/event/${eventId}`}
          className="text-indigo-600 hover:underline"
        >
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Your Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-slate-500">
          Your cart is empty.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="space-y-4">
              {computed.lines.map((item: any) => (
                <div
                  key={`${item.productId}-${item.roomTypeId || ""}-${
                    item.boothSubTypeId || ""
                  }`}
                  className="flex gap-4 items-center border-b pb-4"
                >
                  <div className="relative">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      className="w-16 h-16 rounded-md object-cover border"
                    />
                    {item.appliedOfferPercent ? (
                      <div className="absolute -top-1 -left-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-semibold">
                        -{Math.round(item.appliedOfferPercent)}%
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800">
                      {item.name}
                    </p>

                    {/* 👇 Booth subtype label */}
                    {String(item.productType || "").toUpperCase() === "BOOTH" &&
                      item.boothSubTypeId && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Booth option:{" "}
                          {item.boothSubTypeName ||
                            item.subTypeName ||
                            "Selected booth option"}
                        </p>
                      )}

                    {/* original vs discounted price */}
                    <div className="mt-1">
                      {item.appliedOfferPercent ? (
                        <div className="flex items-baseline gap-3">
                          <div className="text-sm text-slate-500 line-through">
                            ${Number(item.original).toFixed(2)}
                          </div>
                          <div className="text-lg font-bold text-indigo-600">
                            ${Number(item.effective).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">each</div>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-indigo-600">
                          ${Number(item.original).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.max((item.quantity || 1) - 1, 0),
                            item.roomTypeId
                          )
                        }
                        className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-semibold w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            (item.quantity || 1) + 1,
                            item.roomTypeId
                          )
                        }
                        className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-800">
                      ${item.lineTotal.toFixed(2)}
                    </p>
                    <button
                      onClick={() =>
                        removeFromCart(item.productId, item.roomTypeId)
                      }
                      className="text-red-500 hover:text-red-700 mt-2 inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {offersError && (
              <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-md text-sm">
                Offers could not be loaded: {offersError}
              </div>
            )}
            {offersLoading && (
              <div className="mt-4 p-3 text-sm text-slate-500 flex items-center gap-2">
                <Loader className="animate-spin" /> Loading offers...
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow h-fit">
            <div className="flex justify-between items-center font-bold text-lg mb-4 text-slate-800">
              <span>Total</span>
              <span>${Number(total).toFixed(2)}</span>
            </div>
            <button
              onClick={handleGoToCheckout}
              disabled={cart.length === 0 || !companyId}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center transition-colors"
            >
              {isCheckingOut ? (
                <Loader className="animate-spin h-6 w-6" />
              ) : (
                "Proceed to Checkout"
              )}
            </button>
            {!companyId && (
              <p className="text-xs text-center text-red-600 mt-2">
                Please log in to check out.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
