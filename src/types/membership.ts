export interface MembershipPackage {
  id: number;
  type: string;
  durationDays: number;
  price: number;
  description: string;
  isActive: boolean;
  memberships?: any;
}

export interface CreateMembershipPackageRequest {
  type: string;
  durationDays: number;
  price: number;
  description: string;
  isActive: boolean;
}

export interface UpdateMembershipPackageRequest {
  type?: string;
  durationDays?: number;
  price?: number;
  description?: string;
  isActive?: boolean;
}

export interface GrantMembershipRequest {
  userId: number;
  packageId: number;
  startDate: string;
  price?: number;
  durationDays: number;
  description: string; // <-- sửa từ 'string' -> string
}
