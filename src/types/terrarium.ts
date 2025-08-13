// src/types/terrarium.ts

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

export interface Environment {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
  terrarium?: any[];
}

export interface Shape {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
}

export interface TankMethod {
  // Một số API dùng tankMethodName, một số dùng tankMethodType → để optional cả hai
  tankMethodId: number;
  tankMethodName?: string;
  tankMethodType?: string;
  tankMethodDescription: string;
}

/**
 * Terrarium – mở rộng thêm các field từ endpoint mới:
 * - thumbnailUrl
 * - averageRating, feedbackCount, purchaseCount
 */
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
  environment?: Environment;
  shape?: Shape;
  tankMethod?: TankMethod;

  // Field từ các API /featured, /best-sellers, /top-rated, /newest
  thumbnailUrl?: string | null;
  averageRating?: number | null;
  feedbackCount?: number | null;
  purchaseCount?: number | null;
}
