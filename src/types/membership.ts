// src/types/membership.ts
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

// BE nói sẽ bổ sung type & isActive cho PUT — để optional cho an toàn
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
  description: 'string'; 
}
