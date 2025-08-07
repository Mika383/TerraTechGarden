export interface Address {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  tagName: string;
  isDefault: boolean;
  lat?: number; 
  lng?: number; 
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
}


export interface Ward {
  level3_id: string;
  name: string;
  type: string;
}

export interface District {
  level2_id: string;
  name: string;
  type: string;
  level3s: Ward[];
}

export interface Province {
  level1_id: string;
  name: string;
  type: string;
  level2s: District[];
}