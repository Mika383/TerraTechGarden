// src/utils/orderDisplayTransform.ts
import type { Order, OrderItem } from '@/types/order';

// ===== Types để hiển thị (tương tự Cart) =====
export interface DisplayBundle {
  mainItem: {
    terrariumId: number; // 0 nếu chưa suy luận được
    cartItemId?: number;
    itemType: string;
  };
  bundleAccessories: DisplayItem[];
  totalBundlePrice: number;
  totalBundleQuantity: number;
}

export interface DisplayItem {
  orderItemId: number;
  cartItemId?: number;
  terrariumId?: number | null;
  accessoryId?: number | null;
  terrariumVariantId?: number | null;
  comboId?: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  // enriched
  name?: string;
  image?: string;
}

export interface DisplayCombo extends DisplayItem {
  comboItems?: any[];
}

export interface TransformedOrderDisplay {
  bundleItems: DisplayBundle[];
  singleItems: DisplayItem[];
  comboItems: DisplayCombo[];
  totalAmount: number;
  totalQuantity: number;
}

// ===== Utils =====
export const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';
export const keyOfItem = (item: DisplayItem) => `oi_${item.orderItemId}`;
export const keyOfBundle = (bundle: DisplayBundle) => `b_${bundle.mainItem.terrariumId}`;
export const keyOfCombo = (combo: DisplayCombo) => `combo_${combo.orderItemId}`;

/**
 * Suy luận terrariumId cho các item BUNDLE_ACCESSORY dựa vào MAIN_ITEM gần nhất.
 * Nếu không tìm được, để nguyên null/0 — UI sẽ fallback.
 */
export const inferTerrariumForBundleAccessories = (orderItems: OrderItem[]): OrderItem[] => {
  const result = [...orderItems];
  let currentTerrariumId: number | null = null;

  result.forEach((item, index) => {
    if (item.itemType === 'MAIN_ITEM') {
      // Nếu API trả null terrariumId cho MAIN_ITEM, ta vẫn giữ để UI fetch bằng terrariumVariantId
      currentTerrariumId = item.terrariumId ?? null;
    } else if (item.itemType === 'BUNDLE_ACCESSORY' && currentTerrariumId) {
      result[index] = { ...item, terrariumId: currentTerrariumId };
    }
  });
  return result;
};

/**
 * Transform Order data thành cấu trúc display (tương tự Cart) — bản chuẩn.
 */
export const transformOrderForDisplay = (order: Order): TransformedOrderDisplay => {
  const orderItems = order.orderItems || [];

  const bundleMap = new Map<number, DisplayItem[]>(); // key = terrariumId (0 nếu chưa xác định)
  const singles: DisplayItem[] = [];
  const combos: DisplayCombo[] = [];

  let totalAmount = 0;
  let totalQuantity = 0;

  orderItems.forEach((item: OrderItem) => {
    totalAmount += item.totalPrice || 0;
    totalQuantity += item.quantity || 0;

    const displayItem: DisplayItem = {
      orderItemId: item.orderItemId,
      terrariumId: item.terrariumId ?? null,
      accessoryId: item.accessoryId ?? null,
      terrariumVariantId: item.terrariumVariantId ?? null,
      comboId: item.comboId ?? null,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      itemType: item.itemType || 'UNKNOWN',
    };

    if (item.itemType === 'BUNDLE_ACCESSORY') {
      const key = displayItem.terrariumId ?? 0; // 0 = chưa suy luận được
      if (!bundleMap.has(key)) bundleMap.set(key, []);
      bundleMap.get(key)!.push(displayItem);
    } else if (item.comboId && item.comboId > 0) {
      combos.push({ ...displayItem, comboItems: [] });
    } else {
      singles.push(displayItem);
    }
  });

  const bundleItems: DisplayBundle[] = [];
  bundleMap.forEach((accessories, keyTid) => {
    if (accessories.length === 0) return;
    const totalBundlePrice = accessories.reduce((s, it) => s + (it.totalPrice || 0), 0);
    const totalBundleQuantity = accessories.reduce((s, it) => s + (it.quantity || 0), 0);
    bundleItems.push({
      mainItem: {
        terrariumId: keyTid || 0,
        itemType: 'MAIN_ITEM',
      },
      bundleAccessories: accessories,
      totalBundlePrice,
      totalBundleQuantity,
    });
  });

  return {
    bundleItems,
    singleItems: singles,
    comboItems: combos,
    totalAmount,
    totalQuantity,
  };
};

/**
 * Bản cải tiến: tiền xử lý suy luận terrariumId cho bundle accessories.
 */
export const transformOrderForDisplayImproved = (order: Order): TransformedOrderDisplay => {
  const processedItems = inferTerrariumForBundleAccessories(order.orderItems || []);

  return transformOrderForDisplay({
    ...order,
    orderItems: processedItems,
  });
};

/**
 * Tách dữ liệu để render: bundles có accessory, và singles (kể cả main terrarium nếu cần)
 */
export const separateBundlesAndSingles = (transformed: TransformedOrderDisplay) => {
  const bundlesToShow = transformed.bundleItems.filter(
    (b) => (b.bundleAccessories?.length || 0) > 0
  );

  // Nếu bundle nào không có accessory thì convert thành 1 single để hiển thị
  const variantSinglesFromBundles = transformed.bundleItems
    .filter((b) => (b.bundleAccessories?.length || 0) === 0)
    .map((b) => ({
      orderItemId: b.mainItem.cartItemId || 0,
      terrariumId: b.mainItem.terrariumId || null,
      terrariumVariantId: null,
      accessoryId: null,
      comboId: null,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      itemType: 'MAIN_ITEM',
    }));

  const mergedSingles = [...variantSinglesFromBundles, ...transformed.singleItems];

  return {
    bundlesToShow,
    mergedSingles,
    comboItems: transformed.comboItems,
  };
};
