// src/types/order.ts

// Phân loại item theo chuẩn BE mới (gồm COMBO)
export type OrderItemType = 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM' | 'COMBO';

/**
 * Item trong đơn hàng (RESPONSE)
 * Lưu ý: BE có thể trả null cho nhiều field; để linh hoạt ta dùng union với null và optional.
 * childItems là đệ quy để hỗ trợ combo gói nhiều dòng con.
 */
export interface OrderItem {
  orderItemId: number;

  itemType: OrderItemType;

  // Tham chiếu sản phẩm
  terrariumId?: number | null;
  terrariumVariantId?: number | null;
  accessoryId?: number | null;

  // Số lượng theo loại
  accessoryQuantity?: number | null;
  terrariumVariantQuantity?: number | null;

  // COMBO
  comboId?: number | null;
  comboQuantity?: number | null;

  // Tổng quát
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;

  // Phân cấp/quan hệ
  parentOrderItemId?: number | null;
  childItems?: OrderItem[];

  // Thông tin hiển thị
  productName?: string | null;
  imageUrl?: string | null;
}

/**
 * Đơn hàng (RESPONSE)
 */
export interface Order {
  orderId: number;
  userId: number;

  addressId?: number | null;

  // Tổng tiền
  totalAmount: number;
  deposit: number;
  originalAmount?: number | null;
  discountAmount?: number | null;

  // Trạng thái & thanh toán
  orderDate: string;
  status: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  transactionId?: string | null;

  // Danh sách item
  orderItems: OrderItem[];
}

/* ------------------------- VOUCHER ------------------------- */
export interface Voucher {
  voucherId: number;
  code: string;
  description: string;

  discountAmount: number;
  discountPercent?: number;

  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive' | 'expired';

  minOrderAmount?: number | null;
  isPersonal?: boolean;
  targetUserId?: string | null;
  totalUsage?: number;
  remainingUsage?: number;
  perUserUsageLimit?: number;
}

/* --------------------- CREATE ORDER ------------------ */
// Dùng cho API tạo đơn (payload FE -> BE).
export interface CreateOrderItem {
  itemType: OrderItemType;

  // COMBO
  comboId?: number;
  comboQuantity?: number;

  // BUNDLE_ACCESSORY
  terrariumId?: number;
  terrariumVariantId?: number;
  accessoryId?: number;
  accessoryQuantity?: number;

  // MAIN_ITEM
  terrariumVariantQuantity?: number;
}

export interface CreateOrderRequest {
  voucherId: number;        // 0 nếu không có
  deposit: number;          // 0 nếu full
  addressId: number;

  items: CreateOrderItem[];

  totalAmountOld: number;
  totalAmountNew: number;
}
