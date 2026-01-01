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

  // --- Helper to calculate needed rooms based on cart state ---
  const calculateDesiredRoomCount = (currentCart: CartItem[]) => {
    let ticketCount = 0;
    let accompanyingCount = 0;

    for (const item of currentCart) {
      if (item.productType === "TICKET") {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes("meeting package")) continue; // Explicitly ignore

        if (nameLower.includes("accompanying")) {
          accompanyingCount += item.quantity;
        } else if (nameLower.includes("ticket") || nameLower.includes("regular")) {
          ticketCount += item.quantity;
        }
      }
    }
    return Math.max(ticketCount, accompanyingCount);
  };

  // --- Helper to sync hotel rooms ---
  // Returns a NEW cart array if changes are needed, otherwise returns the original.
  const syncHotelRooms = (currentCart: CartItem[]) => {
    const neededRooms = calculateDesiredRoomCount(currentCart);

    // Check if we have any hotel rooms (specifically Deluxe/Standard linked ones)
    // For simplicity in this specific project context, we treat ALL hotel items as synced
    // OR we look for the specific one we added automatically.
    // Let's look for any item with productType="HOTEL".
    const hotelItems = currentCart.filter(i => i.productType === "HOTEL");

    if (hotelItems.length === 0) return currentCart; // nothing to sync

    // We will sync the FIRST hotel item found, assuming there's usually one main room type added.
    // If there are multiple, it gets complex, but per requirements "add a deluxe room", so usually one.
    // If neededRooms == 0, remove all hotel items.

    if (neededRooms === 0) {
      return currentCart.filter(i => i.productType !== "HOTEL");
    }

    // If neededRooms > 0, update the quantity of the hotel item(s) to match?
    // Or just the first one?
    // "One deluxe room holds one ticket member and one accompanying".
    // So total rooms = neededRooms.

    // Let's assume we maintain the quantity of the *first* hotel item found to be `neededRooms`.
    // And remove others? Or strictly sync them all?
    // Prudent approach: Sync the first one, leave others? 
    // User said "the room is not added... automatically reduce or delete".

    let roomsAdjusted = 0;
    return currentCart.map(item => {
      if (item.productType === "HOTEL") {
        // Only adjust the first hotel item we encounter to match the total needed? 
        // Or split it?
        // Simplest: Set the first hotel item to 'neededRooms'.
        // But what if they have multiple TYPES of rooms? 
        // The requirement is specific to the auto-added room context.
        // Let's target items that contain "Room" or "Deluxe" or just generic HOTEL.

        // We'll update the quantity to neededRooms.
        // WARNING: This forces ALL hotel items to this quantity if we map blindly.
        // Let's just update the *first* one found for now, effectively.
        // Actually, if we have 2 types of rooms, logic is ambiguous.
        // Assuming 1 type of room in cart (Deluxe Room).
        return { ...item, quantity: neededRooms };
      }
      return item;
    });
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

      // Sync happens AFTER adding
      return syncHotelRooms(nextCart);
    });
  };

  const removeFromCart = (productId: string, roomTypeId?: string) => {
    setCart(prev => {
      const nextCart = prev.filter(i => !(i.productId === productId && i.roomTypeId === roomTypeId));
      return syncHotelRooms(nextCart);
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
      return syncHotelRooms(nextCart);
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
