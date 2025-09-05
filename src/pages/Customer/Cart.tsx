// src/pages/Customer/Cart.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  changeCartItemVariant,
  updateComboQuantity,       // ✅ dùng cho ± combo
  deleteAllCartItems,        // ✅ THÊM: xóa toàn bộ giỏ hàng
} from '@/api/cart';
import {
  getTerrariumById,
  getVariantsByTerrariumId,
  getTerrariumVariantById,
} from '@/api/terrarium';
import { getAccessoryById } from '@/api/accessory';
import { getComboById } from '@/api/combo';
import type { CartResponseNew, CartBundle, RawCartEntry } from '@/types/cart';

const FALLBACK_IMG = '/TerraTechLogo.png';
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

type VariantStock = Record<number, number>;
type AccessoryStock = Record<number, number>;

// ===========================
// Custom Confirm Modal (headless Tailwind)
// ===========================
type ConfirmKind = 'single' | 'bundle' | 'all';
type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: ConfirmKind;
      title: string;
      message?: string;
      // payload cho xoá single/bundle
      entry?: RawCartEntry;
      bundle?: CartBundle;
    };

const ConfirmModal: React.FC<{
  state: ConfirmState;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}> = ({ state, onCancel, onConfirm, confirmText = 'Xác nhận', cancelText = 'Huỷ' }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // ESC để đóng
  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open, onCancel]);

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative z-[1001] w-full max-w-md rounded-lg bg-white shadow-xl border p-5"
      >
        <h3 className="text-lg font-semibold text-gray-900">{state.title}</h3>
        {state.message && <p className="mt-2 text-gray-600">{state.message}</p>}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border bg-gray-50 hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===========================
