// src/api/feedback.ts
import { FeedbackItem, FeedbackListResponse, FeedbackQuery } from '@/types/feedback';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
});

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
  const res = await axios.post(
    `${BASE_URL}/FeedbackImage/add-image`,
    form,
    authHeader()
  );
  return res.data?.data ?? res.data ?? {};
};

export const updateFeedback = async (
  feedbackId: number,
  body: { rating: number; comment: string }
) => {
  const res = await axios.put(
    `${BASE_URL}/Feedback/${feedbackId}`,
    body,
    authHeader()
  );
  return res.data?.data ?? res.data ?? {};
};
export async function getTerrariumFeedbacks(
  params: FeedbackQuery
): Promise<FeedbackListResponse> {
  const { terrariumId, page = 1, pageSize = 5 } = params;

  const url = `${BASE_URL}/Feedback/terrarium/${terrariumId}?page=${page}&pageSize=${pageSize}`;
  const res = await axios.get(url, authHeader());

  // Backend sample trả thẳng mảng [] không bọc data:
  const raw = Array.isArray(res.data) ? (res.data as FeedbackItem[]) : (res.data?.data ?? []);

  return {
    items: raw ?? [],
    page,
    pageSize,
    total: undefined, // Chưa có total từ backend
  };
}