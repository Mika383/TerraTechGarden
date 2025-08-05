export interface AddToCartRequest {
  accessoryId: number;
  terrariumVariantId: number;
  accessoryQuantity: number;
  variantQuantity: number;
}

export interface CartItemProduct {
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface RawCartItem {
  cartItemId: number;
  cartId: number;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  item: CartItemProduct[];
  totalCartQuantity: number;
  totalCartPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
 status: number;
  message: string;
  data: {
    cartId: number;
    userId: number;
    user: string;
    cartItems: CartItemAPI[];
    totalCartQuantity: number;
    totalCartPrice: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateCartItemRequest {
  accessoryQuantity: number;
  variantQuantity: number;
}

export interface CartItem {
  id: string;           // cartItemId (dưới dạng string)
  name: string;
  price: number;
  quantity: number;
  image: string;
  selected: boolean;
  accessoryId?: number | null;
    variantId?: number | null;
    cartItemId: number;
}

