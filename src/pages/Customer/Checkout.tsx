// src/pages/Customer/Checkout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddressSelector from '@/components/customer/Layout/AddressSelector';
import { Address } from '@/types/profile';
import {
  createOrder,
  getVoucherByCode,
  getWalletBalance,
  useWalletForPayment,
  createMoMoPayment
} from '@/api/order';
import { getCart, deleteCartItem } from '@/api/cart';
import { getTerrariumById, getVariantsByTerrariumId, getTerrariumVariantById } from '@/api/terrarium';
import { getAccessoryById } from '@/api/accessory';
import { getComboById } from '@/api/combo';
import type { Voucher } from '@/types/order';
import type { CartResponseNew, CartBundle, RawCartEntry } from '@/types/cart';
import { useAuth } from '@/hooks/useAuth'; // ✅ dùng userId từ useAuth

// ✅ placeholder logo nền trắng
const FALLBACK_IMG = '/TerraTechLogo.png';

// ===== Helpers & currency =====
const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';
const keyOfEntry = (e: RawCartEntry) => `ci_${e.cartItemId}`;
const keyOfBundle = (b: CartBundle) => `b_${b.mainItem.terrariumId ?? 'x'}`;
const keyOfCombo = (e: RawCartEntry) => `combo_${e.cartItemId}`;
const unitPriceOf = (e: RawCartEntry) => {
  const qty = e.totalCartQuantity || 0;
  return qty > 0 ? e.totalCartPrice / qty : 0;
};

// ===== Small logger (gói gọn, dễ tắt/bật) =====
const isDev = typeof import.meta !== 'undefined' ? import.meta.env.MODE !== 'production' : true;
const log = {
  group(title: string) {
    if (!isDev) return;
    try { console.groupCollapsed(`%c${title}`, 'color:#16a34a;font-weight:600;'); } catch {}
  },
  end() {
    if (!isDev) return;
    try { console.groupEnd(); } catch {}
  },
  info(...args: any[]) {
    if (!isDev) return;
    // @ts-ignore
    console.log('%c[Checkout]', 'color:#16a34a', ...args);
  },
  table(data: any, title?: string) {
    if (!isDev) return;
    if (title) this.info(title);
    try { console.table(data); } catch { console.log(data); }
  }
};

// ===== Thêm API wrapper gửi thông báo web (giữ ngay trong file theo yêu cầu nhanh gọn) =====
const sendWebNotification = async (userId: number, title: string, description: string) => {
  // API: https://terarium.shop/api/Notification/web/create
  // Nếu bạn muốn tách ra /api/notification.ts mình có thể tách ở bước sau.
  await axios.post('https://terarium.shop/api/Notification/web/create', {
    userId,
    title,
    description,
    broadcastToAll: false
  });
};

// ===== Order payload item (API mới) =====
// ✅ BỔ SUNG terrariumId để truyền cho BUNDLE_ACCESSORY
type NewOrderItemPayload = {
  itemType: 'BUNDLE_ACCESSORY' | 'SINGLE' | 'MAIN_ITEM';
  terrariumId?: number;             // <-- thêm
  accessoryId: number;
  terrariumVariantId: number;
  accessoryQuantity: number;
  terrariumVariantQuantity: number;
};

