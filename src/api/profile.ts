// src/api/profile.ts
import axios from 'axios';
import {
  Address,
  ApiResponse,
  ProfileMe,
  UpdateProfileRequest,
} from '@/types/profile';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});

/** =========================
 *  Address APIs (User)
 *  ========================= */

// Lấy danh sách địa chỉ theo userId
export const getAddressesByUserId = async (userId: number): Promise<Address[]> => {
  const res = await axios.get(
    `${BASE_URL}/Address/getall-by-user-id/${userId}`,
    authHeader()
  );
  // Map đề phòng BE trả về addressId thay vì id
  return (res.data?.data || []).map((item: any) => ({
    ...item,
    id: item.addressId ?? item.id,
  }));
};

// Thêm địa chỉ mới
export const addAddress = async (address: Omit<Address, 'id'>): Promise<ApiResponse<null> | void> => {
  const res = await axios.post(
    `${BASE_URL}/Address/add-address`,
    address,
    authHeader()
  );
  return res.data;
};

// Đặt làm mặc định
export const setDefaultAddress = async (
  id: number,
  currentData: Omit<Address, 'id'>
): Promise<ApiResponse<null> | void> => {
  const res = await axios.put(
    // NOTE: nếu BE chuẩn là 'update-address' thì đổi lại giúp mình
    `${BASE_URL}/Address/uodate-adrress/${id}`,
    { ...currentData, id, isDefault: true },
    authHeader()
  );
  return res.data;
};

// Bỏ mặc định
export const unsetDefaultAddress = async (
  id: number,
  currentData: Omit<Address, 'id'>
): Promise<ApiResponse<null> | void> => {
  const res = await axios.put(
    `${BASE_URL}/Address/uodate-adrress/${id}`,
    { ...currentData, id, isDefault: false },
    authHeader()
  );
  return res.data;
};

// Sửa địa chỉ
export const updateAddress = async (
  id: number,
  address: Omit<Address, 'id'>
): Promise<ApiResponse<null> | void> => {
  const res = await axios.put(
    `${BASE_URL}/Address/uodate-adrress/${id}`,
    { ...address, id },
    authHeader()
  );
  return res.data;
};

// Xoá địa chỉ
export const deleteAddress = async (id: number): Promise<ApiResponse<null> | void> => {
  const res = await axios.delete(
    `${BASE_URL}/Address/delete-address/${id}`,
    authHeader()
  );
  return res.data;
};

/** =========================
 *  Profile APIs (User /me)
 *  ========================= */

// GET /Profile/me
export async function getProfileMe(): Promise<ApiResponse<ProfileMe>> {
  const res = await axios.get(`${BASE_URL}/Profile/me`, authHeader());
  return res.data;
}

// PUT /Profile/me
export async function updateProfileMe(
  payload: UpdateProfileRequest
): Promise<ApiResponse<null>> {
  const res = await axios.put(`${BASE_URL}/Profile/me`, payload, authHeader());
  return res.data;
}

// POST /Profile/me/avatar (multipart/form-data, key: "File")
export async function uploadAvatar(
  file: File
): Promise<ApiResponse<{ url?: string } | null>> {
  const form = new FormData();
  form.append('File', file);
  const res = await axios.post(`${BASE_URL}/Profile/me/avatar`, form, {
    ...authHeader(),
    headers: {
      ...authHeader().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// POST /Profile/me/background (multipart/form-data, key: "File")
export async function uploadBackground(
  file: File
): Promise<ApiResponse<{ url?: string } | null>> {
  const form = new FormData();
  form.append('File', file);
  const res = await axios.post(`${BASE_URL}/Profile/me/background`, form, {
    ...authHeader(),
    headers: {
      ...authHeader().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

/** =========================
 *  Profile APIs (Admin)
 *  ========================= */

// GET /api/Admin/Profile/{userId}
export async function adminGetProfileById(userId: number): Promise<ApiResponse<ProfileMe>> {
  const res = await axios.get(`${BASE_URL}/Admin/Profile/${userId}`, authHeader());
  return res.data;
}

// PUT /api/Admin/Profile/{userId}
export async function adminUpdateProfileById(
  userId: number,
  payload: UpdateProfileRequest
): Promise<ApiResponse<null>> {
  const res = await axios.put(`${BASE_URL}/Admin/Profile/${userId}`, payload, authHeader());
  return res.data;
}

// POST /api/Admin/Profile/{userId}/avatar
export async function adminUploadAvatar(
  userId: number,
  file: File
): Promise<ApiResponse<{ url?: string } | null>> {
  const form = new FormData();
  form.append('File', file);
  const res = await axios.post(`${BASE_URL}/Admin/Profile/${userId}/avatar`, form, {
    ...authHeader(),
    headers: {
      ...authHeader().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// POST /api/Admin/Profile/{userId}/background
export async function adminUploadBackground(
  userId: number,
  file: File
): Promise<ApiResponse<{ url?: string } | null>> {
  const form = new FormData();
  form.append('File', file);
  const res = await axios.post(`${BASE_URL}/Admin/Profile/${userId}/background`, form, {
    ...authHeader(),
    headers: {
      ...authHeader().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// GET /api/Admin/Profile/all
export async function adminGetAllProfiles(): Promise<ApiResponse<ProfileMe[]>> {
  const res = await axios.get(`${BASE_URL}/Admin/Profile/all`, authHeader());
  return res.data;
}
