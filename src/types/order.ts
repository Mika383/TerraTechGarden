// src/types/order.ts

// Phân loại item theo chuẩn BE mới
export type OrderItemType = 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM';

// ----- Items trong đơn đã tạo (response) -----
export interface OrderItem {
  orderItemId: number;
  itemType: string;
  terrariumId?: number | null;
  terrariumVariantId?: number | null;
  accessoryId?: number | null;
  comboId?: number | null;
  accessoryQuantity?: number;
  terrariumVariantQuantity?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}


// ----- Đơn hàng (response) -----
export interface Order {
  orderId: number;
  userId: number;

  addressId?: number | null;

  // Tổng tiền của đơn (mới: BE có totalAmount trong payload tạo đơn)
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

// ----- Voucher -----
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
  itemType: 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM';
  terrariumId?: number;                     // ✅ thêm
  accessoryId: number;
  terrariumVariantId: number;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
}

export interface CreateOrderRequest {
  voucherId: number;
  deposit: number;
  addressId: number;
  comboId: number;
  totalAmount: number;
  items: CreateOrderItem[];
}
