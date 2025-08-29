// src/types/refund.ts
export interface RefundRequest {
  orderId: number;     // trùng với id ở path
  userId: number;      // query param
  reason: string;
  images?: string[];
}

export interface RefundResponse {
  message: string;
}
