// src/api/feedback.ts
import axios from 'axios';
import type {
  FeedbackItem,
  FeedbackListResponse,
  FeedbackQueryTerrarium,
  FeedbackQueryAccessory
} from '@/types/feedback';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
});

// ---- Create / Update feedback (dùng chung) ----
export interface CreateFeedbackBody {
  orderItemId: number;
  rating: number;
  comment: string;
}

export const createFeedback = async (body: CreateFeedbackBody) => {
  const res = await axios.post(`${BASE_URL}/Feedback`, body, authHeader());
  return res.data?.data ?? res.data ?? {};
};

export const uploadFeedbackImage = async (feedbackId: number, file: File) => {
  const form = new FormData();
  form.append('FeedbackId', String(feedbackId));
  form.append('ImageFile', file);
  const res = await axios.post(`${BASE_URL}/FeedbackImage/add-image`, form, authHeader());
  return res.data?.data ?? res.data ?? {};
};

export const updateFeedback = async (
  feedbackId: number,
  body: { rating: number; comment: string }
) => {
  const res = await axios.put(`${BASE_URL}/Feedback/${feedbackId}`, body, authHeader());
  return res.data?.data ?? res.data ?? {};
};

// ---- Helpers ----
const normalizeImages = (arr: any): string[] =>
  (Array.isArray(arr) ? arr : [])
    .map((it) => (typeof it === 'string' ? it : it?.url))
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);

// ---- Terrarium feedback ----
export async function getTerrariumFeedbacks(
  params: FeedbackQueryTerrarium
): Promise<FeedbackListResponse> {
  const { terrariumId, page = 1, pageSize = 5 } = params;

  const url = `${BASE_URL}/Feedback/terrarium/${terrariumId}?page=${page}&pageSize=${pageSize}`;
  const res = await axios.get(url, authHeader());

  // Backend mẫu có thể trả mảng thô []
  const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  const items: FeedbackItem[] = (raw ?? []).map((it: any) => ({
    ...it,
    images: normalizeImages(it?.images),
  }));

  return { items, page, pageSize, total: undefined };
}

// ---- Accessory feedback (API riêng) ----
export async function getAccessoryFeedbacks(
  params: FeedbackQueryAccessory
): Promise<FeedbackListResponse> {
  const { accessoryId, page = 1, pageSize = 20 } = params;

  const url = `${BASE_URL}/Feedback/accessory/${accessoryId}?page=${page}&pageSize=${pageSize}`;
  const res = await axios.get(url, authHeader());

  // Backend mẫu của bạn: images = [{ feedbackId, feedbackImageId, url }]
  const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  const items: FeedbackItem[] = (raw ?? []).map((it: any) => ({
    ...it,
    images: normalizeImages(it?.images),
  }));

  return { items, page, pageSize, total: undefined };
}
