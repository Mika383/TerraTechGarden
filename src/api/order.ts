import axios from 'axios';
import { Order } from '@/types/order';

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
export const getOrdersByUser = async (userId: number): Promise<Order[]> => {
  const res = await axios.get(`${BASE_URL}/Order/getbyuserid/${userId}?userId=${userId}`, authHeader());
  return res.data || [];
};

// Lấy một đơn hàng cụ thể từ danh sách theo orderId
export const getOrderByIdFromUser = async (userId: number, orderId: number): Promise<Order | null> => {
  const orders = await getOrdersByUser(userId);
  return orders.find(o => o.orderId === orderId) || null;
};
export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const res = await axios.get(`${BASE_URL}/Order/${orderId}`, authHeader());
  return res.data?.data || null;
};



