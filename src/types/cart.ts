// Request gửi lên khi thêm sản phẩm vào giỏ
export interface AddToCartRequest {
  accessoryId: number;
  terrariumVariantId: number;
  accessoryQuantity: number;
  variantQuantity: number;
}

// Request gửi lên khi cập nhật số lượng trong giỏ
export interface UpdateCartItemRequest {
  accessoryQuantity: number;
  variantQuantity: number;
}

// Thông tin 1 sản phẩm bên trong 1 cartItem
export interface CartItemProduct {
  productName: string;
  quantity: number;    // số lượng riêng của sản phẩm này
  price: number;       // giá 1 đơn vị
  totalPrice: number;  // quantity * price
}

// Định nghĩa cartItem từ API
export interface RawCartItem {
  cartItemId: number;
  cartId: number;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  item: CartItemProduct[];
  totalCartQuantity: number; // tổng số lượng của cartItem
  totalCartPrice: number;    // tổng giá của cartItem
  createdAt: string;
  updatedAt: string;
}

// Phần "data" trong API mới
export interface CartResponse {
  cartId: number;
  userId: number;
  cartItems: RawCartItem[]; // ✅ thêm dòng này
  totalCartQuantity: number;
  totalCartPrice: number;
  createdAt: string;
  updatedAt: string;
}


// API wrapper theo format mới (status, message, data)
export interface CartAPIWrapper {
  status: number;
  message: string;
  data: CartResponse;
}

// Kiểu dữ liệu hiển thị trên FE
export interface CartItem {
  id: string;           // cartItemId dưới dạng string
  name: string;
  price: number;
  quantity: number;
  image: string;
  selected: boolean;
  accessoryId?: number | null;
  variantId?: number | null;
  cartItemId: number;
}
