// src/pages/Customer/Cart.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  addTerrariumVariantToCart, // đổi variant
} from '@/api/cart';
import { getTerrariumById, getVariantsByTerrariumId } from '@/api/terrarium';
import type { CartResponseNew, CartBundle, RawCartEntry } from '@/types/cart';

const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';
const firstItem = (e: RawCartEntry) => (e.item && e.item.length ? e.item[0] : null);
const keyOfEntry = (e: RawCartEntry) => `ci_${e.cartItemId}`;
const keyOfBundle = (b: CartBundle) => `b_${b.mainItem.terrariumId ?? 'x'}`;

const Cart: React.FC = () => {
  const [data, setData] = useState<CartResponseNew | null>(null);

  // luôn thu gọn mặc định
  const [bundleOpen, setBundleOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [variantChanging, setVariantChanging] = useState<Record<number, boolean>>({});

  // cache tên + thumbnail terrarium
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [terrariumThumb, setTerrariumThumb] = useState<Record<number, string>>({});

  // cache danh sách variant theo terrarium
  const [variantsMap, setVariantsMap] = useState<Record<number, any[]>>({});
  // map variantId -> terrariumId
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

  // lấy tên + thumbnail terrarium cho nhóm bundle & single
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
              name: t?.terrariumName || `Bể terrarium #${id}`,
              thumb: t?.terrariumImages?.[0]?.imageUrl || '/default.jpg',
            };
          } catch {
            return { id, name: `Bể terrarium #${id}`, thumb: '/default.jpg' };
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
  }, [data, terrariumName, terrariumThumb]);

  // lọc bundle chỉ gồm accessories (để hiển thị dạng nhóm)
  const bundlesToShow = useMemo(() => {
    const src = data?.bundleItems || [];
    return src.filter((b) => (b.bundleAccessories?.length || 0) > 0);
  }, [data]);

  // item là variant nhưng nằm trong bundle (bundleAccessories rỗng) → hiển thị như single
  const variantSinglesFromBundles = useMemo<RawCartEntry[]>(() => {
    const src = data?.bundleItems || [];
    return src
      .filter((b) => (b.bundleAccessories?.length || 0) === 0 && !!b.mainItem.terrariumVariantId)
      .map((b) => b.mainItem);
  }, [data]);

  // gộp singleItems + các variantSingle tách từ bundle
  const mergedSingles = useMemo<RawCartEntry[]>(() => {
    const singles = data?.singleItems || [];
    return [...variantSinglesFromBundles, ...singles];
  }, [data, variantSinglesFromBundles]);

  // danh sách tất cả entry có thể chọn để checkout
  const allEntries = useMemo<RawCartEntry[]>(
    () => [...mergedSingles, ...bundlesToShow.flatMap((b) => b.bundleAccessories)],
    [mergedSingles, bundlesToShow]
  );

  // prefetch variants cho các item là variant (để đổi variant)
  useEffect(() => {
    const run = async () => {
      const targets = mergedSingles.filter((e) => !!e.terrariumVariantId);
      if (!targets.length) return;

      const variantIds = [...new Set(targets.map((e) => e.terrariumVariantId!).filter(Boolean))];
      const missingVariants = variantIds.filter((vid) => !variantToTerrariumMap[vid]);
      if (!missingVariants.length) return;

      try {
        // bạn có thể thay danh sách này bằng fetch từ BE nếu có
        const possibleTerrariumIds = [22, 24, 25, 26, 27, 28];
        const variantMappings: Record<number, number> = {};

        for (const tid of possibleTerrariumIds) {
          try {
            const variants = await getVariantsByTerrariumId(tid);
            setVariantsMap((prev) => ({ ...prev, [tid]: variants }));
            for (const v of variants) {
              if (variantIds.includes(v.terrariumVariantId)) {
                variantMappings[v.terrariumVariantId] = tid;
              }
            }
          } catch {
            /* ignore */
          }
        }
        setVariantToTerrariumMap((prev) => ({ ...prev, ...variantMappings }));
      } catch (err) {
        console.error('Error fetching variants:', err);
      }
    };
    run();
  }, [mergedSingles, variantToTerrariumMap]);

  const isEntryChecked = (e: RawCartEntry) => !!selected[keyOfEntry(e)];
  const isBundleChecked = (b: CartBundle) => {
    const ids = b.bundleAccessories.map((e) => keyOfEntry(e));
    return ids.length > 0 && ids.every((k) => !!selected[k]);
  };

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

  const inc = async (e: RawCartEntry) => {
    try {
      const i = firstItem(e);
      const next = (i?.quantity || 0) + 1;
      if (e.accessoryId) await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      else if (e.terrariumVariantId) await updateCartItem(e.cartItemId, { variantQuantity: next });
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng');
    }
  };

  const dec = async (e: RawCartEntry) => {
    try {
      const i = firstItem(e);
      const next = Math.max(1, (i?.quantity || 1) - 1);
      if (e.accessoryId) await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      else if (e.terrariumVariantId) await updateCartItem(e.cartItemId, { variantQuantity: next });
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

  // tăng/giảm toàn bộ phụ kiện trong bộ
  const changeBundleQuantity = async (b: CartBundle, delta: 1 | -1) => {
    try {
      const items = b.bundleAccessories;
      if (!items.length) return;

      if (delta < 0) {
        const hasMin = items.some((e) => (firstItem(e)?.quantity || 1) <= 1);
        if (hasMin) {
          toast.info('Không thể giảm vì có phụ kiện đang ở số lượng 1');
          return;
        }
      }

      await Promise.all(
        items.map(async (e) => {
          const i = firstItem(e);
          const current = i?.quantity || 1;
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

  // đổi variant
  const changeVariant = async (e: RawCartEntry, newVariantId: number) => {
    if (e.terrariumVariantId === newVariantId) return;

    const cartItemId = e.cartItemId;
    setVariantChanging((prev) => ({ ...prev, [cartItemId]: true }));

    try {
      const i = firstItem(e);
      const qty = i?.quantity || 1;

      const terrariumId = variantToTerrariumMap[e.terrariumVariantId!];
      if (!terrariumId) throw new Error('Không tìm thấy thông tin terrarium');

      await deleteCartItem(e.cartItemId);
      await addTerrariumVariantToCart(terrariumId, newVariantId, qty);
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
    }[] = [];
    for (const e of allEntries) {
      if (!isEntryChecked(e)) continue;
      const i = firstItem(e);
      if (!i) continue;
      list.push({
        id: keyOfEntry(e),
        name: i.productName,
        price: i.price,
        image: i.imageUrl || '/default.jpg',
        quantity: i.quantity,
        selected: true,
        accessoryId: e.accessoryId ?? undefined,
        variantId: e.terrariumVariantId ?? undefined,
      });
    }
    return list;
  }, [allEntries, selected]);

  const subtotal = selectedItemsForCheckout.reduce((s, it) => s + it.price * it.quantity, 0);

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
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Giỏ hàng</h1>

          {/* BUNDLE: chỉ hiển thị nhóm cho phụ kiện (mặc định thu gọn) */}
          {bundlesToShow.map((b) => {
            const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
            const bundleId = keyOfBundle(b);
            const name = tid ? terrariumName[tid] || `Bể terrarium #${tid}` : 'Bể terrarium';
            const thumb = tid ? terrariumThumb[tid] || '/default.jpg' : '/default.jpg';

            // luôn thu gọn nếu chưa có state
            const isOpen = (bundleOpen[bundleId] ?? false);
            const groupChecked = isBundleChecked(b);
            const canDecBundle = b.bundleAccessories.every((e) => (firstItem(e)?.quantity || 1) > 1);

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
                    {/* thumbnail bể */}
                    <img
                      src={thumb}
                      alt={name}
                      className="w-10 h-10 rounded border object-cover cursor-pointer"
                      onClick={() => tid && navigate(`/terrarium/${tid}`)}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/default.jpg';
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
                    {/* Nút xem bể */}
                    <button
                      onClick={() => tid && navigate(`/terrarium/${tid}`)}
                      className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100"
                    >
                      Xem bể
                    </button>

                    {/* Điều khiển SL cả bộ */}
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
                      const i = firstItem(e);
                      return (
                        <div key={e.cartItemId} className="p-4 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isEntryChecked(e)}
                            onChange={() => toggleEntry(e)}
                            className="w-5 h-5 accent-green-600"
                          />
                          {i?.imageUrl ? (
                            <img
                              src={i.imageUrl}
                              alt={i.productName}
                              className="w-14 h-14 object-cover rounded border"
                              onError={(ev) => {
                                (ev.currentTarget as HTMLImageElement).src = '/default.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded border" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{i?.productName || 'Phụ kiện'}</div>
                            <div className="text-sm text-gray-600">{currency(i?.price || 0)}</div>
                          </div>

                          {/* nút xem phụ kiện */}
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
                            <span className="px-4 py-1">{i?.quantity ?? 1}</span>
                            <button onClick={() => inc(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">
                              +
                            </button>
                          </div>
                          <div className="w-32 text-right font-semibold text-gray-800">
                            {currency((i?.price || 0) * (i?.quantity || 0))}
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

          {/* SINGLE ITEMS + VARIANT */}
          {mergedSingles.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <div className="p-4 border-b font-semibold">Sản phẩm lẻ</div>
              <div className="divide-y">
                {mergedSingles.map((e) => {
                  const i = firstItem(e);
                  const checked = isEntryChecked(e);
                  const isChangingVariant = variantChanging[e.cartItemId] || false;

                  const actualTerrariumId = e.terrariumVariantId ? variantToTerrariumMap[e.terrariumVariantId] : e.terrariumId;
                  const hasVariant = !!e.terrariumVariantId && !!actualTerrariumId;
                  const list = hasVariant ? variantsMap[actualTerrariumId!] || [] : [];

                  const currentVariant = hasVariant ? list.find((v: any) => v.terrariumVariantId === e.terrariumVariantId) : null;

                  const terrariumDisplayName = actualTerrariumId ? terrariumName[actualTerrariumId] || `Bể terrarium #${actualTerrariumId}` : '';
                  const productDisplayName = hasVariant && terrariumDisplayName ? terrariumDisplayName : i?.productName || 'Sản phẩm';

                  // ảnh ưu tiên: ảnh item -> thumbnail terrarium
                  const imgSrc = i?.imageUrl || (actualTerrariumId ? terrariumThumb[actualTerrariumId] : '') || '/default.jpg';

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
                        className="w-14 h-14 object-cover rounded border cursor-pointer"
                        onClick={() => actualTerrariumId && navigate(`/terrarium/${actualTerrariumId}`)}
                        onError={(ev) => {
                          (ev.currentTarget as HTMLImageElement).src = '/default.jpg';
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-gray-800 cursor-pointer hover:underline mb-1"
                          onClick={() => actualTerrariumId && navigate(`/terrarium/${actualTerrariumId}`)}
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

                              {/* nút xem bể */}
                              {actualTerrariumId && (
                                <button
                                  onClick={() => navigate(`/terrarium/${actualTerrariumId}`)}
                                  className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100"
                                >
                                  Xem bể
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

                        <div className="text-sm text-green-600 font-semibold">{currency(i?.price || 0)}</div>
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
                          <span className="px-4 py-1 min-w-[50px] text-center">{i?.quantity ?? 1}</span>
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
                        <div className="font-semibold text-gray-800">{currency((i?.price || 0) * (i?.quantity || 0))}</div>
                        <button
                          onClick={() => removeEntry(e)}
                          className="text-red-600 hover:underline text-sm mt-1 disabled:opacity-50"
                          disabled={isChangingVariant}
                        >
                          Xoá
                        </button>
                        {/* nếu là phụ kiện đơn lẻ -> nút xem phụ kiện */}
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

          {!bundlesToShow.length && !mergedSingles.length && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">Giỏ hàng trống</div>
              <button onClick={() => navigate('/')} className="text-green-600 hover:underline">
                Tiếp tục mua sắm
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-6">
            <h2 className="text-lg font-bold text-green-700 mb-3">Tóm tắt đơn hàng</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Số sản phẩm đã chọn</span>
                <span className="font-medium">{selectedItemsForCheckout.reduce((s, it) => s + it.quantity, 0)}</span>
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
