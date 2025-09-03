// src/pages/Customer/OrderDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wallet, RefreshCw, ChevronRight, Star, X } from 'lucide-react';

import { getOrderById, createMoMoPayment } from '@/api';
import { getVouchers } from '@/api/voucher';
import { getTerrariumById, getTerrariumVariantById } from '@/api/terrarium';
import { getAccessoryById } from '@/api/accessory';
import { getComboById } from '@/api/combo';
import type { Combo, ComboItem } from '@/api/combo';

import type { Order, OrderItem } from '@/types/order';
import type { Voucher } from '@/types/voucher';

import {
  orderStatusToVi,
  paymentStatusToVi,
  orderStatusChip,
  paymentStatusChip,
  isUnpaid,
  isCompleted,
} from '@/utils/orderStatus';

import { createFeedback, uploadFeedbackImage } from '@/api/feedback';

const money = (v?: number | null) =>
  Number(v ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const FALLBACK_IMG = '/TerraTechLogo.png';

type VariantMeta = {
  terrariumId: number;
  variantName?: string;
  image?: string;
};

type AccessoryMeta = {
  name: string;
  image?: string;
};

type BasicAddress = {
  id: number;
  tagName?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  provinceCode?: string | null;
  districtCode?: string | null;
  wardCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  isDefault?: boolean;
};

// ===== Helpers =====
const isComboHeader = (it: OrderItem) =>
  it.itemType === 'COMBO' && !it.accessoryId && !it.terrariumVariantId;

function groupCombos(items: OrderItem[]) {
  const map = new Map<number, { header?: OrderItem; children: OrderItem[]; total: number }>();
  items
    .filter((x) => x.itemType === 'COMBO')
    .forEach((it) => {
      const key = it.comboId || 0;
      if (!map.has(key)) map.set(key, { header: undefined, children: [], total: 0 });
      const g = map.get(key)!;
      if (isComboHeader(it)) g.header = it;
      else g.children.push(it);
      g.total += it.totalPrice || 0;
    });
  return map;
}

function attachBundleVariantByMain(items: OrderItem[]): OrderItem[] {
  let currentMainVariant: number | null = null;
  return items.map((it) => {
    if (it.itemType === 'MAIN_ITEM') {
      currentMainVariant = it.terrariumVariantId ?? null;
      return it;
    }
    if (it.itemType === 'BUNDLE_ACCESSORY') {
      if (!it.terrariumVariantId && currentMainVariant) {
        return { ...it, terrariumVariantId: currentMainVariant };
      }
    }
    return it;
  });
}

function groupBundlesByVariant(items: OrderItem[]) {
  const out = new Map<number, { items: OrderItem[]; totalPrice: number; totalQty: number }>();
  items
    .filter((x) => x.itemType === 'BUNDLE_ACCESSORY')
    .forEach((it) => {
      const vid = it.terrariumVariantId || 0;
      if (!out.has(vid)) out.set(vid, { items: [], totalPrice: 0, totalQty: 0 });
      const g = out.get(vid)!;
      g.items.push(it);
      g.totalPrice += it.totalPrice || 0;
      g.totalQty += it.quantity || 0;
    });
  return out;
}

async function fetchAddressById(id: number): Promise<BasicAddress | null> {
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'https://terarium.shop/api';
    const res = await fetch(`${base}/Address/get/${id}`);
    const data = await res.json();
    if (data?.status === 200 && data?.data) return data.data as BasicAddress;
    return null;
  } catch {
    return null;
  }
}

/** ★ rating */
const StarRating: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} sao`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className="leading-none"
          >
            <span className={`text-2xl ${active ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">{value}/5</span>
    </div>
  );
};

