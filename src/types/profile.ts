// src/types/profile.ts

/** Khung phản hồi chuẩn từ BE */
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/** Thông tin hồ sơ người dùng (/Profile/me) */
export interface ProfileMe {
  fullName: string;
  gender: 'male' | 'female' | 'other' | string;
  phoneNumber: string | null;
  dateOfBirth: string | null; // ISO string
  avatarUrl: string | null;
  backgroundUrl: string | null;
  email: string;
}

/** Payload cập nhật hồ sơ (/Profile/me) */
export interface UpdateProfileRequest {
  fullName: string;
  gender: 'male' | 'female' | 'other' | string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string
  email: string;
}

/** ====== Kiểu dữ liệu hành chính Việt Nam (cho Tỉnh/Quận/Phường) ====== */
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

/** ====== Địa chỉ giao hàng ======
 * LƯU Ý: KHÔNG dùng lat/long trong phiên bản này.
 */
// src/types/profile.ts
export interface Address {
  id: number;
  userId: number;
  tagName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  isDefault: boolean;

  provinceCode: string;   // vd: "79"
  districtCode: string;   // vd: "769"
  wardCode: string;       // vd: "26833"
  latitude?: string | null;
  longitude?: string | null;
}

export interface CreateAddressRequest {
  userId: number;
  tagName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude?: string | null;   // BE cho phép null -> mình cứ gửi "" thay vì null để an toàn
  longitude?: string | null;
  isDefault: boolean;
}

export type UpdateAddressRequest = CreateAddressRequest;

