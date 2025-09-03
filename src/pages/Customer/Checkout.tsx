// src/pages/Customer/Checkout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wallet, CreditCard } from 'lucide-react';
import AddressSelector from '@/components/customer/Layout/AddressSelector';
import { Address } from '@/types/profile';
import {
  createOrder,
  getVoucherByCode,
  
  createMoMoPayment
} from '@/api';
import { getCart, deleteCartItem } from '@/api/cart';
import { getTerrariumById, getVariantsByTerrariumId, getTerrariumVariantById } from '@/api/terrarium';
import { getWalletBalance, useWalletForPayment } from '@/api';
import { payWithWallet, payWithWalletNoBearerPrefix } from '@/api/wallet';  
import { getAccessoryById } from '@/api/accessory';
import { getComboById } from '@/api/combo';
import type { Voucher, CreateOrderItem } from '@/types';
import type { CartResponseNew, CartBundle, RawCartEntry } from '@/types/cart';
import { useAuth } from '@/hooks/useAuth';

const FALLBACK_IMG = '/TerraTechLogo.png';

// ===== Helpers & currency =====
const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';
const keyOfEntry = (e: RawCartEntry) => `ci_${e.cartItemId}`;
const keyOfBundle = (b: CartBundle) =>
  `b_${b.mainItem.terrariumVariantId ?? b.mainItem.terrariumId ?? 'x'}`;
const keyOfCombo = (e: RawCartEntry) => `combo_${e.cartItemId}`;

const unitPriceOf = (e: RawCartEntry) => {
  const explicit =
    Array.isArray(e.item) && e.item[0] && typeof e.item[0].price === 'number'
      ? e.item[0].price
      : undefined;
  if (typeof explicit === 'number') return explicit;
  const qty = e.totalCartQuantity || 0;
  return qty > 0 ? (e.totalCartPrice || 0) / qty : 0;
};

const qtyOf = (e: RawCartEntry) => {
  const q =
    Array.isArray(e.item) && e.item[0] && typeof e.item[0].quantity === 'number'
      ? e.item[0].quantity
      : e.totalCartQuantity;
  return Math.max(1, q || 1);
};

const calcBundleQty = (b: CartBundle) =>
  (b.bundleAccessories || []).reduce((sum, it) => sum + qtyOf(it), 0);

// ===== Small logger =====
const isDev = typeof import.meta !== 'undefined' ? import.meta.env.MODE !== 'production' : true;
const log = {
  group(title: string) { if (!isDev) return; try { console.groupCollapsed(`%c${title}`, 'color:#16a34a;font-weight:600;'); } catch {} },
  end() { if (!isDev) return; try { console.groupEnd(); } catch {} },
  info(...args: any[]) { if (!isDev) return; console.log('%c[Checkout]', 'color:#16a34a', ...args); },
  table(data: any, title?: string) { if (!isDev) return; if (title) this.info(title); try { console.table(data); } catch { console.log(data); } }
};

// ===== Web notification =====
const sendWebNotification = async (userId: number, title: string, description: string) => {
  await axios.post('https://terarium.shop/api/Notification/web/create', {
    userId,
    title,
    description,
    broadcastToAll: false
  });
};

// ===== Local fallback item for summary =====
interface SimpleCartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
  accessoryId?: number | null;
  variantId?: number | null;
  comboId?: number | null;
}

