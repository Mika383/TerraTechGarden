// src/pages/Customer/Checkout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import AddressSelector from '@/components/customer/Layout/AddressSelector';
import { Address } from '@/types/profile';
import vnpayLogo from '@/assets/VNPAY.webp';
import { getVoucherByCode } from '@/api/order';
import { Voucher } from '@/types/order';

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
  const [paymentMethod, setPaymentMethod] = useState<'PayOS' | 'VNPAY'>('VNPAY');
  const [discountCode, setDiscountCode] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    if (selected.length > 0) {
      setCartItems(selected);
    } else {
      navigate('/cart');
      toast.warn('Không có sản phẩm nào để thanh toán!');
    }
  }, [navigate]);

  // ======= TÍNH TIỀN =======
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 30000;
  const discountFromVoucher = voucher ? voucher.discountAmount : 0;
  const discountFromFull = paymentOption === 'full' ? (subtotal - discountFromVoucher) * 0.1 : 0;

  const totalRaw = subtotal - discountFromVoucher - discountFromFull + shippingFee;
  const total = Math.max(0, Math.round(totalRaw));

  const depositRaw =
    paymentOption === 'deposit'
      ? (subtotal - discountFromVoucher) * 0.3 + shippingFee
      : 0; // full => deposit = 0
  const deposit = Math.max(0, Math.round(depositRaw));

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

  // ======= MAP ITEM -> ITEM PAYLOAD (loại hẳn field thừa) =======
  const mapCartItemToOrderItem = (item: CartItem) => {
    if (item.accessoryId) {
      return {
        accessoryId: item.accessoryId,
        accessoryQuantity: item.quantity,
      };
    }
    if (item.variantId) {
      return {
        terrariumVariantId: item.variantId,
        terrariumVariantQuantity: item.quantity,
      };
    }
    return null;
  };

  // ======= ĐẶT HÀNG & THANH TOÁN =======
  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    try {
      const items = cartItems.map(mapCartItemToOrderItem).filter(Boolean) as Array<
        | { accessoryId: number; accessoryQuantity: number }
        | { terrariumVariantId: number; terrariumVariantQuantity: number }
      >;

      if (items.length === 0) {
        toast.error('Không có sản phẩm hợp lệ để tạo đơn!');
        return;
      }

      // payload order: field nào không cần thì KHÔNG gửi
      const orderPayload: any = {
        deposit, // theo spec mới luôn có deposit (full = 0)
        items,
      };
      if (voucher?.voucherId) orderPayload.voucherId = voucher.voucherId;

      // 1) Tạo order
      const orderRes = await axios.post(`${BASE_URL}/Order`, orderPayload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      const orderId = orderRes.data?.orderId;
      if (!orderId) {
        toast.error('Tạo đơn hàng thất bại!');
        return;
      }

      // 2) Tạo thanh toán VNPAY
      if (paymentMethod === 'VNPAY') {
        const paymentPayload = {
          orderId,
          orderType: paymentOption === 'deposit' ? 'Deposit' : 'Bank',
          orderDescription: customerNote || '',
          name:
            (address as any)?.receiverName ||
            (address as any)?.recipientName ||
            '',
        };

        const payRes = await axios.post(`${BASE_URL}/Payment/vn-pay`, paymentPayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });

        const payUrl = payRes.data?.data;
        if (payUrl) {
          localStorage.removeItem('cartItems');
          localStorage.removeItem('checkoutItems');
          window.location.href = payUrl;
          return;
        }
        toast.error('Không lấy được link thanh toán!');
      } else {
        // PayOS (placeholder)
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left content */}
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-green-700">Thanh Toán</h1>

          {/* Sản phẩm */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Sản phẩm</h2>
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center border-b py-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">
                    {item.price.toLocaleString('vi-VN')} VND x {item.quantity}
                  </p>
                </div>
                <p className="font-bold">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                </p>
              </div>
            ))}
          </div>

          {/* Địa chỉ */}
          <AddressSelector
            userId={Number(localStorage.getItem('userId') || 0)}
            onSelect={(addr) => setAddress(addr)}
          />

          {/* Loại thanh toán */}
          <div className="bg-white p-6 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-4">Loại thanh toán</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div
                className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${paymentOption === 'deposit' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-white'}
                  hover:border-yellow-500`}
                onClick={() => setPaymentOption('deposit')}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="deposit"
                    checked={paymentOption === 'deposit'}
                    onChange={() => setPaymentOption('deposit')}
                    className="mr-2"
                  />
                  <span className="font-bold text-yellow-700 text-lg">Cọc trước 30%</span>
                </label>
                <div className="mt-2 text-xs text-gray-700">
                  Đặt cọc 30% để đảm bảo đơn hàng, hỗ trợ chi phí vận chuyển và giảm rủi ro với sản phẩm dễ vỡ.
                </div>
              </div>

              <div
                className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${paymentOption === 'full' ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'}
                  hover:border-green-500`}
                onClick={() => setPaymentOption('full')}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="full"
                    checked={paymentOption === 'full'}
                    onChange={() => setPaymentOption('full')}
                    className="mr-2"
                  />
                  <span className="font-bold text-green-700 text-lg">Thanh toán toàn bộ</span>
                </label>
                <div className="mt-2 text-xs text-gray-700">
                  Giảm ngay <b>10%</b> giá trị đơn hàng, ưu tiên xử lý trước.
                </div>
              </div>
            </div>
          </div>

          {/* Hình thức thanh toán */}
          <div className="bg-white p-6 rounded shadow mb-4">
            <h2 className="text-xl font-semibold mb-4">Hình thức thanh toán</h2>
            <div className="flex gap-4">
              <div
                className={`flex-1 flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                  hover:border-blue-400`}
                onClick={() => setPaymentMethod('VNPAY')}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VNPAY"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                  className="mr-2"
                />
                <img src={vnpayLogo} alt="VNPAY" className="w-8 h-8 object-cover rounded" />
                <span className="font-semibold text-blue-700 text-lg">VNPAY</span>
              </div>

              <div
                className={`flex-1 flex items-center gap-3 border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${paymentMethod === 'PayOS' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                  hover:border-blue-400`}
                onClick={() => setPaymentMethod('PayOS')}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="PayOS"
                  checked={paymentMethod === 'PayOS'}
                  onChange={() => setPaymentMethod('PayOS')}
                  className="mr-2"
                />
                <span className="font-semibold text-blue-700 text-lg">PayOS</span>
              </div>
            </div>
          </div>

          {/* Voucher + Ghi chú */}
          <div className="flex flex-col md:flex-row gap-6 w-full">
            {/* VOUCHER */}
            <div className="flex-1 bg-white rounded shadow p-6">
              <h2 className="text-xl font-semibold mb-3">Mã giảm giá</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 p-3 text-lg border-2 rounded"
                  style={{ minWidth: 0 }}
                />
                <button
                  onClick={applyVoucher}
                  className="bg-blue-500 text-white px-6 py-3 rounded text-lg hover:bg-blue-600 font-bold"
                >
                  Áp dụng
                </button>
              </div>
              <div className="mt-4 min-h-[80px]">
                {voucherError && <div className="text-red-500 text-base">{voucherError}</div>}
                {voucher && (
                  <div className="border-2 border-green-600 rounded p-4 bg-green-50 text-green-700 text-base font-medium space-y-1 mt-1">
                    <div><b>{voucher.description}</b></div>
                    <div>Giảm: <b>{voucher.discountAmount.toLocaleString('vi-VN')} VND</b></div>
                    <div>
                      Hiệu lực: {new Date(voucher.validFrom).toLocaleDateString()} - {new Date(voucher.validTo).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GHI CHÚ */}
            <div className="flex-1 bg-white rounded shadow p-6 flex flex-col">
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-xl font-semibold">Ghi chú cho đơn hàng</h2>
                <span
                  className={`text-sm ${
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
                rows={7}
                placeholder="Nhập ghi chú..."
                className="w-full p-3 text-lg border-2 rounded resize-none"
                style={{ minHeight: 120 }}
              />
            </div>
          </div>
        </div>

        {/* Right: Tổng kết đơn hàng */}
        <div className="sticky top-10 h-fit space-y-4">
          <button
            onClick={() => navigate('/cart')}
            className="w-full text-gray-700 border border-gray-400 px-4 py-2 rounded hover:text-blue-600"
          >
            ← Quay lại giỏ hàng
          </button>

          <div className="bg-white border border-gray-200 rounded shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">Tổng kết đơn hàng</h2>
            <div className="space-y-2 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img src={item.image} alt="" className="w-10 h-10 object-cover rounded" />
                    <span>{item.name} x {item.quantity}</span>
                  </div>
                  <span>{(item.price * item.quantity).toLocaleString('vi-VN')} VND</span>
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
              <div className="flex justify-between font-bold text-lg text-green-700">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between font-medium text-blue-700">
                <span>Số tiền cần thanh toán</span>
                <span>{deposit.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="mt-6 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
