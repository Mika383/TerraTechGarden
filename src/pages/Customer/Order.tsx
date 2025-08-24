import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, Star, Wallet } from 'lucide-react';

import { getOrdersByUser, createMoMoPayment } from '@/api/order';
import { getOrderById } from '@/api/order';
import { getAccessoryById } from '@/api/accessory';
import { getTerrariumById, getTerrariumVariantById } from '@/api/terrarium';
import { createFeedback, uploadFeedbackImage } from '@/api/feedback';

import type { Order, OrderItem } from '@/types/order';
import {
  orderStatusToVi,
  paymentStatusToVi,
  orderStatusChip,
  paymentStatusChip,
  isCompleted,
  isUnpaid,
} from '@/utils/orderStatus';

const money = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + ' VND';
const FALLBACK_IMG = '/TerraTechLogo.png';
const PAGE_SIZE = 5;

/** Chọn sao 1–5 */
const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, onChange, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const cls = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
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
            <span className={`${cls} ${active ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">{value}/5</span>
    </div>
  );
};

type ReviewOption = { orderItemId: number; name: string };

const Order: React.FC = () => {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem('userId') || '0');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);

  // modal đánh giá (tạo trước → upload sau 1 nhịp)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const [reviewOptions, setReviewOptions] = useState<ReviewOption[]>([]);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getOrdersByUser(userId);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const sliced = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, page]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  const payNow = async (order: Order) => {
    try {
      const { payUrl } = await createMoMoPayment({
        orderId: order.orderId,
        orderInfo: `Đơn hàng #${order.orderId}`,
        payAll: true,
      });
      window.location.href = payUrl;
    } catch (e) {
      console.error(e);
      toast.error('Không tạo được giao dịch MoMo.');
    }
  };

  // mở modal đánh giá – fetch nhanh item-name cho dropdown
  const openReview = async (order: Order) => {
    try {
      setLoading(true);
      const od = await getOrderById(order.orderId);
      if (!od) throw new Error('ORDER_NOT_FOUND');

      const opts: ReviewOption[] = await Promise.all(
        (od.orderItems || []).map(async (it: OrderItem) => {
          let name = 'Sản phẩm';
          if (it.terrariumVariantId) {
            const v = await getTerrariumVariantById(Number(it.terrariumVariantId));
            name = v?.variantName || name;
            if (!v?.urlImage && v?.terrariumId) {
              const t = await getTerrariumById(v.terrariumId);
              if (t?.terrariumName) name = t.terrariumName;
            }
          } else if (it.accessoryId) {
            const acc = await getAccessoryById(Number(it.accessoryId));
            name = acc?.name || name;
          }
          return { orderItemId: it.orderItemId, name };
        })
      );

      setReviewOrderId(order.orderId);
      setReviewOptions(opts);
      setSelectedOrderItemId(opts[0]?.orderItemId ?? null);
      setRating(5);
      setComment('');
      setFile(null);
      setReviewOpen(true);
    } catch (e) {
      console.error(e);
      toast.error('Không lấy được sản phẩm để đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    try {
      if (!selectedOrderItemId) {
        toast.warn('Vui lòng chọn sản phẩm để đánh giá.');
        return;
      }

      // 1) tạo feedback
      const fb = await createFeedback({
        orderItemId: selectedOrderItemId,
        rating,
        comment: comment || '',
      });

      const fid: number =
        fb?.feedbackId ?? fb?.data?.feedbackId ?? fb?.id ?? fb?.data?.id;

      // 2) đợi 1 nhịp cho BE tạo xong (tránh 500)
      if (fid && file) {
        await new Promise((r) => setTimeout(r, 400));
        await uploadFeedbackImage(fid, file);
      }

      toast.success('Đã gửi đánh giá!');
      setReviewOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Gửi đánh giá thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-4">Đơn hàng của bạn</h1>

        <div className="bg-white rounded-lg shadow border p-4 flex flex-col">
          {/* vùng danh sách cố định chiều cao để thanh trang không nhảy */}
          <div className="min-h-[440px]">
            {loading ? (
              <div className="text-center text-gray-600 py-10">Đang tải…</div>
            ) : sliced.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Chưa có đơn hàng.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-2 border">Mã đơn</th>
                      <th className="p-2 border">Ngày đặt</th>
                      <th className="p-2 border">Tổng tiền</th>
                      <th className="p-2 border">Trạng thái</th>
                      <th className="p-2 border">Thanh toán</th>
                      <th className="p-2 border w-64">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sliced.map((od) => (
                      <tr key={od.orderId}>
                        <td className="p-2 border font-medium">#{od.orderId}</td>
                        <td className="p-2 border">
                          {od.orderDate
                            ? new Date(od.orderDate).toLocaleString('vi-VN')
                            : 'N/A'}
                        </td>
                        <td className="p-2 border">{money(od.totalAmount)}</td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-0.5 rounded border text-xs ${orderStatusChip(
                              od.status
                            )}`}
                            title={String(od.status)}
                          >
                            {orderStatusToVi(od.status)}
                          </span>
                        </td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-0.5 rounded border text-xs ${paymentStatusChip(
                              od.paymentStatus
                            )}`}
                            title={String(od.paymentStatus)}
                          >
                            {paymentStatusToVi(od.paymentStatus)}
                          </span>
                        </td>
                        <td className="p-2 border">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border rounded hover:bg-gray-50"
                              onClick={() => navigate(`/order/${od.orderId}`)}
                            >
                              <Eye size={16} />
                              Xem chi tiết
                            </button>

                            {isCompleted(od.status) && (
                              <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded"
                                onClick={() => openReview(od)}
                              >
                                <Star size={16} />
                                Đánh giá
                              </button>
                            )}

                            {isUnpaid(od.paymentStatus) && (
                              <button
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded"
                                onClick={() => payNow(od)}
                              >
                                <Wallet size={16} />
                                Thanh toán
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* phân trang luôn dính cuối card */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <button
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Trước
            </button>
            <span className="text-sm">
              Trang {page}/{totalPages}
            </span>
            <button
              className="px-3 py-1.5 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {/* MODAL đánh giá – chọn item, rating, comment, ảnh */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">Đánh giá sản phẩm</div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sản phẩm</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={selectedOrderItemId ?? ''}
                    onChange={(e) => setSelectedOrderItemId(Number(e.target.value))}
                  >
                    {reviewOptions.map((op) => (
                      <option key={op.orderItemId} value={op.orderItemId}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Điểm (1–5)</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ảnh (tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Nhận xét</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setReviewOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Đóng
              </button>
              <button
                onClick={submitReview}
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

export default Order;
