// src/app/components/CartSheet.tsx
'use client';

import React, { useState } from 'react';
import { X, Loader, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../event/[id]/CartContext';
import { useAuth } from '@/app/context/AuthContext'; // keep using your existing auth context
import Link from 'next/link';

export const CartSheet = ({ isOpen, onClose, eventId }: { isOpen: boolean; onClose: () => void; eventId: string; }) => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isCheckingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();
  const companyId = user?.companyId;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!companyId) {
      alert('You must be logged in to check out.');
      return;
    }
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const response = await fetch(`/api/events/${eventId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, cartItems: cart }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }
      alert('Checkout successful!');
      clearCart();
      onClose();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800"><X className="h-6 w-6" /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-slate-500">Your cart is empty.</div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={`${item.productId}-${item.roomTypeId || ''}`} className="flex gap-4">
                <img src={item.image || '/placeholder.png'} alt={item.name} className="w-16 h-16 rounded-md object-cover border" />
                <div className="flex-grow">
                  <p className="font-semibold text-slate-700">{item.name}</p>
                  <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.roomTypeId)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><Minus className="h-4 w-4" /></button>
                    <span className="font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.roomTypeId)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">${(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.productId, item.roomTypeId)} className="text-red-500 hover:text-red-700 mt-2"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t bg-slate-50">
          <div className="flex justify-between items-center font-bold text-lg mb-4 text-slate-800">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut || !companyId} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center transition-colors">
            {isCheckingOut ? <Loader className="animate-spin h-6 w-6" /> : 'Proceed to Checkout'}
          </button>
          {!companyId && <p className="text-xs text-center text-red-600 mt-2">Please log in to check out.</p>}
        </div>
      </div>
    </div>
  );
};
