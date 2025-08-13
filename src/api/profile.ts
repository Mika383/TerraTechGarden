// src/api/profile.ts
import axios from 'axios';
import type {
  Address,
  ApiResponse,
  ProfileMe,
  UpdateProfileRequest,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types/profile';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
  },
});

/** =========================
 *  Address APIs (User)
 *  ========================= */

/** Lấy danh sách địa chỉ theo userId */
export const getAddressesByUserId = async (userId: number): Promise<Address[]> => {
  const res = await axios.get(
    `${BASE_URL}/Address/getall-by-user-id/${userId}`,
    authHeader()
  );

  // Chuẩn hoá id (đề phòng BE trả addressId)
  return (res.data?.data || []).map((item: any) => ({
    ...item,
    id: item.addressId ?? item.id,
  })) as Address[];
};

/** Thêm địa chỉ mới (KHÔNG dùng lat/long) */
export const addAddress = async (
  payload: CreateAddressRequest
): Promise<ApiResponse<null> | void> => {
  const body = {
    tagName: payload.tagName,
    receiverName: payload.receiverName,
    receiverPhone: payload.receiverPhone,
    receiverAddress: payload.receiverAddress,
    provinceCode: payload.provinceCode,
    districtCode: payload.districtCode,
    wardCode: payload.wardCode,
    isDefault: payload.isDefault,
  };

  const res = await axios.post(`${BASE_URL}/Address/add-address`, body, authHeader());
  return res.data as ApiResponse<null>;
};

/** Cập nhật địa chỉ (Bao gồm lat/long)
 *  Lưu ý endpoint BE hiện tại (theo code cũ): uodate-adrress
 *  Nếu BE sửa chính tả -> đổi về /Address/update-address/{id}
 */
export const updateAddress = async (
  id: number,
  payload: UpdateAddressRequest
): Promise<ApiResponse<null> | void> => {
  const body = {
    id,
    tagName: payload.tagName,
    receiverName: payload.receiverName,
    receiverPhone: payload.receiverPhone,
    receiverAddress: payload.receiverAddress,
    provinceCode: payload.provinceCode,
    districtCode: payload.districtCode,
    wardCode: payload.wardCode,
    latitude: payload.latitude || "",  // Gửi string rỗng thay vì null để an toàn
    longitude: payload.longitude || "",
    isDefault: payload.isDefault,
  };

  const res = await axios.put(
    `${BASE_URL}/Address/update-adrress/${id}`,
    body,
    authHeader()
  );
  return res.data as ApiResponse<null>;
};

/** Đặt địa chỉ làm mặc định 
 *  Hàm này được dùng để cập nhật bất kỳ địa chỉ nào với trạng thái isDefault
 *  Logic: Khi set một địa chỉ thành default, các địa chỉ khác sẽ được set thành false
 */
export const setDefaultAddress = async (
  id: number,
  addressData: Address
): Promise<ApiResponse<null> | void> => {
  const body = {
    id,
    tagName: addressData.tagName,
    receiverName: addressData.receiverName,
    receiverPhone: addressData.receiverPhone,
    receiverAddress: addressData.receiverAddress,
    provinceCode: addressData.provinceCode,
    districtCode: addressData.districtCode,
    wardCode: addressData.wardCode,
    latitude: addressData.latitude || "",  // Gửi string rỗng thay vì null
    longitude: addressData.longitude || "",
    isDefault: addressData.isDefault,
  };

  const res = await axios.put(
    `${BASE_URL}/Address/update-adrress/${id}`,
    body,
    authHeader()
  );
  return res.data as ApiResponse<null>;
};

/** Bỏ mặc định - Chỉ cập nhật địa chỉ cụ thể thành isDefault = false
 *  Logic: Cho phép không có địa chỉ mặc định nào (tất cả isDefault = false)
 */
