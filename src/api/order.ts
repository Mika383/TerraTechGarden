// src/api/order.ts
import axios from 'axios';
import type { Order, Voucher, CreateOrderRequest } from '@/types/order';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ---- ORDERS (user/admin) ----
export const getOrdersByUser = async (userId: number): Promise<Order[]> => {
  const res = await axios.get(
    `${BASE_URL}/Order/get-all-by-userid/${userId}?userId=${userId}`,
    authHeader()
  );
  // hỗ trợ cả response bọc/không bọc
  return (res.data?.data ?? res.data ?? []) as Order[];
};

export const getAllOrdersAdmin = async (): Promise<Order[]> => {
  const res = await axios.get(`${BASE_URL}/Order`, authHeader());
  return (res.data?.data ?? res.data ?? []) as Order[];
};

export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const res = await axios.get(`${BASE_URL}/Order/${orderId}`, authHeader());
  return (res.data?.data ?? res.data ?? null) as Order | null;
};

// ---- CREATE ORDER (API MỚI) ----
type CreateOrderAPIResponse =
  | { orderId?: number }
  | { data?: { orderId?: number } }
  | { result?: { orderId?: number } }
  | any;

export const createOrder = async (
  payload: CreateOrderRequest
): Promise<{ orderId: number }> => {
  // ✅ ép payload về dạng chuẩn, các field trống sẽ để = 0
  const normalizedPayload = {
    voucherId: payload.voucherId ?? 0,
    deposit: payload.deposit ?? 0,
    addressId: payload.addressId ?? 0,
    comboId: payload.comboId ?? 0,
    totalAmount: payload.totalAmount ?? 0,
    items: (payload.items || []).map((item) => ({
        itemType: item.itemType ?? "",
        terrariumId: (item as any).terrariumId ?? 0,           // ✅ thêm dòng này
        accessoryId: item.accessoryId ?? 0,
        terrariumVariantId: item.terrariumVariantId ?? 0,
        accessoryQuantity: item.accessoryQuantity ?? 0,
        terrariumVariantQuantity: item.terrariumVariantQuantity ?? 0,
      })),

  };
                        
  const res = await axios.post<CreateOrderAPIResponse>(
    `${BASE_URL}/Order`,
    normalizedPayload,
    authHeader()
  );

  const body = res?.data ?? {};
  const orderId: number | undefined =
    body.orderId ?? body?.data?.orderId ?? body?.result?.orderId;

  if (!orderId) {
    const err: any = new Error("ORDER_ID_MISSING");
    err.response = { data: body };
    throw err;
  }
  return { orderId };
};


// ---- VOUCHER ----
export const validateVoucher = async (code: string): Promise<any> => {
  const res = await axios.get(`${BASE_URL}/Voucher/validate/${code}`, authHeader());
  return res.data;
};

export const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
  const res = await axios.get(`${BASE_URL}/Voucher/get-by-code/${code}`, authHeader());
  // hỗ trợ cả `data` hoặc trả thẳng object
  return (res.data?.data ?? res.data ?? null) as Voucher | null;
};

export const createVoucher = async (data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.post(`${BASE_URL}/Voucher`, data, authHeader());
  return (res.data?.data ?? res.data) as Voucher;
};

export const updateVoucher = async (id: number, data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.put(`${BASE_URL}/Voucher/update-voucher/${id}`, data, authHeader());
  return (res.data?.data ?? res.data) as Voucher;
};

export const deleteVoucher = async (id: number): Promise<any> => {
  const res = await axios.delete(`${BASE_URL}/Voucher/delete-voucher/${id}`, authHeader());
  return res.data;
};

// ---- WALLET ----
export const getWalletBalance = async (userId: number): Promise<number> => {
  const res = await axios.get(`${BASE_URL}/Wallet/balance?userId=${userId}`, authHeader());
  return (res.data?.data ?? res.data ?? 0) as number;
};

export const useWalletForPayment = async (payload: {
  userId: number;
  amount: number;
  orderId: number;
}): Promise<any> => {
  const res = await axios.post(`${BASE_URL}/Wallet/pay`, payload, authHeader());
  return res.data;
};

// ---- MoMo PAYMENT (giữ lại duy nhất) ----
/**
 * Expect response:
 * { payUrl: string; qrImageBase64?: string }
 */
export const createMoMoPayment = async (payload: {
  orderId: number;
  orderInfo: string;
  payAll: boolean;
}): Promise<{ payUrl: string; qrImageBase64: string }> => {
  const res = await axios.post(`${BASE_URL}/Payment/momo/create`, payload, authHeader());

  // hỗ trợ nhiều dạng trả về
  const raw = res?.data ?? {};
  const payUrl: string =
    raw?.payUrl ?? raw?.data?.payUrl ?? raw?.url ?? '';
  const qrImageBase64: string =
    raw?.qrImageBase64 ?? raw?.data?.qrImageBase64 ?? '';

  if (!payUrl) {
    const err: any = new Error('MOMO_PAYMENT_URL_NOT_FOUND');
    err.response = { data: raw };
    throw err;
  }
  return { payUrl, qrImageBase64 };
};

export const cancelOrder = async (
  orderId: number,
  userId: number,
  body: { cancelReason: string; additionalNotes?: string }
): Promise<any> => {
  const res = await axios.put(
    `${BASE_URL}/Order/${orderId}/cancel?userId=${userId}`,
    {
      cancelReason: body.cancelReason,
      additionalNotes: body.additionalNotes ?? '',
    },
    authHeader()
  );
  return res.data;
};