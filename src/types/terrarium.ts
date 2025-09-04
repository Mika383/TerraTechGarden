// src/types/terrarium.ts

export interface TerrariumImage {
  terrariumImageId: number;
  terrariumId: number;
  imageUrl: string;
}

/**
 * Phụ kiện cấu hình theo từng biến thể (mới theo BE)
 * - Được trả về trong field `terrariumVariantAccessories` của mỗi `TerrariumVariant`
 * - API mới trả thêm nhiều thuộc tính chi tiết phụ kiện (name, description, price, stockQuantity, size, quantitative)
 */
export interface TerrariumVariantAccessory {
  terrariumVariantAccessoryId?: number;
  terrariumVariantId?: number;

  /** Khoá chính phụ kiện */
  accessoryId: number;

  /** Các field chi tiết phụ kiện (theo BE mới) */
  accessoryName?: string;
  accessoryDescription?: string;
  accessoryPrice?: number;
  accessoryStockQuantity?: number;
  accessorySize?: string;
  accessoryQuantitative?: string;

  /** Số lượng phụ kiện cần cho 1 đơn vị variant */
  quantity: number;
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

  /** Danh sách phụ kiện thuộc về biến thể (đủ thông tin để hiển thị & check tồn kho) */
  terrariumVariantAccessories?: TerrariumVariantAccessory[];
}

/** (Giữ nguyên bản rút gọn này nếu dự án đang dùng; nếu đã tách sang types/accessory.ts thì có thể xoá) */
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
 * LƯU Ý: Kể từ BE mới, danh sách phụ kiện HIỂN THỊ sẽ đi theo từng Variant
 * (terrariumVariantAccessories), không còn lấy trực tiếp từ Terrarium nữa.
 */
export interface Terrarium {
  terrariumId: number;
  terrariumName: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  stock: number;
  status: string;
  generatedByAI?: boolean; 
  environmentId: number;
  shapeId: number;
  tankMethodId: number;

  createdAt?: string;
  updatedAt?: string;
  bodyHTML?: string;

  terrariumImages?: TerrariumImage[];
  image?: string;

  /**
   * (Giữ lại để tương thích cũ, nhưng trang Detail sẽ KHÔNG sử dụng nữa)
   * Phụ kiện giờ đi theo từng `TerrariumVariant` → xem `terrariumVariantAccessories`
   */
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

/* =======================
   BỔ SUNG CHO LUỒNG AI & LAYOUT
   ======================= */

export interface AutoGenerateRequest {
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  accessoryId?: number; // optional nếu BE hỗ trợ
}

export interface GeneratedTerrarium {
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  terrariumName: string;
  terrariumImages: string[];
  stock: number;
  minPrice: number;
  maxPrice: number;
  description: string;
  status: string;
  bodyHTML: string;
  accessoryNames?: string[]; // BE có thể trả, FE không gửi khi tạo
}

export interface AddTerrariumByAIRequest {
  environmentId: number;
  shapeId: number;
  tankMethodId: number;
  terrariumName: string;
  terrariumImages: string[];
  stock: number;
  minPrice: number;
  maxPrice: number;
  description: string;
  status: string;
  bodyHTML: string;
}

export interface CreatedTerrarium {
  terrariumId: number;
  terrariumName?: string;
}

export interface CreateLayoutRequest {
  userId: number;
  layoutName: string;
  terrariumId: number;
}

export interface CreatedLayout {
  layoutId: number;
}

/* =======================
   TIỆN ÍCH: TÍNH SỐ LƯỢNG MUA TỐI ĐA
   ======================= */
/**
 * Tính số lượng variant tối đa có thể mua, xét đồng thời:
 *  - stock của variant (`stockQuantity`)
 *  - stock của từng phụ kiện: floor(accessoryStockQuantity / quantity yêu cầu)
 * Kết quả là min của tất cả các giới hạn.
 */
export const computeMaxPurchasable = (variant: TerrariumVariant | null | undefined): number => {
  if (!variant) return 0;
  const variantLimit = Math.max(0, Number(variant.stockQuantity || 0));

  const accessories = variant.terrariumVariantAccessories ?? [];
  if (!accessories.length) return variantLimit;

  const accessoryLimit = accessories.reduce((min, acc) => {
    const needPerUnit = Math.max(0, Number(acc.quantity || 0));
    if (needPerUnit === 0) return min; // không giới hạn bởi phụ kiện này
    const inStock = Math.max(0, Number(acc.accessoryStockQuantity || 0));
    const canMake = Math.floor(inStock / needPerUnit);
    return Math.min(min, canMake);
  }, Number.POSITIVE_INFINITY);

  return Math.max(0, Math.min(variantLimit, accessoryLimit));
};
