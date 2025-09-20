'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define the types for a cart item and the context
export interface CartItem {
  productId: string;
  productType: 'TICKET' | 'BOOTH' | 'SPONSOR' | 'HOTEL';
  name: string;
  image?: string | null; // <-- FIX: Allow null in addition to string/undefined
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

// 2. Create the context with a default value
const CartContext = createContext<CartContextType | undefined>(undefined);

// 3. Create the provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.productId === newItem.productId && item.roomTypeId === newItem.roomTypeId
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        return [...prevCart, { ...newItem, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string, roomTypeId?: string) => {
    setCart(prevCart =>
      prevCart.filter(item => !(item.productId === productId && item.roomTypeId === roomTypeId))
    );
  };
  
  const updateQuantity = (productId: string, newQuantity: number, roomTypeId?: string) => {
      if (newQuantity <= 0) {
          removeFromCart(productId, roomTypeId);
      } else {
         setCart(prevCart =>
            prevCart.map(item =>
                (item.productId === productId && item.roomTypeId === roomTypeId)
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
      }
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

// 4. Create a custom hook for easy access to the context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
