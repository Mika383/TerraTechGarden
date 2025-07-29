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
  const res = await axios.get<CartResponse>(`${BASE_URL}/Cart`, authHeader());
  return res.data;
};

export const addToCart = async (item: AddToCartRequest) => {
  const res = await axios.post<RawCartItem>(`${BASE_URL}/Cart/items/multiple`, item, authHeader());
  return res.data;
};

export const addMultipleToCart = async (items: AddToCartRequest[]) => {
  return await Promise.all(items.map((item) => addToCart(item)));
};

export const updateCartItem = async (
  cartItemId: number,
  data: UpdateCartItemRequest
) => {
  const res = await axios.put(`${BASE_URL}/Cart/items/${cartItemId}`, data, authHeader());
  return res.data;
};

export const deleteCartItem = async (cartItemId: number) => {
  const res = await axios.delete(`${BASE_URL}/Cart/items/${cartItemId}`, authHeader());
  return res.data;
};
