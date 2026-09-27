import { apiClient } from "./client";
import { CartSummary } from "@/types/dashboard";

export interface AddToCartRequest {
  product_id: number;
  quantity?: number;
}

export interface AddToCartBarcodeRequest {
  barcode: string;
  quantity?: number;
}

export const cartService = {
  /**
   * Fetch the current user's active cart.
   * GET /api/cart/
   */
  async getCart(): Promise<CartSummary> {
    const response = await apiClient.get("/cart/");
    return response.data.data;
  },

  /**
   * Add a product to the cart by ID
   * POST /api/cart/items/
   */
  async addToCart(data: AddToCartRequest): Promise<CartSummary> {
    const response = await apiClient.post("/cart/items/", data);
    return response.data.data;
  },

  /**
   * Add a product to the cart by Barcode
   * POST /api/cart/items/barcode/
   */
  async addToCartByBarcode(data: AddToCartBarcodeRequest): Promise<CartSummary> {
    const response = await apiClient.post("/cart/items/barcode/", data);
    return response.data.data;
  },

  /**
   * Update quantity of a cart item
   * PATCH /api/cart/items/<id>/
   */
  async updateCartItem(itemId: number, quantity: number): Promise<void> {
    await apiClient.patch(`/cart/items/${itemId}/`, { quantity });
  },

  /**
   * Remove a cart item
   * DELETE /api/cart/items/<id>/
   */
  async removeCartItem(itemId: number): Promise<void> {
    await apiClient.delete(`/cart/items/${itemId}/`);
  },

  /**
   * Clear all items from the cart
   * DELETE /api/cart/clear/
   */
  async clearCart(): Promise<void> {
    await apiClient.delete("/cart/clear/");
  }
};
