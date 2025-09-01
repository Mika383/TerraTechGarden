// src/types/order.ts

// Phân loại item theo chuẩn BE mới (thêm COMBO)
export type OrderItemType = 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM' | 'COMBO';

// ----- Items trong đơn (response) -----
export interface OrderItem {
  orderItemId: number;
  itemType: OrderItemType;
  terrariumId?: number | null;
  terrariumVariantId?: number | null;
  accessoryId?: number | null;
  accessoryQuantity?: number | null;
  terrariumVariantQuantity?: number | null;

  // COMBO (response)
  comboId?: number | null;
  comboQuantity?: number | null;

  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}

// ----- Đơn hàng (response) -----
export interface Order {
  orderId: number;
  userId: number;

  addressId?: number | null;

  // Tổng tiền lưu trong đơn (tuỳ BE)
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

  // BE có thể trả amount hoặc percent (1 trong 2)
  discountAmount: number;          // có thể = 0
  discountPercent?: number;        // có thể = 0

  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive' | 'expired';

  // mới
  minOrderAmount?: number | null;

  // các field tùy chọn khác (không bắt buộc hiển thị)
  isPersonal?: boolean;
  targetUserId?: string | null;
  totalUsage?: number;
  remainingUsage?: number;
  perUserUsageLimit?: number;
}

// ----- Create Order -----
// Để linh hoạt, giữ 1 interface với field tuỳ theo itemType
export interface CreateOrderItem {
  itemType: OrderItemType;

  // COMBO
  comboId?: number;
  comboQuantity?: number;

  // BUNDLE_ACCESSORY
  terrariumId?: number;
  accessoryId?: number;
  accessoryQuantity?: number;

  // MAIN_ITEM
  terrariumVariantId?: number;
  terrariumVariantQuantity?: number;

  // SINGLE
  // (dùng accessoryId + accessoryQuantity)
}

export interface CreateOrderRequest {
  voucherId: number;        // 0 nếu không có
  deposit: number;          // 0 nếu full
  addressId: number;

  // KHÔNG dùng comboId top-level nữa. (giữ optional để backward-compat)
  comboId?: number;         // deprecated

  items: CreateOrderItem[];

  // FE tính & truyền lên
  totalAmountOld: number;   // subtotal + ship (chưa giảm gì)
  totalAmountNew: number;   // sau voucher & full -10% (nếu có) + ship
}
