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
  totalAmount: number;
  deposit: number;
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
  validFrom: string;   // ISO date string, ví dụ: "2025-08-07T00:00:00"
  validTo: string;     // ISO date string
  status: 'active' | 'inactive' | 'expired'; // Có thể bổ sung trạng thái nếu cần
}
