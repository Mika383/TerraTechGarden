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
  // Có thể BE có thêm danh sách terrarium; để optional để không vỡ kiểu
  terrarium?: any[];
}

export interface Shape {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
  shapeMaterial?: string; // có trong /Shape/get-all
}

export interface TankMethod {
  // Một số API dùng tankMethodName, một số dùng tankMethodType → optional cả hai
  tankMethodId: number;
  tankMethodName?: string;
  tankMethodType?: string;
  tankMethodDescription: string;
}

/**
 * Terrarium – mở rộng thêm các field từ endpoint mới:
 * - thumbnailUrl
 * - averageRating, feedbackCount, purchaseCount
 * - liên kết đầy đủ: environment, shape, tankMethod (để hiển thị theo tên)
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

  // Liên kết đã enrich từ các API tên
  environment?: Environment;
  shape?: Shape;
  tankMethod?: TankMethod;

  // Dành cho các API home sections
  thumbnailUrl?: string | null;
  averageRating?: number | null;
  feedbackCount?: number | null;
  purchaseCount?: number | null;
}
