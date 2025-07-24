export interface AccessoryImage {
  accessoryImageId: number;
  accessoryId: number;
  imageUrl: string;
}

export interface Accessory {
  accessoryId: number;
  name: string;
  size: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  accessoryImages: AccessoryImage[];
}

export interface AccessoryCategory {
  categoryId: number;
  categoryName: string;
  description: string;
}

