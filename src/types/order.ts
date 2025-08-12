// src/types/order.ts
export interface OrderItem {
  orderItemId: number;
  accessoryId?: number | null;
  terrariumVariantId?: number | null;
  accessoryQuantity?: number | null;
  terrariumVariantQuantity?: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  orderId: number;
  userId: number;
  addressId?: number | null;
  totalAmount: number;
  deposit: number;
  discountAmount?: number | null;
  orderDate: string;
  status: string | number;
  paymentStatus?: string;
  shippingStatus?: string;
  transactionId?: string | null;
  paymentMethod?: string;
  orderItems: OrderItem[];
}

export interface Voucher {
  voucherId: number;
  code: string;
  description: string;
  discountAmount: number;
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive' | 'expired';
}

export interface CreateOrderItem {
  accessoryId: number;
  terrariumVariantId: number;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
}

export interface CreateOrderRequest {
  voucherId: number;
  deposit: number;
  addressId: number;
  items: CreateOrderItem[];
}
