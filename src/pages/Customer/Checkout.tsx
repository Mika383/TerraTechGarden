// src/pages/Customer/Checkout.tsx
import React, { useState, useEffect } from 'react';
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
import type { Voucher, CreateOrderRequest } from '@/types/order';

interface CartItem {
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'PayOS' | 'VNPAY' | 'MoMo'>('VNPAY');
  const [discountCode, setDiscountCode] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  
  // ===== WALLET STATES =====
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // ===== MOMO QR STATES =====
  const [showMoMoQR, setShowMoMoQR] = useState(false);
  const [momoQRCode, setMoMoQRCode] = useState<string | null>(null);
  const [momoPayUrl, setMoMoPayUrl] = useState<string | null>(null);

  const userId = Number(localStorage.getItem('userId') || 0);

  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    if (selected.length > 0) {
      setCartItems(selected);
    } else {
      navigate('/cart');
      toast.warn('Không có sản phẩm nào để thanh toán!');
    }
  }, [navigate]);

  // ===== Lấy Số Dư Ví =====
  useEffect(() => {
    if (userId) {
      fetchWalletBalance();
    }
  }, [userId]);

  const fetchWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const balance = await getWalletBalance(userId);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  // ======= CLEANUP CART ITEMS =======
  const cleanupCartItems = async (orderItems: any[]) => {
    try {
      console.log('🧹 Bắt đầu cleanup cart items...');
      const cartData = await getCart();
      const cartItemsFromAPI = cartData.cartItems || [];

      // Find matching cart items and delete them
      const itemsToDelete: number[] = [];
      
      for (const orderItem of orderItems) {
        const matchingCartItem = cartItemsFromAPI.find((cartItem: any) => {
          // Match terrarium variants
          if (orderItem.terrariumVariantId && cartItem.terrariumVariantId) {
            return orderItem.terrariumVariantId === cartItem.terrariumVariantId;
          }
          // Match accessories
          if (orderItem.accessoryId && cartItem.accessoryId) {
            return orderItem.accessoryId === cartItem.accessoryId;
          }
          return false;
        });

        if (matchingCartItem) {
          itemsToDelete.push(matchingCartItem.cartItemId);
        }
      }

      // Delete cart items
      if (itemsToDelete.length > 0) {
        await Promise.all(
          itemsToDelete.map(cartItemId => deleteCartItem(cartItemId))
        );
        console.log(`✅ Đã xóa ${itemsToDelete.length} sản phẩm khỏi giỏ hàng`);
        toast.success(`Đã xóa ${itemsToDelete.length} sản phẩm khỏi giỏ hàng`);
      } else {
        console.log('ℹ️ Không tìm thấy sản phẩm nào để xóa khỏi giỏ hàng');
      }
    } catch (error) {
      console.error('❌ Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
      // Không hiển thị toast error vì không ảnh hưởng đến flow chính
    }
  };

  // ======= TÍNH TIỀN =======
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 30000;
  const discountFromVoucher = voucher ? voucher.discountAmount : 0;
  const discountFromFull = paymentOption === 'full' ? (subtotal - discountFromVoucher) * 0.1 : 0;

  const totalBeforeWallet = Math.max(0, Math.round(subtotal - discountFromVoucher - discountFromFull + shippingFee));
  
  // Tính số tiền cần thanh toán thực tế
  const actualPaymentAmount = paymentOption === 'deposit' 
    ? Math.max(0, Math.round((subtotal - discountFromVoucher) * 0.3 + shippingFee))
    : totalBeforeWallet;

  // Số tiền sử dụng từ ví
  const walletUsageAmount = useWallet 
    ? Math.min(walletBalance, actualPaymentAmount) 
    : 0;

  // Số tiền còn lại cần thanh toán qua gateway
  const remainingPaymentAmount = Math.max(0, actualPaymentAmount - walletUsageAmount);

  // ======= ÁP DỤNG VOUCHER =======
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

  // ======= MAP ITEM -> ITEM PAYLOAD (đủ 4 field) =======
  const mapCartItemToOrderItem = (item: CartItem) => {
    if (item.accessoryId) {
      return {
        accessoryId: item.accessoryId ?? 0,
        terrariumVariantId: 0,
        accessoryQuantity: item.quantity ?? 0,
        terrariumVariantQuantity: 0,
      };
    }
    if (item.variantId) {
      return {
        accessoryId: 0,
        terrariumVariantId: item.variantId ?? 0,
        accessoryQuantity: 0,
        terrariumVariantQuantity: item.quantity ?? 0,
      };
    }
    return null;
  };

  // ======= ĐẶT HÀNG & THANH TOÁN =======
  const handlePlaceOrder = async () => {
    if (!address?.id) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    try {
      const items = cartItems
        .map(mapCartItemToOrderItem)
        .filter(Boolean) as CreateOrderRequest['items'];

      if (!items.length) {
        toast.error('Không có sản phẩm hợp lệ để tạo đơn!');
        return;
      }

      // Tạo order payload
      const payload: CreateOrderRequest = {
        voucherId: voucher?.voucherId ?? 0,
        deposit: paymentOption === 'deposit' ? actualPaymentAmount : 0,
        addressId: (address as any).id,
        items,
      };

      // Tạo order
      const { orderId } = await createOrder(payload);
      if (!orderId) {
        toast.error('Tạo đơn hàng thất bại!');
        return;
      }

      console.log('✅ Tạo order thành công, ID:', orderId);

      // ===== CLEANUP CART NGAY SAU KHI TẠO ORDER THÀNH CÔNG =====
      await cleanupCartItems(items);

      // Nếu sử dụng ví và có số dư ví
      if (useWallet && walletUsageAmount > 0) {
        try {
          await useWalletForPayment({
            userId,
            amount: walletUsageAmount,
            orderId,
          });
        } catch (error) {
          console.error('Error using wallet:', error);
          toast.error('Lỗi khi sử dụng ví, vui lòng thử lại!');
          return;
        }
      }

      // Nếu không còn số tiền cần thanh toán (ví đã thanh toán hết)
      if (remainingPaymentAmount === 0) {
        toast.success('Thanh toán thành công bằng ví!');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('checkoutItems');
        navigate(`/thank-you/${orderId}`);
        return;
      }

      // Nếu còn số tiền cần thanh toán qua gateway
      const payAll = paymentOption === 'full'; // Logic payAll: deposit = false, full = true
      
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
          
          // Hiển thị QR code trước khi chuyển hướng
          if (qrImageBase64) {
            setMoMoQRCode(qrImageBase64);
            setMoMoPayUrl(payUrl);
            setShowMoMoQR(true);
            
            // Tự động chuyển hướng sau 10 giây
            setTimeout(() => {
              localStorage.removeItem('cartItems');
              localStorage.removeItem('checkoutItems');
              window.location.href = payUrl;
            }, 10000);
          } else {
            // Nếu không có QR, chuyển hướng ngay
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
        // PayOS hoặc phương thức khác
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

  return (
    <>
      {/* MoMo QR Code Modal */}
      {showMoMoQR && momoQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <h2 className="text-xl font-bold text-pink-600">Thanh toán MoMo</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Quét mã QR bằng ứng dụng MoMo để thanh toán
            </p>
            
            <div className="flex justify-center mb-4">
              <img 
                src={`data:image/png;base64,${momoQRCode}`}
                alt="MoMo QR Code"
                className="w-64 h-64 border border-gray-300 rounded-lg"
              />
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Trang sẽ tự động chuyển hướng sau 10 giây...
            </p>
            
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
      )}

      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">
              Thanh Toán
            </h1>

            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">Sản phẩm</h2>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center border-b py-3 sm:py-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded"
                  />
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg truncate">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {item.price.toLocaleString('vi-VN')} VND x {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-sm sm:text-base md:text-lg">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                  </p>
                </div>
              ))}
            </div>

            <AddressSelector
              userId={userId}
              onSelect={(addr) => setAddress(addr)}
            />

            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">
                Loại thanh toán
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div
                  className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentOption === 'deposit'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 bg-white'
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
                    Đặt cọc 30% để đảm bảo đơn hàng, hỗ trợ chi phí vận chuyển và giảm
                    rủi ro với sản phẩm dễ vỡ.
                  </div>
                </div>

                <div
                  className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentOption === 'full'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 bg-white'
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

            {/* ===== KHU VỰC VÍ MỚI ===== */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">
                Ví điện tử
              </h2>
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
                <div className="mt-2 text-yellow-600 text-sm">
                  Số dư ví không đủ để thanh toán.
                </div>
              )}
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">
                Hình thức thanh toán
              </h2>
              {remainingPaymentAmount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div
                    className={`flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'VNPAY'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
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
                    <img
                      src={vnpayLogo}
                      alt="VNPAY"
                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                    />
                    <span className="font-semibold text-blue-700 text-sm sm:text-base">
                      VNPAY
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'MoMo'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-300 bg-white'
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
                    <span className="font-semibold text-pink-700 text-sm sm:text-base">
                      MoMo
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'PayOS'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
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
                    <span className="font-semibold text-blue-700 text-sm sm:text-base">
                      PayOS
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-green-600 font-medium p-4 bg-green-50 rounded-lg">
                  Đơn hàng sẽ được thanh toán hoàn toàn bằng ví điện tử
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
              <div className="flex-1 bg-white rounded-lg shadow p-4 sm:p-5">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3">
                  Mã giảm giá
                </h2>
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
                  {voucherError && (
                    <div className="text-red-500 text-sm sm:text-base">
                      {voucherError}
                    </div>
                  )}
                  {voucher && (
                    <div className="border-2 border-green-600 rounded p-4 bg-green-50 text-green-700 text-sm sm:text-base font-medium space-y-1 mt-1">
                      <div><b>{voucher.description}</b></div>
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
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                    Ghi chú cho đơn hàng
                  </h2>
                  <span
                    className={`text-xs sm:text-sm ${
                      customerNote.trim().split(/\s+/).length > 100
                        ? 'text-red-500'
                        : 'text-gray-500'
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

          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <button
              onClick={() => navigate('/cart')}
              className="w-full text-gray-700 border border-gray-400 px-4 py-2 rounded hover:text-blue-600 text-sm sm:text-base"
            >
              ← Quay lại giỏ hàng
            </button>

            <div className="bg-white border border-gray-200 rounded-lg shadow p-4 sm:p-5 sticky top-4 sm:top-6">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 text-green-700">
                Tổng kết đơn hàng
              </h2>
              <div className="space-y-2 text-sm sm:text-base">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.image}
                        alt=""
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
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