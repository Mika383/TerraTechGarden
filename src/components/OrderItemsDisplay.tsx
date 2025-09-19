// src/components/OrderItemsDisplay.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTerrariumById, getTerrariumVariantById } from '@/api/terrarium';
import { getAccessoryById } from '@/api/accessory';
import { getComboById } from '@/api/combo';
import {
  transformOrderForDisplayImproved,
  separateBundlesAndSingles,
  currency,
  keyOfBundle,
  keyOfCombo,
  type DisplayItem,
} from '@/utils/orderDisplayTransform';
import type { Order } from '@/types/order';

const FALLBACK_IMG = '/TerraTechLogo.png';

interface OrderItemsDisplayProps {
  order: Order;
  showActions?: boolean;
  onReviewItem?: (item: any) => void;
  className?: string;
}

/** Mở rộng kiểu hiển thị cục bộ để đọc các field optional BE trả về */
type DisplayItemExt = DisplayItem & {
  accessoryId?: number;
  terrariumId?: number;
  terrariumVariantId?: number;
};

type ComboMetaItem = {
  accessoryId?: number | null;
  terrariumVariantId?: number | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
};

type ComboEnrichedItem = ComboMetaItem & {
  name?: string;
  image?: string;
  type?: 'accessory' | 'terrarium';
  variantName?: string | null;
  id?: number; // terrariumId nếu là terrarium
};

/** NEW: gom đủ meta của Terrarium từ variantId (id + tên + ảnh + tên variant) */
type TerrFromVariant = { id: number; name: string; thumb: string; variantName?: string };

