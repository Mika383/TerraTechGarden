// src/pages/Customer/Checkout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddressSelector from '@/components/customer/Layout/AddressSelector';
import { Address } from '@/types/profile';
import vnpayLogo from '@/assets/VNPAY.webp';
import {
  createOrder,
  getVoucherByCode,
  getWalletBalance,
  useWalletForPayment,
  createVNPayPayment,
  createMoMoPayment
} from '@/api/order';
import { getCart, deleteCartItem } from '@/api/cart';
import { getTerrariumById } from '@/api/terrarium';
import type { Voucher, CreateOrderRequest } from '@/types/order';
import type { CartResponseNew, CartBundle, RawCartEntry } from '@/types/cart';

// --- Helpers & currency ---
const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';
const firstItem = (e: RawCartEntry) => (e.item && e.item.length ? e.item[0] : null);
const keyOfEntry = (e: RawCartEntry) => `ci_${e.cartItemId}`;
const keyOfBundle = (b: CartBundle) => `b_${b.mainItem.terrariumId ?? 'x'}`;

interface SimpleCartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected: boolean;
  accessoryId?: number | null;
  variantId?: number | null;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();

  // --- State cũ (summary, thanh toán, ví, voucher, note) ---
  const [address, setAddress] = useState<Address | null>(null);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'PayOS' | 'VNPAY' | 'MoMo'>('VNPAY');
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

  // --- Dữ liệu hiển thị giống Cart ---
  const [apiCart, setApiCart] = useState<CartResponseNew | null>(null);
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Fallback local (khi không dùng API được) ---
  const [localSimple, setLocalSimple] = useState<SimpleCartItem[]>([]);

  const userId = Number(localStorage.getItem('userId') || 0);

  // Đọc danh sách mục đã chọn từ localStorage (được set từ trang Cart)
  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('checkoutItems') || '[]') as SimpleCartItem[];
    if (!raw.length) {
      navigate('/cart');
      toast.warn('Không có sản phẩm nào để thanh toán!');
      return;
    }

    // Lấy ra list id (keyOfEntry) nếu có, để lọc từ API cart
    const ids = new Set<string>(raw.map((it) => it.id));
    setSelectedIds(ids);
    setLocalSimple(raw); // để fallback nếu API không dùng được

    // Thử gọi API giỏ hàng để dựng lại cấu trúc nhóm giống Cart
    (async () => {
      try {
        const res = await getCart();
        setApiCart(res);
      } catch {
        // im lặng, dùng localSimple để render
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

  // Lấy tên terrarium cho group bundle
  useEffect(() => {
    (async () => {
      if (!apiCart) return;
      const ids = new Set<number>();
      for (const b of apiCart.bundleItems || []) {
        const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
        if (tid) ids.add(tid);
      }
      // thêm terrariumId của single entries nếu có
      for (const e of apiCart.singleItems || []) {
        if (e.terrariumId) ids.add(e.terrariumId);
      }

      const missing = [...ids].filter((id) => !terrariumName[id]);
      if (!missing.length) return;

      const pairs = await Promise.all(
        missing.map(async (id) => {
          try {
            const t = await getTerrariumById(id);
            return [id, t?.terrariumName || `Bể terrarium #${id}`] as const;
          } catch {
            return [id, `Bể terrarium #${id}`] as const;
          }
        })
      );
      setTerrariumName((m) => {
        const n = { ...m };
        for (const [id, name] of pairs) n[id] = name;
        return n;
      });
    })();
  }, [apiCart, terrariumName]);

  // --- Dựng cấu trúc giống Cart (nhưng chỉ giữ các mục đã chọn) ---
  const bundlesAll = useMemo(() => {
    const src = apiCart?.bundleItems || [];
    // chỉ giữ bundles có phụ kiện (để hiển thị dạng nhóm)
    return src
      .filter((b) => (b.bundleAccessories?.length || 0) > 0)
      .map((b) => {
        // Lọc các accessory entry nằm trong selectedIds
        const filteredAcc = b.bundleAccessories.filter((e) => selectedIds.has(keyOfEntry(e)));
        return { ...b, bundleAccessories: filteredAcc };
      })
      .filter((b) => (b.bundleAccessories?.length || 0) > 0);
  }, [apiCart, selectedIds]);

  const variantSinglesFromBundles = useMemo<RawCartEntry[]>(() => {
    const src = apiCart?.bundleItems || [];
    return src
      .filter(
        (b) =>
          (b.bundleAccessories?.length || 0) === 0 && !!b.mainItem.terrariumVariantId
      )
      .map((b) => b.mainItem)
      .filter((e) => selectedIds.has(keyOfEntry(e)));
  }, [apiCart, selectedIds]);

  const mergedSingles = useMemo<RawCartEntry[]>(() => {
    const singles = (apiCart?.singleItems || []).filter((e) =>
      selectedIds.has(keyOfEntry(e))
    );
    return [...variantSinglesFromBundles, ...singles];
  }, [apiCart, selectedIds, variantSinglesFromBundles]);

  // --- Tính tổng tạm tính dựa trên data đang render ---
  const subtotalFromAPI = useMemo(() => {
    const sumSingles = mergedSingles.reduce((s, e) => {
      const i = firstItem(e);
      return s + (i?.price || 0) * (i?.quantity || 0);
    }, 0);
    const sumBundles = bundlesAll.reduce((s, b) => {
      const sub = b.bundleAccessories.reduce((ss, e) => {
        const i = firstItem(e);
        return ss + (i?.price || 0) * (i?.quantity || 0);
      }, 0);
      return s + sub;
    }, 0);
    return sumSingles + sumBundles;
  }, [mergedSingles, bundlesAll]);

  // --- Fallback subtotal (local) ---
  const subtotalLocal = useMemo(
    () => localSimple.reduce((s, it) => s + it.price * it.quantity, 0),
    [localSimple]
  );

  // --- Dùng subtotal nào? Nếu có apiCart (đăng nhập) -> ưu tiên API ---
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
      if (!res || res.status !== 'active') {
        setVoucher(null);
        setVoucherError('Mã không tồn tại hoặc đã hết hạn!');
        return;
      }
      const now = new Date();
      if (new Date(res.validFrom) > now || new Date(res.validTo) < now) {
        setVoucher(null);
        setVoucherError('Mã đã hết hạn hoặc chưa được áp dụng!');
        return;
      }
      setVoucher(res);
      toast.success('Áp dụng voucher thành công!');
    } catch {
      setVoucher(null);
      setVoucherError('Mã không hợp lệ!');
    }
  };

  // Map item -> payload
  const mapCartItemToOrderItem = (item: SimpleCartItem) => {
    if (item.accessoryId) {
      return {
        accessoryId: item.accessoryId ?? 0,
        terrariumVariantId: 0,
        accessoryQuantity: item.quantity ?? 0,
        terrariumVariantQuantity: 0
      };
    }
    if (item.variantId) {
      return {
        accessoryId: 0,
        terrariumVariantId: item.variantId ?? 0,
        accessoryQuantity: 0,
        terrariumVariantQuantity: item.quantity ?? 0
      };
    }
    return null;
  };

  // ======= CLEANUP CART ITEMS =======
  const cleanupCartItems = async (orderItems: any[]) => {
    try {
      console.log('🧹 Bắt đầu cleanup cart items...');
      const cartData = await getCart();

      // Chuẩn hoá tất cả item trong giỏ hàng (hỗ trợ cả kiểu cũ và mới)
      let cartItemsFromAPI: any[] = [];

      // Kiểu cũ: có cartItems
      const anyCart = cartData as any;
      if (Array.isArray(anyCart?.cartItems)) {
        cartItemsFromAPI = anyCart.cartItems;
      } else {
        // Kiểu mới: singleItems + bundleItems
        const singles = Array.isArray((cartData as any)?.singleItems)
          ? (cartData as any).singleItems
          : [];

        const bundles = Array.isArray((cartData as any)?.bundleItems)
          ? (cartData as any).bundleItems
          : [];

        // bundleAccessories: xoá từng phụ kiện
        // mainItem là variant: nếu bundleAccessories rỗng thì xem như 1 item đơn lẻ
        const fromBundles = bundles.flatMap((b: any) => {
          const accs = Array.isArray(b.bundleAccessories) ? b.bundleAccessories : [];
          if (accs.length > 0) return accs;
          // Không có phụ kiện -> có thể là 1 terrarium variant nằm trong bundle
          return b?.mainItem ? [b.mainItem] : [];
        });

        cartItemsFromAPI = [...singles, ...fromBundles];
      }

      // Tìm các cartItemId cần xoá dựa trên orderItems (match theo variantId / accessoryId)
      const itemsToDelete: number[] = [];

      for (const orderItem of orderItems) {
        const matchingCartItem = cartItemsFromAPI.find((cartItem: any) => {
          // Terrarium variant
          if (orderItem.terrariumVariantId && cartItem.terrariumVariantId) {
            return orderItem.terrariumVariantId === cartItem.terrariumVariantId;
          }
          // Accessory
          if (orderItem.accessoryId && cartItem.accessoryId) {
            return orderItem.accessoryId === cartItem.accessoryId;
          }
          return false;
        });

        if (matchingCartItem?.cartItemId) {
          itemsToDelete.push(matchingCartItem.cartItemId);
        }
      }

      // Xoá
      if (itemsToDelete.length > 0) {
        await Promise.all(itemsToDelete.map((cartItemId) => deleteCartItem(cartItemId)));
        console.log(`✅ Đã xóa ${itemsToDelete.length} sản phẩm khỏi giỏ hàng`);
        toast.success(`Đã xóa ${itemsToDelete.length} sản phẩm khỏi giỏ hàng`);
      } else {
        console.log('ℹ️ Không tìm thấy sản phẩm nào để xóa khỏi giỏ hàng');
      }
    } catch (error) {
      console.error('❌ Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
      // Không toast error để không chặn flow
    }
  };

  // Đặt hàng & thanh toán
  const handlePlaceOrder = async () => {
    if (!address?.id) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }
    const baseList = localSimple;
    if (baseList.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    try {
      const items = baseList.map(mapCartItemToOrderItem).filter(Boolean) as CreateOrderRequest['items'];
      if (!items.length) {
        toast.error('Không có sản phẩm hợp lệ để tạo đơn!');
        return;
      }

      const payload: CreateOrderRequest = {
        voucherId: voucher?.voucherId ?? 0,
        deposit: paymentOption === 'deposit' ? actualPaymentAmount : 0,
        addressId: (address as any).id,
        items
      };

      const { orderId } = await createOrder(payload);
      if (!orderId) {
        toast.error('Tạo đơn hàng thất bại!');
        return;
      }

      await cleanupCartItems(items);

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

      const payAll = paymentOption === 'full';

      if (paymentMethod === 'VNPAY') {
        const paymentPayload = {
          orderId,
          orderType: paymentOption === 'deposit' ? 'Cọc 30%' : 'Thanh toán toàn bộ',
          orderDescription: customerNote || `Đơn hàng #${orderId}`,
          name: (address as any)?.receiverName || (address as any)?.recipientName || 'Khách hàng',
          payAll
        };
        try {
          const payUrl = await createVNPayPayment(paymentPayload);
          localStorage.removeItem('cartItems');
          localStorage.removeItem('checkoutItems');
          window.location.href = payUrl;
          return;
        } catch (error) {
          console.error('VNPAY payment error:', error);
          toast.error('Không lấy được link thanh toán VNPAY!');
          return;
        }
      } else if (paymentMethod === 'MoMo') {
        const momoPayload = {
          orderId,
          orderInfo: customerNote || `Đơn hàng #${orderId}`,
          payAll
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
          return;
        } catch (error) {
          console.error('MoMo payment error:', error);
          toast.error('Không lấy được link thanh toán MoMo!');
          return;
        }
      } else {
        toast.success('Tạo đơn hàng thành công!');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('checkoutItems');
        navigate(`/thank-you/${orderId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Đặt hàng/thanh toán thất bại, vui lòng thử lại!');
    }
  };

  // ============ RENDER ============
  // Block MoMo QR
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
            className="w-64 h-64 border border-gray-300 rounded-lg"
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

  // Khối sản phẩm “giống Cart” (read-only)
  const ProductSectionAPI = (
    <div className="bg-white p-4 sm:p-5 rounded-lg shadow space-y-4">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold">Sản phẩm</h2>

      {/* BUNDLES: phụ kiện theo bể */}
      {bundlesAll.map((b) => {
        const tid = b.mainItem.terrariumId ?? b.bundleAccessories[0]?.terrariumId ?? 0;
        const name = tid ? terrariumName[tid] || `Bể terrarium #${tid}` : 'Bể terrarium';
        const bundleId = keyOfBundle(b);

        const totalQty = b.bundleAccessories.reduce((s, e) => s + (firstItem(e)?.quantity || 0), 0);
        const totalPrice = b.bundleAccessories.reduce(
          (s, e) => s + (firstItem(e)?.price || 0) * (firstItem(e)?.quantity || 0),
          0
        );

        return (
          <div key={bundleId} className="rounded-lg border">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
              <div className="font-semibold">
                Bộ phụ kiện của{' '}
                <button
                  onClick={() => tid && navigate(`/terrarium/${tid}`)}
                  className="text-green-700 hover:underline"
                >
                  {name}
                </button>
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
                const i = firstItem(e);
                return (
                  <div key={e.cartItemId} className="p-3 sm:p-4 flex items-center gap-3">
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
                      <div className="font-medium text-gray-800 truncate">{i?.productName}</div>
                      <div className="text-sm text-gray-600">
                        {currency(i?.price || 0)} × {i?.quantity ?? 1}
                      </div>
                    </div>
                    <div className="w-32 text-right font-semibold text-gray-800">
                      {currency((i?.price || 0) * (i?.quantity || 0))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* SINGLE ITEMS + VARIANT (read-only) */}
      {mergedSingles.length > 0 && (
        <div className="rounded-lg border">
          <div className="p-3 sm:p-4 border-b font-semibold bg-gray-50">Sản phẩm lẻ</div>
          <div className="divide-y">
            {mergedSingles.map((e) => {
              const i = firstItem(e);
              const actualTerrariumId = e.terrariumId;
              const terrariumDisplayName = actualTerrariumId
                ? terrariumName[actualTerrariumId] || `Bể terrarium #${actualTerrariumId}`
                : '';
              const productDisplayName =
                e.terrariumVariantId && terrariumDisplayName
                  ? terrariumDisplayName
                  : i?.productName || 'Sản phẩm';

              return (
                <div key={e.cartItemId} className="p-3 sm:p-4 flex items-start gap-3">
                  {i?.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={productDisplayName}
                      className="w-14 h-14 object-cover rounded border cursor-pointer"
                      onClick={() => actualTerrariumId && navigate(`/terrarium/${actualTerrariumId}`)}
                      onError={(ev) => {
                        (ev.currentTarget as HTMLImageElement).src = '/default.jpg';
                      }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 bg-gray-100 rounded border cursor-pointer flex items-center justify-center"
                      onClick={() => actualTerrariumId && navigate(`/terrarium/${actualTerrariumId}`)}
                    >
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-gray-800 cursor-pointer hover:underline mb-1"
                      onClick={() => actualTerrariumId && navigate(`/terrarium/${actualTerrariumId}`)}
                      title={productDisplayName}
                    >
                      {productDisplayName}
                    </div>

                    {/* Nếu là variant: hiển thị dòng phân loại (không dropdown) */}
                    {e.terrariumVariantId && (
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">
                        Phân loại hàng: <span className="font-medium text-gray-700">{i?.productName}</span>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      {currency(i?.price || 0)} × {i?.quantity ?? 1}
                    </div>
                  </div>

                  <div className="w-32 text-right font-semibold text-gray-800">
                    {currency((i?.price || 0) * (i?.quantity || 0))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback local (nếu không có apiCart) */}
      {!apiCart && (
        <div className="rounded-lg border">
          <div className="p-3 sm:p-4 border-b font-semibold bg-gray-50">Sản phẩm</div>
          <div className="divide-y">
            {localSimple.map((item) => (
              <div key={item.id} className="p-3 sm:p-4 flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded border"
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

            {/* Sản phẩm — hiển thị giống Cart (read-only) */}
            {ProductSectionAPI}

            <AddressSelector userId={userId} onSelect={(addr) => setAddress(addr)} />

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
                    Đặt cọc 30% để đảm bảo đơn hàng, hỗ trợ chi phí vận chuyển và giảm rủi ro với sản phẩm dễ vỡ.
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

            {/* Hình thức thanh toán */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Hình thức thanh toán</h2>
              {remainingPaymentAmount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div
                    className={`flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                    } hover:border-blue-400`}
                    onClick={() => setPaymentMethod('VNPAY')}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={() => setPaymentMethod('VNPAY')}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <img src={vnpayLogo} alt="VNPAY" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded" />
                    <span className="font-semibold text-blue-700 text-sm sm:text-base">VNPAY</span>
                  </div>

                  <div
                    className={`flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'MoMo' ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-white'
                    } hover:border-pink-400`}
                    onClick={() => setPaymentMethod('MoMo')}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MoMo"
                      checked={paymentMethod === 'MoMo'}
                      onChange={() => setPaymentMethod('MoMo')}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">M</span>
                    </div>
                    <span className="font-semibold text-pink-700 text-sm sm:text-base">MoMo</span>
                  </div>

                  <div
                    className={`flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'PayOS' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                    } hover:border-blue-400`}
                    onClick={() => setPaymentMethod('PayOS')}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PayOS"
                      checked={paymentMethod === 'PayOS'}
                      onChange={() => setPaymentMethod('PayOS')}
                      className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">P</span>
                    </div>
                    <span className="font-semibold text-blue-700 text-sm sm:text-base">PayOS</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-green-600 font-medium p-4 bg-green-50 rounded-lg">
                  Đơn hàng sẽ được thanh toán hoàn toàn bằng ví điện tử
                </div>
              )}
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
                      customerNote.trim().split(/\s+/).length > 100 ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    {customerNote.trim().split(/\s+/).filter(Boolean).length}/100 từ
                  </span>
                </div>
                <textarea
                  value={customerNote}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 100) {
                      setCustomerNote(e.target.value);
                    } else {
                      setCustomerNote(words.slice(0, 100).join(' ') + ' ');
                    }
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
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 text-green-700">Tổng kết đơn hàng</h2>

              {/* Tóm tắt theo localSimple (đã được dùng để tạo order payload) */}
              <div className="space-y-2 text-sm sm:text-base">
                {localSimple.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={item.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />
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
                {discountFromFull > 0 && (
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
                {remainingPaymentAmount === 0 ? 'Thanh toán bằng ví' : 'Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
