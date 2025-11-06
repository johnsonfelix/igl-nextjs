'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Loader, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/app/event/[id]/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isCheckingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();
  const companyId = user?.companyId;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleGoToCheckout = () => {
    if (!companyId) {
      alert('You must be logged in to check out.');
      return;
    }
    if (cart.length === 0) return;
    setCheckingOut(true);
    // Navigate to the 3-step checkout page
    router.push(`/event/${eventId}/checkout`);
  };

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/event/${eventId}`} className="text-indigo-600 hover:underline">← Back to Event</Link>
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
              {cart.map(item => (
                <div key={`${item.productId}-${item.roomTypeId || ''}`} className="flex gap-4 items-center border-b pb-4">
                  <img src={item.image || '/placeholder.png'} alt={item.name} className="w-16 h-16 rounded-md object-cover border" />
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.roomTypeId)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><Minus className="h-4 w-4" /></button>
                      <span className="font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.roomTypeId)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.productId, item.roomTypeId)} className="text-red-500 hover:text-red-700 mt-2 inline-flex items-center gap-1">
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow h-fit">
            <div className="flex justify-between items-center font-bold text-lg mb-4 text-slate-800">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleGoToCheckout}
              disabled={cart.length === 0 || !companyId}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center transition-colors"
            >
              {isCheckingOut ? <Loader className="animate-spin h-6 w-6" /> : 'Proceed to Checkout'}
            </button>
            {!companyId && <p className="text-xs text-center text-red-600 mt-2">Please log in to check out.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
