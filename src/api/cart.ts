import axios from 'axios';
import {
  AddToCartRequest,
  CartResponse,
  UpdateCartItemRequest,
  RawCartItem
} from '@/types/cart';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getCart = async () => {
  const res = await axios.get<{
    status: number;
    message: string;
    data: CartResponse;
  }>(
    `${BASE_URL}/Cart/get-all`,
    authHeader()
  );
  return res.data.data; // chỉ trả CartResponse
};


// Add to cart mới: nhận mảng các item
export const addToCart = async (items: any[]) => {
  const res = await axios.post<RawCartItem[]>(
    `${BASE_URL}/Cart/items/multiple`,
    items,
    authHeader()
  );
  return res.data;
};
export const addTerrariumToCart = async (variantId: number, quantity: number) => {
  const payload = [
    {
      terrariumVariantId: variantId,
      variantQuantity: quantity
    }
  ];
  const res = await axios.post<RawCartItem[]>(
    `${BASE_URL}/Cart/add-items/multiple`, // ✅ sửa path
    payload,
    authHeader()
  );
  return res.data;
};

export const addAccessoryToCart = async (accessoryId: number, quantity: number) => {
  const payload = [
    {
      accessoryId: accessoryId,
      accessoryQuantity: quantity
    }
  ];
  const res = await axios.post<RawCartItem[]>(
    `${BASE_URL}/Cart/add-items/multiple`, // ✅ sửa path
    payload,
    authHeader()
  );
  return res.data;
};

export const addMultipleToCart = async (items: AddToCartRequest[]) => {
  return await Promise.all(items.map((item) => addToCart([item])));
};


export const updateCartItem = async (
  cartItemId: number,
  data: UpdateCartItemRequest
) => {
  const url = `${BASE_URL}/Cart/update-items/${cartItemId}`;
  console.log('Upadating cart item:', url, data); // log để kiểm tra
  const res = await axios.put(url, data, authHeader());
  return res.data;
};

export const deleteCartItem = async (cartItemId: number) => {
  const res = await axios.delete(
    `${BASE_URL}/Cart/delete-items/${cartItemId}`, // ✅ sửa endpoint
    authHeader()
  );
  return res.data;
};

export const deleteAllCartItems = async () => {
  const res = await axios.delete(
    `${BASE_URL}/Cart/delete-all-items`,
    authHeader()
  );
  return res.data;
};


export const addMultipleAccessoriesToCart = async (
  accessories: { accessoryId: number; accessoryQuantity: number }[]
) => {
  const res = await axios.post<RawCartItem[]>(
    `${BASE_URL}/Cart/add-items/multiple`,
    accessories,
    authHeader()
  );
  return res.data;
};