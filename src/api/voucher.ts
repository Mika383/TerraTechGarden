// src/api/voucher.ts
import axios from 'axios';
import type { Voucher, CreateVoucherRequest, UpdateVoucherRequest } from '@/types/voucher';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// giống cách bạn dùng bên cart
const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  };
};

const pickData = (res: any) => res?.data?.data ?? res?.data ?? [];

export async function getVouchers(): Promise<Voucher[]> {
  const res = await axios.get(`${BASE_URL}/Voucher`, authHeader());
  const data = pickData(res);
  return Array.isArray(data) ? data : [];
}

export async function createVoucher(payload: CreateVoucherRequest): Promise<Voucher> {
  const res = await axios.post(`${BASE_URL}/Voucher`, payload, authHeader());
  return pickData(res) as Voucher;
}

export async function updateVoucher(id: number, payload: UpdateVoucherRequest): Promise<Voucher> {
  // nhiều BE yêu cầu có cả voucherId trong body
  const body = { voucherId: id, ...payload };
  const res = await axios.put(`${BASE_URL}/Voucher/update-voucher/${id}`, body, authHeader());
  return pickData(res) as Voucher;
}

export async function deleteVoucher(id: number): Promise<void> {
  await axios.delete(`${BASE_URL}/Voucher/delete-voucher/${id}`, authHeader());
}
