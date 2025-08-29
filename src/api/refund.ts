// src/api/refund.ts
import { RefundRequest, RefundResponse } from '@/types/refund';
import axios from 'axios';


const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

/** Upload 1 ảnh lên Cloudinary */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'TerraTech');

  const res = await fetch('https://api.cloudinary.com/v1_1/dsp6pjeey/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('CLOUDINARY_UPLOAD_FAILED');
  const data = await res.json();
  return data?.secure_url || data?.url;
};

/** Gửi yêu cầu hoàn tiền */
export const requestRefund = async (
  req: RefundRequest
): Promise<RefundResponse> => {
  const { orderId, userId, reason, images = [] } = req;

  // chỉ giữ URL hợp lệ
  const urls = (images || []).filter((u) =>
    /^https?:\/\/.*cloudinary\.com\//i.test(u)
  );

  const body = { orderId, reason: reason.trim(), images: urls };
  const url = `${BASE_URL}/Order/${orderId}/Refund?userId=${userId}`;

  console.log('[Refund] POST', url, body);
  const res = await axios.post(url, body, authHeader());
  return res.data;
};
