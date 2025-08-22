// src/api/cart.ts
import axios from 'axios';
import {
  CartResponseNew,
  UpdateCartItemRequest,
  AddAccessoryToCartPayload,
  AddVariantToCartPayload,
  AddBundleAccessoriesPayload,
  AddComboPayload,
} from '@/types/cart';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

/**
 * GET CART (API MỚI)
 * GET /Cart/get-all  -> { status, message, data: CartResponseNew }
 */
export const getCart = async (): Promise<CartResponseNew> => {
  const res = await axios.get<{
    status: number;
    message: string;
    data: CartResponseNew;
  }>(`${BASE_URL}/Cart/get-all`, authHeader());

  return res.data.data;
};

/**
 * ADD BUNDLE ACCESSORIES (MUA DƯỚI DẠNG LINH KIỆN)
 * POST /Cart/add-items/multiple
 * body: AddBundleAccessoriesPayload[]
 */
export const addBundleAccessories = async (
  items: AddBundleAccessoriesPayload[]
) => {
  const res = await axios.post(
    `${BASE_URL}/Cart/add-items/multiple`,
    items,
    authHeader()
  );
  return res.data;
};

/**
 * ADD SINGLE ITEM - ACCESSORY
 * POST /Cart/add-item
 * body: AddAccessoryToCartPayload
 */
export const addAccessoryToCart = async (
  accessoryId: number,
  quantity: number
) => {
  const payload: AddAccessoryToCartPayload = {
    accessoryId,
    accessoryQuantity: quantity,
  };

  const res = await axios.post(
    `${BASE_URL}/Cart/add-item`,
    payload,
    authHeader()
  );
  return res.data;
};

/**
 * ADD SINGLE ITEM - TERRARIUM VARIANT
 * POST /Cart/add-item
 * body: AddVariantToCartPayload
 */
export const addTerrariumVariantToCart = async (
  terrariumId: number,
  terrariumVariantId: number,
  variantQuantity: number
) => {
  const payload: AddVariantToCartPayload = {
    terrariumId,
    terrariumVariantId,
    variantQuantity,
  };

  const res = await axios.post(
    `${BASE_URL}/Cart/add-item`,
    payload,
    authHeader()
  );
  return res.data;
};

/**
 * ADD COMBO
 * POST /Cart/add-combo
 */
export const addComboToCart = async (payload: AddComboPayload) => {
  const res = await axios.post(
    `${BASE_URL}/Cart/add-combo`,
    payload,
    authHeader()
  );
  return res.data;
};

/**
 * UPDATE CART ITEM QUANTITY
 * PUT /Cart/update-items/{cartItemId}
 * body: UpdateCartItemRequest (accessoryQuantity? | variantQuantity?)
 */
export const updateCartItem = async (
  cartItemId: number,
  data: UpdateCartItemRequest
) => {
  const res = await axios.put(
    `${BASE_URL}/Cart/update-items/${cartItemId}`,
    data,
    authHeader()
  );
  return res.data;
};

/**
 * DELETE 1 ITEM
 * DELETE /Cart/delete-items/{cartItemId}
 */
export const deleteCartItem = async (cartItemId: number) => {
  const res = await axios.delete(
    `${BASE_URL}/Cart/delete-items/${cartItemId}`,
    authHeader()
  );
  return res.data;
};

/**
 * DELETE ALL ITEMS
 * DELETE /Cart/delete-all-items
 */
export const deleteAllCartItems = async () => {
  const res = await axios.delete(
    `${BASE_URL}/Cart/delete-all-items`,
    authHeader()
  );
  return res.data;
};
