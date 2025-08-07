import axios from 'axios';
import { Address } from '@/types/profile';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});

// Lấy danh sách địa chỉ (mapping addressId -> id nếu cần)
export const getAddressesByUserId = async (userId: number): Promise<Address[]> => {
  const res = await axios.get(`${BASE_URL}/Address/get-by-user-id/${userId}`, authHeader());
  return (res.data?.data || []).map((item: any) => ({
    ...item,
    id: item.addressId ?? item.id, // mapping nếu BE trả addressId
  }));
};

// Thêm địa chỉ mới
export const addAddress = async (address: Omit<Address, 'id'>): Promise<void> => {
  await axios.post(`${BASE_URL}/Address/add-address`, address, authHeader());
};

// Đặt làm mặc định
export const setDefaultAddress = async (
  id: number,
  currentData: Omit<Address, 'id'>
): Promise<void> => {
  // Nhớ truyền đủ field, phải có id trong body
  await axios.put(`${BASE_URL}/Address/uodate-adrress/${id}`, {
    ...currentData,
    id,
    isDefault: true,
  }, authHeader());
};

// Bỏ mặc định
export const unsetDefaultAddress = async (
  id: number,
  currentData: Omit<Address, 'id'>
): Promise<void> => {
  await axios.put(`${BASE_URL}/Address/uodate-adrress/${id}`, {
    ...currentData,
    id,
    isDefault: false,
  }, authHeader());
};

// Xoá địa chỉ
export const deleteAddress = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/Address/delete-address/${id}`, authHeader());
};

// Sửa địa chỉ
export const updateAddress = async (
  id: number,
  address: Omit<Address, 'id'>
): Promise<void> => {
  await axios.put(`${BASE_URL}/Address/uodate-adrress/${id}`, {
    ...address,
    id,
  }, authHeader());
};
