// src/types/order.ts

// Phân loại item theo chuẩn BE (gồm COMBO)
export type OrderItemType = 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM' | 'COMBO';

/**
 * Item trong đơn hàng (RESPONSE)
 * childItems là đệ quy để hỗ trợ combo gói nhiều dòng con.
 */
export interface OrderItem {
  orderItemId: number;

  itemType: OrderItemType | string;

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
 * Lưu ý: API get-all-by-userid KHÔNG còn trả orderItems.
 */
export interface Order {
  orderId: number;
  userId: number;

  voucherId?: number | null;
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

  // Danh sách item — có ở /Order/{id}, vắng ở /get-all-by-userid
  orderItems?: OrderItem[];
}

/* ------------------------- VOUCHER (tham chiếu) ------------------------- */
export interface VoucherRef {
  voucherId: number;
  code?: string;
}

/* --------------------- CREATE ORDER ------------------ */
// Dùng cho API tạo đơn (payload FE -> BE).
export interface CreateOrderItem {
  itemType: OrderItemType;

  // COMBO
  comboId?: number;
  comboQuantity?: number;

  // BUNDLE_ACCESSORY
  /** ⚠️ BE mới: KHÔNG dùng terrariumId cho bundle, luôn để = 0 khi gửi */
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

  // ✅ NEW
  note?: string;            // ghi chú khách hàng
  isPayFull?: boolean;      // true nếu thanh toán toàn bộ
}

/* --------------------- MOMO PAYMENT ------------------ */
export interface CreateMoMoPaymentRequest {
  orderId: number;
  orderInfo: string;
  finalAmount: number;
  voucherId: number;
  payAll: boolean;
}

export interface CreateMoMoPaymentResponse {
  payUrl: string;
  qrImageBase64?: string;
}
