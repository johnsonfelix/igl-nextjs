'use client';

import React, { use } from 'react';
import { CartProvider, useCart } from './CartContext';
import Link from 'next/link';

export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // unwrap params (Next.js 14+)
  const { id } = use(params);

  return (
    // pass the event id so the cart is scoped to this event
    <CartProvider eventId={id}>
      {children}
      <CartFloat eventId={id} />
    </CartProvider>
  );
}

function CartFloat({ eventId }: { eventId: string }) {
  const { itemCount } = useCart();
  return (
    <Link
      href={`/event/${eventId}/cart`}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-4 py-3 shadow-lg hover:bg-indigo-700 transition"
      aria-label="Open cart"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l-2 9m-6 0h8" />
      </svg>
      <span className="font-semibold">Cart</span>
      {itemCount > 0 && (
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold h-6 w-6">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
