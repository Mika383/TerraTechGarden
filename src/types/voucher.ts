export type VoucherStatus = 'active' | 'inactive' | 'Active' | 'Inactive';

export interface Voucher {
  voucherId: number;
  code: string;
  description: string;
  discountAmount?: number | null;
  discountPercent?: number | null;
  validFrom: string; // ISO
  validTo: string;   // ISO
  status: VoucherStatus;
  isPersonal: boolean;
  targetUserId?: string | null;
  totalUsage: number;
  remainingUsage: number;
  perUserUsageLimit?: number | null;

  /** BE mới có thêm, có thể là 0 hoặc null */
  minOrderAmount?: number | null;
}

export interface CreateVoucherRequest {
  code: string;
  description: string;
  discountAmount?: number | null;
  discountPercent?: number | null;
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive' | 'Active' | 'Inactive';
  isPersonal: boolean;
  targetUserId?: string | null;
  totalUsage?: number | null;
  perUserUsageLimit?: number | null;

  /** BE mới có thêm, có thể là 0 hoặc null */
  minOrderAmount?: number | null;
}

export interface UpdateVoucherRequest extends CreateVoucherRequest {
  /** một số BE yêu cầu */
  voucherId?: number;
}
