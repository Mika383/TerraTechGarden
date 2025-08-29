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

// Kiểu item trả về từ API combo.items (cho chắc chắn, cho phép null)
type ComboMetaItem = {
  accessoryId?: number | null;
  terrariumVariantId?: number | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
};

// Kiểu item đã enrich (không ép chặt null → tránh TS error)
type ComboEnrichedItem = ComboMetaItem & {
  name?: string;
  image?: string;
  type?: 'accessory' | 'terrarium';
  variantName?: string | null;
  id?: number; // terrariumId nếu là terrarium
};

const OrderItemsDisplay: React.FC<OrderItemsDisplayProps> = ({
  order,
  showActions = false,
  onReviewItem,
  className = '',
}) => {
  const navigate = useNavigate();

  // 1) Chuẩn hoá dữ liệu order -> cấu trúc hiển thị giống Cart
  const transformedData = useMemo(() => transformOrderForDisplayImproved(order), [order]);
  const { bundlesToShow, mergedSingles, comboItems } = useMemo(
    () => separateBundlesAndSingles(transformedData),
    [transformedData]
  );

  // 2) UI state
  const [bundleOpen, setBundleOpen] = useState<Record<string, boolean>>({});
  const [comboOpen, setComboOpen] = useState<Record<string, boolean>>({});

  // 3) Meta caches
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [terrariumThumb, setTerrariumThumb] = useState<Record<number, string>>({});
  const [terrariumNameByVariant, setTerrariumNameByVariant] = useState<Record<number, string>>({});
  const [terrariumThumbByVariant, setTerrariumThumbByVariant] = useState<Record<number, string>>({});

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
        const tid = b.mainItem.terrariumId;
        if (tid) ids.add(tid);
      });
      mergedSingles.forEach((it) => {
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
  }, [bundlesToShow, mergedSingles]);

  // === TERRARIUM META BY variantId (khi API trả terrariumId = null) ===
  useEffect(() => {
    const fetchTerrariumMetaByVariant = async () => {
      const variantIds = new Set<number>();

      mergedSingles.forEach((it) => {
        if (!it.terrariumId && it.terrariumVariantId) variantIds.add(it.terrariumVariantId);
      });

      const missing = [...variantIds].filter(
        (vid) => !terrariumNameByVariant[vid] || !terrariumThumbByVariant[vid]
      );
      if (!missing.length) return;

      const pairs = await Promise.all(
        missing.map(async (variantId) => {
          try {
            const variant = await getTerrariumVariantById(variantId);
            if (!variant) throw new Error('no-variant');
            const t = await getTerrariumById(variant.terrariumId);
            return {
              variantId,
              name: t?.terrariumName || variant.variantName || `Terrarium #${variant.terrariumId}`,
              thumb:
                variant.urlImage ||
                t?.terrariumImages?.[0]?.imageUrl ||
                t?.thumbnailUrl ||
                FALLBACK_IMG,
            };
          } catch {
            return {
              variantId,
              name: `Terrarium variant #${variantId}`,
              thumb: FALLBACK_IMG,
            };
          }
        })
      );

      setTerrariumNameByVariant((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.variantId] = p.name;
        return next;
      });
      setTerrariumThumbByVariant((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.variantId] = p.thumb;
        return next;
      });
    };

    fetchTerrariumMetaByVariant();
  }, [mergedSingles, terrariumNameByVariant, terrariumThumbByVariant]);

  // === ACCESSORY META ===
  useEffect(() => {
    const fetchAccessoryMeta = async () => {
      const ids = new Set<number>();
      bundlesToShow.forEach((b) => {
        (b.bundleAccessories || []).forEach((e) => {
          if (e.accessoryId) ids.add(e.accessoryId);
        });
      });
      mergedSingles.forEach((e) => {
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
  }, [bundlesToShow, mergedSingles]);

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
                // Accessory trong combo
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

                // Terrarium (thông qua variant) trong combo
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

                // fallback
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
  const getEnrichedItem = (item: DisplayItem) => {
    // Accessory
    if (item.accessoryId) {
      return {
        name: accessoryName[item.accessoryId] || `Phụ kiện #${item.accessoryId}`,
        image: accessoryThumb[item.accessoryId] || FALLBACK_IMG,
      };
    }

    // Terrarium: nếu có terrariumId → lấy theo terrariumId,
    // nếu không có mà có variantId → lấy theo variantId
    if (item.terrariumId) {
      return {
        name: terrariumName[item.terrariumId] || `Bộ terrarium #${item.terrariumId}`,
        image: terrariumThumb[item.terrariumId] || FALLBACK_IMG,
      };
    }

    if (item.terrariumVariantId) {
      return {
        name:
          terrariumNameByVariant[item.terrariumVariantId] ||
          `Terrarium variant #${item.terrariumVariantId}`,
        image: terrariumThumbByVariant[item.terrariumVariantId] || FALLBACK_IMG,
      };
    }

    return { name: 'Sản phẩm', image: FALLBACK_IMG };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* === COMBO SECTION === */}
      {comboItems.map((ci) => {
        const comboKey = keyOfCombo(ci);
        const isOpen = comboOpen[comboKey] ?? false;
        const meta = ci.comboId ? comboMeta[ci.comboId] : undefined;

        return (
          <div key={ci.orderItemId} className="bg-white rounded-lg shadow border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={meta?.image || FALLBACK_IMG}
                  alt={meta?.name || `Combo #${ci.comboId}`}
                  className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                  onClick={() => ci.comboId && navigate(`/combo/${ci.comboId}`)}
                  onError={(ev) => {
                    (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
                <div className="font-semibold">
                  <button
                    onClick={() => ci.comboId && navigate(`/combo/${ci.comboId}`)}
                    className="text-green-700 hover:underline"
                  >
                    {meta?.name || `Combo #${ci.comboId}`}
                  </button>
                  <div className="text-sm text-gray-500">
                    Combo gồm {meta?.items?.length ?? 0} sản phẩm
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">SL: {ci.quantity}</div>
                <div className="text-sm text-purple-700 font-semibold">
                  {currency(ci.totalPrice)}
                </div>
                <button
                  onClick={() => setComboOpen((m) => ({ ...m, [comboKey]: !isOpen }))}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  {isOpen ? 'Thu gọn' : 'Mở rộng'}
                </button>
                {showActions && onReviewItem && (
                  <button
                    onClick={() => onReviewItem(ci)}
                    className="px-3 py-1 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                  >
                    Đánh giá
                  </button>
                )}
              </div>
            </div>

            {isOpen && meta?.items && (
              <div className="divide-y bg-gray-50">
                <div className="px-4 py-2 text-sm text-gray-600 font-medium bg-purple-50 border-b">
                  Sản phẩm trong combo:
                </div>
                {meta.items.map((item, idx) => (
                  <div key={`combo-item-${idx}`} className="p-4 flex items-center gap-3">
                    <div className="w-5" />
                    <img
                      src={item.image || FALLBACK_IMG}
                      alt={item.name || 'Sản phẩm'}
                      className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                      onClick={() => {
                        if (item.type === 'accessory' && item.accessoryId) {
                          navigate(`/accessory/${item.accessoryId}`);
                        } else if (item.type === 'terrarium' && item.id) {
                          navigate(`/terrarium/${item.id}`);
                        }
                      }}
                      onError={(ev) => {
                        (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {item.name || 'Sản phẩm'}
                      </div>
                      {item.variantName && (
                        <div className="text-sm text-gray-500">Phân loại: {item.variantName}</div>
                      )}
                      <div className="text-sm text-gray-600">{currency(item.unitPrice || 0)}</div>
                    </div>
                    <div className="text-sm text-gray-700 px-3 py-1 bg-gray-100 rounded">
                      SL: {item.quantity || 1}
                    </div>
                    <div className="w-32 text-right font-semibold text-gray-800">
                      {currency(item.totalPrice || item.unitPrice || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* === BUNDLE (BỘ PHỤ KIỆN THEO BỂ) === */}
      {bundlesToShow.map((bundle) => {
        const tid = bundle.mainItem.terrariumId; // có thể là 0 nếu chưa suy luận được
        const bundleId = keyOfBundle(bundle);
        const name =
          (tid && terrariumName[tid]) ||
          (tid ? `Bộ terrarium #${tid}` : 'Bộ phụ kiện (chưa xác định bể)');
        const thumb = (tid && terrariumThumb[tid]) || FALLBACK_IMG;
        const isOpen = bundleOpen[bundleId] ?? false;

        return (
          <div key={bundleId} className="bg-white rounded-lg shadow border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={thumb}
                  alt={name}
                  className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                  onClick={() => tid && navigate(`/terrarium/${tid}`)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
                <div className="font-semibold">
                  Bộ phụ kiện của{' '}
                  {tid ? (
                    <button
                      onClick={() => navigate(`/terrarium/${tid}`)}
                      className="text-green-700 hover:underline"
                    >
                      {name}
                    </button>
                  ) : (
                    <span>{name}</span>
                  )}
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
                {bundle.bundleAccessories.map((item) => {
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

      {/* === SINGLE ITEMS (SẢN PHẨM LẺ) === */}
      {mergedSingles.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b font-semibold">Sản phẩm lẻ</div>
          <div className="divide-y">
            {mergedSingles.map((item) => {
              const { name: itemName, image: itemImage } = getEnrichedItem(item);
              return (
                <div key={item.orderItemId} className="p-4 flex items-center gap-3">
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                    onClick={async () => {
                      if (item.accessoryId) {
                        navigate(`/accessory/${item.accessoryId}`);
                      } else if (item.terrariumId) {
                        navigate(`/terrarium/${item.terrariumId}`);
                      } else if (item.terrariumVariantId) {
                        // Khi API trả terrariumId = null → lấy terrariumId qua variant
                        try {
                          const variant = await getTerrariumVariantById(item.terrariumVariantId);
                          if (variant?.terrariumId) navigate(`/terrarium/${variant.terrariumId}`);
                        } catch {
                          // ignore
                        }
                      }
                    }}
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
                      {(item.accessoryId || item.terrariumId || item.terrariumVariantId) && (
                        <button
                          onClick={async () => {
                            if (item.accessoryId) {
                              navigate(`/accessory/${item.accessoryId}`);
                            } else if (item.terrariumId) {
                              navigate(`/terrarium/${item.terrariumId}`);
                            } else if (item.terrariumVariantId) {
                              try {
                                const variant = await getTerrariumVariantById(item.terrariumVariantId);
                                if (variant?.terrariumId) navigate(`/terrarium/${variant.terrariumId}`);
                              } catch {
                                // ignore
                              }
                            }
                          }}
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