export const unsetDefaultAddress = async (
  id: number,
  addressData: Address
): Promise<ApiResponse<null> | void> => {
  const body = {
    id,
    tagName: addressData.tagName,
    receiverName: addressData.receiverName,
    receiverPhone: addressData.receiverPhone,
    receiverAddress: addressData.receiverAddress,
    provinceCode: addressData.provinceCode,
    districtCode: addressData.districtCode,
    wardCode: addressData.wardCode,
    latitude: addressData.latitude || "",  // Gửi string rỗng thay vì null
    longitude: addressData.longitude || "",
    isDefault: false, // Luôn set thành false khi unset
  };

  const res = await axios.put(
    `${BASE_URL}/Address/update-adrress/${id}`,
    body,
    authHeader()
  );
  return res.data as ApiResponse<null>;
};

/** Xoá địa chỉ */
export const deleteAddress = async (id: number): Promise<ApiResponse<null> | void> => {
  const res = await axios.delete(
    `${BASE_URL}/Address/delete-address/${id}`,
    authHeader()
  );
  return res.data as ApiResponse<null>;
};

/** =========================
 *  Profile APIs (User /me)
 *  ========================= */

/** GET /Profile/me */
export async function getProfileMe(): Promise<ApiResponse<ProfileMe>> {
  const res = await axios.get(`${BASE_URL}/Profile/me`, authHeader());
  return res.data as ApiResponse<ProfileMe>;
}

/** PUT /Profile/me */
export async function updateProfileMe(
  payload: UpdateProfileRequest
): Promise<ApiResponse<null>> {
  const res = await axios.put(`${BASE_URL}/Profile/me`, payload, authHeader());
  return res.data as ApiResponse<null>;
}

/** POST /Profile/me/avatar (multipart/form-data, key: "File") */
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
  return res.data as ApiResponse<{ url?: string } | null>;
}

/** POST /Profile/me/background (multipart/form-data, key: "File") */
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
  return res.data as ApiResponse<{ url?: string } | null>;
}

/** =========================
 *  Profile APIs (Admin)
 *  ========================= */

/** GET /api/Admin/Profile/{userId} */
export async function adminGetProfileById(
  userId: number
): Promise<ApiResponse<ProfileMe>> {
  const res = await axios.get(`${BASE_URL}/Admin/Profile/${userId}`, authHeader());
  return res.data as ApiResponse<ProfileMe>;
}

/** PUT /api/Admin/Profile/{userId} */
export async function adminUpdateProfileById(
  userId: number,
  payload: UpdateProfileRequest
): Promise<ApiResponse<null>> {
  const res = await axios.put(
    `${BASE_URL}/Admin/Profile/${userId}`,
    payload,
    authHeader()
  );
  return res.data as ApiResponse<null>;
}

/** POST /api/Admin/Profile/{userId}/avatar */
export async function adminUploadAvatar(
  userId: number,
  file: File
): Promise<ApiResponse<{ url?: string } | null>> {
  const form = new FormData();
  form.append('File', file);

  const res = await axios.post(
    `${BASE_URL}/Admin/Profile/${userId}/avatar`,
    form,
    {
      ...authHeader(),
      headers: {
        ...authHeader().headers,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data as ApiResponse<{ url?: string } | null>;
}

/** POST /api/Admin/Profile/{userId}/background */
export async function adminUploadBackground(
  userId: number,
  file: File
): Promise<ApiResponse<{ url?: string } | null>> {
  const form = new FormData();
  form.append('File', file);

  const res = await axios.post(
    `${BASE_URL}/Admin/Profile/${userId}/background`,
    form,
    {
      ...authHeader(),
      headers: {
        ...authHeader().headers,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data as ApiResponse<{ url?: string } | null>;
}

/** GET /api/Admin/Profile/all */
export async function adminGetAllProfiles(): Promise<ApiResponse<ProfileMe[]>> {
  const res = await axios.get(`${BASE_URL}/Admin/Profile/all`, authHeader());
  return res.data as ApiResponse<ProfileMe[]>;
}