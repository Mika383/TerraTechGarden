// src/api/voucher.ts
import axios from 'axios';
import type { Voucher, CreateVoucherRequest, UpdateVoucherRequest } from '@/types/voucher';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Đọc token giống các module khác
const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  };
};

// Helper pick data an toàn với nhiều kiểu đóng gói
const pickData = <T,>(res: any): T => (res?.data?.data ?? res?.data ?? null) as T;

/**
 * GET /api/Voucher
 * Trả về danh sách voucher
 */
export async function getVouchers(): Promise<Voucher[]> {
  const res = await axios.get(`${BASE_URL}/Voucher`, authHeader());
  const data = pickData<Voucher[] | any>(res);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

/**
 * POST /api/Voucher
 * Tạo voucher mới
 * - Hỗ trợ đầy đủ field theo spec mới (bao gồm minOrderAmount)
 */
export async function createVoucher(payload: CreateVoucherRequest): Promise<Voucher> {
  const res = await axios.post(`${BASE_URL}/Voucher`, payload, authHeader());
  return pickData<Voucher>(res);
}

/**
 * PUT /api/Voucher/update-voucher/{id}
 * Cập nhật voucher
 * - Nhiều BE yêu cầu có cả voucherId trong body
 */
export async function updateVoucher(id: number, payload: UpdateVoucherRequest): Promise<Voucher> {
  const body = { voucherId: id, ...payload };
  const res = await axios.put(`${BASE_URL}/Voucher/update-voucher/${id}`, body, authHeader());
  return pickData<Voucher>(res);
}

/**
 * DELETE /api/Voucher/delete-voucher/{id}
 * Xoá voucher
 */
export async function deleteVoucher(id: number): Promise<void> {
  await axios.delete(`${BASE_URL}/Voucher/delete-voucher/${id}`, authHeader());
}

/**
 * GET /api/Voucher/get-by-code/{code}
 * Lấy chi tiết voucher theo code
 */
export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  const res = await axios.get(`${BASE_URL}/Voucher/get-by-code/${code}`, authHeader());
  const data = pickData<Voucher | null>(res);
  return (data as any) ?? null;
}

/**
 * GET /api/Voucher/validate/{code}
 * Validate code (tuỳ BE trả gì, để any)
 */
export async function validateVoucher(code: string): Promise<any> {
  const res = await axios.get(`${BASE_URL}/Voucher/validate/${code}`, authHeader());
  return res?.data;
}
