import axios from 'axios';
import {
  MembershipPackage,
  CreateMembershipPackageRequest,
  UpdateMembershipPackageRequest,
  GrantMembershipRequest,
} from '@/types/membership';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token || ''}` } };
};

// Chuẩn hóa lấy body + ném lỗi khi status != 200
const norm = (res: any) => {
  const body = res?.data ?? res;
  const status = body?.status;
  const message = body?.message;
  const data = body?.data ?? body;

  // Nếu BE có field status dạng số => cho phép 2xx (200..299)
  if (typeof status === 'number' && (status < 200 || status >= 300)) {
    const err = new Error(message || 'Yêu cầu thất bại');
    (err as any).status = status;
    throw err;
  }
  return data;
};

/** Lấy tất cả gói */
export async function getMembershipPackages(): Promise<MembershipPackage[]> {
  const res = await axios.get(`${BASE_URL}/MembershipPackage`, authHeader());
  const data = norm(res);
  return Array.isArray(data) ? data : (data?.data ?? []);
}

/** Lấy 1 gói theo id */
export async function getMembershipPackage(id: number): Promise<MembershipPackage> {
  const res = await axios.get(`${BASE_URL}/MembershipPackage/${id}`, authHeader());
  return norm(res) as MembershipPackage;
}

/** Tạo gói (Admin) — ĐÚNG endpoint /create */
export async function createMembershipPackage(payload: CreateMembershipPackageRequest) {
  // Validate tối thiểu để tránh 400 từ BE
  if (!payload?.type?.trim()) throw new Error('Vui lòng nhập loại gói');
  if (!Number.isFinite(payload.durationDays) || payload.durationDays < 1) {
    throw new Error('Số ngày phải >= 1');
  }
  if (!Number.isFinite(payload.price) || payload.price < 1) {
    throw new Error('Giá phải > 0');
  }

  const res = await axios.post(
    `${BASE_URL}/MembershipPackage/create`,
    payload,
    authHeader()
  );
  return norm(res);
}

/** Cập nhật gói (Admin) */
export async function updateMembershipPackage(
  id: number,
  payload: UpdateMembershipPackageRequest
) {
  // đảm bảo id là số hợp lệ
  const pid = Number(id);
  if (!Number.isFinite(pid) || pid <= 0) {
    throw new Error('ID gói không hợp lệ');
  }

  // Một số BE yêu cầu ID nằm trong body với key cụ thể (packageId hoặc id).
  // Gửi cả hai để an toàn.
  const body = {
    packageId: pid,   // ⭐ phổ biến theo thông điệp trước đó của bạn
    id: pid,          // ⭐ fallback nếu BE đọc 'id'
    ...payload,
  };

  // URL path vẫn giữ dạng /MembershipPackage/{id}
  const res = await axios.put(`${BASE_URL}/MembershipPackage/${pid}`, body, authHeader());
  return norm(res);
}


/** Xoá gói (Admin) */
export async function deleteMembershipPackage(id: number) {
  const res = await axios.delete(`${BASE_URL}/MembershipPackage/${id}`, authHeader());
  return norm(res);
}

/** Cấp gói cho user (Admin) */
export async function grantMembershipToUser(payload: GrantMembershipRequest) {
  const res = await axios.post(`${BASE_URL}/Membership`, payload, authHeader());
  return norm(res);
}

/** Lấy membership hiện tại của user (lọc active-chưa hết hạn) */
export type UserMembership = any;

export async function getUserMembership(userId: number): Promise<UserMembership[]> {
  try {
    const res = await axios.get(`${BASE_URL}/Membership/user/${userId}`, authHeader());
    const body = res?.data;

    if (body?.status === 404 || body?.data == null) return [];
    const data = body?.data ?? body;

    const isActiveItem = (m: any) =>
      m?.status === 'Active' && m?.endDate && new Date(m.endDate) > new Date();

    if (Array.isArray(data)) return data.filter(isActiveItem);
    if (typeof data === 'object' && isActiveItem(data)) return [data];
    return [];
  } catch (e: any) {
    if (e?.response?.status === 404) return [];
    throw e;
  }
}

/** Mua membership */
export async function purchaseMembership(payload: { userId: number; packageId: number; startDate: string }) {
  const res = await axios.post(`${BASE_URL}/Membership/purchase`, payload, authHeader());
  return norm(res) ?? null;
}

// MoMo direct
export type CreateMomoDirectPayload = {
  userId: number;
  packageId: number;
  startDate: string; // ISO
};
export type CreateMomoDirectResponse = { payUrl: string; qrImageBase64?: string };

export async function createMembershipMomoDirect(
  payload: CreateMomoDirectPayload
): Promise<CreateMomoDirectResponse> {
  const res = await axios.post(`${BASE_URL}/Membership/momo/create-direct`, payload, authHeader());
  const body = norm(res) || {};
  return {
    payUrl: body.payUrl || '',
    qrImageBase64: body.qrImageBase64 || '',
  };
}
