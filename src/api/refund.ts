// src/api/refund.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Upload 1 ảnh lên Cloudinary và trả về secure_url
 * - Sử dụng preset & cloud name bạn cung cấp
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'TerraTech'); // <- preset bạn đưa

  const res = await fetch('https://api.cloudinary.com/v1_1/dsp6pjeey/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CLOUDINARY_UPLOAD_FAILED: ${res.status} ${text}`);
  }

  const data = await res.json();
  const url: string | undefined = data?.secure_url || data?.url;
  if (!url) {
    throw new Error('CLOUDINARY_NO_URL');
  }
  return url;
};

/**
 * Gửi yêu cầu hoàn tiền cho 1 đơn hàng
 * - API mới nhất: POST /Order/{id}/Refund?userId=...
 * - Body: { orderId, reason, images[] }
 */
export const requestRefund = async ({
  orderId, userId, reason, images = [],
}: { orderId: number; userId: number; reason: string; images?: string[]; }) => {
  // chỉ giữ lại những URL hợp lệ (Cloudinary)
  const urls = (images || []).filter(u => /^https?:\/\/.*cloudinary\.com\//i.test(u));
  const body = { orderId, reason: reason.trim(), images: urls };
  const url = `${BASE_URL}/Order/${orderId}/Refund?userId=${userId}`;

  // TRACE để debug 400
  // eslint-disable-next-line no-console
  console.log('[Refund] POST', url, body);

  try {
    const res = await axios.post(url, body, authHeader());
    return res.data;
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[Refund][400?] url/body/res', url, body, err?.response?.status, err?.response?.data);
    throw err;
  }
};
