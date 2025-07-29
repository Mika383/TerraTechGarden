import { RawCartItem } from '@/types/cart';

export type CartItemType = 'accessory' | 'variant';

/**
 * Gộp các cart item theo loại (accessoryId hoặc variantId)
 * để hiển thị tổng quantity và tổng price như 1 dòng duy nhất
 */
export const groupCartItems = (items: RawCartItem[]) => {
  const grouped: Record<string, RawCartItem> = {};

  items.forEach((item) => {
    const key =
      item.accessoryId !== null
        ? `a-${item.accessoryId}`
        : item.terrariumVariantId !== null
        ? `v-${item.terrariumVariantId}`
        : '';

    if (!key) return;

    if (!grouped[key]) {
      grouped[key] = { ...item };
    } else {
      grouped[key].totalCartQuantity += item.totalCartQuantity;
      grouped[key].totalCartPrice += item.totalCartPrice;
      grouped[key].item[0].quantity += item.item[0].quantity;
      grouped[key].item[0].totalPrice += item.item[0].totalPrice;
    }
  });

  return Object.values(grouped);
};

/**
 * Lọc toàn bộ cart items cùng loại (accessory hoặc variant)
 */
export const getAllMatchingItems = (
  items: RawCartItem[],
  id: number,
  type: CartItemType
) => {
  return items.filter((item) =>
    type === 'accessory'
      ? item.accessoryId === id
      : item.terrariumVariantId === id
  );
};

/**
 * Tìm cart item có quantity nhỏ nhất (dùng để giảm)
 */
export const findItemToDecrease = (items: RawCartItem[]) => {
  return items.reduce((min, item) =>
    item.totalCartQuantity < min.totalCartQuantity ? item : min
  );
};

/**
 * Tìm cart item có quantity lớn nhất (dùng để tăng)
 */
export const findItemToIncrease = (items: RawCartItem[]) => {
  return items.reduce((max, item) =>
    item.totalCartQuantity > max.totalCartQuantity ? item : max
  );
};
