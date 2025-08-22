export interface TerrariumLayout {
  layoutId: number;
  layoutName: string;
  status: string;
  finalPrice: number | null;
  createdDate: string;
  updatedDate: string;
  userId: number;
  terrariumId: number;
  reviewedBy: string | null;
  reviewDate: string | null;
  reviewNotes: string | null;
}

/** Bản tóm tắt dùng cho list */
export interface LayoutSummary {
  layoutId: number;
  layoutName: string;
  status: string; // 'Pending' | 'Approved' | 'Rejected' | ...
  finalPrice?: number | null;
  createdDate: string;
  updatedDate: string;
  userId: number;
  terrariumId: number;
  reviewedBy?: string | null;
  reviewDate?: string | null;
  reviewNotes?: string | null;
}
