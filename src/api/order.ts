// src/api/order.ts
import axios from 'axios';
import type { Order, Voucher, CreateOrderRequest } from '@/types/order';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getOrdersByUser = async (userId: number): Promise<Order[]> => {
  const res = await axios.get(`${BASE_URL}/Order/get-all-by-userid/${userId}?userId=${userId}`, authHeader());
  return res.data || [];
};

export const getAllOrdersAdmin = async (): Promise<Order[]> => {
  const res = await axios.get(`${BASE_URL}/Order`, authHeader());
  return res.data?.data || [];
};

export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const res = await axios.get(`${BASE_URL}/Order/${orderId}`, authHeader());
  return res.data?.data || null;
};

type CreateOrderAPIResponse =
  | { orderId?: number }
  | { data?: { orderId?: number } }
  | any;

export const createOrder = async (
  payload: CreateOrderRequest
): Promise<{ orderId: number }> => {
  const res = await axios.post<CreateOrderAPIResponse>(`${BASE_URL}/Order`, payload, authHeader());
  const orderId =
    (res.data && (res.data.orderId ?? res.data?.data?.orderId)) ?? undefined;

  if (!orderId) {
    throw new Error('ORDER_ID_MISSING');
  }
  return { orderId };
};

export const validateVoucher = async (code: string): Promise<any> => {
  const res = await axios.get(`${BASE_URL}/Voucher/validate/${code}`, authHeader());
  return res.data;
};

export const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
  const res = await axios.get(`${BASE_URL}/Voucher/get-by-code/${code}`, authHeader());
  return res.data || null;
};

export const createVoucher = async (data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.post(`${BASE_URL}/Voucher`, data, authHeader());
  return res.data;
};

export const updateVoucher = async (id: number, data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.put(`${BASE_URL}/Voucher/update-voucher/${id}`, data, authHeader());
  return res.data;
};

export const deleteVoucher = async (id: number): Promise<any> => {
  const res = await axios.delete(`${BASE_URL}/Voucher/delete-voucher/${id}`, authHeader());
  return res.data;
};