// ===== Local type: allow COMBO + comboId/comboQuantity =====
type CreateOrderItemWithCombo = CreateOrderItem & {
  itemType: CreateOrderItem['itemType'] | 'COMBO';
  comboId?: number;
  comboQuantity?: number;
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  // --- State chính ---
  const [address, setAddress] = useState<Address | null>(null);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'wallet'>('momo');
  const [discountCode, setDiscountCode] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Ví
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // Dữ liệu cart/API
  const [apiCart, setApiCart] = useState<CartResponseNew | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Meta hiển thị
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [terrariumThumb, setTerrariumThumb] = useState<Record<number, string>>({});
  const [accessoryName, setAccessoryName] = useState<Record<number, string>>({});
  const [accessoryThumb, setAccessoryThumb] = useState<Record<number, string>>({});

  // Variants
  const [variantsMap, setVariantsMap] = useState<Record<number, any[]>>({});
  const [variantToTerrariumMap, setVariantToTerrariumMap] = useState<Record<number, number>>({});

  // Combo meta
  const [comboMeta, setComboMeta] = useState<Record<number, { name: string; image: string; items: any[] }>>({});
  const [comboOpen, setComboOpen] = useState<Record<string, boolean>>({});
  const [bundleOpen, setBundleOpen] = useState<Record<string, boolean>>({});

  // Fallback local + Summary toggle
  const [localSimple, setLocalSimple] = useState<SimpleCartItem[]>([]);
  const [summaryItemsOpen, setSummaryItemsOpen] = useState(false);

  // Load selected & cart
  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('checkoutItems') || '[]') as SimpleCartItem[];
    if (!raw.length) {
      navigate('/cart');
      toast.warn('Không có sản phẩm nào để thanh toán!');
      return;
    }
    const ids = new Set<string>(raw.map((it) => it.id));
    setSelectedIds(ids);
    setLocalSimple(raw);

    (async () => {
      try {
        const res = await getCart();
        setApiCart(res);
      } catch {
        // silent
      }
    })();
  }, [navigate]);

  // Wallet balance
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setWalletLoading(true);
        const balance = await getWalletBalance(userId);
        setWalletBalance(balance);
      } catch {
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    })();
  }, [userId]);

  // ACCESSORY meta (same as original)
  useEffect(() => {
    (async () => {
      if (!apiCart) return;
      const ids = new Set<number>();
      for (const b of apiCart.bundleItems || []) for (const e of b.bundleAccessories || []) e.accessoryId && ids.add(e.accessoryId);
      for (const e of apiCart.singleItems || []) e.accessoryId && ids.add(e.accessoryId);

      const missing = [...ids].filter((id) => !accessoryName[id] || !accessoryThumb[id]);
      if (!missing.length) return;

      const pairs = await Promise.allSettled(
        missing.map(async (id) => {
          const a = await getAccessoryById(id);
          return { id, name: a?.name || `Phụ kiện #${id}`, thumb: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG };
        })
      );
      const nameAdd: Record<number, string> = {};
      const thumbAdd: Record<number, string> = {};
      pairs.forEach((r) => {
        if (r.status === 'fulfilled') {
          nameAdd[r.value.id] = r.value.name;
          thumbAdd[r.value.id] = r.value.thumb;
        }
      });
      if (Object.keys(nameAdd).length) {
        setAccessoryName((m) => ({ ...m, ...nameAdd }));
        setAccessoryThumb((m) => ({ ...m, ...thumbAdd }));
      }
    })();
  }, [apiCart, accessoryName, accessoryThumb]);

  // === Chọn theo Cart: tách combos, singles, bundles (same as original) ===
  const allSingles = apiCart?.singleItems || [];
  const combosSelected = useMemo(() => {
    const src = allSingles.filter(e => !!e.comboId);
    return src.filter(e => selectedIds.has(keyOfCombo(e)));
  }, [allSingles, selectedIds]);

  const bundlesAll = useMemo(() => {
    const src = apiCart?.bundleItems || [];
    const out = src
      .filter((b) => (b.bundleAccessories?.length || 0) > 0)
      .map((b) => {
        const filteredAcc = b.bundleAccessories.filter((e) => selectedIds.has(keyOfEntry(e)));
        return { ...b, bundleAccessories: filteredAcc };
      })
      .filter((b) => (b.bundleAccessories?.length || 0) > 0);
    return out;
  }, [apiCart, selectedIds]);

  const variantSinglesFromBundles = useMemo<RawCartEntry[]>(() => {
    const src = apiCart?.bundleItems || [];
    const out = src
      .filter((b) => (b.bundleAccessories?.length || 0) === 0 && !!b.mainItem.terrariumVariantId)
      .map((b) => b.mainItem)
      .filter((e) => selectedIds.has(keyOfEntry(e)));
    return out;
  }, [apiCart, selectedIds]);

  const mergedSingles = useMemo<RawCartEntry[]>(() => {
    const singles = (apiCart?.singleItems || [])
      .filter((e) => !e.comboId)
      .filter((e) => selectedIds.has(keyOfEntry(e)));
    return [...variantSinglesFromBundles, ...singles];
  }, [apiCart, selectedIds, variantSinglesFromBundles]);

  // === Resolve variant → terrarium (same as original) ===
  useEffect(() => {
    const run = async () => {
      const variantIds = new Set<number>();
      mergedSingles.forEach((e) => e.terrariumVariantId && variantIds.add(e.terrariumVariantId));
      (apiCart?.bundleItems || []).forEach((b) => {
        b.mainItem?.terrariumVariantId && variantIds.add(b.mainItem.terrariumVariantId);
        (b.bundleAccessories || []).forEach((ba) => ba.terrariumVariantId && variantIds.add(ba.terrariumVariantId));
      });

      const missing = [...variantIds].filter((vid) => !variantToTerrariumMap[vid]);
      if (!missing.length) return;

      const results = await Promise.allSettled(
        missing.map(async (vid) => {
          const v = await getTerrariumVariantById(vid);
          return { vid, tid: v?.terrariumId as number | undefined };
        })
      );

      const newMap: Record<number, number> = {};
      const terrariumIdsToFetch = new Set<number>();
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value?.tid) {
          newMap[r.value.vid] = r.value.tid;
          terrariumIdsToFetch.add(r.value.tid);
        }
      });
      if (Object.keys(newMap).length) setVariantToTerrariumMap((prev) => ({ ...prev, ...newMap }));

      if (terrariumIdsToFetch.size) {
        const toFetch = [...terrariumIdsToFetch].filter((tid) => !variantsMap[tid]);
        if (toFetch.length) {
          const fetched = await Promise.allSettled(
            toFetch.map(async (tid) => {
              const list = await getVariantsByTerrariumId(tid);
              return { tid, list };
            })
          );
          const add: Record<number, any[]> = {};
          fetched.forEach((r) => {
            if (r.status === 'fulfilled') add[r.value.tid] = r.value.list || [];
          });
          if (Object.keys(add).length) setVariantsMap((prev) => ({ ...prev, ...add }));
        }
      }

      if (terrariumIdsToFetch.size) {
        const needMeta = [...terrariumIdsToFetch].filter((tid) => !terrariumName[tid] || !terrariumThumb[tid]);
        if (needMeta.length) {
          const meta = await Promise.allSettled(
            needMeta.map(async (tid) => {
              const t = await getTerrariumById(tid);
              return {
                tid,
                name: t?.terrariumName || `Bộ terrarium #${tid}`,
                thumb: t?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG,
              };
            })
          );
          const nameAdd: Record<number, string> = {};
          const thumbAdd: Record<number, string> = {};
          meta.forEach((r) => {
            if (r.status === 'fulfilled') {
              nameAdd[r.value.tid] = r.value.name;
              thumbAdd[r.value.tid] = r.value.thumb;
            }
          });
          if (Object.keys(nameAdd).length) {
            setTerrariumName((prev) => ({ ...prev, ...nameAdd }));
            setTerrariumThumb((prev) => ({ ...prev, ...thumbAdd }));
          }
        }
      }
    };
    run();
  }, [apiCart, mergedSingles, variantsMap, terrariumName, terrariumThumb, variantToTerrariumMap]);

  // === Fetch combo meta (same as original) ===
  useEffect(() => {
    const fetchComboMeta = async () => {
      if (!combosSelected.length) return;
      const missingIds = [...new Set(combosSelected.map(e => e.comboId!))].filter(id => !comboMeta[id]);
      if (!missingIds.length) return;

      const results = await Promise.all(missingIds.map(async (comboId) => {
        try {
          const comboData = await getComboById(comboId);
          const itemDetails = await Promise.all(
            (comboData.items || []).map(async (item: any) => {
              if (item.accessoryId) {
                try {
                  const acc = await getAccessoryById(item.accessoryId);
                  return {
                    ...item,
                    name: acc?.name || `Phụ kiện #${item.accessoryId}`,
                    image: acc?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
                    type: 'accessory'
                  };
                } catch {
                  return { ...item, name: `Phụ kiện #${item.accessoryId}`, image: FALLBACK_IMG, type: 'accessory' };
                }
              } else if (item.terrariumVariantId) {
                try {
                  const variant = await getTerrariumVariantById(item.terrariumVariantId);
                  const terr = variant ? await getTerrariumById(variant.terrariumId) : null;
                  return {
                    ...item,
                    name: terr?.terrariumName || variant?.variantName || `Terrarium #${variant?.terrariumId}`,
                    image: variant?.urlImage || terr?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG,
                    type: 'terrarium',
                    variantName: variant?.variantName
                  };
                } catch {
                  return { ...item, name: `Terrarium variant #${item.terrariumVariantId}`, image: FALLBACK_IMG, type: 'terrarium' };
                }
              }
              return item;
            })
          );

          return { comboId, name: comboData.name, image: comboData.imageUrl || FALLBACK_IMG, items: itemDetails };
        } catch (error) {
          console.error(`Error fetching combo ${comboId}:`, error);
          return { comboId, name: `Combo #${comboId}`, image: FALLBACK_IMG, items: [] };
        }
      }));

      setComboMeta((prev) => {
        const n = { ...prev };
        results.forEach((c) => { n[c.comboId] = c; });
        return n;
      });
    };
    fetchComboMeta();
  }, [combosSelected, comboMeta]);

  // ====== TÍNH TIỀN ======
  const subtotalFromAPI = useMemo(() => {
    const sumSingles = mergedSingles.reduce((s, e) => s + (e.totalCartPrice || 0), 0);
    const sumBundles = bundlesAll.reduce(
      (s, b) => s + b.bundleAccessories.reduce((ss, e) => ss + (e.totalCartPrice || 0), 0),
      0
    );
    const sumCombos = combosSelected.reduce((s, e) => s + (e.totalCartPrice || 0), 0);
    return sumSingles + sumBundles + sumCombos;
  }, [mergedSingles, bundlesAll, combosSelected]);

  const subtotalLocal = useMemo(
    () => localSimple.reduce((s, it) => s + it.price * it.quantity, 0),
    [localSimple]
  );

  const subtotal = apiCart ? subtotalFromAPI : subtotalLocal;

  // Voucher calculation
  const voucherApplicable = useMemo(() => {
    if (!voucher) return false;
    const now = new Date();
    const validDate = new Date(voucher.validFrom) <= now && now <= new Date(voucher.validTo);
    const minOK = (voucher.minOrderAmount ?? 0) <= subtotal;
    const status = String(voucher.status || '').toLowerCase();
    return status === 'active' && validDate && minOK;
  }, [voucher, subtotal]);

  const discountFromVoucher = useMemo(() => {
    if (!voucher || !voucherApplicable) return 0;
    const percent = voucher.discountPercent ?? 0;
    const byPercent = Math.floor((subtotal * percent) / 100);
    const byAmount = voucher.discountAmount ?? 0;
    return Math.min(subtotal, Math.max(byPercent, byAmount));
  }, [voucher, voucherApplicable, subtotal]);

  // Shipping: free if subtotal >= 500k, else 30k
  const shippingFee = useMemo(() => {
    return subtotal >= 500_000 ? 0 : 30_000;
  }, [subtotal]);

  /**
   * NEW 10% logic (full payment):
   * - Tính trên tổng sau voucher + phí ship
   *   base = (subtotal - discountFromVoucher) + shippingFee
   *   discountFromFull = 10% * base
   */
  const discountFromFull = useMemo(() => {
    if (paymentOption !== 'full') return 0;
    const base = Math.max(0, subtotal - discountFromVoucher + shippingFee);
    return Math.floor(base * 0.10);
  }, [paymentOption, subtotal, discountFromVoucher, shippingFee]);

  // Totals
  const totalAmountOld = Math.max(0, subtotal + shippingFee);
  // final total = (subtotal - voucher + ship) - fullDiscount
  const totalAmountNew = Math.max(0, subtotal - discountFromVoucher + shippingFee - discountFromFull);

  // Payment amount
  const actualPaymentAmount =
    paymentOption === 'deposit'
      ? Math.max(0, Math.round((Math.max(0, subtotal - discountFromVoucher + shippingFee)) * 0.3 ))
      : totalAmountNew;

  // Check if wallet has enough balance
  const walletCanPayFull = walletBalance >= actualPaymentAmount;

  // Apply voucher
  const applyVoucher = async () => {
    setVoucherError('');
    if (!discountCode.trim()) return;
    try {
      const res = await getVoucherByCode(discountCode.trim());
      if (!res) {
        setVoucher(null);
        setVoucherError('Mã không hợp lệ!');
        return;
      }
      const now = new Date();
      const validDate = new Date(res.validFrom) <= now && now <= new Date(res.validTo);
      const statusOK = String(res.status || '').toLowerCase() === 'active';
      if (!statusOK || !validDate) {
        setVoucher(null);
        setVoucherError('Mã đã hết hạn hoặc chưa được áp dụng!');
        return;
      }
      if ((res.minOrderAmount ?? 0) > subtotal) {
        setVoucher(res);
        setVoucherError(`Áp dụng cho đơn từ ${(res.minOrderAmount || 0).toLocaleString('vi-VN')} VND (tạm tính chưa đạt).`);
        toast.warn('Tạm tính chưa đạt mức tối thiểu để áp voucher.');
        return;
      }
      setVoucher(res);
      toast.success('Áp dụng voucher thành công!');
    } catch {
      setVoucher(null);
      setVoucherError('Mã không hợp lệ!');
    }
  };

  // Build order items (same as original)
  const buildOrderItems = (): CreateOrderItemWithCombo[] => {
    const items: CreateOrderItemWithCombo[] = [];

    // Bundles
    for (const b of bundlesAll) {
      const variantFromMain = b?.mainItem?.terrariumVariantId ?? 0;
      const variantFromAnyAcc =
        (b?.bundleAccessories || []).find(x => !!x.terrariumVariantId)?.terrariumVariantId ?? 0;

      const bundleVariantId = variantFromMain || variantFromAnyAcc || 0;

      if (!bundleVariantId) {
        console.warn('[Checkout] ❗Thiếu terrariumVariantId cho bundle:', {
          mainItem: b?.mainItem,
          accessories: b?.bundleAccessories
        });
        toast.error('Không xác định được biến thể (variant) cho một bộ phụ kiện. Vui lòng mở lại trang/ chọn đúng biến thể.');
        continue;
      }

      for (const e of b.bundleAccessories) {
        if (!e.accessoryId) continue;
        const qty = e.totalCartQuantity ?? qtyOf(e);

        items.push({
          itemType: 'BUNDLE_ACCESSORY',
          terrariumId: 0,
          terrariumVariantId: bundleVariantId,
          terrariumVariantQuantity: 0,
          accessoryId: e.accessoryId,
          accessoryQuantity: qty,
          comboId: 0,
          comboQuantity: 0,
        });
      }
    }

    // Singles & main items
    for (const e of mergedSingles) {
      const qty = e.totalCartQuantity ?? qtyOf(e);

      if (e.terrariumVariantId != null) {
        items.push({
          itemType: 'MAIN_ITEM',
          terrariumId: 0,
          terrariumVariantId: e.terrariumVariantId,
          terrariumVariantQuantity: qty,
          accessoryId: 0,
          accessoryQuantity: 0,
          comboId: 0,
          comboQuantity: 0,
        });
      } else if (e.accessoryId != null) {
        items.push({
          itemType: 'SINGLE',
          terrariumId: 0,
          terrariumVariantId: 0,
          terrariumVariantQuantity: 0,
          accessoryId: e.accessoryId,
          accessoryQuantity: qty,
          comboId: 0,
          comboQuantity: 0,
        });
      }
    }

    // COMBOs
    for (const ce of combosSelected) {
      const qty = ce.totalCartQuantity ?? qtyOf(ce);
      items.push({
        itemType: 'COMBO',
        comboId: ce.comboId ?? 0,
        comboQuantity: qty,
        terrariumId: 0,
        terrariumVariantId: 0,
        terrariumVariantQuantity: 0,
        accessoryId: 0,
        accessoryQuantity: 0,
      } as CreateOrderItemWithCombo);
    }

    return items;
  };

  // Cleanup cart (same as original)
  const cleanupCartItems = async (orderItems: CreateOrderItemWithCombo[], selectedCombos: RawCartEntry[]) => {
    try {
      const cartData = await getCart();
      const singles = Array.isArray((cartData as any)?.singleItems) ? (cartData as any).singleItems : [];
      const bundles = Array.isArray((cartData as any)?.bundleItems) ? (cartData as any).bundleItems : [];
      const fromBundles = bundles.flatMap((b: any) => {
        const accs = Array.isArray(b.bundleAccessories) ? b.bundleAccessories : [];
        if (accs.length > 0) return accs;
        return b?.mainItem ? [b.mainItem] : [];
      });
      const cartItemsFromAPI = [...singles, ...fromBundles];

      const itemsToDelete: number[] = [];

      for (const orderItem of orderItems) {
        const matchingCartItem = cartItemsFromAPI.find((cartItem: any) => {
          if (orderItem.terrariumVariantId && cartItem.terrariumVariantId) {
            return orderItem.terrariumVariantId === cartItem.terrariumVariantId;
          }
          if (orderItem.accessoryId && cartItem.accessoryId) {
            return orderItem.accessoryId === cartItem.accessoryId;
          }
          return false;
        });
        if (matchingCartItem?.cartItemId) itemsToDelete.push(matchingCartItem.cartItemId);
      }

      const selectedComboIds = selectedCombos.map(c => c.comboId!);
      for (const ci of singles) {
        if (ci.comboId && selectedComboIds.includes(ci.comboId) && ci.cartItemId) {
          itemsToDelete.push(ci.cartItemId);
        }
      }

      const uniq = [...new Set(itemsToDelete)];
      if (uniq.length > 0) {
        await Promise.all(uniq.map((cartItemId) => deleteCartItem(cartItemId)));
        toast.success(`Đã xóa ${uniq.length} sản phẩm khỏi giỏ hàng`);
      }
    } catch (error) {
      console.error('Lỗi cleanup cart:', error);
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!address?.id) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }
    if (!userId) {
      toast.error('Bạn cần đăng nhập để đặt hàng!');
      return;
    }

    // Check wallet balance if wallet payment is selected
    if (paymentMethod === 'wallet' && !walletCanPayFull) {
      toast.error('Số dư ví không đủ để thanh toán!');
      return;
    }

    try {
      const items = buildOrderItems();
      if (!items.length) {
        toast.error('Không có sản phẩm hợp lệ để tạo đơn!');
        return;
      }

      const payload = {
        voucherId: voucherApplicable ? voucher!.voucherId : 0,
        deposit: paymentOption === 'deposit' ? actualPaymentAmount : 0,
        addressId: (address as any).id,
        items,
        totalAmountOld,
        totalAmountNew
      } as const;

      const { orderId } = await createOrder(payload as any);
      if (!orderId) {
        toast.error('Tạo đơn hàng thất bại!');
        return;
      }

      // Send web notification
      try {
        await sendWebNotification(
          userId,
          `Đặt hàng thành công #${orderId}`,
          `Đơn hàng #${orderId} đã được tạo. Tổng tiền: ${totalAmountNew.toLocaleString('vi-VN')} VND`
        );
      } catch (e) {
        console.warn('[Checkout] Gửi thông báo web thất bại:', e);
      }

      // Cleanup cart
      await cleanupCartItems(items, combosSelected);

      if (paymentMethod === 'wallet') {
        // Use wallet for payment
        try {
          await useWalletForPayment({ userId, amount: actualPaymentAmount, orderId});
          toast.success('Thanh toán thành công bằng ví!');
          localStorage.removeItem('cartItems');
          localStorage.removeItem('checkoutItems');

          // ★ Điều hướng sang trang PaymentWalletSuccess (route: /wallet-success/:orderId)
          navigate(`/wallet-success/${orderId}`);
        } catch (error) {
          console.error('Error using wallet:', error);
          toast.error('Lỗi khi sử dụng ví, vui lòng thử lại!');
          return;
        }
      } else {
        // MoMo payment
        try {
          const { payUrl } = await createMoMoPayment({
            orderId,
            orderInfo: customerNote || `Đơn hàng #${orderId}`,
            finalAmount: actualPaymentAmount,
            voucherId: voucherApplicable ? voucher!.voucherId : 0,
            payAll: paymentOption === 'full'
          } as any);
          localStorage.removeItem('cartItems');
          localStorage.removeItem('checkoutItems');
          window.location.href = payUrl;
        } catch (error: any) {
          console.error('MoMo payment error:', error?.response?.data || error);
          toast.error('Không lấy được link thanh toán MoMo!');
        }
      }
    } catch (err: any) {
      log.group('Checkout ▶ ERROR createOrder');
      log.info('error.response?.data:', err?.response?.data);
      log.info('error.message:', err?.message);
      log.end();

      if (err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstKey = Object.keys(errors)[0];
        const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : String(errors[firstKey]);
        toast.error(firstMsg || 'Đặt hàng/thanh toán thất bại!');
      } else {
        toast.error('Đặt hàng/thanh toán thất bại, vui lòng thử lại!');
      }
    }
  };

  const ProductSectionAPI = (
  <div className="bg-white p-4 sm:p-5 rounded-lg shadow space-y-4">
    <h2 className="text-base sm:text-lg md:text-xl font-semibold">Sản phẩm</h2>

    {/* COMBOS */}
    {combosSelected.map((e) => {
      const comboKey = keyOfCombo(e);
      const isOpen = comboOpen[comboKey] ?? false;
      const data = e.comboId ? comboMeta[e.comboId] : undefined;

      return (
        <div key={e.cartItemId} className="rounded-lg border">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-purple-50">
            <div className="flex items-center gap-3">
              <img
                src={data?.image || FALLBACK_IMG}
                alt= {data?.name || `Combo #${e.comboId}`}
                className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                onClick={() => navigate(`/combo/${e.comboId}`)}
                onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
              />
              <div className="font-semibold">
                <button onClick={() => navigate(`/combo/${e.comboId}`)} className="text-purple-700 hover:underline">
                  Combo {data?.name || `Combo #${e.comboId}`}
                </button>
                <div className="text-sm text-gray-600">SL: <b>{e.totalCartQuantity || qtyOf(e)}</b></div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="text-purple-700 font-semibold">{currency(e.totalCartPrice || 0)}</div>
              <button
                onClick={() => setComboOpen((m) => ({ ...m, [comboKey]: !isOpen }))}
                className="text-gray-600 hover:text-gray-800"
              >
                {isOpen ? 'Thu gọn' : 'Mở rộng'}
              </button>
            </div>
          </div>

          {isOpen && data?.items && (
            <div className="divide-y bg-gray-50">
              <div className="px-4 py-2 text-sm text-gray-600 font-medium bg-purple-50 border-b">
                Sản phẩm trong combo:
              </div>
              {data.items.map((it: any, idx: number) => (
                <div key={`combo-item-${idx}`} className="p-3 sm:p-4 flex items-center gap-3">
                  <img
                    src={it.image || FALLBACK_IMG}
                    alt={it.name || 'Sản phẩm'}
                    className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                    onClick={() => {
                      if (it.type === 'accessory' && it.accessoryId) {
                        navigate(`/accessory/${it.accessoryId}`);
                      } else if (it.type === 'terrarium') {
                        navigate(`/terrarium/${it.terrariumId ?? ''}`);
                      }
                    }}
                    onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{it.name || 'Sản phẩm'}</div>
                    {it.variantName && (
                      <div className="text-xs sm:text-sm text-gray-500">Phân loại: {it.variantName}</div>
                    )}
                    <div className="text-sm text-gray-600">
                      {currency(it.unitPrice || 0)} × {it.quantity}
                    </div>
                  </div>
                  <div className="w-32 text-right font-semibold text-gray-800">
                    {currency(it.totalPrice || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })}

    {/* BUNDLES — có nút Thu gọn/Mở rộng */}
{bundlesAll.map((b) => {
  const mainVariantId = b?.mainItem?.terrariumVariantId || 0;
  const resolvedTidFromMain = mainVariantId ? variantToTerrariumMap[mainVariantId] : 0;
  let tid = resolvedTidFromMain;
  if (!tid) {
    const firstAccVariantId = b.bundleAccessories?.[0]?.terrariumVariantId || 0;
    if (firstAccVariantId) tid = variantToTerrariumMap[firstAccVariantId] || 0;
  }

  const bundleKey = keyOfBundle(b);
  const isOpen = bundleOpen[bundleKey] ?? false;

  const name = tid ? (terrariumName[tid] || `Bộ terrarium #${tid}`) : 'Bộ phụ kiện theo biến thể';
  const thumb = tid ? (terrariumThumb[tid] || FALLBACK_IMG) : FALLBACK_IMG;

  const totalQty = calcBundleQty(b);
  const totalPrice = b.bundleAccessories.reduce((s, e) => s + (e.totalCartPrice || 0), 0);

  return (
    <div key={bundleKey} className="rounded-lg border">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <img
            src={thumb}
            alt={name}
            className="w-8 h-8 rounded border bg-white object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
          />
          <div className="font-semibold">
            Bộ phụ kiện của{' '}
            {tid ? (
              <button onClick={() => navigate(`/terrarium/${tid}`)} className="text-green-700 hover:underline">
                {name}
              </button>
            ) : (
              <span className="text-gray-700">biến thể #{mainVariantId}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div>SL: <b>{totalQty}</b></div>
          <div className="text-green-700 font-semibold">{currency(totalPrice)}</div>
          <button
            onClick={() => setBundleOpen((m) => ({ ...m, [bundleKey]: !isOpen }))}
            className="text-gray-600 hover:text-gray-800"
          >
            {isOpen ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="divide-y">
          {b.bundleAccessories.map((e) => {
            const aId = e.accessoryId || 0;
            const aName = aId ? (accessoryName[aId] || e.item?.[0]?.productName || `Phụ kiện #${aId}`) : 'Phụ kiện';
            const aThumb = aId ? (accessoryThumb[aId] || e.item?.[0]?.imageUrl || FALLBACK_IMG) : FALLBACK_IMG;

            return (
              <div key={e.cartItemId} className="p-3 sm:p-4 flex items-center gap-3">
                <img
                  src={aThumb}
                  alt={aName}
                  className="w-14 h-14 object-cover rounded border bg-white"
                  onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{aName}</div>
                  <div className="text-sm text-gray-600">
                    {currency(unitPriceOf(e))} × {qtyOf(e)}
                  </div>
                </div>
                <div className="w-32 text-right font-semibold text-gray-800">
                  {currency(e.totalCartPrice || 0)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
})}


    {/* Singles + main items */}
    {mergedSingles.length > 0 && (
      <div className="rounded-lg border">
        <div className="p-3 sm:p-4 border-b font-semibold bg-gray-50">Sản phẩm lẻ</div>
        <div className="divide-y">
          {mergedSingles.map((e) => {
            const isVariant = !!e.terrariumVariantId;
            const actualTerrariumId = isVariant
              ? (variantToTerrariumMap[e.terrariumVariantId!] || e.terrariumId)
              : e.terrariumId;

            const terrariumDisplayName = actualTerrariumId
              ? (terrariumName[actualTerrariumId] || `Bể terrarium #${actualTerrariumId}`)
              : '';

            const terrariumImage = actualTerrariumId
              ? (terrariumThumb[actualTerrariumId] || FALLBACK_IMG)
              : FALLBACK_IMG;

            const list = actualTerrariumId ? (variantsMap[actualTerrariumId] || []) : [];
            const currentVariant = isVariant
              ? list.find((v: any) => v.terrariumVariantId === e.terrariumVariantId)
              : null;

            const displayName =
              isVariant && terrariumDisplayName
                ? terrariumDisplayName
                : e.accessoryId
                ? (accessoryName[e.accessoryId] || `Phụ kiện #${e.accessoryId}`)
                : 'Sản phẩm';

            const accThumb = e.accessoryId ? (accessoryThumb[e.accessoryId] || FALLBACK_IMG) : null;
            const imgSrc = accThumb || terrariumImage || FALLBACK_IMG;

            return (
              <div key={e.cartItemId} className="p-3 sm:p-4 flex items-start gap-3">
                <img
                  src={imgSrc}
                  alt={displayName}
                  className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                  onClick={() =>
                    isVariant && actualTerrariumId
                      ? navigate(`/terrarium/${actualTerrariumId}`)
                      : e.accessoryId
                      ? navigate(`/accessory/${e.accessoryId}`)
                      : undefined
                  }
                  onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                />

                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-gray-800 cursor-pointer hover:underline mb-1"
                    onClick={() =>
                      isVariant && actualTerrariumId
                        ? navigate(`/terrarium/${actualTerrariumId}`)
                        : e.accessoryId
                        ? navigate(`/accessory/${e.accessoryId}`)
                        : undefined
                    }
                    title={displayName}
                  >
                    {displayName}
                  </div>

                  {isVariant && (
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                      Phân loại hàng:{' '}
                      <span className="font-medium text-gray-700">
                        {currentVariant?.variantName || `Variant #${e.terrariumVariantId}`}
                      </span>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    {currency(unitPriceOf(e))} × {qtyOf(e)}
                  </div>
                </div>

                <div className="w-32 text-right font-semibold text-gray-800">
                  {currency(e.totalCartPrice || 0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Fallback local (khi chưa lấy được apiCart) */}
    {!apiCart && (
      <div className="rounded-lg border">
        <div className="p-3 sm:p-4 border-b font-semibold bg-gray-50">Sản phẩm</div>
        <div className="divide-y">
          {localSimple.map((item) => (
            <div key={item.id} className="p-3 sm:p-4 flex items-center gap-3">
              <img
                src={item.image || FALLBACK_IMG}
                alt={item.name}
                className="w-14 h-14 object-cover rounded border bg-white"
                onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{item.name}</div>
                <div className="text-sm text-gray-600">
                  {currency(item.price)} × {item.quantity}
                </div>
              </div>
              <div className="w-32 text-right font-semibold text-gray-800">
                {currency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">Thanh Toán</h1>

            {/* Sản phẩm */}
            {ProductSectionAPI}

            {/* Địa chỉ */}
            <div className="relative">
              <AddressSelector userId={userId || 0} onSelect={(addr) => setAddress(addr)} />
              <div className="absolute top-2 right-2 text-xs text-gray-500" title="Hiện chỉ hỗ trợ giao nội thành TP.HCM">
                TP.HCM nội thành
              </div>
            </div>

            {/* Loại thanh toán */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Loại thanh toán</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div
                  className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentOption === 'deposit' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-white'
                  } hover:border-yellow-500`}
                  onClick={() => setPaymentOption('deposit')}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="deposit"
                      checked={paymentOption === 'deposit'}
                      onChange={() => setPaymentOption('deposit')}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <span className="font-bold text-yellow-700 text-sm sm:text-base md:text-lg">
                      Cọc trước 30%
                    </span>
                  </label>
                  <div className="mt-2 text-xs sm:text-sm text-gray-700">
                    Đặt cọc 30% để đảm bảo đơn hàng; phí ship được tính kèm lần thanh toán này.
                  </div>
                </div>

                <div
                  className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentOption === 'full' ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'
                  } hover:border-green-500`}
                  onClick={() => setPaymentOption('full')}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={paymentOption === 'full'}
                      onChange={() => setPaymentOption('full')}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <span className="font-bold text-green-700 text-sm sm:text-base md:text-lg">
                      Thanh toán toàn bộ
                    </span>
                  </label>
                  <div className="mt-2 text-xs sm:text-sm text-gray-700">
                    Giảm ngay <b>10%</b> giá trị sản phẩm sau khi áp voucher.
                  </div>
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div
                  className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'momo' ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-white'
                  } hover:border-pink-500`}
                  onClick={() => setPaymentMethod('momo')}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="momo"
                      checked={paymentMethod === 'momo'}
                      onChange={() => setPaymentMethod('momo')}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <CreditCard className="w-5 h-5 mr-2 text-pink-600" />
                    <span className="font-bold text-pink-700 text-sm sm:text-base md:text-lg">
                      MoMo
                    </span>
                  </label>
                  <div className="mt-2 text-xs sm:text-sm text-gray-700">
                    Thanh toán qua ví điện tử MoMo
                  </div>
                </div>

                <div
                  className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'wallet' 
                      ? walletCanPayFull 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  } hover:border-purple-500 ${!walletCanPayFull ? 'opacity-60' : ''}`}
                  onClick={() => walletCanPayFull && setPaymentMethod('wallet')}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      disabled={!walletCanPayFull}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <Wallet className="w-5 h-5 mr-2 text-purple-600" />
                    <span className="font-bold text-purple-700 text-sm sm:text-base md:text-lg">
                      Ví điện tử
                    </span>
                  </label>
                  <div className="mt-2 text-xs sm:text-sm">
                    <div className={walletCanPayFull ? 'text-gray-700' : 'text-red-600'}>
                      Số dư: {walletLoading ? 'Đang tải...' : currency(walletBalance)}
                    </div>
                    {!walletCanPayFull && (
                      <div className="text-red-600">
                        Không đủ số dư (cần {currency(actualPaymentAmount)})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Voucher + Ghi chú */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
              <div className="flex-1 bg-white rounded-lg shadow p-4 sm:p-5">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3">Mã giảm giá</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã giảm giá..."
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 p-3 text-sm sm:text-base border-2 rounded w-full"
                  />
                  <button
                    onClick={applyVoucher}
                    className="bg-blue-500 text-white px-4 sm:px-6 py-3 rounded text-sm sm:text-base hover:bg-blue-600 font-bold min-w-[100px]"
                  >
                    Áp dụng
                  </button>
                </div>
                <div className="mt-4 min-h-[80px]">
                  {voucherError && <div className="text-red-500 text-sm sm:text-base">{voucherError}</div>}
                  {voucher && (
                    <div className="border-2 border-green-600 rounded p-4 bg-green-50 text-green-700 text-sm sm:text-base font-medium space-y-1 mt-1">
                      <div><b>{voucher.description}</b></div>
                      {voucher.minOrderAmount ? (
                        <div>Áp dụng cho đơn từ <b>{voucher.minOrderAmount.toLocaleString('vi-VN')} VND</b></div>
                      ) : null}
                      <div>
                        {voucher.discountPercent && voucher.discountPercent > 0
                          ? <>Giảm: <b>{voucher.discountPercent}%</b></>
                          : <>Giảm: <b>{(voucher.discountAmount || 0).toLocaleString('vi-VN')} VND</b></>}
                      </div>
                      <div>
                        Hiệu lực: {new Date(voucher.validFrom).toLocaleDateString()} - {new Date(voucher.validTo).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-lg shadow p-4 sm:p-5 flex flex-col">
                <div className="flex justify-between items-end mb-3">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold">Ghi chú cho đơn hàng</h2>
                  <span
                    className={`text-xs sm:text-sm ${
                      customerNote.trim().split(/\s+/).filter(Boolean).length > 100 ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    {customerNote.trim().split(/\s+/).filter(Boolean).length}/100 từ
                  </span>
                </div>
                <textarea
                  value={customerNote}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 100) setCustomerNote(e.target.value);
                    else setCustomerNote(words.slice(0, 100).join(' ') + ' ');
                  }}
                  rows={5}
                  placeholder="Nhập ghi chú..."
                  className="w-full p-3 text-sm sm:text-base border-2 rounded resize-none min-h-[100px] sm:min-h-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <button
              onClick={() => navigate('/cart')}
              className="w-full text-gray-700 border border-gray-400 px-4 py-2 rounded hover:text-blue-600 text-sm sm:text-base"
            >
              ← Quay lại giỏ hàng
            </button>

            <div className="bg-white border border-gray-200 rounded-lg shadow p-4 sm:p-5 sticky top-4 sm:top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-green-700">Tổng kết đơn hàng</h2>
                <button
                  onClick={() => setSummaryItemsOpen((v) => !v)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {summaryItemsOpen ? 'Thu gọn sản phẩm' : 'Hiển thị sản phẩm'}
                </button>
              </div>

              {summaryItemsOpen && (
                <div className="space-y-2 text-sm sm:text-base mb-2">
                  {localSimple.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={item.image || FALLBACK_IMG}
                          alt=""
                          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded bg-white"
                          onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                        />
                        <span className="truncate">
                          {item.name} x {item.quantity}
                        </span>
                      </div>
                      <span className="text-right">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  ))}
                  <hr className="my-2" />
                </div>
              )}

              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString('vi-VN')} VND</span>
                </div>

                {voucher && (
                  <div className={`flex justify-between ${voucherApplicable ? 'text-yellow-600' : 'text-gray-400'}`}>
                    <span>Giảm giá voucher</span>
                    <span>-{discountFromVoucher.toLocaleString('vi-VN')} VND</span>
                  </div>
                )}

                {paymentOption === 'full' && (
                  <div className="flex justify-between text-green-600">
                    <span>Ưu đãi thanh toán toàn bộ</span>
                    <span>-{discountFromFull.toLocaleString('vi-VN')} VND</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Phí ship</span>
                  <span>{shippingFee.toLocaleString('vi-VN')} VND</span>
                </div>

                <hr className="my-2" />

                <div className="flex justify-between font-bold text-base sm:text-lg text-green-700">
                  <span>Cần thanh toán</span>
                  <span>{actualPaymentAmount.toLocaleString('vi-VN')} VND</span>
                </div>

                {paymentOption === 'deposit' && (
                  <div className="flex justify-between text-red-600">
                    <span>Thanh toán khi nhận hàng</span>
                    <span>{(totalAmountNew - actualPaymentAmount).toLocaleString('vi-VN')} VND</span>
                  </div>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={paymentMethod === 'wallet' && !walletCanPayFull}
                className={`mt-4 sm:mt-6 w-full py-2 sm:py-3 rounded text-sm sm:text-base font-medium transition-colors ${
                  paymentMethod === 'wallet' && !walletCanPayFull
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : paymentMethod === 'wallet'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {paymentMethod === 'wallet' 
                  ? walletCanPayFull 
                    ? 'Thanh toán bằng ví' 
                    : 'Số dư ví không đủ'
                  : 'Thanh toán với MoMo'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
