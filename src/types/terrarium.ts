export interface TerrariumImage {
  terrariumImageId: number;
  terrariumId: number;
  imageUrl: string;
}

export interface TerrariumVariant {
  terrariumVariantId: number;
  terrariumId: number;
  variantName: string;
  price: number;
  stockQuantity: number;
  urlImage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Accessory {
  accessoryId: number;
  name: string;
  description: string;
  price: number;
}

// ✅ Thêm interface cho Environment
export interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
  terrarium?: any[];
}

// ✅ Thêm interface cho Shape và TankMethod nếu cần
export interface Shape {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
}

export interface TankMethod {
  tankMethodId: number;
  tankMethodName: string;
  tankMethodDescription: string;
}

export interface Terrarium {
  terrariumId: number;
  terrariumName: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  stock: number;
  status: string;
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  createdAt?: string;
  updatedAt?: string;
  bodyHTML?: string;
  terrariumImages?: TerrariumImage[];
  image?: string; 
  accessories?: Accessory[];
  environment?: Environment; // ✅ Thêm environment object
  shape?: Shape; // ✅ Thêm shape object nếu cần
  tankMethod?: TankMethod; // ✅ Thêm tankMethod object nếu cần
}

export interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
}

export interface TankMethod {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
}
