// src/api/paymentConfig.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export type PaymentConfig = {
  depositPercent: number;
  fullPaymentDiscountPercent: number;
  freeshipAmount: number;
  orderAmount: number;
  description: string;
  updatedAt?: string;
};

export const getPaymentConfig = async (): Promise<PaymentConfig> => {
  const res = await axios.get(`${BASE_URL}/PaymentConfig/1`, authHeader());
  return res.data?.data ?? res.data;
};
