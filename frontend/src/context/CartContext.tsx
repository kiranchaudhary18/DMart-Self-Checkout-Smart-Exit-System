"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { cartService, AddToCartRequest, AddToCartBarcodeRequest } from "@/lib/api/cart";
import { CartSummary } from "@/types/dashboard";
import { useAuth } from "@/hooks/useAuth";

interface CartContextType {
  cart: CartSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (data: AddToCartRequest) => Promise<void>;
  addItemByBarcode: (data: AddToCartBarcodeRequest) => Promise<void>;
  updateItemQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    // Only fetch if authenticated customer
    if (!user || user.role !== "CUSTOMER") {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await cartService.getCart();
      setCart(data);
    } catch (err: any) {
      console.error("Failed to load cart:", err);
      // Determine if network error or specific API error
      const msg = err.response?.data?.message || err.response?.data?.detail || "Unable to load your cart. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (data: AddToCartRequest) => {
    try {
      setError(null);
      const updatedCart = await cartService.addToCart(data);
      // Wait wait wait, the backend response shape is { status: "success", message: "...", data: CartSerializer }
      // Our api client intercepts and usually returns response.data which is the whole JSON.
      // So updatedCart could be { status: "success", data: CartSummary }.
      // Let's rely on re-fetching to be absolutely certain of state consistency, or parse it correctly.
      await fetchCart();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to add item to cart.";
      throw new Error(msg); // Let components handle the toast/alert
    }
  };

  const addItemByBarcode = async (data: AddToCartBarcodeRequest) => {
    try {
      setError(null);
      await cartService.addToCartByBarcode(data);
      await fetchCart();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to add item to cart.";
      throw new Error(msg);
    }
  };

  const updateItemQuantity = async (id: number, quantity: number) => {
    try {
      setError(null);
      await cartService.updateCartItem(id, quantity);
      await fetchCart();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update item quantity.";
      throw new Error(msg);
    }
  };

  const removeItem = async (id: number) => {
    try {
      setError(null);
      await cartService.removeCartItem(id);
      await fetchCart();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to remove item.";
      throw new Error(msg);
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      await cartService.clearCart();
      await fetchCart();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to clear cart.";
      throw new Error(msg);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      isLoading,
      error,
      fetchCart,
      addItem,
      addItemByBarcode,
      updateItemQuantity,
      removeItem,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