// PAGE
// ===========================
const Cart: React.FC = () => {
  const [data, setData] = useState<CartResponseNew | null>(null);

  const [bundleOpen, setBundleOpen] = useState<Record<string, boolean>>({});
  const [comboOpen, setComboOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [variantChanging, setVariantChanging] = useState<Record<number, boolean>>({});

  // meta caches
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [terrariumThumb, setTerrariumThumb] = useState<Record<number, string>>({});
  const [accessoryName, setAccessoryName] = useState<Record<number, string>>({});
  const [accessoryThumb, setAccessoryThumb] = useState<Record<number, string>>({});
  // meta combo + stock combo
  const [comboMeta, setComboMeta] = useState<
    Record<number, { name: string; image: string; items: any[]; stock?: number }>
  >({});
  const [variantsMap, setVariantsMap] = useState<Record<number, any[]>>({});
  const [variantToTerrariumMap, setVariantToTerrariumMap] = useState<Record<number, number>>({});

  // stock từng item
  const [variantStock, setVariantStock] = useState<VariantStock>({});
  const [accessoryStock, setAccessoryStock] = useState<AccessoryStock>({});

  // trạng thái updating số lượng combo theo comboId
  const [comboUpdating, setComboUpdating] = useState<Record<number, boolean>>({});

  // ===== Confirm modal state =====
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

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

  useEffect(() => { load(); }, []);

  // ====== COMBO META (kèm tồn kho combo) ======
  useEffect(() => {
    const fetchComboMeta = async () => {
      if (!data) return;
      const comboIds = new Set<number>();
      for (const item of data.singleItems || []) if (item.comboId) comboIds.add(item.comboId);
      const missing = [...comboIds].filter((id) => !comboMeta[id]);
      if (!missing.length) return;

      const results = await Promise.allSettled(
        missing.map(async (comboId) => {
          const comboData = await getComboById(comboId);
          const itemDetails = await Promise.allSettled(
            (comboData.items || []).map(async (item: any) => {
              if (item.accessoryId) {
                try {
                  const a = await getAccessoryById(item.accessoryId);
                  const stock = typeof a?.stockQuantity === 'number' ? a.stockQuantity : undefined;
                  if (typeof stock === 'number') setAccessoryStock((m) => ({ ...m, [item.accessoryId]: stock }));
                  return {
                    ...item,
                    name: a?.name || `Phụ kiện #${item.accessoryId}`,
                    image: a?.accessoryImages?.[0]?.imageUrl || item.image || FALLBACK_IMG,
                    type: 'accessory',
                    stock,
                  };
                } catch {
                  return { ...item, name: `Phụ kiện #${item.accessoryId}`, image: item.image || FALLBACK_IMG, type: 'accessory' };
                }
              } else if (item.terrariumVariantId) {
                try {
                  const v = await getTerrariumVariantById(item.terrariumVariantId);
                  const stock = typeof v?.stockQuantity === 'number' ? v.stockQuantity : undefined;
                  if (typeof stock === 'number') setVariantStock((m) => ({ ...m, [item.terrariumVariantId]: stock }));
                  let terrariumId = v?.terrariumId;
                  let name = v?.variantName || `Terrarium variant #${item.terrariumVariantId}`;
                  let image = v?.urlImage || '';
                  if (terrariumId) {
                    try {
                      const t = await getTerrariumById(terrariumId);
                      name = t?.terrariumName || name;
                      image = image || t?.terrariumImages?.[0]?.imageUrl || '';
                    } catch {}
                  }
                  return { ...item, terrariumId, name, image: image || FALLBACK_IMG, type: 'terrarium', variantName: v?.variantName, stock };
                } catch {
                  return { ...item, name: `Terrarium variant #${item.terrariumVariantId}`, image: FALLBACK_IMG, type: 'terrarium' };
                }
              }
              return item;
            })
          );
          const items = itemDetails.map((r) => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean) as any[];
          return { comboId, name: comboData.name, image: comboData.imageUrl || FALLBACK_IMG, items, stock: comboData.stockQuantity };
        })
      );

      setComboMeta((prev) => {
        const updated = { ...prev };
        results.forEach((r) => { if (r.status === 'fulfilled') updated[r.value.comboId] = r.value; });
        return updated;
      });
    };
    fetchComboMeta();
  }, [data, comboMeta]);

  // ====== TÁCH COMBO KHỎI SINGLE ======
  const { comboItems, regularSingles } = useMemo(() => {
    const singles = data?.singleItems || [];
    return { comboItems: singles.filter((i) => i.comboId), regularSingles: singles.filter((i) => !i.comboId) };
  }, [data]);

  // ====== BUNDLE ======
  const bundlesToShow = useMemo(
    () => (data?.bundleItems || []).filter((b) => (b.bundleAccessories?.length || 0) > 0),
    [data]
  );

  // main variant của bundle -> đưa ra “Sản phẩm lẻ” nếu có giá
  const variantSinglesFromBundles = useMemo<RawCartEntry[]>(
    () =>
      (data?.bundleItems || [])
        .filter((b) => !!b.mainItem?.terrariumVariantId)
        .map((b) => b.mainItem)
        .filter((mi) => {
          const unit = unitPriceOf(mi);
          const itemTotal = Array.isArray(mi.item) && mi.item[0]?.totalPrice ? mi.item[0].totalPrice : 0;
          const serverTotal = mi.totalCartPrice || 0;
          return Math.max(itemTotal, unit * qtyOf(mi), serverTotal) > 0;
        }),
    [data]
  );

  const mergedSingles = useMemo<RawCartEntry[]>(
    () => [...variantSinglesFromBundles, ...regularSingles],
    [variantSinglesFromBundles, regularSingles]
  );

  // ====== Map variant → terrarium + danh sách variant + stock ======
  useEffect(() => {
    const run = async () => {
      const variantIds = new Set<number>();
      mergedSingles.forEach((e) => e.terrariumVariantId && variantIds.add(e.terrariumVariantId));
      (data?.bundleItems || []).forEach((b) => {
        b.mainItem?.terrariumVariantId && variantIds.add(b.mainItem.terrariumVariantId);
        (b.bundleAccessories || []).forEach((ba) => ba.terrariumVariantId && variantIds.add(ba.terrariumVariantId));
      });

      const missing = [...variantIds].filter((vid) => !variantToTerrariumMap[vid]);
      if (!missing.length) return;

      const results = await Promise.allSettled(
        missing.map(async (vid) => {
          const v = await getTerrariumVariantById(vid);
          return { vid, tid: v?.terrariumId as number | undefined, stock: v?.stockQuantity as number | undefined };
        })
      );

      const newMap: Record<number, number> = {};
      const patchStock: VariantStock = {};
      const terrariumIds = new Set<number>();
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          if (r.value?.tid) {
            newMap[r.value.vid] = r.value.tid;
            terrariumIds.add(r.value.tid);
          }
          if (typeof r.value?.stock === 'number') patchStock[r.value.vid] = r.value.stock;
        }
      });
      if (Object.keys(newMap).length) setVariantToTerrariumMap((prev) => ({ ...prev, ...newMap }));
      if (Object.keys(patchStock).length) setVariantStock((prev) => ({ ...prev, ...patchStock }));

      if (terrariumIds.size) {
        const toFetch = [...terrariumIds].filter((tid) => !variantsMap[tid]);
        if (toFetch.length) {
          const fetched = await Promise.allSettled(
            toFetch.map(async (tid) => {
              const list = await getVariantsByTerrariumId(tid);
              return { tid, list };
            })
          );
            const add: Record<number, any[]> = {};
            fetched.forEach((r) => { if (r.status === 'fulfilled') add[r.value.tid] = r.value.list || []; });
            if (Object.keys(add).length) setVariantsMap((prev) => ({ ...prev, ...add }));
        }

        const needMeta = [...terrariumIds].filter((tid) => !terrariumName[tid] || !terrariumThumb[tid]);
        if (needMeta.length) {
          const meta = await Promise.allSettled(
            needMeta.map(async (tid) => {
              const t = await getTerrariumById(tid);
              return { tid, name: t?.terrariumName || `Bộ terrarium #${tid}`, thumb: t?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mergedSingles, variantsMap, terrariumName, terrariumThumb, variantToTerrariumMap]);

  // ====== Terrarium meta nếu có terrariumId trực tiếp ======
  useEffect(() => {
    const fetchTerrariumMeta = async () => {
      if (!data) return;
      const ids = new Set<number>();
      for (const b of data.bundleItems || []) if (b.mainItem?.terrariumId) ids.add(b.mainItem.terrariumId);
      for (const it of data.singleItems || []) if (it.terrariumId) ids.add(it.terrariumId);

      const missing = [...ids].filter((id) => !terrariumName[id] || !terrariumThumb[id]);
      if (!missing.length) return;

      const pairs = await Promise.allSettled(
        missing.map(async (id) => {
          const t = await getTerrariumById(id);
          return { id, name: t?.terrariumName || `Bộ terrarium #${id}`, thumb: t?.terrariumImages?.[0]?.imageUrl || FALLBACK_IMG };
        })
      );
      const nameAdd: Record<number, string> = {};
      const thumbAdd: Record<number, string> = {};
      pairs.forEach((r) => { if (r.status === 'fulfilled') { nameAdd[r.value.id] = r.value.name; thumbAdd[r.value.id] = r.value.thumb; }});
      if (Object.keys(nameAdd).length) {
        setTerrariumName((m) => ({ ...m, ...nameAdd }));
        setTerrariumThumb((m) => ({ ...m, ...thumbAdd }));
      }
    };
    fetchTerrariumMeta();
  }, [data, terrariumName, terrariumThumb]);

  // ====== Accessory meta + stock ======
  useEffect(() => {
    const fetchAccessoryMeta = async () => {
      if (!data) return;
      const ids = new Set<number>();
      for (const b of data.bundleItems || []) for (const e of b.bundleAccessories || []) e.accessoryId && ids.add(e.accessoryId);
      for (const e of data.singleItems || []) e.accessoryId && ids.add(e.accessoryId);

      const missing = [...ids].filter((id) => !accessoryName[id] || !accessoryThumb[id] || typeof accessoryStock[id] !== 'number');
      if (!missing.length) return;

      const pairs = await Promise.allSettled(
        missing.map(async (id) => {
          const a = await getAccessoryById(id);
          const stock = typeof a?.stockQuantity === 'number' ? a.stockQuantity : undefined;
          return { id, name: a?.name || `Phụ kiện #${id}`, thumb: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG, stock };
        })
      );
      const nameAdd: Record<number, string> = {};
      const thumbAdd: Record<number, string> = {};
      const stockAdd: AccessoryStock = {};
      pairs.forEach((r) => {
        if (r.status === 'fulfilled') {
          nameAdd[r.value.id] = r.value.name;
          thumbAdd[r.value.id] = r.value.thumb;
          if (typeof r.value.stock === 'number') stockAdd[r.value.id] = r.value.stock;
        }
      });
      if (Object.keys(nameAdd).length) {
        setAccessoryName((m) => ({ ...m, ...nameAdd }));
        setAccessoryThumb((m) => ({ ...m, ...thumbAdd }));
      }
      if (Object.keys(stockAdd).length) setAccessoryStock((m) => ({ ...m, ...stockAdd }));
    };
    fetchAccessoryMeta();
  }, [data, accessoryName, accessoryThumb, accessoryStock]);

  // ====== checkbox helpers ======
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

  // ====== Chọn tất cả / Bỏ chọn tất cả ======
  const buildAllKeys = () => {
    const entryKeys: string[] = [];
    // singles (variant & accessory)
    for (const e of mergedSingles) entryKeys.push(keyOfEntry(e));
    // bundle accessories
    for (const b of bundlesToShow) for (const e of b.bundleAccessories) entryKeys.push(keyOfEntry(e));
    // combos
    const comboKeys: string[] = [];
    for (const e of comboItems) comboKeys.push(keyOfCombo(e));
    return { entryKeys, comboKeys };
  };

  const selectAll = () => {
    const { entryKeys, comboKeys } = buildAllKeys();
    const map: Record<string, boolean> = {};
    entryKeys.forEach((k) => (map[k] = true));
    comboKeys.forEach((k) => (map[k] = true));
    setSelected(map);
  };

  const deselectAll = () => setSelected({});

  // ====== CẬP NHẬT SỐ LƯỢNG ======
  const inc = async (e: RawCartEntry) => {
    try {
      const next = qtyOf(e) + 1;
      if (e.comboId) return incCombo(e);
      if (e.accessoryId) await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      else if (e.terrariumVariantId) await updateCartItem(e.cartItemId, { variantQuantity: next });
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng');
    }
  };
  const dec = async (e: RawCartEntry) => {
    try {
      const next = Math.max(1, qtyOf(e) - 1);
      if (e.comboId) return decCombo(e);
      if (e.accessoryId) await updateCartItem(e.cartItemId, { accessoryQuantity: next });
      else if (e.terrariumVariantId) await updateCartItem(e.cartItemId, { variantQuantity: next });
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng');
    }
  };

  // ====== Combo ± số lượng qua /Cart/update-combo ======
  const incCombo = async (e: RawCartEntry) => {
    if (!e.comboId) return;
    const comboId = e.comboId;
    const current = qtyOf(e);
    const max = comboMeta[comboId]?.stock ?? Infinity;
    if (current >= max) {
      toast.info('Đã đạt tối đa tồn kho combo');
      return;
    }
    setComboUpdating((m) => ({ ...m, [comboId]: true }));
    try {
      await updateComboQuantity(comboId, current + 1);
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng combo');
    } finally {
      setComboUpdating((m) => ({ ...m, [comboId]: false }));
    }
  };

  const decCombo = async (e: RawCartEntry) => {
    if (!e.comboId) return;
    const comboId = e.comboId;
    const current = qtyOf(e);
    const next = Math.max(1, current - 1);
    setComboUpdating((m) => ({ ...m, [comboId]: true }));
    try {
      await updateComboQuantity(comboId, next);
      await load();
    } catch {
      toast.error('Không cập nhật được số lượng combo');
    } finally {
      setComboUpdating((m) => ({ ...m, [comboId]: false }));
    }
  };

  // ====== Xoá item / bundle / toàn bộ (thực thi) ======
  const _removeEntryNoConfirm = async (e: RawCartEntry) => {
    try {
      await deleteCartItem(e.cartItemId);
      await load();
      toast.success('Đã xoá sản phẩm');
    } catch {
      toast.error('Xoá thất bại');
    }
  };

  const _removeBundleNoConfirm = async (b: CartBundle) => {
    // nếu BE đã hỗ trợ xoá theo main thì chỉ cần gọi 1 lần:
    try {
      await deleteCartItem(b.mainItem.cartItemId);
      await load();
      toast.success('Đã xoá trọn bộ');
    } catch {
      // fallback tuần tự (nếu BE chưa xoá theo quan hệ)
      try {
        const ids = [b.mainItem.cartItemId, ...b.bundleAccessories.map((e) => e.cartItemId)];
        for (const id of ids) {
          try {
            await deleteCartItem(id);
          } catch (err: any) {
            if (!String(err?.response?.status || '').startsWith('4')) throw err;
          }
        }
        await load();
        toast.success('Đã xoá trọn bộ (fallback)');
      } catch {
        await load();
        toast.error('Xoá bộ thất bại');
      }
    }
  };

  const _removeAllNoConfirm = async () => {
    try {
      await deleteAllCartItems();
      await load();
      setSelected({});
      toast.success('Đã xoá toàn bộ giỏ hàng');
    } catch {
      toast.error('Không thể xoá toàn bộ giỏ hàng');
    }
  };

  // ====== Trigger modal xác nhận ======
  const askRemoveEntry = (e: RawCartEntry) => {
    const name =
      e.accessoryId
        ? (accessoryName[e.accessoryId] || e.item?.[0]?.productName || `Phụ kiện #${e.accessoryId}`)
        : e.terrariumVariantId
        ? (terrariumName[variantToTerrariumMap[e.terrariumVariantId] || 0] || 'Sản phẩm')
        : 'Sản phẩm';
    setConfirm({
      open: true,
      kind: 'single',
      title: 'Xác nhận xoá sản phẩm?',
      message: `Bạn có chắc muốn xoá "${name}" khỏi giỏ hàng?`,
      entry: e,
    });
  };

  const askRemoveBundle = (b: CartBundle) => {
    const mainVariantId = b?.mainItem?.terrariumVariantId || 0;
    const tidFromMain = mainVariantId ? variantToTerrariumMap[mainVariantId] : 0;
    const name = tidFromMain ? (terrariumName[tidFromMain] || `Bộ terrarium #${tidFromMain}`) : 'Bộ phụ kiện theo biến thể';
    setConfirm({
      open: true,
      kind: 'bundle',
      title: 'Xác nhận xoá trọn bộ?',
      message: `Thao tác này sẽ xoá toàn bộ phụ kiện của "${name}".`,
      bundle: b,
    });
  };

  const askRemoveAll = () => {
    setConfirm({
      open: true,
      kind: 'all',
      title: 'Xoá toàn bộ giỏ hàng?',
      message: 'Tất cả sản phẩm trong giỏ sẽ bị xoá và không thể hoàn tác.',
    });
  };

  // ====== Điều khiển modal ======
  const closeConfirm = () => setConfirm({ open: false });

  const confirmProceed = async () => {
    if (!confirm.open) return;
    const kind = confirm.kind;
    closeConfirm();
    if (kind === 'single' && confirm.entry) {
      await _removeEntryNoConfirm(confirm.entry);
    } else if (kind === 'bundle' && confirm.bundle) {
      await _removeBundleNoConfirm(confirm.bundle);
    } else if (kind === 'all') {
      await _removeAllNoConfirm();
    }
  };

  // ====== Helper: tổng tiền hiển thị ======
  const displayTotalOf = (e: RawCartEntry) => {
    const unit = unitPriceOf(e);
    const q = qtyOf(e);
    const fromItem = (Array.isArray(e.item) && e.item[0]?.totalPrice) ? e.item[0].totalPrice : 0;
    const server = e.totalCartPrice || 0;
    return Math.max(fromItem, unit * q, server);
  };

  // ====== Checkout data & subtotal ======
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

    for (const e of [...mergedSingles, ...bundlesToShow.flatMap((b) => b.bundleAccessories)]) {
      if (!isEntryChecked(e)) continue;

      const isVariant = !!e.terrariumVariantId;
      const actualTerrariumId = isVariant
        ? variantToTerrariumMap[e.terrariumVariantId!]
        : e.terrariumId || undefined;

      let name = 'Sản phẩm';
      let image = FALLBACK_IMG;

      if (isVariant && actualTerrariumId) {
        name = terrariumName[actualTerrariumId] || e.item?.[0]?.productName || `Bộ terrarium #${actualTerrariumId}`;
        image = terrariumThumb[actualTerrariumId] || e.item?.[0]?.imageUrl || FALLBACK_IMG;
      } else if (e.accessoryId) {
        name = accessoryName[e.accessoryId] || e.item?.[0]?.productName || `Phụ kiện #${e.accessoryId}`;
        image = accessoryThumb[e.accessoryId] || e.item?.[0]?.imageUrl || FALLBACK_IMG;
      }

      list.push({
        id: keyOfEntry(e),
        name,
        price: unitPriceOf(e),
        image,
        quantity: qtyOf(e),
        selected: true,
        accessoryId: e.accessoryId ?? undefined,
        variantId: e.terrariumVariantId ?? undefined,
      });
    }

    for (const e of comboItems) {
      if (!isComboChecked(e)) continue;
      const comboData = comboMeta[e.comboId!];
      list.push({
        id: keyOfCombo(e),
        name: comboData?.name || `Combo #${e.comboId}`,
        price: unitPriceOf(e),
        image: comboData?.image || FALLBACK_IMG,
        quantity: qtyOf(e),
        selected: true,
        comboId: e.comboId ?? undefined,
      });
    }

    return list;
  }, [
    mergedSingles,
    bundlesToShow,
    comboItems,
    selected,
    terrariumName,
    terrariumThumb,
    accessoryName,
    accessoryThumb,
    comboMeta,
    variantToTerrariumMap,
  ]);

  const subtotal = useMemo(() => {
    let total = 0;
    for (const e of [...mergedSingles, ...bundlesToShow.flatMap((b) => b.bundleAccessories)])
      if (isEntryChecked(e)) total += displayTotalOf(e);
    for (const e of comboItems) if (isComboChecked(e)) total += displayTotalOf(e);
    return total;
  }, [mergedSingles, bundlesToShow, comboItems, selected]);

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

  const cartIsEmpty = !bundlesToShow.length && !mergedSingles.length && !comboItems.length;

  // ====== Đổi variant ======
  const changeVariant = async (e: RawCartEntry, newVariantId: number) => {
    if (e.terrariumVariantId === newVariantId) return;
    const cartItemId = e.cartItemId;
    setVariantChanging((prev) => ({ ...prev, [cartItemId]: true }));
    try {
      await changeCartItemVariant(e.cartItemId, newVariantId, qtyOf(e));
      await load();
      toast.success('Đã thay đổi phân loại hàng');
    } catch {
      toast.error('Không thể thay đổi phân loại');
      await load();
    } finally {
      setVariantChanging((prev) => ({ ...prev, [cartItemId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10">
      {/* Modal xác nhận */}
      <ConfirmModal state={confirm} onCancel={closeConfirm} onConfirm={confirmProceed} confirmText="Xoá" cancelText="Huỷ" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-green-700">Giỏ hàng</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                disabled={cartIsEmpty}
                className="px-3 py-1 text-sm rounded border bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              >
                Chọn tất cả
              </button>
              <button
                onClick={deselectAll}
                disabled={cartIsEmpty && Object.keys(selected).length === 0}
                className="px-3 py-1 text-sm rounded border bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              >
                Bỏ chọn tất cả
              </button>
              <button
                onClick={askRemoveAll} // ✅ dùng modal thay vì window.confirm
                disabled={cartIsEmpty}
                className="px-3 py-1 text-sm rounded border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                Xoá toàn bộ
              </button>
            </div>
          </div>

          {/* (Nếu có) COMBO */}
          {comboItems.map((e) => {
            const comboKey = keyOfCombo(e);
            const isOpen = comboOpen[comboKey] ?? false;
            const checked = isComboChecked(e);
            const comboId = e.comboId!;
            const comboData = comboMeta[comboId];
            const stock = comboData?.stock;
            const qty = qtyOf(e);
            const isUpdating = !!comboUpdating[comboId];
            const disableInc = typeof stock === 'number' ? qty >= stock : false;

            return (
              <div key={e.cartItemId} className="bg-white rounded-lg shadow border">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggleCombo(e)} className="w-5 h-5 accent-green-600" />
                    <img
                      src={comboData?.image || FALLBACK_IMG}
                      alt={comboData?.name || `Combo #${comboId}`}
                      className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                      onClick={() => navigate(`/combo/${comboId}`)}
                      onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                    />
                    <div className="font-semibold">
                      <button onClick={() => navigate(`/combo/${comboId}`)} className="text-green-700 hover:underline">
                        {comboData?.name || `Combo #${comboId}`}
                      </button>
                      <div className="text-xs text-gray-500">
                        Combo gồm {comboData?.items?.length || 0} sản phẩm
                        {typeof stock === 'number' && (
                          <span className="ml-2 inline-block px-2 py-[2px] rounded bg-gray-100 text-gray-700">Tồn: {stock}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/combo/${comboId}`)}
                      className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100"
                    >
                      Xem combo
                    </button>

                    {/* ± COMBO */}
                    <div className={`flex items-center border rounded overflow-hidden ${isUpdating ? 'opacity-60' : ''}`}>
                      <button
                        onClick={() => decCombo(e)}
                        disabled={isUpdating || qty <= 1}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="px-4 py-1 min-w-[50px] text-center">{qty}</span>
                      <button
                        onClick={() => incCombo(e)}
                        disabled={isUpdating || disableInc}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        title={disableInc ? 'Đã đạt tối đa tồn kho' : ''}
                      >
                        +
                      </button>
                    </div>

                    <div className="text-sm text-purple-700 font-semibold">{currency(displayTotalOf(e))}</div>
                    <button onClick={() => setComboOpen((m) => ({ ...m, [comboKey]: !isOpen }))} className="text-gray-600 hover:text-gray-800 text-sm">
                      {isOpen ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                    <button
                      onClick={() =>
                        setConfirm({
                          open: true,
                          kind: 'single',
                          title: 'Xác nhận xoá combo?',
                          message: `Bạn có chắc muốn xoá "${comboData?.name || `Combo #${comboId}`}" khỏi giỏ hàng?`,
                          entry: e,
                        })
                      }
                      className="text-red-600 hover:underline text-sm"
                    >
                      Xoá combo
                    </button>
                  </div>
                </div>

                {isOpen && comboData?.items && (
                  <div className="divide-y bg-gray-50">
                    <div className="px-4 py-2 text-sm text-gray-600 font-medium bg-purple-50 border-b">Sản phẩm trong combo:</div>
                    {comboData.items.map((item: any, idx: number) => (
                      <div key={`combo-item-${idx}`} className="p-4 flex items-center gap-3">
                        <div className="w-5" />
                        <img
                          src={item.image || FALLBACK_IMG}
                          alt={item.name || 'Sản phẩm'}
                          className="w-14 h-14 object-cover rounded border bg-white cursor-pointer"
                          onClick={() => {
                            if (item.type === 'accessory' && item.accessoryId) navigate(`/accessory/${item.accessoryId}`);
                            else if (item.type === 'terrarium' && item.terrariumId) navigate(`/terrarium/${item.terrariumId}`);
                          }}
                          onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{item.name || 'Sản phẩm'}</div>
                          {item.variantName && <div className="text-sm text-gray-500">Phân loại: {item.variantName}</div>}
                        </div>
                        <div className="text-sm text-gray-700 px-3 py-1 bg-gray-100 rounded">Số Lượng: {item.quantity}</div>
                        <div className="w-32 text-right font-semibold text-gray-800">{currency(item.totalPrice || 0)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* BUNDLE THEO VARIANT */}
          {bundlesToShow.map((b) => {
            const mainVariantId = b?.mainItem?.terrariumVariantId || 0;
            const resolvedTidFromMain = mainVariantId ? variantToTerrariumMap[mainVariantId] : 0;
            let tid = resolvedTidFromMain;
            if (!tid) {
              const firstAccVariantId = b.bundleAccessories?.[0]?.terrariumVariantId || 0;
              if (firstAccVariantId) tid = variantToTerrariumMap[firstAccVariantId] || 0;
            }

            const bundleId = keyOfBundle(b);
            const name = tid ? terrariumName[tid] || `Bộ terrarium #${tid}` : 'Bộ phụ kiện theo biến thể';
            const thumb = tid ? terrariumThumb[tid] || FALLBACK_IMG : FALLBACK_IMG;

            const isOpen = bundleOpen[bundleId] ?? false;
            const groupChecked = isBundleChecked(b);
            const bundleQty = calcBundleQty(b);

            return (
              <div key={bundleId} className="bg-white rounded-lg shadow border">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={groupChecked} onChange={() => toggleBundle(b)} className="w-5 h-5 accent-green-600" />
                    <img
                      src={thumb}
                      alt={name}
                      className="w-10 h-10 rounded border bg-white object-cover cursor-pointer"
                      onClick={() => tid && navigate(`/terrarium/${tid}`)}
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

                  <div className="flex items-center gap-3">
                    {tid ? (
                      <button onClick={() => navigate(`/terrarium/${tid}`)} className="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100">
                        Xem bộ
                      </button>
                    ) : (
                      <div className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">Đang xác định Terrarium…</div>
                    )}

                    <div className="text-sm text-gray-700">Tổng Số Lượng: <b>{bundleQty}</b></div>
                    <div className="text-sm text-green-700 font-semibold">{currency(b.totalBundlePrice)}</div>
                    <button onClick={() => setBundleOpen((m) => ({ ...m, [bundleId]: !isOpen }))} className="text-gray-600 hover:text-gray-800 text-sm">
                      {isOpen ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                    <button
                      onClick={() => askRemoveBundle(b)} // ✅ mở modal xác nhận xoá bundle
                      className="text-red-600 hover:underline text-sm"
                    >
                      Xoá bộ
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="divide-y">
                    {b.bundleAccessories.map((e) => {
                      const aId = e.accessoryId || 0;
                      const aName = aId ? accessoryName[aId] || e.item?.[0]?.productName || `Phụ kiện #${aId}` : 'Phụ kiện';
                      const aThumb = aId ? accessoryThumb[aId] || e.item?.[0]?.imageUrl || FALLBACK_IMG : FALLBACK_IMG;

                      return (
                        <div key={e.cartItemId} className="p-4 flex items-center gap-3">
                          <input type="checkbox" checked={isEntryChecked(e)} onChange={() => toggleEntry(e)} className="w-5 h-5 accent-green-600" />
                          <img
                            src={aThumb}
                            alt={aName}
                            className="w-14 h-14 object-cover rounded border bg-white"
                            onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{aName}</div>
                            <div className="text-sm text-gray-600">{currency(unitPriceOf(e))} × {qtyOf(e)}</div>
                          </div>
                          {e.accessoryId && (
                            <button onClick={() => navigate(`/accessory/${e.accessoryId}`)} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100">
                              Xem phụ kiện
                            </button>
                          )}
                          <div className="flex items-center border rounded overflow-hidden">
                            <button onClick={() => dec(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">−</button>
                            <span className="px-4 py-1">{qtyOf(e)}</span>
                            <button onClick={() => inc(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">+</button>
                          </div>
                          <div className="w-32 text-right font-semibold text-gray-800">{currency(displayTotalOf(e))}</div>
                          <button
                            onClick={() =>
                              setConfirm({
                                open: true,
                                kind: 'single',
                                title: 'Xác nhận xoá sản phẩm?',
                                message: `Bạn có chắc muốn xoá "${aName}" khỏi giỏ hàng?`,
                                entry: e,
                              })
                            }
                            className="text-red-600 hover:underline text-sm"
                          >
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

          {/* SẢN PHẨM LẺ */}
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

                  const terrariumDisplayName = actualTerrariumId
                    ? terrariumName[actualTerrariumId] || e.item?.[0]?.productName || `Bộ terrarium #${actualTerrariumId}`
                    : '';
                  const accessoryDisplayName = e.accessoryId
                    ? accessoryName[e.accessoryId] || e.item?.[0]?.productName || `Phụ kiện #${e.accessoryId}`
                    : '';
                  const productDisplayName = hasVariant && terrariumDisplayName ? terrariumDisplayName : accessoryDisplayName || 'Sản phẩm';

                  const imgSrc =
                    (hasVariant && actualTerrariumId
                      ? terrariumThumb[actualTerrariumId] || e.item?.[0]?.imageUrl || ''
                      : e.accessoryId
                      ? accessoryThumb[e.accessoryId] || e.item?.[0]?.imageUrl || ''
                      : '') || FALLBACK_IMG;

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
                        onError={(ev) => ((ev.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
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
                                    {v.variantName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-green-600 font-semibold">{currency(unitPriceOf(e))}</div>
                      </div>

                      {!e.comboId && (
                        <div className="flex items-center border rounded overflow-hidden">
                          <button onClick={() => dec(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50" disabled={isChangingVariant}>−</button>
                          <span className="px-4 py-1 min-w-[50px] text-center">{qtyOf(e)}</span>
                          <button onClick={() => inc(e)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50" disabled={isChangingVariant}>+</button>
                        </div>
                      )}

                      <div className="w-32 text-right">
                        <div className="font-semibold text-gray-800">{currency(displayTotalOf(e))}</div>
                        <button
                          onClick={() => askRemoveEntry(e)} // ✅ modal xác nhận xoá single
                          className="text-red-600 hover:underline text-sm mt-1 disabled:opacity-50"
                          disabled={isChangingVariant}
                        >
                          Xoá
                        </button>
                        {e.accessoryId && (
                          <button onClick={() => navigate(`/accessory/${e.accessoryId}`)} className="block mt-2 text-blue-600 hover:underline text-xs">
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

          {cartIsEmpty && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">Giỏ hàng trống</div>
              <button onClick={() => navigate('/')} className="text-green-600 hover:underline">Tiếp tục mua sắm</button>
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
