import axios from 'axios';
import {
  MembershipPackage,
  CreateMembershipPackageRequest,
  UpdateMembershipPackageRequest,
  GrantMembershipRequest,
} from '@/types/membership';
const DEBUG_MEMBERSHIP = import.meta.env.DEV === true; 
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token || ''}` } };
};

const pickData = (res: any) => res?.data?.data ?? res?.data ?? [];

/** Lấy tất cả gói membership package */
export async function getMembershipPackages(): Promise<MembershipPackage[]> {
  const res = await axios.get(`${BASE_URL}/MembershipPackage`, authHeader());
  const data = pickData(res);
  return Array.isArray(data) ? data : (data?.data ?? []);
}

/** Lấy 1 gói theo id */
export async function getMembershipPackage(id: number): Promise<MembershipPackage> {
  const res = await axios.get(`${BASE_URL}/MembershipPackage/${id}`, authHeader());
  return pickData(res) as MembershipPackage;
}

/** Tạo gói (Admin) */
export async function createMembershipPackage(payload: CreateMembershipPackageRequest) {
  const res = await axios.post(`${BASE_URL}/MembershipPackage`, payload, authHeader());
  return pickData(res);
}

/** Cập nhật gói (Admin) */
export async function updateMembershipPackage(id: number, payload: UpdateMembershipPackageRequest) {
  const body = { packageId: id, ...payload };
  const res = await axios.put(`${BASE_URL}/MembershipPackage/${id}`, body, authHeader());
  return pickData(res);
}

/** Xoá gói (Admin) */
export async function deleteMembershipPackage(id: number) {
  await axios.delete(`${BASE_URL}/MembershipPackage/${id}`, authHeader());
}

/** Cấp gói cho user (Admin) */
export async function grantMembershipToUser(payload: GrantMembershipRequest) {
  const res = await axios.post(`${BASE_URL}/Membership`, payload, authHeader());
  return pickData(res);
}

/** Lấy membership hiện tại của user.
 *  Nuốt 404 => trả null (coi như chưa có membership) */
export type UserMembership = any;

export async function getUserMembership(userId: number): Promise<UserMembership[]> {
  try {
    const res = await axios.get(`${BASE_URL}/Membership/user/${userId}`, authHeader());
    const body = res?.data;

    // BE đôi khi trả 200 nhưng body.status = 404 -> coi như chưa có
    if (body?.status === 404 || body?.data == null) {
      return [];
    }

    const data = body?.data ?? body;

    // Trả về luôn dạng mảng để phía UI chỉ cần check length
    if (Array.isArray(data)) {
      // Filter only active memberships that haven't expired
      return data.filter(membership => 
        membership.status === 'Active' && 
        new Date(membership.endDate) > new Date()
      );
    }
    if (typeof data === 'object' && data.status === 'Active' && new Date(data.endDate) > new Date()) {
      return [data];
    }
    return [];
  } catch (e: any) {
    // HTTP 404 thực sự -> chưa có
    if (e?.response?.status === 404) return [];
    throw e;
  }
}


/** Mua (đăng ký) membership cho user hiện tại */
export async function purchaseMembership(payload: { userId: number; packageId: number; startDate: string }) {
  const res = await axios.post(`${BASE_URL}/Membership/purchase`, payload, authHeader());
  return res?.data?.data ?? res?.data ?? null;
}
// ---- MoMo Direct: tạo thanh toán Membership & nhận payUrl + QR ----
export type CreateMomoDirectPayload = {
  userId: number;
  packageId: number;
  startDate: string; // ISO string
};

export type CreateMomoDirectResponse = {
  payUrl: string;
  qrImageBase64?: string;
};

export async function createMembershipMomoDirect(
  payload: CreateMomoDirectPayload
): Promise<CreateMomoDirectResponse> {
  const res = await axios.post(
    `${BASE_URL}/Membership/momo/create-direct`,
    payload,
    authHeader()
  );

  // BE có thể trả ở res.data hoặc res.data.data
  const body = res?.data?.data ?? res?.data ?? {};
  return {
    payUrl: body.payUrl || '',
    qrImageBase64: body.qrImageBase64 || '',
  };
}
