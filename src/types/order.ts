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