const OrderItemsDisplay: React.FC<OrderItemsDisplayProps> = ({
  order,
  showActions = false,
  onReviewItem,
  className = '',
}) => {
  const navigate = useNavigate();

  // 1) Chuẩn hoá dữ liệu order -> cấu trúc hiển thị
  const transformedData = useMemo(() => transformOrderForDisplayImproved(order), [order]);
  const { bundlesToShow, mergedSingles, comboItems } = useMemo(
    () => separateBundlesAndSingles(transformedData),
    [transformedData]
  );
  const mergedSinglesEx = useMemo(() => mergedSingles as DisplayItemExt[], [mergedSingles]);

  // 2) UI state
  const [bundleOpen, setBundleOpen] = useState<Record<string, boolean>>({});
  const [comboOpen, setComboOpen] = useState<Record<string, boolean>>({});

  // 3) Meta caches
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [terrariumThumb, setTerrariumThumb] = useState<Record<number, string>>({});

  /** NEW: meta theo variant → id + name + thumb + variantName */
  const [terrFromVariant, setTerrFromVariant] = useState<Record<number, TerrFromVariant>>({});

  const [accessoryName, setAccessoryName] = useState<Record<number, string>>({});
  const [accessoryThumb, setAccessoryThumb] = useState<Record<number, string>>({});

  const [comboMeta, setComboMeta] = useState<
    Record<number, { name: string; image: string; items: ComboEnrichedItem[] }>
  >({});

  // === TERRARIUM META BY terrariumId ===
  useEffect(() => {
    const fetchTerrariumMeta = async () => {
      const ids = new Set<number>();

      bundlesToShow.forEach((b) => {
        const tid = (b.mainItem as DisplayItemExt).terrariumId;
        if (tid) ids.add(tid);
      });
      mergedSinglesEx.forEach((it) => {
        if (it.terrariumId) ids.add(it.terrariumId);
      });

      const missing = [...ids].filter((id) => !terrariumName[id] || !terrariumThumb[id]);
      if (!missing.length) return;

      const pairs = await Promise.all(
        missing.map(async (id) => {
          try {
            const t = await getTerrariumById(id);
            return {
              id,
              name: t?.terrariumName || `Bộ terrarium #${id}`,
              thumb: t?.terrariumImages?.[0]?.imageUrl || t?.thumbnailUrl || FALLBACK_IMG,
            };
          } catch {
            return { id, name: `Bộ terrarium #${id}`, thumb: FALLBACK_IMG };
          }
        })
      );

      setTerrariumName((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.id] = p.name;
        return next;
      });
      setTerrariumThumb((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.id] = p.thumb;
        return next;
      });
    };
    fetchTerrariumMeta();
  }, [bundlesToShow, mergedSinglesEx, terrariumName, terrariumThumb]);

  // === NEW: TERRARIUM + VARIANT META BY variantId (gồm cả bundle header) ===
  useEffect(() => {
    const fetchTerrariumMetaByVariant = async () => {
      const variantIds = new Set<number>();

      // Singles chưa có terrariumId → lấy theo variant
      mergedSinglesEx.forEach((it) => {
        if (!it.terrariumId && it.terrariumVariantId) variantIds.add(it.terrariumVariantId);
      });

      // Bundle main (để header hiện đúng tên bể) — Fallback lấy từ 1 accessory trong bundle
      bundlesToShow.forEach((b) => {
        let v = (b.mainItem as DisplayItemExt).terrariumVariantId;
        const t = (b.mainItem as DisplayItemExt).terrariumId;
        if (!v) {
          const found = (b.bundleAccessories || []).find((x) => (x as any).terrariumVariantId);
          v = found ? (found as any).terrariumVariantId : undefined;
        }
        if (!t && v) variantIds.add(v);
      });

      const missing = [...variantIds].filter((vid) => !terrFromVariant[vid]);
      if (!missing.length) return;

      const pairs = await Promise.all(
        missing.map(async (variantId) => {
          try {
            const variant = await getTerrariumVariantById(variantId);
            if (!variant) throw new Error('no-variant');
            const t = await getTerrariumById(variant.terrariumId);
            return {
              variantId,
              data: {
                id: variant.terrariumId,
                name: t?.terrariumName || variant.variantName || `Terrarium #${variant.terrariumId}`,
                thumb:
                  variant.urlImage ||
                  t?.terrariumImages?.[0]?.imageUrl ||
                  t?.thumbnailUrl ||
                  FALLBACK_IMG,
                variantName: variant.variantName || undefined,
              } as TerrFromVariant,
            };
          } catch {
            return {
              variantId,
              data: { id: 0, name: `Terrarium variant #${variantId}`, thumb: FALLBACK_IMG } as TerrFromVariant,
            };
          }
        })
      );

      const add: Record<number, TerrFromVariant> = {};
      pairs.forEach((p) => (add[p.variantId] = p.data));
      setTerrFromVariant((m) => ({ ...m, ...add }));
    };

    fetchTerrariumMetaByVariant();
  }, [bundlesToShow, mergedSinglesEx, terrFromVariant]);

  // === ACCESSORY META ===
  useEffect(() => {
    const fetchAccessoryMeta = async () => {
      const ids = new Set<number>();
      bundlesToShow.forEach((b) => {
        (b.bundleAccessories || []).forEach((e) => {
          const ex = e as DisplayItemExt;
          if (ex.accessoryId) ids.add(ex.accessoryId);
        });
      });
      mergedSinglesEx.forEach((e) => {
        if (e.accessoryId) ids.add(e.accessoryId);
      });

      const missing = [...ids].filter((id) => !accessoryName[id] || !accessoryThumb[id]);
      if (!missing.length) return;

      const pairs = await Promise.all(
        missing.map(async (id) => {
          try {
            const a = await getAccessoryById(id);
            return {
              id,
              name: a?.name || `Phụ kiện #${id}`,
              thumb: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
            };
          } catch {
            return { id, name: `Phụ kiện #${id}`, thumb: FALLBACK_IMG };
          }
        })
      );

      setAccessoryName((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.id] = p.name;
        return next;
      });
      setAccessoryThumb((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.id] = p.thumb;
        return next;
      });
    };
    fetchAccessoryMeta();
  }, [bundlesToShow, mergedSinglesEx, accessoryName, accessoryThumb]);

  // === COMBO META (enrich từng item trong combo) ===
  useEffect(() => {
    const fetchComboMeta = async () => {
      const comboIds = new Set<number>();
      comboItems.forEach((item) => {
        if (item.comboId) comboIds.add(item.comboId);
      });

      const missing = [...comboIds].filter((id) => !comboMeta[id]);
      if (!missing.length) return;

      const comboResults = await Promise.all(
        missing.map(async (comboId) => {
          try {
            const comboData = await getComboById(comboId);
            const items: ComboEnrichedItem[] = await Promise.all(
              (comboData?.items as ComboMetaItem[] | undefined)?.map(async (ci) => {
                if (ci?.accessoryId) {
                  try {
                    const a = await getAccessoryById(ci.accessoryId);
                    return {
                      ...ci,
                      name: a?.name || `Phụ kiện #${ci.accessoryId}`,
                      image: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
                      type: 'accessory',
                    } as ComboEnrichedItem;
                  } catch {
                    return {
                      ...ci,
                      name: `Phụ kiện #${ci.accessoryId}`,
                      image: FALLBACK_IMG,
                      type: 'accessory',
                    } as ComboEnrichedItem;
                  }
                }

                if (ci?.terrariumVariantId) {
                  try {
                    const variant = await getTerrariumVariantById(ci.terrariumVariantId);
                    if (!variant) {
                      return {
                        ...ci,
                        name: `Terrarium variant #${ci.terrariumVariantId}`,
                        image: FALLBACK_IMG,
                        type: 'terrarium',
                      } as ComboEnrichedItem;
                    }
                    const terrarium = await getTerrariumById(variant.terrariumId);
                    return {
                      ...ci,
                      name:
                        terrarium?.terrariumName ||
                        variant.variantName ||
                        `Terrarium #${variant.terrariumId}`,
                      image:
                        variant.urlImage ||
                        terrarium?.terrariumImages?.[0]?.imageUrl ||
                        terrarium?.thumbnailUrl ||
                        FALLBACK_IMG,
                      type: 'terrarium',
                      variantName: variant.variantName,
                      id: variant.terrariumId,
                    } as ComboEnrichedItem;
                  } catch {
                    return {
                      ...ci,
                      name: `Terrarium variant #${ci.terrariumVariantId}`,
                      image: FALLBACK_IMG,
                      type: 'terrarium',
                    } as ComboEnrichedItem;
                  }
                }

                return { ...ci } as ComboEnrichedItem;
              }) ?? []
            );

            return {
              comboId,
              name: comboData?.name || `Combo #${comboId}`,
              image: comboData?.imageUrl || FALLBACK_IMG,
              items,
            };
          } catch {
            return { comboId, name: `Combo #${comboId}`, image: FALLBACK_IMG, items: [] as ComboEnrichedItem[] };
          }
        })
      );

      setComboMeta((prev) => {
        const next = { ...prev };
        comboResults.forEach((c) => (next[c.comboId] = { name: c.name, image: c.image, items: c.items }));
        return next;
      });
    };

    fetchComboMeta();
  }, [comboItems, comboMeta]);

  // Helper dựng tên/ảnh cho 1 item order
  const getEnrichedItem = (item: DisplayItemExt) => {
    if (item.accessoryId) {
      return {
        name: accessoryName[item.accessoryId] || `Phụ kiện #${item.accessoryId}`,
        image: accessoryThumb[item.accessoryId] || FALLBACK_IMG,
      };
    }
    if (item.terrariumId) {
      return {
        name: terrariumName[item.terrariumId] || `Bộ terrarium #${item.terrariumId}`,
        image: terrariumThumb[item.terrariumId] || FALLBACK_IMG,
      };
    }
    if (item.terrariumVariantId) {
      const vm = terrFromVariant[item.terrariumVariantId];
      return {
        name: vm?.name || `Terrarium variant #${item.terrariumVariantId}`,
        image: vm?.thumb || FALLBACK_IMG,
      };
    }
    return { name: 'Sản phẩm', image: FALLBACK_IMG };
  };

  // Chia single items: MAIN (variant) vs ACCESSORY lẻ
  const mainSingles = useMemo(
    () => mergedSinglesEx.filter((i) => !!i.terrariumVariantId),
    [mergedSinglesEx]
  );
  const accessorySingles = useMemo(
    () => mergedSinglesEx.filter((i) => !!i.accessoryId),
    [mergedSinglesEx]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* === SẢN PHẨM CHÍNH (variant) === */}
      {mainSingles.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b font-semibold">Sản phẩm chính</div>
          <div className="divide-y">
            {mainSingles.map((item) => {
              const { name: itemName, image: itemImage } = getEnrichedItem(item);
              const vname = item.terrariumVariantId
                ? terrFromVariant[item.terrariumVariantId]?.variantName
                : undefined;

              return (
                <div key={item.orderItemId} className="p-4 flex items-center gap-3">
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                    onClick={async () => {
                      if (item.terrariumId) {
                        navigate(`/terrarium/${item.terrariumId}`);
                      } else if (item.terrariumVariantId) {
                        const vm = terrFromVariant[item.terrariumVariantId];
                        if (vm?.id) navigate(`/terrarium/${vm.id}`);
                      }
                    }}
                    onError={(ev) => {
                      (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{itemName}</div>
                    {vname && (
                      <div className="text-sm text-gray-500">
                        Phân loại: <b>{vname}</b>
                      </div>
                    )}
                    <div className="text-sm text-green-600 font-semibold">
                      {currency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">SL: {item.quantity}</div>
                  <div className="w-32 text-right font-semibold text-gray-800">
                    {currency(item.totalPrice)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === BUNDLE (BỘ PHỤ KIỆN THEO BỂ) === */}
      {bundlesToShow.map((bundle) => {
        const mainEx = bundle.mainItem as DisplayItemExt;

        // Lấy variant cho header: ưu tiên mainItem, fallback từ 1 accessory
        let vid = mainEx.terrariumVariantId;
        if (!vid) {
          const f = (bundle.bundleAccessories || []).find((x) => (x as any).terrariumVariantId);
          vid = f ? (f as any).terrariumVariantId : undefined;
        }

        const vMeta = vid ? terrFromVariant[vid] : undefined;
        const derivedTid = mainEx.terrariumId || vMeta?.id;

        const name = derivedTid
          ? (terrariumName[derivedTid] || vMeta?.name || `Bộ terrarium #${derivedTid}`)
          : (vMeta?.name || 'Bộ phụ kiện (chưa xác định bể)');

        const thumb = derivedTid
          ? (terrariumThumb[derivedTid] || vMeta?.thumb || FALLBACK_IMG)
          : (vMeta?.thumb || FALLBACK_IMG);

        const vname = vMeta?.variantName;
        const bundleId = keyOfBundle(bundle);
        const isOpen = bundleOpen[bundleId] ?? false;

        return (
          <div key={bundleId} className="bg-white rounded-lg shadow border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={thumb}
                  alt={name}
                  className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                  onClick={() => derivedTid && navigate(`/terrarium/${derivedTid}`)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
                <div className="font-semibold">
                  Bộ phụ kiện của{' '}
                  {derivedTid ? (
                    <button
                      onClick={() => navigate(`/terrarium/${derivedTid}`)}
                      className="text-green-700 hover:underline"
                    >
                      {name}
                    </button>
                  ) : (
                    <span>{name}</span>
                  )}
                  {vname ? <span> • {vname}</span> : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">
                  SL: <b>{bundle.totalBundleQuantity}</b>
                </div>
                <div className="text-sm text-green-700 font-semibold">
                  {currency(bundle.totalBundlePrice)}
                </div>
                <button
                  onClick={() => setBundleOpen((m) => ({ ...m, [bundleId]: !isOpen }))}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  {isOpen ? 'Thu gọn' : 'Mở rộng'}
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="divide-y">
                {bundle.bundleAccessories.map((raw) => {
                  const item = raw as DisplayItemExt;
                  const { name: itemName, image: itemImage } = getEnrichedItem(item);
                  return (
                    <div key={item.orderItemId} className="p-4 flex items-center gap-3">
                      <img
                        src={itemImage}
                        alt={itemName}
                        className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                        onClick={() => item.accessoryId && navigate(`/accessory/${item.accessoryId}`)}
                        onError={(ev) => {
                          (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{itemName}</div>
                        <div className="text-sm text-gray-600">{currency(item.unitPrice)}</div>
                      </div>
                      <div className="text-sm text-gray-700">SL: {item.quantity}</div>
                      <div className="w-32 text-right font-semibold text-gray-800">
                        {currency(item.totalPrice)}
                      </div>
                      {showActions && (
                        <div className="flex gap-2">
                          {item.accessoryId && (
                            <button
                              onClick={() => navigate(`/accessory/${item.accessoryId}`)}
                              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                            >
                              Xem
                            </button>
                          )}
                          {onReviewItem && (
                            <button
                              onClick={() => onReviewItem(item)}
                              className="px-3 py-1 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                            >
                              Đánh giá
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* === SẢN PHẨM LẺ (accessory) === */}
      {accessorySingles.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b font-semibold">Sản phẩm lẻ</div>
          <div className="divide-y">
            {accessorySingles.map((item) => {
              const { name: itemName, image: itemImage } = getEnrichedItem(item);
              return (
                <div key={item.orderItemId} className="p-4 flex items-center gap-3">
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                    onClick={() => item.accessoryId && navigate(`/accessory/${item.accessoryId}`)}
                    onError={(ev) => {
                      (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{itemName}</div>
                    <div className="text-sm text-green-600 font-semibold">
                      {currency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">SL: {item.quantity}</div>
                  <div className="w-32 text-right">
                    <div className="font-semibold text-gray-800">
                      {currency(item.totalPrice)}
                    </div>
                  </div>
                  {showActions && (
                    <div className="flex gap-2">
                      {item.accessoryId && (
                        <button
                          onClick={() => navigate(`/accessory/${item.accessoryId}`)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                        >
                          Xem
                        </button>
                      )}
                      {onReviewItem && (
                        <button
                          onClick={() => onReviewItem(item)}
                          className="px-3 py-1 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderItemsDisplay;
