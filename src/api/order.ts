// src/api/order.ts
import axios from 'axios';
import type { Order, Voucher, CreateOrderRequest, CreateOrderItem } from '@/types/order';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token || ''}` } };
};

// —— Helpers an toàn với nhiều kiểu bọc dữ liệu khác nhau —— //
const pickData = <T,>(res: any): T => (res?.data?.data ?? res?.data ?? null) as T;

// =========================== ORDERS =========================== //

/** Lấy tất cả đơn theo user */
export const getOrdersByUser = async (userId: number): Promise<Order[]> => {
  const res = await axios.get(
    `${BASE_URL}/Order/get-all-by-userid/${userId}?userId=${userId}`,
    authHeader()
  );
  return (pickData<Order[] | any>(res) ?? []) as Order[];
};

/** Lấy tất cả đơn (admin) */
export const getAllOrdersAdmin = async (): Promise<Order[]> => {
  const res = await axios.get(`${BASE_URL}/Order`, authHeader());
  return (pickData<Order[] | any>(res) ?? []) as Order[];
};

/** Lấy 1 đơn theo id */
export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const res = await axios.get(`${BASE_URL}/Order/${orderId}`, authHeader());
  const data = pickData<Order | { order: Order } | null>(res);

  const order: Order | null =
    (data && (data as any).orderId ? (data as Order) : (data as any)?.order) ?? null;

  return order;
};

// ======================= CREATE ORDER ==================== //

type CreateOrderAPIResponse =
  | { orderId?: number }
  | { data?: { orderId?: number } }
  | { result?: { orderId?: number } }
  | any;

// Chuẩn hoá 1 item để gửi lên BE (điền 0 cho field không dùng)
const normalizeItem = (item: CreateOrderItem) => {
  const base = {
    itemType: item.itemType ?? '',

    // COMBO
    comboId: item.comboId ?? 0,
    comboQuantity: item.comboQuantity ?? 0,

    // Terrarium / Accessory
    terrariumVariantId: item.terrariumVariantId ?? 0,
    accessoryId: item.accessoryId ?? 0,
    accessoryQuantity: item.accessoryQuantity ?? 0,

    terrariumVariantQuantity: item.terrariumVariantQuantity ?? 0,
  };

  switch (item.itemType) {
    case 'COMBO':
      return {
        ...base,
        terrariumVariantId: 0,
        accessoryId: 0,
        accessoryQuantity: 0,
        terrariumVariantQuantity: 0,
      };
    case 'BUNDLE_ACCESSORY':
      // Không truyền terrariumId nữa, chỉ gắn theo variant + accessory
      return {
        ...base,
        terrariumVariantQuantity: 0,
      };
    case 'MAIN_ITEM':
      return {
        ...base,
        accessoryId: 0,
        accessoryQuantity: 0,
      };
    case 'SINGLE':
      return {
        ...base,
        terrariumVariantId: 0,
        terrariumVariantQuantity: 0,
      };
    default:
      return base;
  }
};

export const createOrder = async (
  payload: CreateOrderRequest
): Promise<{ orderId: number }> => {
  const normalizedPayload = {
    voucherId: payload.voucherId ?? 0,
    deposit: payload.deposit ?? 0,
    addressId: payload.addressId ?? 0,

    totalAmountOld: payload.totalAmountOld ?? 0,
    totalAmountNew: payload.totalAmountNew ?? 0,

    items: (payload.items || []).map(normalizeItem),
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
    const err: any = new Error('ORDER_ID_MISSING');
    err.response = { data: body };
    throw err;
  }
  return { orderId };
};

// ============================ VOUCHER ========================= //

export const validateVoucher = async (code: string): Promise<any> => {
  const res = await axios.get(`${BASE_URL}/Voucher/validate/${code}`, authHeader());
  return res.data;
};

export const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
  const res = await axios.get(`${BASE_URL}/Voucher/get-by-code/${code}`, authHeader());
  return (pickData<Voucher | null>(res) as any) ?? null;
};

export const createVoucher = async (data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.post(`${BASE_URL}/Voucher`, data, authHeader());
  return pickData<Voucher>(res);
};

export const updateVoucher = async (id: number, data: Omit<Voucher, 'voucherId'>): Promise<Voucher> => {
  const res = await axios.put(`${BASE_URL}/Voucher/update-voucher/${id}`, data, authHeader());
  return pickData<Voucher>(res);
};

export const deleteVoucher = async (id: number): Promise<any> => {
  const res = await axios.delete(`${BASE_URL}/Voucher/delete-voucher/${id}`, authHeader());
  return res.data;
};

// ============================ WALLET ========================== //

export const getWalletBalance = async (userId: number): Promise<number> => {
  const res = await axios.get(`${BASE_URL}/Wallet/balance?userId=${userId}`, authHeader());
  const data = pickData<number | { balance: number }>(res);
  if (typeof data === 'number') return data;
  return (data as any)?.balance ?? 0;
};

export const useWalletForPayment = async (payload: {
  userId: number;
  amount: number;
  orderId: number;
}): Promise<any> => {
  const res = await axios.post(`${BASE_URL}/Wallet/pay`, payload, authHeader());
  return res.data;
};

// ============================ PAYMENT ========================= //

/** Expect response: { payUrl: string; qrImageBase64?: string } */
export const createMoMoPayment = async (payload: {
  orderId: number;
  orderInfo: string;
  payAll: boolean;
}): Promise<{ payUrl: string; qrImageBase64: string }> => {
  const res = await axios.post(`${BASE_URL}/Payment/momo/create`, payload, authHeader());
  const raw = res?.data ?? {};
  const payUrl: string = raw?.payUrl ?? raw?.data?.payUrl ?? raw?.url ?? '';
  const qrImageBase64: string = raw?.qrImageBase64 ?? raw?.data?.qrImageBase64 ?? '';
  if (!payUrl) {
    const err: any = new Error('MOMO_PAYMENT_URL_NOT_FOUND');
    err.response = { data: raw };
    throw err;
  }
  return { payUrl, qrImageBase64 };
};

// ============================ CANCEL ========================== //

export const cancelOrder = async (
  orderId: number,
  userId: number,
  body: { cancelReason: string; additionalNotes?: string }
): Promise<any> => {
  const res = await axios.put(
    `${BASE_URL}/Order/${orderId}/cancel?userId=${userId}`,
    { cancelReason: body.cancelReason, additionalNotes: body.additionalNotes ?? '' },
    authHeader()
  );
  return res.data;
};
