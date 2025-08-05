import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

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
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [savedAddresses] = useState<string[]>([
    '123 Đường ABC, Quận 1, TP.HCM',
    '456 Đường XYZ, Quận 3, TP.HCM',
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<number>(0);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Lấy sản phẩm đã chọn từ localStorage.checkoutItems
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    if (selected.length > 0) {
      setCartItems(selected);
    } else {
      navigate('/cart');
      toast.warn('Không có sản phẩm nào để thanh toán!');
    }
  }, [navigate]);

  // Tính giá
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discountApplied;

  // Áp dụng mã giảm giá
  const applyDiscount = () => {
    if (discountCode === 'DISCOUNT10') {
      setDiscountApplied(subtotal * 0.1);
      toast.success('Áp dụng mã giảm giá thành công! Giảm 10%.');
    } else {
      setDiscountApplied(0);
      toast.error('Mã giảm giá không hợp lệ!');
    }
  };

  // Thay đổi phương thức thanh toán
  const handlePaymentMethodChange = (method: 'COD' | 'Online') => {
    setPaymentMethod(method);
    toast.info(`Hình thức thanh toán: ${method === 'COD' ? 'COD' : 'Online'}`);
  };

  // Đặt hàng
  const handlePlaceOrder = async () => {
  if (!fullName || !phoneNumber || !address) {
    toast.error('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ!');
    return;
  }

  try {
    const userId = Number(localStorage.getItem('userId') || 0);
    const payloadItems = cartItems
      .map((item) => {
        if (item.accessoryId) {
          return {
            accessoryId: item.accessoryId,
            quantity: item.quantity,
            unitPrice: item.price,
          };
        }
        if (item.variantId) {
          return {
            terrariumVariantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.price,
          };
        }
        return null;
      })
      .filter(Boolean);

    const payload = {
      userId,
      voucherId: 0,
      totalAmount: total,
      deposit: 0,
      items: payloadItems,
    };

    // 🔍 Log dữ liệu để kiểm tra
    console.log('=== DỮ LIỆU CHECKOUT ===');
    console.log('cartItems:', cartItems);
    console.log('payloadItems:', payloadItems);
    console.log('payload:', payload);

    const res = await axios.post(`${BASE_URL}/Order`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    toast.success('Đặt hàng thành công!');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('checkoutItems');
    navigate(`/thank-you/${res.data.orderId}`);
  } catch (err) {
    console.error(err);
    toast.error('Đặt hàng thất bại, vui lòng thử lại!');
  }
};


  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Thanh Toán</h1>
        {cartItems.length === 0 ? (
          <p className="text-gray-600">Không có sản phẩm để thanh toán.</p>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            {/* Danh sách sản phẩm */}
            <div className="mb-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between mb-4 p-4 border-b"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 ml-4">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
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

            {/* Tổng giá */}
            <div className="mb-6 text-right">
              <p>Tạm tính: {subtotal.toLocaleString('vi-VN')} VND</p>
              <p>Giảm giá: {discountApplied.toLocaleString('vi-VN')} VND</p>
              <p className="text-xl font-bold">Tổng: {total.toLocaleString('vi-VN')} VND</p>
            </div>

            {/* Hình thức thanh toán */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Hình thức thanh toán</h3>
              <label className="block mb-2">
                <input
                  type="radio"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => handlePaymentMethodChange('COD')}
                  className="mr-2"
                />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label>
                <input
                  type="radio"
                  value="Online"
                  checked={paymentMethod === 'Online'}
                  onChange={() => handlePaymentMethodChange('Online')}
                  className="mr-2"
                />
                Thanh toán online (Banking)
              </label>
            </div>

            {/* Địa chỉ */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Địa chỉ giao hàng</h3>
              <input
                type="text"
                placeholder="Họ và tên..."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded-lg mb-2"
                required
              />
              <input
                type="tel"
                placeholder="Số điện thoại..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 border rounded-lg mb-2"
                required
              />
              <select
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded-lg mb-2"
              >
                <option value="">Chọn địa chỉ đã lưu</option>
                {savedAddresses.map((addr, index) => (
                  <option key={index} value={addr}>
                    {addr}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nhập địa chỉ mới..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            {/* Mã giảm giá */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Mã giảm giá</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
                <button
                  onClick={applyDiscount}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Nút thanh toán */}
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Hoàn tất thanh toán
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
