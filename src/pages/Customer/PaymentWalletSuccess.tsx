// src/pages/Customer/PaymentWalletSuccess.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { getOrderById } from '@/api';
import type { Order } from '@/types/order';

const money = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + ' VND';

const PaymentWalletSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const od = await getOrderById(Number(orderId));
        if (!od?.orderId) {
          toast.error('Không tìm thấy đơn hàng!');
        }
        setOrder(od ?? null);
      } catch {
        toast.error('Lỗi khi lấy thông tin đơn hàng!');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [orderId]);

  const info = useMemo(() => {
    const originalAmount = order?.originalAmount ?? 0;
    const discountAmount = order?.discountAmount ?? 0;   // giảm do voucher
    const totalAmount = order?.totalAmount ?? 0;         // tổng cần thanh toán sau giảm
    const deposit = order?.deposit ?? 0;

    const isDeposit = deposit > 0;
    const paidNow = isDeposit ? deposit : totalAmount;   // ví đã trừ đúng phần cần trả
    const cod = Math.max(0, totalAmount - deposit);

    return { originalAmount, discountAmount, totalAmount, deposit, isDeposit, paidNow, cod };
  }, [order]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-6 bg-white p-8 rounded-xl shadow-2xl border-4 border-green-200">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán thành công</h1>
          <p className="mt-2 text-gray-600">Cảm ơn bạn đã mua hàng tại TerraTechGarden.</p>
        </div>

        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <>
            {/* Khối thông tin thanh toán */}
            <div className="bg-white p-6 rounded-lg shadow border border-green-100">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Thông tin thanh toán</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><strong>Mã đơn hàng:</strong> {order?.orderId ?? orderId}</p>
                <p><strong>Trạng thái:</strong> <span className="text-green-600 font-semibold">Thành công</span></p>
                <p><strong>Hình thức:</strong> Ví điện tử (Wallet)</p>
                <p><strong>Thời gian:</strong> {new Date().toLocaleString('vi-VN')}</p>
                <p><strong>Loại đơn:</strong> {info.isDeposit ? 'Đặt cọc (30%)' : 'Thanh toán toàn bộ'}</p>
                <p><strong>Đã thanh toán:</strong> {money(info.paidNow)}</p>
              </div>
            </div>

            {/* Tóm tắt tiền */}
            <div className="bg-white p-6 rounded-lg shadow border border-amber-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Tóm tắt đơn hàng</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính (giá gốc)</span>
                  <span className="font-medium">{money(info.originalAmount)}</span>
                </div>
                <div className="flex justify-between text-yellow-700">
                  <span>Giảm giá</span>
                  <span>-{money(info.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng tiền cần thanh toán</span>
                  <span className="font-semibold text-green-700">{money(info.totalAmount)}</span>
                </div>
                {info.isDeposit && (
                  <>
                    <div className="flex justify-between text-blue-700">
                      <span>Đã đặt cọc (đã trừ qua ví)</span>
                      <span>-{money(info.deposit)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Thanh toán khi nhận hàng</span>
                      <span>{money(info.cod)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate('/customer-dashboard/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Xem lịch sử đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentWalletSuccess;
