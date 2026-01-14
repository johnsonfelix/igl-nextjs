'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  productType: "TICKET" | "BOOTH" | "HOTEL" | "SPONSOR";
  name: string;
  price: number;
  quantity: number;
  image?: string;

  roomTypeId?: string;

  // for booth variant tracking
  boothSubTypeId?: string;
  boothSubTypeName?: string;
  originalPrice?: number;

  // Track complimentary items
  isComplimentary?: boolean;
  linkedSponsorId?: string;
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

  // --- Helper to sync cart dependents (Accompanying & Hotels) ---
  const syncCartDependents = (currentCart: CartItem[]) => {
    let nextCart = [...currentCart];

    // 1. Calculate Counts
    let validTicketCount = 0;
    let accompanyingCount = 0;
    let accompanyingIndices: number[] = [];

    nextCart.forEach((item, index) => {
      if (item.productType === "TICKET") {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes("meeting package")) return;

        if (nameLower.includes("accompanying")) {
          accompanyingCount += item.quantity;
          accompanyingIndices.push(index);
        } else if (nameLower.includes("ticket") || nameLower.includes("regular") || nameLower.includes("standard")) {
          validTicketCount += item.quantity;
        }
      }
    });

    // 2. Enforce Accompanying <= Tickets
    if (accompanyingCount > validTicketCount) {
      let removeCount = accompanyingCount - validTicketCount;
      // Iterate backwards to safely reduce/remove items
      for (let i = accompanyingIndices.length - 1; i >= 0 && removeCount > 0; i--) {
        const idx = accompanyingIndices[i];
        const item = nextCart[idx];
        const canRemove = Math.min(item.quantity, removeCount);

        if (item.quantity - canRemove <= 0) {
          nextCart[idx] = { ...item, quantity: 0 };
        } else {
          nextCart[idx] = { ...item, quantity: item.quantity - canRemove };
        }
        removeCount -= canRemove;
      }

      // Filter out 0 quantity items
      nextCart = nextCart.filter(i => i.quantity > 0);
      accompanyingCount = validTicketCount;
    }

    // 3. Sync Hotel Rooms
    const neededRooms = Math.max(validTicketCount, accompanyingCount);
    const hotelItems = nextCart.filter(i => i.productType === "HOTEL");

    if (hotelItems.length > 0) {
      if (neededRooms === 0) {
        nextCart = nextCart.filter(i => i.productType !== "HOTEL");
      } else {
        nextCart = nextCart.map(i => {
          if (i.productType === "HOTEL") {
            return { ...i, quantity: neededRooms };
          }
          return i;
        });
      }
    }

    return nextCart;
  };

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart(prev => {
      let nextCart = [...prev];
      const idx = nextCart.findIndex(
        i => i.productId === newItem.productId && i.roomTypeId === newItem.roomTypeId
      );
      if (idx > -1) {
        nextCart[idx] = { ...nextCart[idx], quantity: nextCart[idx].quantity + quantity };
      } else {
        nextCart.push({ ...newItem, quantity });
      }

      // Sync dependencies
      return syncCartDependents(nextCart);
    });
  };

  const removeFromCart = (productId: string, roomTypeId?: string) => {
    setCart(prev => {
      // Find the item being removed to check if it's a sponsor
      const removedItem = prev.find(i => i.productId === productId && i.roomTypeId === roomTypeId);

      // Remove the item itself
      let nextCart = prev.filter(i => !(i.productId === productId && i.roomTypeId === roomTypeId));

      // If removing a sponsor, also remove its linked complimentary tickets
      if (removedItem?.productType === "SPONSOR") {
        nextCart = nextCart.filter(i => i.linkedSponsorId !== productId);
      }

      return syncCartDependents(nextCart);
    });
  };

  const updateQuantity = (productId: string, newQuantity: number, roomTypeId?: string) => {
    setCart(prev => {
      let nextCart;
      if (newQuantity <= 0) {
        nextCart = prev.filter(i => !(i.productId === productId && i.roomTypeId === roomTypeId));
      } else {
        nextCart = prev.map(i =>
          i.productId === productId && i.roomTypeId === roomTypeId ? { ...i, quantity: newQuantity } : i
        );
      }
      return syncCartDependents(nextCart);
    });
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
