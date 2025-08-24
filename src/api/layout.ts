import axios from 'axios';
import type { LayoutSummary } from '@/types/layout';

// ===== BASE URL (fallback nếu env chưa set) =====
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://terarium.shop/api';

// ===== Auth header helper =====
const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===== Kiểu response BE có thể trả =====
type ApiList<T> = { status: number; message: string; data: T[] };
type ApiOne<T>  = { status: number; message: string; data: T | null };

// ===== Axios instance (để tiện interceptor sau này) =====
export const http = axios.create({
  baseURL: BASE_URL,
});

// (tùy chọn) interceptor 401
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // gọn nhẹ: xóa token & ném lỗi; Router có thể bắt và điều hướng /login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
    return Promise.reject(err);
  }
);

/**
 * GET /TerrariumLayout/my-layouts?userId=...
 * BE có thể trả:
 *  - [ ... ]  (mảng thô)
 *  - { status, message, data: [ ... ] }
 */
export const getMyLayouts = async (userId: number): Promise<LayoutSummary[]> => {
  const res = await http.get(`${BASE_URL}/TerrariumLayout/my-layouts`, {
    headers: authHeader(),
    params: { userId },
  });

  // Chuẩn hoá dữ liệu
  const data = res.data;
  if (Array.isArray(data)) return data as LayoutSummary[];
  if (Array.isArray(data?.data)) return data.data as LayoutSummary[];
  return [];
};

/**
 * GET /TerrariumLayout/get/{layoutId} (nếu BE có)
 */
export const getLayoutById = async (layoutId: number): Promise<LayoutSummary | null> => {
  const res = await http.get<ApiOne<LayoutSummary>>(`/TerrariumLayout/get/${layoutId}`, {
    headers: authHeader(),
  });
  const data = res.data;
  if (data?.data) return data.data;
  return null;
};

/**
 * DELETE /TerrariumLayout/{layoutId}
 * (nếu BE dùng path khác, bạn chỉ cần đổi ở đây)
 */
export const deleteLayout = async (layoutId: number) => {
  const res = await http.delete(`/TerrariumLayout/${layoutId}`, {
    headers: authHeader(),
  });
  return res.data;
};
