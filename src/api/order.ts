import axios from 'axios';
import { Order, Voucher } from '@/types/order';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Lấy tất cả đơn hàng của user
// src/api/order.ts
export const getOrdersByUser = async (userId: number): Promise<any[]> => {
  const res = await axios.get(`${BASE_URL}/Order/getbyuserid/${userId}?userId=${userId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  // backend trả về mảng order, bạn có thể map lại data nếu muốn
  return res.data || [];
};


// Lấy một đơn hàng cụ thể từ danh sách theo orderId
export const getOrderByIdFromUser = async (userId: number, orderId: number): Promise<Order | null> => {
  const orders = await getOrdersByUser(userId);
  return orders.find(o => o.orderId === orderId) || null;
};
// src/api/order.ts
export const getOrderById = async (orderId: number): Promise<any> => {
  const res = await axios.get(`${BASE_URL}/Order/${orderId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });
  return res.data || null;
};



// Validate voucher code (chỉ check hợp lệ, trả về message)
export const validateVoucher = async (code: string): Promise<any> => {
  const res = await axios.get(
    `${BASE_URL}/Voucher/validate/${code}`,
    authHeader()
  );
  return res.data;
};

// Lấy voucher theo code (trả về chi tiết voucher nếu có)
export const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
  const res = await axios.get(
    `${BASE_URL}/Voucher/get-by-code/${code}`,
    authHeader()
  );
  return res.data || null;
};

// Tạo voucher mới (POST /Voucher)
export const createVoucher = async (data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.post(
    `${BASE_URL}/Voucher`,
    data,
    authHeader()
  );
  return res.data;
};

// Update voucher (PUT /Voucher/update-voucher/{id})
export const updateVoucher = async (id: number, data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.put(
    `${BASE_URL}/Voucher/update-voucher/${id}`,
    data,
    authHeader()
  );
  return res.data;
};

// Xóa voucher (DELETE /Voucher/delete-voucher/{id})
export const deleteVoucher = async (id: number): Promise<any> => {
  const res = await axios.delete(
    `${BASE_URL}/Voucher/delete-voucher/${id}`,
    authHeader()
  );
  return res.data;
};

