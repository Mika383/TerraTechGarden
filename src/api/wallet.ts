// src/api/wallet.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken') || '';
  return { headers: { Authorization: `Bearer ${token}` } };
};

/** Chuẩn hoá số (BE có thể trả 1050655.9, hoặc {data: 1050655.9}) */
const pickNumber = (res: any): number => {
  const raw = res?.data?.data ?? res?.data;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
};

/** GET /Wallet/balance?userId= */
export async function getWalletBalance(userId: number): Promise<number> {
  const res = await axios.get(`${BASE_URL}/Wallet/balance`, {
    params: { userId },
    ...authHeader(),
  });
  return pickNumber(res);
}

/** POST /Wallet/pay?userId=&amount=&orderId=  (body rỗng, y hệt Swagger) */
export async function useWalletForPayment(opts: {
  userId: number;
  amount: number;
  orderId: number;
}): Promise<number> {
  const { userId, amount, orderId } = opts;

  const res = await axios.post(
    `${BASE_URL}/Wallet/pay`,
    null, // body rỗng để BE bind query params
    {
      params: { userId, amount, orderId },
      ...authHeader(),
    }
  );

  // BE trả số dư mới sau khi trừ
  return pickNumber(res);
}



