// src/types/cart.ts

export interface CartItemProduct {
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  imageUrl: string | null;
  productType: string | null;
}

export interface RawCartEntry {
  cartItemId: number;
  cartId: number;
  terrariumId: number | null;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  comboId: number | null;
  comboName: string | null;
  comboPrice: number | null;
  comboOriginalPrice: number | null;
  comboDiscountPercent: number | null;
  comboItems: any[] | null;
  item: CartItemProduct[];
  totalCartQuantity: number;
  totalCartPrice: number;
  itemType: string;
  isInStock: boolean;
  maxQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartBundle {
  mainItem: RawCartEntry;
  bundleAccessories: RawCartEntry[];
  totalBundlePrice: number;
  totalBundleQuantity: number;
}

export interface CartResponseNew {
  cartId: number;
  userId: number;
  user: string;
  bundleItems: CartBundle[];
  singleItems: RawCartEntry[];
  totalCartPrice: number;
  totalCartQuantity: number;
  totalCartItem: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCartItemRequest {
  accessoryQuantity?: number;
  variantQuantity?: number;
}

export interface AddAccessoryToCartPayload {
  accessoryId: number;
  accessoryQuantity: number;
}

export interface AddVariantToCartPayload {
  terrariumId: number;
  terrariumVariantId: number;
  variantQuantity: number;
}

/**
 * ⚠️ Theo BE mới: key là "terrariumVarientId" (giữ nguyên chính tả của BE).
 * Payload dùng cho POST /Cart/add-items/multiple (mua dưới dạng linh kiện theo variant)
 */
export interface AddBundleAccessoriesPayload {
  terrariumVarientId: number; // CHANGED: từ terrariumId -> terrariumVarientId
  totalPrice?: number;
  bundleAccessories: {
    accessoryId: number;
    quantity: number;
  }[];
}

export interface AddComboPayload {
  comboId: number;
  quantity: number;
}

/** Dùng cho local cart hiển thị/checkbox */
export interface NormalizedCartItem {
  id: string;
  cartItemId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selected: boolean;
  accessoryId?: number | null;
  variantId?: number | null;
  terrariumId?: number | null;
  groupKey?: string;
  isBundleMain?: boolean;
}
