'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  productType: 'TICKET' | 'BOOTH' | 'SPONSOR' | 'HOTEL';
  name: string;
  image?: string | null;
  price: number;
  quantity: number;
  roomTypeId?: string;
  boothSubTypeId?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string, roomTypeId?: string) => void;
  updateQuantity: (productId: string, newQuantity: number, roomTypeId?: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * CartProvider now takes eventId so the cart is scoped to each event.
 * This prevents cart conflicts across different events.
 */
export const CartProvider = ({ children, eventId }: { children: ReactNode; eventId: string }) => {
  const STORAGE_KEY = `event-cart-${eventId}`; // event-scoped key
  const [cart, setCart] = useState<CartItem[]>([]);

  // hydrate from localStorage (per event)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (e) {
      console.warn('Failed to hydrate cart', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]); // re-run if eventId ever changes

  // persist whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist cart', e);
    }
  }, [cart, STORAGE_KEY]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(
        i => i.productId === newItem.productId && i.roomTypeId === newItem.roomTypeId
      );
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [...prev, { ...newItem, quantity }];
    });
  };

  const removeFromCart = (productId: string, roomTypeId?: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.roomTypeId === roomTypeId)));
  };

  const updateQuantity = (productId: string, newQuantity: number, roomTypeId?: string) => {
    if (newQuantity <= 0) return removeFromCart(productId, roomTypeId);
    setCart(prev =>
      prev.map(i =>
        i.productId === productId && i.roomTypeId === roomTypeId ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const itemCount = useMemo(() => cart.reduce((n, i) => n + i.quantity, 0), [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
