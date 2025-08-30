// src/types/feedback.ts

// Item feedback thống nhất cho cả terrarium & accessory.
// Lưu ý: backend có thể trả images là string[] hoặc [{ url }]. Ta chuẩn hóa về string[] ở tầng API.
export interface FeedbackItem {
  feedbackId: number;
  orderItemId: number;
  rating: number;          // 1..5
  comment: string;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  images: string[];        // ✅ đã chuẩn hóa tại API layer
  terrariumId: number | null;
  terrariumName: string | null;
  accessoryId: number | null;
  accessoryName: string | null;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  page: number;
  pageSize: number;
  total?: number;          // nếu backend có thêm total
}

// Query cho Terrarium feedback
export interface FeedbackQueryTerrarium {
  terrariumId: number;
  page?: number;      // default 1
  pageSize?: number;  // default 5
}

// Query cho Accessory feedback
export interface FeedbackQueryAccessory {
  accessoryId: number;
  page?: number;      // default 20 (thường)
  pageSize?: number;  // default 20
}
