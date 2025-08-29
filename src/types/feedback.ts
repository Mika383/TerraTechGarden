// src/types/feedback.ts
export interface FeedbackItem {
  feedbackId: number;
  orderItemId: number;
  rating: number;          // 1..5
  comment: string;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  images: string[];        // base64 or urls (backend trả mảng)
  terrariumId: number | null;
  terrariumName: string | null;
  accessoryId: number | null;
  accessoryName: string | null;
}

export interface FeedbackQuery {
  terrariumId: number;
  page?: number;      // default 1
  pageSize?: number;  // default 5
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  page: number;
  pageSize: number;
  total?: number;     // nếu backend có trả; nếu không sẽ undefined
}