type ReviewState = {
  open: boolean;
  orderItemId: number | null;
  rating: number;
  comment: string;
  file?: File | null;
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const [variantMeta, setVariantMeta] = useState<Record<number, VariantMeta>>({});
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [accessoryMeta, setAccessoryMeta] = useState<Record<number, AccessoryMeta>>({});
  const [comboMeta, setComboMeta] = useState<Record<number, Combo>>({});
  const [address, setAddress] = useState<BasicAddress | null>(null);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  

  const [bundleOpen, setBundleOpen] = useState<Record<number, boolean>>({});
  const [comboOpen, setComboOpen] = useState<Record<number, boolean>>({});

  // Preview image URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [review, setReview] = useState<ReviewState>({
    open: false,
    orderItemId: null,
    rating: 5,
    comment: '',
    file: null,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setReview((s) => ({ ...s, file: null }));
  };

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const full = await getOrderById(Number(id));
      if (!full) {
        toast.error('Không tìm thấy đơn hàng.');
        return;
      }
      const processed = {
        ...full,
        orderItems: attachBundleVariantByMain(full.orderItems || []),
      };
      setOrder(processed);

      try {
        const vs = await getVouchers();
        setVouchers(Array.isArray(vs) ? vs : []);
      } catch {}

      if (processed.addressId) {
        const adr = await fetchAddressById(processed.addressId);
        setAddress(adr);
      } else setAddress(null);

      const vIds = new Set<number>();
      const aIds = new Set<number>();
      const cIds = new Set<number>();
      for (const it of processed.orderItems || []) {
        if (it.terrariumVariantId) vIds.add(it.terrariumVariantId);
        if (it.accessoryId) aIds.add(it.accessoryId);
        if (it.itemType === 'COMBO' && it.comboId) cIds.add(it.comboId);
      }

      const needVariant = [...vIds].filter((vid) => !variantMeta[vid]);
      if (needVariant.length) {
        const results = await Promise.allSettled(
          needVariant.map(async (vid) => {
            const v = await getTerrariumVariantById(vid);
            return {
              vid,
              terrariumId: Number(v?.terrariumId || 0),
              variantName: v?.variantName as string | undefined,
              image: (v as any)?.urlImage as string | undefined,
            };
          })
        );
        const add: Record<number, VariantMeta> = {};
        const terrs = new Set<number>();
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            add[r.value.vid] = {
              terrariumId: r.value.terrariumId,
              variantName: r.value.variantName,
              image: r.value.image,
            };
            if (r.value.terrariumId) terrs.add(r.value.terrariumId);
          }
        });
        if (Object.keys(add).length) setVariantMeta((m) => ({ ...m, ...add }));

        const terrToFetch = [...terrs].filter((tid) => !terrariumName[tid]);
        if (terrToFetch.length) {
          const terrFetch = await Promise.allSettled(
            terrToFetch.map(async (tid) => {
              const t = await getTerrariumById(tid);
              return { tid, name: t?.terrariumName as string | undefined };
            })
          );
          const tAdd: Record<number, string> = {};
          terrFetch.forEach((r) => {
            if (r.status === 'fulfilled') tAdd[r.value.tid] = r.value.name || `Terrarium #${r.value.tid}`;
          });
          if (Object.keys(tAdd).length) setTerrariumName((m) => ({ ...m, ...tAdd }));
        }
      }

      const needAcc = [...aIds].filter((aid) => !accessoryMeta[aid]);
      if (needAcc.length) {
        const accs = await Promise.allSettled(
          needAcc.map(async (aid) => {
            const a = await getAccessoryById(aid);
            return {
              aid,
              name: a?.name || `Phụ kiện #${aid}`,
              image: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
            };
          })
        );
        const addA: Record<number, AccessoryMeta> = {};
        accs.forEach((r) => {
          if (r.status === 'fulfilled') addA[r.value.aid] = { name: r.value.name, image: r.value.image };
        });
        if (Object.keys(addA).length) setAccessoryMeta((m) => ({ ...m, ...addA }));
      }

      const needCombo = [...cIds].filter((cid) => !comboMeta[cid]);
      if (needCombo.length) {
        const combos = await Promise.allSettled(needCombo.map((cid) => getComboById(cid)));
        const addC: Record<number, Combo> = {};
        combos.forEach((r) => {
          if (r.status === 'fulfilled') addC[r.value.comboId] = r.value;
        });
        if (Object.keys(addC).length) setComboMeta((m) => ({ ...m, ...addC }));
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải chi tiết đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const items = order?.orderItems || [];
  const comboGroups = useMemo(() => groupCombos(items), [items]);
  const mainItems = useMemo(() => items.filter((x) => x.itemType === 'MAIN_ITEM'), [items]);
  const bundleGroups = useMemo(() => groupBundlesByVariant(items), [items]);
  const singles = useMemo(() => items.filter((x) => x.itemType === 'SINGLE'), [items]);

  // Trong phần tính toán thanh toán
const originalAmount = order?.originalAmount ?? 0;

// Tính voucherDiscount dựa trên voucherUsed
const voucherUsed = useMemo(() => {
  if (!order?.voucherId) return undefined;
  return vouchers.find((v) => v.voucherId === order.voucherId);
}, [order?.voucherId, vouchers]);

const voucherDiscount = useMemo(() => {
  if (!voucherUsed) return 0;
  if (voucherUsed.discountPercent && voucherUsed.discountPercent > 0) {
    // Tính giảm giá theo phần trăm
    return (originalAmount * voucherUsed.discountPercent) / 100;
  } else if (voucherUsed.discountAmount && voucherUsed.discountAmount > 0) {
    // Sử dụng số tiền giảm cố định
    return voucherUsed.discountAmount;
  }
  return 0;
}, [voucherUsed, originalAmount]);

const totalAmount = order?.totalAmount ?? 0;
const fullPaymentDiscount = Math.max(0, originalAmount - voucherDiscount - totalAmount);
const deposit = order?.deposit ?? 0;

// Logic tính codAmount (giữ nguyên như bạn yêu cầu)
let codAmount;
if (deposit === 0) {
  // Người dùng chọn thanh toán toàn bộ bằng chuyển khoản, không cần COD
  codAmount = 0;
} else if (deposit > 0) {
  // Người dùng chọn cọc, tính COD là phần còn lại
  codAmount = Math.max(0, totalAmount - deposit);
} else {
  // Trường hợp deposit âm (không nên xảy ra, nhưng phòng thủ)
  codAmount = totalAmount;
}
  

  
  const onPay = async () => {
    try {
      if (!order) return;
      const outstanding = Math.max(0, (order.totalAmount ?? 0) - (order.deposit ?? 0));
      if (outstanding === 0) {
        toast.info('Đơn đã thanh toán đủ.');
        return;
      }
      const voucherId = (order as any)?.voucherId ?? 0;
      const { payUrl } = await createMoMoPayment({
        orderId: order.orderId,
        orderInfo: `Thanh toán đơn #${order.orderId}`,
        finalAmount: outstanding,
        voucherId,
        payAll: (order.deposit ?? 0) === 0,
      } as any);
      window.location.href = payUrl;
    } catch (err) {
      console.error(err);
      toast.error('Không tạo được giao dịch MoMo.');
    }
  };

  // ✅ Chỉ hiển thị nút đánh giá nếu ĐÃ HOÀN THÀNH
  const canRate = !!order && isCompleted(order.status);

  const openFeedbackFor = (orderItemId: number | undefined) => {
    if (!orderItemId || !canRate) return;
    clearPreview();
    setReview({
      open: true,
      orderItemId,
      rating: 5,
      comment: '',
      file: null,
    });
  };

  const submitFeedback = async () => {
    try {
      if (!review.orderItemId) return;
      if (review.rating < 1 || review.rating > 5) {
        toast.info('Điểm đánh giá từ 1 đến 5.');
        return;
      }
      const fb = await createFeedback({
        orderItemId: review.orderItemId,
        rating: review.rating,
        comment: review.comment || '',
      });

      const fid: number =
        (fb as any)?.feedbackId ?? (fb as any)?.data?.feedbackId ?? (fb as any)?.id ?? (fb as any)?.data?.id;

      if (fid && review.file) {
        await uploadFeedbackImage(fid, review.file);
      }

      toast.success('Đã gửi đánh giá. Cảm ơn bạn!');
      setReview((s) => ({ ...s, open: false }));
      clearPreview();
    } catch (e) {
      console.error(e);
      toast.error('Gửi đánh giá thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">Chi tiết đơn hàng</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/customer-dashboard/orders')}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              ← Danh sách đơn
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {!order || loading ? (
          <div className="bg-white p-6 rounded shadow text-gray-600">
            {loading ? 'Đang tải...' : 'Không có dữ liệu đơn hàng.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">
              {/* MAIN ITEMS */}
              {mainItems.length > 0 && (
                <div className="bg-white rounded shadow border">
                  <div className="px-4 py-3 border-b font-semibold bg-gray-50">Sản phẩm chính</div>
                  <div className="divide-y">
                    {mainItems.map((it) => {
                      const vid = it.terrariumVariantId || 0;
                      const meta = vid ? variantMeta[vid] : undefined;
                      const terrName = meta?.terrariumId
                        ? terrariumName[meta.terrariumId] || `Terrarium #${meta.terrariumId}`
                        : 'Terrarium';
                      const img = meta?.image || FALLBACK_IMG;

                      return (
                        <div key={it.orderItemId} className="p-4 flex items-start gap-3">
                          <img
                            src={img}
                            alt={terrName}
                            className="w-16 h-16 rounded border object-cover bg-white"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800">{terrName}</div>
                            {meta?.variantName && (
                              <div className="text-sm text-gray-500">
                                Phân loại: <b>{meta.variantName}</b>
                              </div>
                            )}
                            <div className="text-sm text-gray-600">
                              {money(it.unitPrice)} × {it.quantity}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-28 text-right font-semibold text-gray-800">
                              {money(it.totalPrice)}
                            </div>
                            {canRate && (
                              <button
                                onClick={() => openFeedbackFor(it.orderItemId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded"
                              >
                                <Star size={16} />
                                Đánh giá
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BUNDLES */}
              {bundleGroups.size > 0 && (
                <div className="bg-white rounded shadow border">
                  <div className="px-4 py-3 border-b font-semibold bg-gray-50">Bộ phụ kiện </div>

                  {[...bundleGroups.entries()].map(([variantId, g]) => {
                    const vm = variantMeta[variantId];
                    const tid = vm?.terrariumId || 0;
                    const terrName = tid ? terrariumName[tid] || `Terrarium #${tid}` : `Variant #${variantId}`;
                    const groupTotal = g.totalPrice;
                    const groupQty = g.totalQty;
                    const isOpen = !!bundleOpen[variantId];

                    return (
                      <div key={variantId} className="divide-y border-t">
                        <div className="p-4 flex items-center justify-between bg-gray-50">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-800">
                              Bộ phụ kiện của{' '}
                              <span className="text-green-700">
                                {terrName}
                                {vm?.variantName ? ` • ${vm.variantName}` : ''}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              SL: <b>{groupQty}</b>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-green-700 font-semibold">{money(groupTotal)}</div>
                            <button
                              onClick={() => setBundleOpen((m) => ({ ...m, [variantId]: !m[variantId] }))}
                              className="text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                              {isOpen ? 'Thu gọn' : 'Mở rộng'}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="divide-y">
                            {g.items.map((it) => {
                              const aid = it.accessoryId || 0;
                              const acc = accessoryMeta[aid];
                              const name = acc?.name || it.productName || `Phụ kiện #${aid}`;
                              const img = acc?.image || FALLBACK_IMG;
                              return (
                                <div key={it.orderItemId} className="p-4 flex items-start gap-3">
                                  <img
                                    src={img}
                                    alt={name}
                                    className="w-14 h-14 rounded border object-cover bg-white"
                                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800">{name}</div>
                                    <div className="text-sm text-gray-600">
                                      {money(it.unitPrice)} × {it.quantity}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="w-28 text-right font-semibold text-gray-800">
                                      {money(it.totalPrice)}
                                    </div>
                                    {canRate && (
                                      <button
                                        onClick={() => openFeedbackFor(it.orderItemId)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded"
                                      >
                                        <Star size={16} />
                                        Đánh giá
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SINGLES */}
              {singles.length > 0 && (
                <div className="bg-white rounded shadow border">
                  <div className="px-4 py-3 border-b font-semibold bg-gray-50">Sản phẩm lẻ</div>
                  <div className="divide-y">
                    {singles.map((it) => {
                      const aid = it.accessoryId || 0;
                      const acc = accessoryMeta[aid];
                      const name = acc?.name || it.productName || `Phụ kiện #${aid}`;
                      const img = acc?.image || FALLBACK_IMG;
                      return (
                        <div key={it.orderItemId} className="p-4 flex items-start gap-3">
                          <img
                            src={img}
                            alt={name}
                            className="w-14 h-14 rounded border object-cover bg-white"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800">{name}</div>
                            <div className="text-sm text-gray-600">
                              {money(it.unitPrice)} × {it.quantity}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-28 text-right font-semibold text-gray-800">{money(it.totalPrice)}</div>
                            {canRate && (
                              <button
                                onClick={() => openFeedbackFor(it.orderItemId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded"
                              >
                                <Star size={16} />
                                Đánh giá
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMBOS – chỉ feedback ở header */}
              {comboGroups.size > 0 && (
                <div className="bg-white rounded shadow border">
                  <div className="px-4 py-3 border-b font-semibold bg-gray-50">Combo</div>
                  {[...comboGroups.entries()].map(([comboId, g]) => {
                    const meta = comboMeta[comboId];
                    const headerTitle = meta?.name || `Combo #${comboId}`;
                    const groupTotal = g.total || 0;
                    const isOpen = !!comboOpen[comboId];

                    const comboItemsFromApi: ComboItem[] | undefined = meta?.items;
                    const comboHeaderOrderItemId = g.header?.orderItemId;

                    return (
                      <div key={comboId} className="divide-y border-t">
                        <div className="p-4 flex items-center justify-between bg-purple-50">
                          <div className="min-w-0">
                            <div className="font-semibold text-purple-700">{headerTitle}</div>
                            <div className="text-xs text-gray-600">
                              {g.header?.quantity ? <>SL: <b>{g.header.quantity}</b></> : '—'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-purple-700 font-semibold">{money(groupTotal)}</div>

                            {canRate && (
                              <button
                                onClick={() => openFeedbackFor(comboHeaderOrderItemId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded"
                              >
                                <Star size={16} />
                                Đánh giá
                              </button>
                            )}

                            <button
                              onClick={() => setComboOpen((m) => ({ ...m, [comboId]: !m[comboId] }))}
                              className="text-sm text-gray-700 hover:text-gray-900 underline"
                            >
                              {isOpen ? 'Thu gọn' : 'Mở rộng'}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="divide-y">
                            {comboItemsFromApi && comboItemsFromApi.length > 0
                              ? comboItemsFromApi.map((ci) => {
                                  let name = ci.productName;
                                  let img = ci.productImage || FALLBACK_IMG;

                                  if (ci.accessoryId) {
                                    const acc = accessoryMeta[ci.accessoryId];
                                    name = acc?.name || name || `Phụ kiện #${ci.accessoryId}`;
                                    img = acc?.image || img || FALLBACK_IMG;
                                  } else if (ci.terrariumVariantId) {
                                    const vm = variantMeta[ci.terrariumVariantId];
                                    const tid = vm?.terrariumId || 0;
                                    const terrName =
                                      tid ? terrariumName[tid] || `Terrarium #${tid}` : name || `Variant #${ci.terrariumVariantId}`;
                                    name = vm?.variantName ? `${terrName} • ${vm.variantName}` : terrName;
                                    img = vm?.image || img || FALLBACK_IMG;
                                  }

                                  return (
                                    <div key={ci.comboItemId} className="p-4 flex items-start gap-3">
                                      <img
                                        src={img}
                                        alt={name || 'Sản phẩm'}
                                        className="w-12 h-12 rounded border object-cover bg-white"
                                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800">{name || 'Sản phẩm'}</div>
                                        <div className="text-sm text-gray-600">
                                          {money(ci.unitPrice)} × {ci.quantity}
                                        </div>
                                      </div>
                                      <div className="w-28 text-right font-semibold text-gray-800">
                                        {money(ci.totalPrice)}
                                      </div>
                                    </div>
                                  );
                                })
                              : g.children.map((it) => {
                                  let name = it.productName || '';
                                  let img = it.imageUrl || FALLBACK_IMG;

                                  if (it.accessoryId) {
                                    const acc = accessoryMeta[it.accessoryId];
                                    name = acc?.name || name || `Phụ kiện #${it.accessoryId}`;
                                    img = acc?.image || img || FALLBACK_IMG;
                                  } else if (it.terrariumVariantId) {
                                    const meta = variantMeta[it.terrariumVariantId];
                                    const tid = meta?.terrariumId || 0;
                                    const terrName =
                                      tid ? terrariumName[tid] || `Terrarium #${tid}` : name || `Variant #${it.terrariumVariantId}`;
                                    name = terrName;
                                    img = meta?.image || img || FALLBACK_IMG;
                                  }

                                  return (
                                    <div key={it.orderItemId} className="p-4 flex items-start gap-3">
                                      <img
                                        src={img}
                                        alt={name || 'Sản phẩm'}
                                        className="w-12 h-12 rounded border object-cover bg-white"
                                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800">{name || 'Sản phẩm'}</div>
                                        <div className="text-sm text-gray-600">
                                          {money(it.unitPrice)} × {it.quantity}
                                        </div>
                                      </div>
                                      <div className="w-28 text-right font-semibold text-gray-800">{money(it.totalPrice)}</div>
                                    </div>
                                  );
                                })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Tổng quan & thanh toán */}
            <div className="lg:col-span-1 space-y-6">
              {/* Trạng thái */}
              <div className="bg-white rounded shadow border">
                <div className="px-4 py-3 border-b font-semibold bg-gray-50">Trạng thái</div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded border text-xs ${orderStatusChip(order.status)}`}>
                      {orderStatusToVi(order.status)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-xs ${paymentStatusChip(order.paymentStatus ?? '')}`}
                    >
                      {paymentStatusToVi(order.paymentStatus ?? '')}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Ngày đặt:{' '}
                    <b>{order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'N/A'}</b>
                  </div>
                  {order.transactionId && (
                    <div className="text-gray-600">
                      Mã giao dịch: <b>{order.transactionId}</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Thanh toán */}
              <div className="bg-white rounded shadow border">
                <div className="px-4 py-3 border-b font-semibold bg-gray-50">Thanh toán</div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính (giá gốc)</span>
                    <span className="font-medium">{money(originalAmount)}</span>
                  </div>

                  {order.voucherId ? (
                    <div className="flex justify-between text-yellow-700">
                      <span>
                        Giảm voucher{' '}
                        {voucherUsed ? (
                          <span className="text-gray-500">
                            (mã <b>{voucherUsed.code}</b>
                            {voucherUsed.discountPercent && voucherUsed.discountPercent > 0
                              ? ` ${voucherUsed.discountPercent}%`
                              : voucherUsed.discountAmount
                              ? ` -${money(voucherUsed.discountAmount)}`
                              : ''}
                            )
                          </span>
                        ) : null}
                      </span>
                      <span>-{money(voucherDiscount)}</span>
                    </div>
                  ) : null}

                  {fullPaymentDiscount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Ưu đãi thanh toán toàn bộ</span>
                      <span>-{money(fullPaymentDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-blue-700">
                      <span>Đã đặt cọc</span>
                      <span>-{money(deposit)}</span>
                    </div>

                  <hr />

                  <div className="flex justify-between font-semibold text-base">
                    <span>Tổng thanh toán</span>
                    <span className="text-green-700">{money(totalAmount)}</span>
                  </div>

                 <div className="flex justify-between text-red-600">
                    <span>Thanh toán khi nhận hàng</span>
                    <span>{money(codAmount)}</span>
                  </div>
                </div>

                {isUnpaid(order.paymentStatus ?? '') && (
                  <div className="p-4 pt-0">
                    <button
                      onClick={onPay}
                      className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
                    >
                      <Wallet size={18} />
                      Thanh toán MoMo
                    </button>
                  </div>
                )}
              </div>

              {/* Địa chỉ giao hàng */}
              <div className="bg-white rounded shadow border">
                <div className="px-4 py-3 border-b font-semibold bg-gray-50">Thông tin giao hàng</div>
                <div className="p-4 text-sm text-gray-700 space-y-1">
                  {address ? (
                    <>
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className="text-gray-400" />
                        <span>
                          Nhãn: <b>{address.tagName ?? '—'}</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className="text-gray-400" />
                        <span>
                          Người nhận: <b>{address.receiverName ?? '—'}</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className="text-gray-400" />
                        <span>
                          SĐT: <b>{address.receiverPhone ?? '—'}</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className="text-gray-400" />
                        <span className="break-words">
                          Địa chỉ: <b>{address.receiverAddress ?? '—'}</b>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ChevronRight size={16} className="text-gray-400" />
                      <span>
                        Address ID: <b>{order.addressId ?? 'N/A'}</b>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Voucher (chi tiết) */}
              {voucherUsed && (
                <div className="bg-white rounded shadow border">
                  <div className="px-4 py-3 border-b font-semibold bg-gray-50">Mã ưu đãi đã dùng</div>
                  <div className="p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{voucherUsed.code}</div>
                        <div className="text-gray-600">{voucherUsed.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Hiệu lực: {new Date(voucherUsed.validFrom).toLocaleDateString()} -{' '}
                          {new Date(voucherUsed.validTo).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        {voucherUsed.discountPercent && voucherUsed.discountPercent > 0 ? (
                          <div className="text-green-700 font-semibold">-{voucherUsed.discountPercent}%</div>
                        ) : (
                          <div className="text-green-700 font-semibold">-{money(voucherUsed.discountAmount || 0)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Modal đánh giá item (có preview ảnh) ===== */}
      {review.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">Đánh giá sản phẩm</div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Điểm (1–5)</label>
                  <StarRating
                    value={review.rating}
                    onChange={(n) => setReview((s) => ({ ...s, rating: n }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ảnh (tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setReview((s) => ({ ...s, file: f }));
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                  {previewUrl && (
                    <div className="mt-2 relative inline-block">
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-24 h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={clearPreview}
                        className="absolute -top-2 -right-2 p-1 bg-white border rounded-full shadow hover:bg-gray-50"
                        aria-label="Xóa ảnh"
                        title="Xóa ảnh"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Nhận xét</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={review.comment}
                  onChange={(e) => setReview((s) => ({ ...s, comment: e.target.value }))}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setReview((s) => ({ ...s, open: false }));
                  clearPreview();
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Đóng
              </button>
              <button
                onClick={submitFeedback}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
