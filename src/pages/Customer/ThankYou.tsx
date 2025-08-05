import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrderById } from '@/api/order';
import { Order } from '@/types/order';

const ThankYou: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          toast.error('Không tìm thấy mã đơn hàng!');
          setNotFound(true);
          return;
        }

        // ⏳ Delay để backend kịp lưu dữ liệu
        await new Promise((resolve) => setTimeout(resolve, 800));

        const orderData = await getOrderById(Number(orderId));
        console.log('📦 Order data từ API:', orderData); // ✅ Debug

        if (!orderData) {
          setNotFound(true);
          return;
        }

        setOrder(orderData);
      } catch (err) {
        console.error('❌ Lỗi khi gọi API getOrderById:', err);
        toast.error('Lỗi khi tải thông tin đơn hàng!');
        setNotFound(true);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-lg">
        <p>Không tìm thấy thông tin đơn hàng!</p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Xem lịch sử đơn hàng
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-4 text-green-600">
        🎉 Cảm ơn bạn đã đặt hàng!
      </h1>
      <p className="mb-6">
        Mã đơn hàng của bạn: <strong>#{order.orderId}</strong>
      </p>

      {/* Chi tiết đơn hàng */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Chi tiết đơn hàng</h2>
        {order.orderItems.length === 0 ? (
          <p className="text-gray-600">Đơn hàng này chưa có sản phẩm.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-base mb-4">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="py-2 text-left">Sản phẩm</th>
                <th className="py-2 text-center">Số lượng</th>
                <th className="py-2 text-center">Đơn giá</th>
                <th className="py-2 text-center">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.orderItems.map((item) => (
                <tr key={item.orderItemId}>
                  <td className="py-2">
                    {item.accessoryId
                      ? `Accessory #${item.accessoryId}`
                      : `Variant #${item.terrariumVariantId}`}
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-center">
                    {item.unitPrice.toLocaleString()} VND
                  </td>
                  <td className="py-2 text-center">
                    {item.totalPrice.toLocaleString()} VND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="text-right font-bold text-lg">
          Tổng cộng: {order.totalAmount.toLocaleString()} VND
        </div>
      </div>

      {/* Thông tin đơn hàng */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p>
          <strong>Ngày đặt:</strong>{' '}
          {new Date(order.orderDate).toLocaleString()}
        </p>
        <p>
          <strong>Trạng thái:</strong> {order.status || 'Chưa cập nhật'}
        </p>
        <p>
          <strong>Phương thức thanh toán:</strong>{' '}
          {order.paymentMethod || 'Chưa xác định'}
        </p>
      </div>

      {/* Nút điều hướng */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Về trang chủ
        </button>
        <button
          onClick={() => navigate('/orders')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Xem lịch sử đơn hàng
        </button>
      </div>
    </div>
  );
};

export default ThankYou;
