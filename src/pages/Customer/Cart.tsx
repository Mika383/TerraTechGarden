// src/pages/Customer/Cart.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  changeCartItemVariant,
} from '@/api/cart';
import { getTerrariumById, getVariantsByTerrariumId, getTerrariumVariantById } from '@/api/terrarium';
import { getAccessoryById } from '@/api/accessory';
import { getComboById } from '@/api/combo';
import type { CartResponseNew, CartBundle, RawCartEntry } from '@/types/cart';

const FALLBACK_IMG = '/TerraTechLogo.png';
const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';
const keyOfEntry = (e: RawCartEntry) => `ci_${e.cartItemId}`;
const keyOfBundle = (b: CartBundle) => `b_${b.mainItem.terrariumId ?? 'x'}`;
const keyOfCombo = (e: RawCartEntry) => `combo_${e.cartItemId}`;
const unitPriceOf = (e: RawCartEntry) => {
  const qty = e.totalCartQuantity || 0;
  return qty > 0 ? e.totalCartPrice / qty : 0;
};

const Cart: React.FC = () => {
  const [data, setData] = useState<CartResponseNew | null>(null);

  // UI state
  const [bundleOpen, setBundleOpen] = useState<Record<string, boolean>>({});
  const [comboOpen, setComboOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [variantChanging, setVariantChanging] = useState<Record<number, boolean>>({});

  // Meta data caches
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [terrariumThumb, setTerrariumThumb] = useState<Record<number, string>>({});
  const [accessoryName, setAccessoryName] = useState<Record<number, string>>({});
  const [accessoryThumb, setAccessoryThumb] = useState<Record<number, string>>({});
  const [comboMeta, setComboMeta] = useState<Record<number, { name: string; image: string; items: any[] }>>({});
  const [variantsMap, setVariantsMap] = useState<Record<number, any[]>>({});
  const [variantToTerrariumMap, setVariantToTerrariumMap] = useState<Record<number, number>>({});

  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCart();
      setData(res);
    } catch {
      toast.error('Không tải được giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // === COMBO META FETCHING ===
  useEffect(() => {
    const fetchComboMeta = async () => {
      if (!data) return;
      
      const comboIds = new Set<number>();
      for (const item of data.singleItems || []) {
        if (item.comboId) comboIds.add(item.comboId);
      }

      const missingComboIds = [...comboIds].filter(id => !comboMeta[id]);
      if (!missingComboIds.length) return;

      const comboDataPromises = missingComboIds.map(async (comboId) => {
        try {
          const comboData = await getComboById(comboId);
          
          // Fetch detailed info for each item in combo
          const itemDetailsPromises = comboData.items.map(async (item: any) => {
            if (item.accessoryId) {
              try {
                const accessory = await getAccessoryById(item.accessoryId);
                return {
                  ...item,
                  name: accessory?.name || `Phụ kiện #${item.accessoryId}`,
                  image: accessory?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
                  type: 'accessory'
                };
              } catch {
                return {
                  ...item,
                  name: `Phụ kiện #${item.accessoryId}`,
                  image: FALLBACK_IMG,
                  type: 'accessory'
                };
              }
            } else if (item.terrariumVariantId) {
              try {
                const variant = await getTerrariumVariantById(item.terrariumVariantId);
                if (!variant) {
                  return {
                    ...item,
                    name: `Terrarium variant #${item.terrariumVariantId}`,
                    image: FALLBACK_IMG,
                    type: 'terrarium'
                  };
                }
                const terrarium = await getTerrariumById(variant.terrariumId);
                return {
                  ...item,
                  name: terrarium?.terrariumName || variant.variantName || `Terrarium #${variant.terrariumId}`,
                  image: variant.urlImage || terrarium?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG,
                  type: 'terrarium',
                  variantName: variant.variantName
                };
              } catch {
                return {
                  ...item,
                  name: `Terrarium variant #${item.terrariumVariantId}`,
                  image: FALLBACK_IMG,
                  type: 'terrarium'
                };
              }
            }
            return item;
          });

          const itemDetails = await Promise.all(itemDetailsPromises);

          return {
            comboId,
            name: comboData.name,
            image: comboData.imageUrl || FALLBACK_IMG,
            items: itemDetails
          };
        } catch (error) {
          console.error(`Error fetching combo ${comboId}:`, error);
          return {
            comboId,
            name: `Combo #${comboId}`,
            image: FALLBACK_IMG,
            items: []
          };
        }
      });

      const comboResults = await Promise.all(comboDataPromises);
      
      setComboMeta(prev => {
        const updated = { ...prev };
        comboResults.forEach(combo => {
          updated[combo.comboId] = combo;
        });
        return updated;
      });
    };

    fetchComboMeta();
  }, [data, comboMeta]);

  // === TERRARIUM META ===
  useEffect(() => {
    const fetchTerrariumMeta = async () => {
      if (!data) return;
      const ids = new Set<number>();

      for (const b of data.bundleItems || []) {
        const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
        if (tid) ids.add(tid);
      }
      for (const it of data.singleItems || []) {
        if (it.terrariumId) ids.add(it.terrariumId);
      }

      const missing = [...ids].filter((id) => !terrariumName[id] || !terrariumThumb[id]);
      if (!missing.length) return;

      const pairs = await Promise.all(
        missing.map(async (id) => {
          try {
            const t = await getTerrariumById(id);
            return {
              id,
              name: t?.terrariumName || `Bộ terrarium #${id}`,
              thumb: t?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG,
            };
          } catch {
            return { id, name: `Bộ terrarium #${id}`, thumb: FALLBACK_IMG };
          }
        })
      );

      setTerrariumName((m) => {
        const n = { ...m };
        for (const p of pairs) n[p.id] = p.name;
        return n;
      });
      setTerrariumThumb((m) => {
        const n = { ...m };
        for (const p of pairs) n[p.id] = p.thumb;
        return n;
      });
    };
    fetchTerrariumMeta();
  }, [data]);

  // === ACCESSORY META ===
  useEffect(() => {
    const fetchAccessoryMeta = async () => {
      if (!data) return;
      const ids = new Set<number>();

      for (const b of data.bundleItems || []) {
        for (const e of b.bundleAccessories || []) {
          if (e.accessoryId) ids.add(e.accessoryId);
        }
      }
      for (const e of data.singleItems || []) {
        if (e.accessoryId) ids.add(e.accessoryId);
      }

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

      setAccessoryName((m) => {
        const n = { ...m };
        for (const p of pairs) n[p.id] = p.name;
        return n;
      });
      setAccessoryThumb((m) => {
        const n = { ...m };
        for (const p of pairs) n[p.id] = p.thumb;
        return n;
      });
    };
    fetchAccessoryMeta();
  }, [data]);

  // === SEPARATE COMBOS FROM OTHER SINGLES ===
  const { comboItems, regularSingles } = useMemo(() => {
    const singles = data?.singleItems || [];
    const combos = singles.filter(item => item.comboId);
    const regulars = singles.filter(item => !item.comboId);
    return { comboItems: combos, regularSingles: regulars };
  }, [data]);

  // === BUNDLES / SINGLES ===
  const bundlesToShow = useMemo(() => {
    const src = data?.bundleItems || [];
    return src.filter((b) => (b.bundleAccessories?.length || 0) > 0);
  }, [data]);

  const variantSinglesFromBundles = useMemo<RawCartEntry[]>(() => {
    const src = data?.bundleItems || [];
    return src
      .filter((b) => (b.bundleAccessories?.length || 0) === 0 && !!b.mainItem.terrariumVariantId)
      .map((b) => b.mainItem);
  }, [data]);

  const mergedSingles = useMemo<RawCartEntry[]>(() => {
    return [...variantSinglesFromBundles, ...regularSingles];
  }, [variantSinglesFromBundles, regularSingles]);

  // tất cả các dòng có thể chọn (không bao gồm combo items vì combo chỉ chọn theo combo)
  const allEntries = useMemo<RawCartEntry[]>(
    () => [...mergedSingles, ...bundlesToShow.flatMap((b) => b.bundleAccessories), ...comboItems],
    [mergedSingles, bundlesToShow, comboItems]
  );

  // === VARIANTS (prefetch) ===
  useEffect(() => {
    const run = async () => {
      const targets = mergedSingles.filter((e) => !!e.terrariumVariantId);
      if (!targets.length) return;

      const variantIds = [...new Set(targets.map((e) => e.terrariumVariantId!).filter(Boolean))];
      const missingVariants = variantIds.filter((vid) => !variantToTerrariumMap[vid]);
      if (!missingVariants.length) return;

      const dynamicTerrariumIds = new Set<number>();
      targets.forEach((e) => e.terrariumId && dynamicTerrariumIds.add(e.terrariumId));
      (data?.bundleItems || []).forEach((b) => b.mainItem?.terrariumId && dynamicTerrariumIds.add(b.mainItem.terrariumId));

      if (dynamicTerrariumIds.size === 0) [22, 24, 25, 26, 27, 28].forEach((id) => dynamicTerrariumIds.add(id));

      try {
        const map: Record<number, number> = {};
        for (const tid of dynamicTerrariumIds) {
          try {
            const variants = await getVariantsByTerrariumId(tid);
            setVariantsMap((prev) => ({ ...prev, [tid]: variants }));
            for (const v of variants) if (variantIds.includes(v.terrariumVariantId)) map[v.terrariumVariantId] = tid;
          } catch {/* ignore */}
        }
        setVariantToTerrariumMap((prev) => ({ ...prev, ...map }));
      } catch (err) {
        console.error('fetch variants error:', err);
      }
    };
    run();
  }, [mergedSingles, data, variantToTerrariumMap]);

  // === SELECT / GROUP TOGGLE ===
  const isEntryChecked = (e: RawCartEntry) => !!selected[keyOfEntry(e)];
  const isBundleChecked = (b: CartBundle) => {
    const ids = b.bundleAccessories.map((e) => keyOfEntry(e));
    return ids.length > 0 && ids.every((k) => !!selected[k]);
  };
  const isComboChecked = (e: RawCartEntry) => !!selected[keyOfCombo(e)];

  const toggleEntry = (e: RawCartEntry) => {
    const k = keyOfEntry(e);
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  };

  const toggleBundle = (b: CartBundle) => {
    const keys = b.bundleAccessories.map((e) => keyOfEntry(e));
    const on = !isBundleChecked(b);
    setSelected((s) => {
      const n = { ...s };
      for (const k of keys) n[k] = on;
      return n;
    });
  };

  const toggleCombo = (e: RawCartEntry) => {
    const k = keyOfCombo(e);
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  };

  // === QUANTITY ===
  const inc = async (e: RawCartEntry) => {
    try {
      const next = (e.totalCartQuantity || 0) + 1;
      if (e.accessoryId) await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      else if (e.terrariumVariantId) await updateCartItem(e.cartItemId, { variantQuantity: next });
      else if (e.comboId) {
        // For combo, we update quantity directly
        await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      }
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng');
    }
  };

  const dec = async (e: RawCartEntry) => {
    try {
      const current = e.totalCartQuantity || 1;
      const next = Math.max(1, current - 1);
      if (e.accessoryId) await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      else if (e.terrariumVariantId) await updateCartItem(e.cartItemId, { variantQuantity: next });
      else if (e.comboId) {
        await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      }
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng');
    }
  };

  const removeEntry = async (e: RawCartEntry) => {
    try {
      await deleteCartItem(e.cartItemId);
      await load();
      toast.success('Đã xoá sản phẩm');
    } catch {
      toast.error('Xoá thất bại');
    }
  };

  const removeBundle = async (b: CartBundle) => {
    try {
      const tasks = b.bundleAccessories.map((e) => deleteCartItem(e.cartItemId));
      await Promise.all(tasks);
      await load();
      toast.success('Đã xoá bộ phụ kiện');
    } catch {
      toast.error('Xoá bộ phụ kiện thất bại');
    }
  };

  const changeBundleQuantity = async (b: CartBundle, delta: 1 | -1) => {
    try {
      const items = b.bundleAccessories;
      if (!items.length) return;

      if (delta < 0) {
        const hasMin = items.some((e) => (e.totalCartQuantity || 1) <= 1);
        if (hasMin) {
          toast.info('Không thể giảm vì có phụ kiện đang ở số lượng 1');
          return;
        }
      }

      await Promise.all(
        items.map(async (e) => {
          const current = e.totalCartQuantity || 1;
          const next = Math.max(1, current + delta);
          await updateCartItem(e.cartItemId, { accessoryQuantity: next });
        })
      );

      await load();
      toast.success(delta > 0 ? 'Đã tăng số lượng toàn bộ phụ kiện' : 'Đã giảm số lượng toàn bộ phụ kiện');
    } catch {
      toast.error('Không cập nhật được số lượng cho cả bộ');
    }
  };

  // === ĐỔI VARIANT ===
  const changeVariant = async (e: RawCartEntry, newVariantId: number) => {
    if (e.terrariumVariantId === newVariantId) return;

    const cartItemId = e.cartItemId;
    setVariantChanging((prev) => ({ ...prev, [cartItemId]: true }));

    try {
      const qty = e.totalCartQuantity || 1;
      await changeCartItemVariant(e.cartItemId, newVariantId, qty);
      await load();
      toast.success('Đã thay đổi phân loại hàng');
    } catch (error) {
      console.error('Error changing variant:', error);
      toast.error('Không thể thay đổi phân loại');
      await load();
    } finally {
      setVariantChanging((prev) => ({ ...prev, [cartItemId]: false }));
    }
  };

  // === CHECKOUT DATA ===
  const selectedItemsForCheckout = useMemo(() => {
    const list: {
      id: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
      selected: boolean;
      accessoryId?: number | null;
      variantId?: number | null;
      comboId?: number | null;
    }[] = [];

    // Regular singles and bundle accessories
    for (const e of [...mergedSingles, ...bundlesToShow.flatMap((b) => b.bundleAccessories)]) {
      if (!isEntryChecked(e)) continue;

      const isVariant = !!e.terrariumVariantId;
      const actualTerrariumId = isVariant ? variantToTerrariumMap[e.terrariumVariantId!] : e.terrariumId || undefined;

      let name = 'Sản phẩm';
      let image = FALLBACK_IMG;

      if (isVariant && actualTerrariumId) {
        name = terrariumName[actualTerrariumId] || `Bộ terrarium #${actualTerrariumId}`;
        image = terrariumThumb[actualTerrariumId] || FALLBACK_IMG;
      } else if (e.accessoryId) {
        name = accessoryName[e.accessoryId] || `Phụ kiện #${e.accessoryId}`;
        image = accessoryThumb[e.accessoryId] || FALLBACK_IMG;
      }

      list.push({
        id: keyOfEntry(e),
        name,
        price: unitPriceOf(e),
        image,
        quantity: e.totalCartQuantity || 1,
        selected: true,
        accessoryId: e.accessoryId ?? undefined,
        variantId: e.terrariumVariantId ?? undefined,
      });
    }

    // Combo items
    for (const e of comboItems) {
      if (!isComboChecked(e)) continue;

      const comboData = comboMeta[e.comboId!];
      list.push({
        id: keyOfCombo(e),
        name: comboData?.name || `Combo #${e.comboId}`,
        price: unitPriceOf(e),
        image: comboData?.image || FALLBACK_IMG,
        quantity: e.totalCartQuantity || 1,
        selected: true,
        comboId: e.comboId ?? undefined,
      });
    }

    return list;
  }, [allEntries, selected, terrariumName, terrariumThumb, accessoryName, accessoryThumb, comboMeta, comboItems, mergedSingles, bundlesToShow, variantToTerrariumMap]);

  // Subtotal
  const subtotal = useMemo(() => {
    let total = 0;
    
    // Bundle accessories and regular singles
    for (const e of [...mergedSingles, ...bundlesToShow.flatMap((b) => b.bundleAccessories)]) {
      if (isEntryChecked(e)) {
        total += e.totalCartPrice || 0;
      }
    }
    
    // Combo items
    for (const e of comboItems) {
      if (isComboChecked(e)) {
        total += e.totalCartPrice || 0;
      }
    }
    
    return total;
  }, [allEntries, selected, comboItems, mergedSingles, bundlesToShow]);

  const goCheckout = () => {
    if (!selectedItemsForCheckout.length) {
      toast.info('Chọn sản phẩm để thanh toán');
      return;
    }
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItemsForCheckout));
    navigate('/checkout');
  };

  if (loading && !data) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Đang tải giỏ hàng...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Giỏ hàng</h1>

          {/* COMBO SECTION */}
          {comboItems.map((e) => {
            const comboKey = keyOfCombo(e);
            const isOpen = comboOpen[comboKey] ?? false;
            const isChecked = isComboChecked(e);
            const comboData = comboMeta[e.comboId!];

            return (
              <div key={e.cartItemId} className="bg-white rounded-lg shadow border">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCombo(e)}
                      className="w-5 h-5 accent-green-600"
                    />
                    <img
                      src={comboData?.image || FALLBACK_IMG}
                      alt={comboData?.name || `Combo #${e.comboId}`}
                      className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                      onClick={() => navigate(`/combo/${e.comboId}`)}
                      onError={(ev) => {
                        (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                    <div className="font-semibold">
                      <button
                        onClick={() => navigate(`/combo/${e.comboId}`)}
                        className="text-green-700 hover:underline"
                      >
                        {comboData?.name || `Combo #${e.comboId}`}
                      </button>
                      <div className="text-sm text-gray-500">
                        Combo gồm {comboData?.items?.length || 0} sản phẩm
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/combo/${e.comboId}`)}
                      className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100"
                    >
                      Xem combo
                    </button>

                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        onClick={() => dec(e)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                      >
                        −
                      </button>
                      <span className="px-4 py-1 min-w-[50px] text-center">{e.totalCartQuantity || 1}</span>
                      <button
                        onClick={() => inc(e)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-sm text-purple-700 font-semibold">{currency(e.totalCartPrice || 0)}</div>
                    <button
                      onClick={() => setComboOpen((m) => ({ ...m, [comboKey]: !isOpen }))}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      {isOpen ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                    <button onClick={() => removeEntry(e)} className="text-red-600 hover:underline text-sm">
                      Xoá combo
                    </button>
                  </div>
                </div>

                {isOpen && comboData?.items && (
                  <div className="divide-y bg-gray-50">
                    <div className="px-4 py-2 text-sm text-gray-600 font-medium bg-purple-50 border-b">
                      Sản phẩm trong combo:
                    </div>
                    {comboData.items.map((item: any, idx: number) => (
                      <div key={`combo-item-${idx}`} className="p-4 flex items-center gap-3">
                        <div className="w-5"></div> {/* Spacing for alignment */}
                        
                        <img
                          src={item.image || FALLBACK_IMG}
                          alt={item.name || 'Sản phẩm'}
                          className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                          onClick={() => {
                            if (item.type === 'accessory' && item.accessoryId) {
                              navigate(`/accessory/${item.accessoryId}`);
                            } else if (item.type === 'terrarium' && item.terrariumVariantId) {
                              // Navigate to terrarium page, need to get terrarium ID from variant
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
                            <div className="text-sm text-gray-500">
                              Phân loại: {item.variantName}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">{currency(item.unitPrice || 0)}</div>
                        </div>

                        <div className="text-sm text-gray-700 px-3 py-1 bg-gray-100 rounded">
                          SL: {item.quantity}
                        </div>

                        <div className="w-32 text-right font-semibold text-gray-800">
                          {currency(item.totalPrice || 0)}
                        </div>

                        {item.type === 'accessory' && item.accessoryId && (
                          <button
                            onClick={() => navigate(`/accessory/${item.accessoryId}`)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100"
                          >
                            Xem
                          </button>
                        )}
                        
                        {item.type === 'terrarium' && (
                          <button
                            onClick={() => navigate(`/terrarium/${item.id}`)}
                            className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100"
                          >
                            Xem
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* BUNDLE SECTION */}
          {bundlesToShow.map((b) => {
            const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
            const bundleId = keyOfBundle(b);
            const name = tid ? terrariumName[tid] || `Bộ terrarium #${tid}` : 'Bộ terrarium';
            const thumb = tid ? terrariumThumb[tid] || FALLBACK_IMG : FALLBACK_IMG;

            const isOpen = bundleOpen[bundleId] ?? false;
            const groupChecked = isBundleChecked(b);
            const canDecBundle = b.bundleAccessories.every((e) => (e.totalCartQuantity || 1) > 1);

            return (
              <div key={bundleId} className="bg-white rounded-lg shadow border">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={groupChecked}
                      onChange={() => toggleBundle(b)}
                      className="w-5 h-5 accent-green-600"
                    />
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
                      <button
                        onClick={() => tid && navigate(`/terrarium/${tid}`)}
                        className="text-green-700 hover:underline"
                      >
                        {name}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => tid && navigate(`/terrarium/${tid}`)}
                      className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100"
                    >
                      Xem bộ
                    </button>

                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        onClick={() => changeBundleQuantity(b, -1)}
                        disabled={!canDecBundle}
                        className={`px-3 py-1 ${canDecBundle ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}
                        title="Giảm mỗi phụ kiện trong bộ 1 đơn vị"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700 whitespace-nowrap">SL bộ</span>
                      <button
                        onClick={() => changeBundleQuantity(b, +1)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                        title="Tăng mỗi phụ kiện trong bộ 1 đơn vị"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-sm text-gray-700">
                      SL: <b>{b.totalBundleQuantity}</b>
                    </div>
                    <div className="text-sm text-green-700 font-semibold">{currency(b.totalBundlePrice)}</div>
                    <button
                      onClick={() => setBundleOpen((m) => ({ ...m, [bundleId]: !isOpen }))}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      {isOpen ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                    <button onClick={() => removeBundle(b)} className="text-red-600 hover:underline text-sm">
                      Xoá bộ
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="divide-y">
                    {b.bundleAccessories.map((e) => {
                      const aId = e.accessoryId || 0;
                      const aName = aId ? (accessoryName[aId] || `Phụ kiện #${aId}`) : 'Phụ kiện';
                      const aThumb = aId ? (accessoryThumb[aId] || FALLBACK_IMG) : FALLBACK_IMG;

                      return (
                        <div key={e.cartItemId} className="p-4 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isEntryChecked(e)}
                            onChange={() => toggleEntry(e)}
                            className="w-5 h-5 accent-green-600"
                          />

                          <img
                            src={aThumb}
                            alt={aName}
                            className="w-14 h-14 object-cover rounded border bg-white"
                            onError={(ev) => {
                              (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                            }}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{aName}</div>
                            <div className="text-sm text-gray-600">{currency(unitPriceOf(e))}</div>
                          </div>

                          {e.accessoryId && (
                            <button
                              onClick={() => navigate(`/accessory/${e.accessoryId}`)}
                              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100"
                            >
                              Xem phụ kiện
                            </button>
                          )}

                          <div className="flex items-center border rounded overflow-hidden">
                            <button onClick={() => dec(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">
                              −
                            </button>
                            <span className="px-4 py-1">{e.totalCartQuantity ?? 1}</span>
                            <button onClick={() => inc(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">
                              +
                            </button>
                          </div>

                          <div className="w-32 text-right font-semibold text-gray-800">
                            {currency(e.totalCartPrice || 0)}
                          </div>
                          <button onClick={() => removeEntry(e)} className="text-red-600 hover:underline text-sm">
                            Xoá
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* SẢN PHẨM LẺ (single accessories + variant singles) */}
          {mergedSingles.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <div className="p-4 border-b font-semibold">Sản phẩm lẻ</div>
              <div className="divide-y">
                {mergedSingles.map((e) => {
                  const checked = isEntryChecked(e);
                  const isChangingVariant = variantChanging[e.cartItemId] || false;

                  const actualTerrariumId = e.terrariumVariantId ? variantToTerrariumMap[e.terrariumVariantId] : e.terrariumId;
                  const hasVariant = !!e.terrariumVariantId && !!actualTerrariumId;
                  const list = hasVariant ? variantsMap[actualTerrariumId!] || [] : [];

                  const currentVariant = hasVariant ? list.find((v: any) => v.terrariumVariantId === e.terrariumVariantId) : null;

                  const terrariumDisplayName = actualTerrariumId ? terrariumName[actualTerrariumId] || `Bộ terrarium #${actualTerrariumId}` : '';
                  const accessoryDisplayName = e.accessoryId ? (accessoryName[e.accessoryId] || `Phụ kiện #${e.accessoryId}`) : '';
                  const productDisplayName = hasVariant && terrariumDisplayName ? terrariumDisplayName : (accessoryDisplayName || 'Sản phẩm');

                  const imgSrc =
                    (hasVariant && actualTerrariumId ? (terrariumThumb[actualTerrariumId] || '') : (e.accessoryId ? (accessoryThumb[e.accessoryId] || '') : ''))
                    || FALLBACK_IMG;

                  return (
                    <div key={e.cartItemId} className={`p-4 flex items-start gap-3 ${isChangingVariant ? 'opacity-60' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEntry(e)}
                        className="w-5 h-5 accent-green-600 mt-1"
                        disabled={isChangingVariant}
                      />

                      <img
                        src={imgSrc}
                        alt={productDisplayName}
                        className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                        onClick={() =>
                          hasVariant && actualTerrariumId
                            ? navigate(`/terrarium/${actualTerrariumId}`)
                            : e.accessoryId
                            ? navigate(`/accessory/${e.accessoryId}`)
                            : undefined
                        }
                        onError={(ev) => {
                          (ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-gray-800 cursor-pointer hover:underline mb-1"
                          onClick={() =>
                            hasVariant && actualTerrariumId
                              ? navigate(`/terrarium/${actualTerrariumId}`)
                              : e.accessoryId
                              ? navigate(`/accessory/${e.accessoryId}`)
                              : undefined
                          }
                          title={productDisplayName}
                        >
                          {productDisplayName}
                        </div>

                        {hasVariant && Array.isArray(list) && list.length > 0 && (
                          <div className="mb-2">
                            <div className="text-sm text-gray-500 mb-1">
                              Phân loại hàng:
                              <span className="ml-1 text-gray-700 font-medium">
                                {currentVariant?.variantName || 'Đang tải...'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                value={e.terrariumVariantId!}
                                onChange={(ev) => changeVariant(e, Number(ev.target.value))}
                                disabled={isChangingVariant}
                              >
                                {list.map((v: any) => (
                                  <option key={v.terrariumVariantId} value={v.terrariumVariantId}>
                                    {v.variantName} - {currency(v.price)}
                                  </option>
                                ))}
                              </select>

                              {actualTerrariumId && (
                                <button
                                  onClick={() => navigate(`/terrarium/${actualTerrariumId}`)}
                                  className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100"
                                >
                                  Xem bộ
                                </button>
                              )}
                            </div>

                            {isChangingVariant && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Đang thay đổi phân loại...
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-sm text-green-600 font-semibold">{currency(unitPriceOf(e))}</div>
                      </div>

                      {!e.comboId && (
                        <div className="flex items-center border rounded overflow-hidden">
                          <button
                            onClick={() => dec(e)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            disabled={isChangingVariant}
                          >
                            −
                          </button>
                          <span className="px-4 py-1 min-w-[50px] text-center">{e.totalCartQuantity ?? 1}</span>
                          <button
                            onClick={() => inc(e)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            disabled={isChangingVariant}
                          >
                            +
                          </button>
                        </div>
                      )}

                      <div className="w-32 text-right">
                        <div className="font-semibold text-gray-800">{currency(e.totalCartPrice || 0)}</div>
                        <button
                          onClick={() => removeEntry(e)}
                          className="text-red-600 hover:underline text-sm mt-1 disabled:opacity-50"
                          disabled={isChangingVariant}
                        >
                          Xoá
                        </button>
                        {e.accessoryId && (
                          <button
                            onClick={() => navigate(`/accessory/${e.accessoryId}`)}
                            className="block mt-2 text-blue-600 hover:underline text-xs"
                          >
                            Xem phụ kiện
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!bundlesToShow.length && !mergedSingles.length && !comboItems.length && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">Giỏ hàng trống</div>
              <button onClick={() => navigate('/')} className="text-green-600 hover:underline">
                Tiếp tục mua sắm
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-6">
            <h2 className="text-lg font-bold text-green-700 mb-3">Tóm tắt đơn hàng</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Số sản phẩm đã chọn</span>
                <span className="font-medium">
                  {selectedItemsForCheckout.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-lg">{currency(subtotal)}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-green-700">{currency(subtotal)}</span>
              </div>
            </div>
            <button
              onClick={goCheckout}
              disabled={!selectedItemsForCheckout.length}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Thanh toán ({selectedItemsForCheckout.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;