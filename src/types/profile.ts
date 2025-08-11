// src/types/profile.ts
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/** Hồ sơ người dùng (me) */
export interface ProfileMe {
  fullName: string;
  gender: 'male' | 'female' | 'other' | string;
  phoneNumber: string | null;
  dateOfBirth: string | null; // ISO string
  avatarUrl: string | null;
  backgroundUrl: string | null;
  email: string;
}

/** Payload cập nhật hồ sơ */
export interface UpdateProfileRequest {
  fullName: string;
  gender: 'male' | 'female' | 'other' | string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string
  email: string;
}

/** Địa chỉ giao hàng */
export interface Address {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  tagName: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
}

export interface Ward {
  level3_id: string;
  name: string;
  type: string;
}
export interface District {
  level2_id: string;
  name: string;
  type: string;
  level3s: Ward[];
}
export interface Province {
  level1_id: string;
  name: string;
  type: string;
  level2s: District[];
}