// ===== Simple item for local fallback =====
interface SimpleCartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
  accessoryId?: number | null;
  variantId?: number | null;
  comboId?: number | null; // để hiển thị trong Summary khi user chọn combo từ Cart
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth(); // ✅ lấy userId từ hook

  // --- State chính ---
  const [address, setAddress] = useState<Address | null>(null);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [discountCode, setDiscountCode] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Ví
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // MoMo QR
  const [showMoMoQR, setShowMoMoQR] = useState(false);
  const [momoQRCode, setMoMoQRCode] = useState<string | null>(null);
  const [momoPayUrl, setMoMoPayUrl] = useState<string | null>(null);

  // Dữ liệu hiển thị kiểu Cart
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

  // Combo meta (để show item trong combo)
  const [comboMeta, setComboMeta] = useState<Record<number, { name: string; image: string; items: any[] }>>({});
  const [comboOpen, setComboOpen] = useState<Record<string, boolean>>({}); // UI toggle trong phần Sản phẩm

  // Fallback local + Summary toggle
  const [localSimple, setLocalSimple] = useState<SimpleCartItem[]>([]);
  const [summaryItemsOpen, setSummaryItemsOpen] = useState(false); // ✅ mặc định đóng

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

    log.group('Checkout ▶ Selected (localStorage)');
    log.info('checkoutItems (localSimple):', raw);
    log.info('selectedIds:', [...ids]);
    log.end();

    (async () => {
      try {
        const res = await getCart();
        setApiCart(res);
        log.group('Checkout ▶ API Cart loaded');
        log.info('apiCart:', res);
        log.end();
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
        log.group('Checkout ▶ Wallet');
        log.info('userId:', userId);
        log.info('walletBalance:', balance);
        log.end();
      } catch {
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    })();
  }, [userId]);

  // TERRARIUM meta
  useEffect(() => {
    (async () => {
      if (!apiCart) return;
      const ids = new Set<number>();
      for (const b of apiCart.bundleItems || []) {
        const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
        if (tid) ids.add(tid);
      }
      for (const e of apiCart.singleItems || []) {
        if (e.terrariumId) ids.add(e.terrariumId);
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
              thumb: t?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG
            };
          } catch {
            return { id, name: `Bể terrarium #${id}`, thumb: FALLBACK_IMG };
          }
        })
      );

      setTerrariumName((m) => Object.assign({}, m, ...pairs.map(p => ({ [p.id]: p.name }))));
      setTerrariumThumb((m) => Object.assign({}, m, ...pairs.map(p => ({ [p.id]: p.thumb }))));
      log.group('Checkout ▶ Terrarium meta');
      log.table(pairs, 'terrarium pairs');
      log.end();
    })();
  }, [apiCart, terrariumName, terrariumThumb]);

  // ACCESSORY meta
  useEffect(() => {
    (async () => {
      if (!apiCart) return;
      const ids = new Set<number>();
      for (const b of apiCart.bundleItems || []) {
        for (const e of b.bundleAccessories || []) {
          if (e.accessoryId) ids.add(e.accessoryId);
        }
      }
      for (const e of apiCart.singleItems || []) {
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
              thumb: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG
            };
          } catch {
            return { id, name: `Phụ kiện #${id}`, thumb: FALLBACK_IMG };
          }
        })
      );

      setAccessoryName((m) => Object.assign({}, m, ...pairs.map(p => ({ [p.id]: p.name }))));
      setAccessoryThumb((m) => Object.assign({}, m, ...pairs.map(p => ({ [p.id]: p.thumb }))));
      log.group('Checkout ▶ Accessory meta');
      log.table(pairs, 'accessory pairs');
      log.end();
    })();
  }, [apiCart, accessoryName, accessoryThumb]);

  // === Chọn theo Cart: tách combos, singles, bundles ===
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

    log.group('Checkout ▶ Bundles (selected)');
    log.info('bundlesAll.count:', out.length);
    log.end();

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
      .filter((e) => !e.comboId) // loại combo ra khỏi singles
      .filter((e) => selectedIds.has(keyOfEntry(e)));
    return [...variantSinglesFromBundles, ...singles];
  }, [apiCart, selectedIds, variantSinglesFromBundles]);

  // Prefetch variant names (read-only)
  useEffect(() => {
    const run = async () => {
      const targets = mergedSingles.filter((e) => !!e.terrariumVariantId);
      if (!targets.length) return;

      const variantIds = [...new Set(targets.map((e) => e.terrariumVariantId!).filter(Boolean))];
      const missing = variantIds.filter((vid) => !variantToTerrariumMap[vid]);
      if (!missing.length) return;

      try {
        const possibleTerrariumIds = [
          ...new Set(
            targets.map((e) => e.terrariumId).filter((x): x is number => typeof x === 'number' && x > 0)
          )
        ];
        if (!possibleTerrariumIds.length) possibleTerrariumIds.push(22, 24, 25, 26, 27, 28);

        const map: Record<number, number> = {};
        for (const tid of possibleTerrariumIds) {
          try {
            const variants = await getVariantsByTerrariumId(tid);
            setVariantsMap((prev) => ({ ...prev, [tid]: variants }));
            for (const v of variants) {
              if (variantIds.includes(v.terrariumVariantId)) map[v.terrariumVariantId] = tid;
            }
          } catch {}
        }
        setVariantToTerrariumMap((prev) => ({ ...prev, ...map }));

        log.group('Checkout ▶ Variant mapping');
        log.info('variantIds:', variantIds);
        log.info('variantToTerrariumMap (delta):', map);
        log.end();
      } catch (err) {
        console.error('fetch variants error:', err);
      }
    };
    run();
  }, [mergedSingles, variantToTerrariumMap]);

  // === Fetch combo meta giống Cart (để show item trong combo) ===
  useEffect(() => {
    const fetchComboMeta = async () => {
      if (!combosSelected.length) return;
      const missingIds = [...new Set(combosSelected.map(e => e.comboId!))].filter(id => !comboMeta[id]);

      if (!missingIds.length) return;

      const comboDataPromises = missingIds.map(async (comboId) => {
        try {
          const comboData = await getComboById(comboId);

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
                return { ...item, name: `Phụ kiện #${item.accessoryId}`, image: FALLBACK_IMG, type: 'accessory' };
              }
            } else if (item.terrariumVariantId) {
              try {
                const variant = await getTerrariumVariantById(item.terrariumVariantId);
                if (!variant) {
                  return { ...item, name: `Terrarium variant #${item.terrariumVariantId}`, image: FALLBACK_IMG, type: 'terrarium' };
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
                return { ...item, name: `Terrarium variant #${item.terrariumVariantId}`, image: FALLBACK_IMG, type: 'terrarium' };
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
          return { comboId, name: `Combo #${comboId}`, image: FALLBACK_IMG, items: [] };
        }
      });

      const results = await Promise.all(comboDataPromises);
      setComboMeta((prev) => {
        const n = { ...prev };
        results.forEach(c => { n[c.comboId] = c; });
        return n;
      });
    };

    fetchComboMeta();
  }, [combosSelected, comboMeta]);

  // ====== TÍNH TIỀN (CỘNG CẢ COMBO) ======
  const subtotalFromAPI = useMemo(() => {
    const sumSingles = mergedSingles.reduce((s, e) => s + (e.totalCartPrice || 0), 0);
    const sumBundles = bundlesAll.reduce(
      (s, b) => s + b.bundleAccessories.reduce((ss, e) => ss + (e.totalCartPrice || 0), 0),
      0
    );
    const sumCombos = combosSelected.reduce((s, e) => s + (e.totalCartPrice || 0), 0); // ✅ cộng combo
    return sumSingles + sumBundles + sumCombos;
  }, [mergedSingles, bundlesAll, combosSelected]);

  const subtotalLocal = useMemo(
    () => localSimple.reduce((s, it) => s + it.price * it.quantity, 0),
    [localSimple]
  );

  const subtotal = apiCart ? subtotalFromAPI : subtotalLocal;
  const shippingFee = 30000;
  const discountFromVoucher = voucher ? voucher.discountAmount : 0;
  const discountFromFull = paymentOption === 'full' ? (subtotal - discountFromVoucher) * 0.1 : 0;
  const totalBeforeWallet = Math.max(
    0,
    Math.round(subtotal - discountFromVoucher - discountFromFull + shippingFee)
  );
  const actualPaymentAmount =
    paymentOption === 'deposit'
      ? Math.max(0, Math.round((subtotal - discountFromVoucher) * 0.3 + shippingFee))
      : totalBeforeWallet;

  const walletUsageAmount = useWallet ? Math.min(walletBalance, actualPaymentAmount) : 0;
  const remainingPaymentAmount = Math.max(0, actualPaymentAmount - walletUsageAmount);

  // Voucher
  const applyVoucher = async () => {
    setVoucherError('');
    if (!discountCode.trim()) return;
    try {
      const res = await getVoucherByCode(discountCode.trim());
      if (!res || (res as any).status !== 'active') {
        setVoucher(null);
        setVoucherError('Mã không tồn tại hoặc đã hết hạn!');
        return;
      }
      const now = new Date();
      if (new Date((res as any).validFrom) > now || new Date((res as any).validTo) < now) {
        setVoucher(null);
        setVoucherError('Mã đã hết hạn hoặc chưa được áp dụng!');
        return;
      }
      setVoucher(res as Voucher);
      toast.success('Áp dụng voucher thành công!');
    } catch {
      setVoucher(null);
      setVoucherError('Mã không hợp lệ!');
    }
  };

  // ===== Dựng items cho API Order MỚI, giữ semantics bundle/single (chưa gửi combo) =====
  // ✅ BỔ SUNG terrariumId cho BUNDLE_ACCESSORY
  const buildOrderItems = (): NewOrderItemPayload[] => {
    const items: NewOrderItemPayload[] = [];

    if (apiCart) {
      // 1) Accessories thuộc bundle
      for (const b of bundlesAll) {
        for (const e of b.bundleAccessories) {
          items.push({
            itemType: 'BUNDLE_ACCESSORY',
            terrariumId: e.terrariumId ?? b.mainItem.terrariumId ?? 0, // ✅ thêm terrariumId
            accessoryId: e.accessoryId ?? 0,
            terrariumVariantId: 0,
            accessoryQuantity: e.totalCartQuantity ?? 0,
            terrariumVariantQuantity: 0
          });
        }
      }


      // 2) Singles & main items
      for (const e of mergedSingles) {
        if (e.terrariumVariantId != null) {
          items.push({
            itemType: 'MAIN_ITEM',
            accessoryId: 0,
            terrariumVariantId: e.terrariumVariantId,
            accessoryQuantity: 0,
            terrariumVariantQuantity: e.totalCartQuantity ?? 0
          });
        } else if (e.accessoryId != null) {
          items.push({
            itemType: 'SINGLE',
            accessoryId: e.accessoryId,
            terrariumVariantId: 0,
            accessoryQuantity: e.totalCartQuantity ?? 0,
            terrariumVariantQuantity: 0
          });
        }
      }
      return items;
    }

    // Fallback local
    for (const it of localSimple) {
      if (it.accessoryId != null) {
        items.push({
          itemType: 'SINGLE',
          accessoryId: it.accessoryId,
          terrariumVariantId: 0,
          accessoryQuantity: it.quantity,
          terrariumVariantQuantity: 0
        });
      } else if (it.variantId != null) {
        items.push({
          itemType: 'MAIN_ITEM',
          accessoryId: 0,
          terrariumVariantId: it.variantId,
          accessoryQuantity: 0,
          terrariumVariantQuantity: it.quantity
        });
      }
    }
    return items;
  };

  // ===== Phân rã combo thành items (khi có nhiều combo/pha trộn) =====
  const explodeCombosToItems = async (selectedCombos: RawCartEntry[]): Promise<NewOrderItemPayload[]> => {
    const out: NewOrderItemPayload[] = [];
    for (const ce of selectedCombos) {
      const comboId = ce.comboId!;
      // ưu tiên dùng comboMeta đã fetch để giữ đúng name/image/variantName
      let cItems: any[] | undefined = comboMeta[comboId]?.items;
      if (!cItems) {
        try {
          const c = await getComboById(comboId);
          cItems = c.items || [];
        } catch {
          cItems = [];
        }
      }
      const comboQty = ce.totalCartQuantity || 1;
      for (const it of cItems) {
        const q = (it.quantity || 1) * comboQty;
        if (it.accessoryId) {
          out.push({
            itemType: 'SINGLE',
            accessoryId: it.accessoryId,
            terrariumVariantId: 0,
            accessoryQuantity: q,
            terrariumVariantQuantity: 0
          });
        } else if (it.terrariumVariantId) {
          out.push({
            itemType: 'MAIN_ITEM',
            accessoryId: 0,
            terrariumVariantId: it.terrariumVariantId,
            accessoryQuantity: 0,
            terrariumVariantQuantity: q
          });
        }
      }
    }
    return out;
  };

  // ======= CLEANUP CART ITEMS =======
  const cleanupCartItems = async (orderItems: NewOrderItemPayload[], selectedCombos: RawCartEntry[]) => {
    try {
      const cartData = await getCart();

      // chuẩn hóa danh sách items trong cart (API mới)
      const singles = Array.isArray((cartData as any)?.singleItems)
        ? (cartData as any).singleItems : [];
      const bundles = Array.isArray((cartData as any)?.bundleItems)
        ? (cartData as any).bundleItems : [];
      const fromBundles = bundles.flatMap((b: any) => {
        const accs = Array.isArray(b.bundleAccessories) ? b.bundleAccessories : [];
        if (accs.length > 0) return accs;
        return b?.mainItem ? [b.mainItem] : [];
      });
      const cartItemsFromAPI = [...singles, ...fromBundles];

      const itemsToDelete: number[] = [];

      // match accessory/variant
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

      // xóa combo (nếu combo được chọn)
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

  // ===== Đặt hàng & thanh toán (chỉ MoMo) =====
  const handlePlaceOrder = async () => {
    if (!address?.id) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }
    if (localSimple.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    if (!userId) {
      toast.error('Bạn cần đăng nhập để đặt hàng!');
      return;
    }

    try {
      // 1) Base items (không gồm combo)
      const itemsBase = buildOrderItems();

      // 2) Quyết định gửi combo thế nào
      const hasCombos = combosSelected.length > 0;
      const comboOnly = hasCombos && bundlesAll.length === 0 && mergedSingles.length === 0;

      let comboIdToSend = 0;
      let itemsToSend = [...itemsBase];

      if (hasCombos) {
        if (comboOnly && combosSelected.length === 1) {
          // ✅ BE hỗ trợ: đúng 1 combo và không kèm sản phẩm khác
          comboIdToSend = combosSelected[0].comboId!;
        } else {
          // ⚠️ Nhiều combo hoặc pha trộn → phân rã thành items
          const exploded = await explodeCombosToItems(combosSelected);
          itemsToSend = [...itemsToSend, ...exploded];
          comboIdToSend = 0;
        }
      }

      if (!itemsToSend.length && comboIdToSend === 0) {
        toast.error('Không có sản phẩm hợp lệ để tạo đơn!');
        return;
      }

      // 3) Payload tạo đơn (totalAmount đã tính gồm combo)
      const payload = {
        voucherId: voucher?.voucherId ?? 0,
        deposit: paymentOption === 'deposit' ? actualPaymentAmount : 0,
        addressId: (address as any).id,
        comboId: comboIdToSend,
        items: itemsToSend,
        totalAmount: totalBeforeWallet
      } as any;

      // debug
      // @ts-ignore
      window.__lastOrderItems = itemsToSend;
      // @ts-ignore
      window.__lastOrderPayload = payload;

      const { orderId } = await createOrder(payload);
      if (!orderId) {
        toast.error('Tạo đơn hàng thất bại!');
        return;
      }

      // ✅ Gửi thông báo web sau khi tạo đơn thành công (KHÔNG chặn luồng nếu lỗi)
      try {
        await sendWebNotification(
          userId,
          `Đặt hàng thành công #${orderId}`,
          `Đơn hàng #${orderId} đã được tạo. Tổng tiền: ${totalBeforeWallet.toLocaleString('vi-VN')} VND`
        );
      } catch (e) {
        console.warn('[Checkout] Gửi thông báo web thất bại:', e);
      }

      // 4) Cleanup cart
      await cleanupCartItems(itemsToSend, combosSelected);

      // 5) Thanh toán ví/MoMo
      if (useWallet && walletUsageAmount > 0) {
        try {
          await useWalletForPayment({ userId, amount: walletUsageAmount, orderId });
        } catch (error) {
          console.error('Error using wallet:', error);
          toast.error('Lỗi khi sử dụng ví, vui lòng thử lại!');
          return;
        }
      }

      if (remainingPaymentAmount === 0) {
        toast.success('Thanh toán thành công bằng ví!');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('checkoutItems');
        navigate(`/thank-you/${orderId}`);
        return;
      }

      // MoMo
      const momoPayload = {
        orderId,
        orderInfo: customerNote || `Đơn hàng #${orderId}`,
        payAll: paymentOption === 'full'
      };

      try {
        const { payUrl, qrImageBase64 } = await createMoMoPayment(momoPayload);

        if (qrImageBase64) {
          setMoMoQRCode(qrImageBase64);
          setMoMoPayUrl(payUrl);
          setShowMoMoQR(true);
          setTimeout(() => {
            localStorage.removeItem('cartItems');
            localStorage.removeItem('checkoutItems');
            window.location.href = payUrl;
          }, 10000);
        } else {
          localStorage.removeItem('cartItems');
          localStorage.removeItem('checkoutItems');
          window.location.href = payUrl;
        }
      } catch (error: any) {
        console.error('MoMo payment error:', error?.response?.data || error);
        toast.error('Không lấy được link thanh toán MoMo!');
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

  // ============ UI ============

  const MomoModal = showMoMoQR && momoQRCode && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h2 className="text-xl font-bold text-pink-600">Thanh toán MoMo</h2>
        </div>
        <p className="text-gray-600 mb-4">Quét mã QR bằng ứng dụng MoMo để thanh toán</p>
        <div className="flex justify-center mb-4">
          <img
            src={`data:image/png;base64,${momoQRCode}`}
            alt="MoMo QR Code"
            className="w-64 h-64 border border-gray-300 rounded-lg bg-white"
          />
        </div>
        <p className="text-sm text-gray-500 mb-4">Trang sẽ tự động chuyển hướng sau 10 giây...</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              localStorage.removeItem('cartItems');
              localStorage.removeItem('checkoutItems');
              window.location.href = momoPayUrl || '#';
            }}
            className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600 font-medium"
          >
            Mở ứng dụng MoMo
          </button>
          <button
            onClick={() => {
              setShowMoMoQR(false);
              setMoMoQRCode(null);
              setMoMoPayUrl(null);
            }}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  // ====== SẢN PHẨM (hiển thị giống Cart — bổ sung COMBO) ======
  const ProductSectionAPI = (
    <div className="bg-white p-4 sm:p-5 rounded-lg shadow space-y-4">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold">Sản phẩm</h2>

      {/* COMBOS (mới thêm) */}
      {combosSelected.map((e) => {
        const comboKey = keyOfCombo(e);
        const isOpen = comboOpen[comboKey] ?? true; // mở mặc định để người dùng kiểm tra
        const data = e.comboId ? comboMeta[e.comboId] : undefined;

        return (
          <div key={e.cartItemId} className="rounded-lg border">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-purple-50">
              <div className="flex items-center gap-3">
                <img
                  src={data?.image || FALLBACK_IMG}
                  alt={data?.name || `Combo #${e.comboId}`}
                  className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                  onClick={() => navigate(`/combo/${e.comboId}`)}
                  onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                />
                <div className="font-semibold">
                  <button
                    onClick={() => navigate(`/combo/${e.comboId}`)}
                    className="text-purple-700 hover:underline"
                  >
                    {data?.name || `Combo #${e.comboId}`}
                  </button>
                  <div className="text-sm text-gray-600">SL: <b>{e.totalCartQuantity || 1}</b></div>
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
                          navigate(`/terrarium/${it.id ?? it.terrariumId ?? ''}`);
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

      {/* Bundles */}
      {bundlesAll.map((b) => {
        const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
        const name = tid ? terrariumName[tid] || `Bể terrarium #${tid}` : 'Bể terrarium';
        const thumb = tid ? terrariumThumb[tid] || FALLBACK_IMG : FALLBACK_IMG;
        const bundleId = keyOfBundle(b);

        const totalQty = b.bundleAccessories.reduce((s, e) => s + (e.totalCartQuantity || 0), 0);
        const totalPrice = b.bundleAccessories.reduce((s, e) => s + (e.totalCartPrice || 0), 0);

        return (
          <div key={bundleId} className="rounded-lg border">
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
                  <button
                    onClick={() => tid && navigate(`/terrarium/${tid}`)}
                    className="text-green-700 hover:underline"
                  >
                    {name}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div>
                  SL: <b>{totalQty}</b>
                </div>
                <div className="text-green-700 font-semibold">{currency(totalPrice)}</div>
              </div>
            </div>
            <div className="divide-y">
              {b.bundleAccessories.map((e) => {
                const aId = e.accessoryId || 0;
                const aName = aId ? accessoryName[aId] || `Phụ kiện #${aId}` : 'Phụ kiện';
                const aThumb = aId ? accessoryThumb[aId] || FALLBACK_IMG : FALLBACK_IMG;

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
                        {currency(unitPriceOf(e))} × {e.totalCartQuantity ?? 1}
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
                ? terrariumName[actualTerrariumId] || `Bể terrarium #${actualTerrariumId}`
                : '';
              const terrariumImage = actualTerrariumId
                ? (terrariumThumb[actualTerrariumId] || FALLBACK_IMG)
                : FALLBACK_IMG;

              const list = actualTerrariumId ? variantsMap[actualTerrariumId] || [] : [];
              const currentVariant = isVariant
                ? list.find((v: any) => v.terrariumVariantId === e.terrariumVariantId)
                : null;

              const displayName =
                isVariant && terrariumDisplayName
                  ? terrariumDisplayName
                  : e.accessoryId
                  ? accessoryName[e.accessoryId] || `Phụ kiện #${e.accessoryId}`
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
                      {currency(unitPriceOf(e))} × {e.totalCartQuantity ?? 1}
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

      {/* Fallback local */}
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
      {MomoModal}

      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">Thanh Toán</h1>

            {/* Sản phẩm — hiển thị giống Cart + COMBO */}
            {ProductSectionAPI}

            <AddressSelector userId={userId || 0} onSelect={(addr) => setAddress(addr)} />

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
                    Đặt cọc 30% để đảm bảo đơn hàng, hỗ trợ vận chuyển & giảm rủi ro sản phẩm dễ vỡ.
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
                    Giảm ngay <b>10%</b> giá trị đơn hàng, ưu tiên xử lý trước.
                  </div>
                </div>
              </div>
            </div>

            {/* Ví điện tử */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Ví điện tử</h2>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useWallet"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-3"
                  />
                  <label htmlFor="useWallet" className="text-sm sm:text-base md:text-lg font-medium">
                    Sử dụng số dư ví
                  </label>
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-semibold text-green-600">
                    {walletLoading ? 'Đang tải...' : `${walletBalance.toLocaleString('vi-VN')} VND`}
                  </div>
                  {useWallet && walletUsageAmount > 0 && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      Sử dụng: {walletUsageAmount.toLocaleString('vi-VN')} VND
                    </div>
                  )}
                </div>
              </div>
              {useWallet && walletBalance === 0 && (
                <div className="mt-2 text-yellow-600 text-sm">Số dư ví không đủ để thanh toán.</div>
              )}
            </div>

            {/* Hình thức thanh toán: chỉ MoMo */}
            {remainingPaymentAmount > 0 ? (
              <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Hình thức thanh toán</h2>
                <div className="flex items-center gap-3 border-2 rounded-lg p-4 bg-pink-50 border-pink-500">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">M</span>
                  </div>
                  <span className="font-semibold text-pink-700 text-sm sm:text-base">MoMo</span>
                  <span className="ml-auto text-xs text-pink-700 bg-white border border-pink-200 px-2 py-1 rounded">
                    Mặc định
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2">Hình thức thanh toán</h2>
                <div className="text-center text-green-600 font-medium p-4 bg-green-50 rounded-lg">
                  Đơn hàng sẽ được thanh toán hoàn toàn bằng ví điện tử
                </div>
              </div>
            )}

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
                      <div>
                        <b>{voucher.description}</b>
                      </div>
                      <div>
                        Giảm: <b>{voucher.discountAmount.toLocaleString('vi-VN')} VND</b>
                      </div>
                      <div>
                        Hiệu lực: {new Date(voucher.validFrom).toLocaleDateString()} -{' '}
                        {new Date(voucher.validTo).toLocaleDateString()}
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
                {/* ✅ Nút thu gọn danh sách sản phẩm (mặc định đóng) */}
                <button
                  onClick={() => setSummaryItemsOpen((v) => !v)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {summaryItemsOpen ? 'Thu gọn sản phẩm' : 'Hiển thị sản phẩm'}
                </button>
              </div>

              {/* ✅ Danh sách sản phẩm trong tổng kết — chỉ hiển thị khi mở */}
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

              {/* ✅ Các dòng giá luôn hiển thị (không bị thu gọn) */}
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString('vi-VN')} VND</span>
                </div>
                {discountFromVoucher > 0 && (
                  <div className="flex justify-between text-yellow-600">
                    <span>Giảm giá voucher</span>
                    <span>-{discountFromVoucher.toLocaleString('vi-VN')} VND</span>
                  </div>
                )}
                {paymentOption === 'full' && discountFromFull > 0 && (
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
                  <span>Tổng cộng</span>
                  <span>{totalBeforeWallet.toLocaleString('vi-VN')} VND</span>
                </div>
                <div className="flex justify-between font-medium text-blue-700">
                  <span>Số tiền cần thanh toán</span>
                  <span>{actualPaymentAmount.toLocaleString('vi-VN')} VND</span>
                </div>
                {useWallet && walletUsageAmount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Thanh toán bằng ví</span>
                    <span>-{walletUsageAmount.toLocaleString('vi-VN')} VND</span>
                  </div>
                )}
                {remainingPaymentAmount > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Còn lại cần thanh toán</span>
                    <span>{remainingPaymentAmount.toLocaleString('vi-VN')} VND</span>
                  </div>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                className="mt-4 sm:mt-6 w-full bg-green-600 text-white py-2 sm:py-3 rounded hover:bg-green-700 text-sm sm:text-base"
              >
                {remainingPaymentAmount === 0 ? 'Thanh toán bằng ví' : 'Thanh toán với MoMo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
