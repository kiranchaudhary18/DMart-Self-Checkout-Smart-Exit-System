import { Product } from "./product";

export interface Inventory {
  product: Product;
  current_stock: number;
  reserved_stock: number;
  low_stock_threshold: number;
  available_stock: number;
}

export enum StockTransactionType {
  INITIAL = "INITIAL",
  RESTOCK = "RESTOCK",
  SALE = "SALE",
  ADJUSTMENT = "ADJUSTMENT",
  RETURN = "RETURN",
  DAMAGE = "DAMAGE",
  EXPIRED = "EXPIRED",
}

export interface StockTransaction {
  id: number;
  product: number | Product;
  transaction_type: StockTransactionType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference_id?: string;
  created_by?: number | any;
  created_at: string;
}

export interface InventoryAdjustmentPayload {
  product: number;
  quantity: number;
  transaction_type: StockTransactionType;
  reason?: string;
  reference_id?: string;
}
