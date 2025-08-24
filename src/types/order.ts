// src/types/order.ts

// Phân loại item theo chuẩn BE mới
export type OrderItemType = 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM';

// ----- Items trong đơn đã tạo (response) -----
export interface OrderItem {
  orderItemId: number;

  // Phân loại (mới)
  itemType?: OrderItemType;

  // Liên quan sản phẩm
  accessoryId?: number | null;
  terrariumVariantId?: number | null;

  // Số lượng theo từng loại
  accessoryQuantity?: number | null;
  terrariumVariantQuantity?: number | null;

  // Giá
  quantity: number;     // tổng quantity của dòng này (giữ nguyên theo dự án cũ nếu BE còn trả)
  unitPrice: number;
  totalPrice: number;
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

// ----- Payload tạo đơn (request) theo API mới -----
export interface CreateOrderItem {
  // PHẢI có itemType theo lỗi BE trả về
  itemType: OrderItemType;

  // Nếu itemType = 'SINGLE' → dùng accessoryId + accessoryQuantity
  // Nếu itemType = 'MAIN_ITEM' → dùng terrariumVariantId + terrariumVariantQuantity
  // Nếu itemType = 'BUNDLE_ACCESSORY' → accessoryId + accessoryQuantity (nằm trong bundle)
  accessoryId: number;
  terrariumVariantId: number;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
}

export interface CreateOrderRequest {
  voucherId: number;
  deposit: number;
  addressId: number;

  // Mới theo spec BE
  comboId: number;

  // Danh sách item (bắt buộc có itemType)
  items: CreateOrderItem[];

  // Tổng tiền dùng để BE xác nhận/tính (mới theo spec BE)
  totalAmount: number;
}
