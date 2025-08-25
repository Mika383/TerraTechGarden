// src/pages/Customer/Order.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, Star, Wallet, XCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { createMoMoPayment, getOrdersByUser, cancelOrder } from '@/api/order';
import type { Order, OrderItem } from '@/types/order';

import {
  orderStatusToVi,
  paymentStatusToVi,
  orderStatusChip,
  paymentStatusChip,
  isCompleted,
  isUnpaid,
} from '@/utils/orderStatus';

import { createFeedback, uploadFeedbackImage } from '@/api/feedback';

const money = (v?: number) => (v ?? 0).toLocaleString('vi-VN') + ' VND';
const PER_PAGE = 5;

/** Star rating (★) – nhấp để chọn, hover để xem trước */
const StarRating: React.FC<{
  value: number;
  onChange: (n: number) => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, onChange, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const starSize =
    size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => {
        const n = idx + 1;
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
            className="leading-none focus:outline-none"
          >
            <span
              className={`${starSize} ${
                active ? 'text-amber-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">{value}/5</span>
    </div>
  );
};

type ReviewState = {
  open: boolean;
  order?: Order | null;
  orderItemId?: number | null;
  rating: number;
  comment: string;
  file?: File | null;
};

const Order: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);

  // modal đánh giá
  const [review, setReview] = useState<ReviewState>({
    open: false,
    order: null,
    orderItemId: null,
    rating: 5,
    comment: '',
    file: null,
  });

  const userId = useMemo(() => Number(localStorage.getItem('userId') || 0), []);

  const load = async () => {
    if (!userId) {
      toast.info('Bạn cần đăng nhập để xem đơn hàng.');
      return;
    }
    try {
      setLoading(true);
      const data = await getOrdersByUser(userId);
      const sorted = [...(Array.isArray(data) ? data : [])].sort((a, b) => {
        const ta = new Date(a.orderDate ?? '').getTime();
        const tb = new Date(b.orderDate ?? '').getTime();
        return tb - ta;
      });
      setOrders(sorted);
      setPage(1);
    } catch {
      toast.error('Không tải được danh sách đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— ACTIONS ———
  const payWithMoMo = async (o: Order) => {
    try {
      const { payUrl } = await createMoMoPayment({
        orderId: o.orderId,
        orderInfo: `Đơn hàng #${o.orderId}`,
        payAll: true,
      });
      window.location.href = payUrl;
    } catch (err) {
      console.error(err);
      toast.error('Không tạo được giao dịch MoMo.');
    }
  };

  const handleCancel = async (o: Order) => {
    // xin lý do nhanh (tùy chọn)
    const reason = window.prompt('Lý do hủy (tùy chọn):', 'Khách hàng yêu cầu hủy');
    if (reason === null) return;

    try {
      await cancelOrder(o.orderId, userId, {
        cancelReason: reason || 'Khách hàng yêu cầu hủy',
        additionalNotes: '',
      });
      toast.success(`Đã gửi yêu cầu hủy đơn #${o.orderId}`);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error('Hủy đơn thất bại.');
    }
  };

  const requestRefund = (o: Order) => {
    // chỗ này tùy flow của bạn (đi đến màn tạo yêu cầu hoàn, hoặc mở modal)
    toast.info('Tính năng yêu cầu hoàn sẽ được bật cho đơn đã hoàn thành.');
    // ví dụ: navigate(`/customer-dashboard/orders/${o.orderId}?tab=refund`);
  };

  const openReview = (o: Order) => {
    const firstItem = o.orderItems?.[0]?.orderItemId ?? null;
    setReview({
      open: true,
      order: o,
      orderItemId: firstItem,
      rating: 5,
      comment: '',
      file: null,
    });
  };

  const submitReview = async () => {
    try {
      if (!review.order || !review.orderItemId) return;
      if (review.rating < 1 || review.rating > 5) {
        toast.info('Điểm đánh giá từ 1 đến 5.');
        return;
      }
      const fb = await createFeedback({
        orderItemId: review.orderItemId,
        rating: review.rating,
        comment: review.comment || '',
      });

      const fid: number =
        fb?.feedbackId ?? fb?.data?.feedbackId ?? fb?.id ?? fb?.data?.id;

      if (fid && review.file) {
        await uploadFeedbackImage(fid, review.file);
      }

      toast.success('Đã gửi đánh giá. Cảm ơn bạn!');
      setReview((s) => ({ ...s, open: false }));
    } catch (e) {
      console.error(e);
      toast.error('Gửi đánh giá thất bại.');
    }
  };

  // —— Helpers (hiển thị nút) ——
  const isCanceled = (s: string | number) => {
    const v = String(s).toLowerCase();
    return v === 'cancel' || v === 'cancle';
  };
  const isShipping = (o: Order) =>
    String(o.status).toLowerCase() === 'shipping' ||
    String(o.shippingStatus ?? '').toLowerCase() === 'shipping';
  const isPaymentFailed = (o: Order) =>
    String(o.paymentStatus ?? '').toLowerCase() === 'failed';

  const canRate = (o: Order) => isCompleted(o.status);
  // nút pay: chỉ khi unpaid và KHÔNG bị hủy
  const canPay = (o: Order) => isUnpaid(o.paymentStatus) && !isCanceled(o.status);
  // nút cancel: pending/processing, chưa shipping, chưa canceled, và không phải payment failed
  const canCancel = (o: Order) => {
    const st = String(o.status).toLowerCase();
    const pendingOrProcessing = st === 'pending' || st === 'processing';
    return pendingOrProcessing && !isShipping(o) && !isCanceled(o.status) && !isPaymentFailed(o);
  };

  // ——— PAGINATION DATA ———
  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return orders.slice(start, start + PER_PAGE);
  }, [orders, currentPage]);

  const from = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const to = Math.min(currentPage * PER_PAGE, total);

  const goPage = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    setPage(np);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeholderCount = Math.max(0, PER_PAGE - pagedOrders.length);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-4">
          Đơn hàng của tôi
        </h1>

        {loading ? (
          <div className="text-center text-gray-600">Đang tải...</div>
        ) : total === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            Chưa có đơn hàng nào.
          </div>
        ) : (
          <>
            <div className="space-y-4 min-h-0">
              {pagedOrders.map((o) => (
                <div
                  key={o.orderId}
                  className="bg-white rounded-lg shadow border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-800">
                      Đơn hàng #{o.orderId}
                    </div>
                    <div className="text-sm text-gray-500">
                      Ngày đặt:{' '}
                      {o.orderDate
                        ? new Date(o.orderDate).toLocaleString('vi-VN')
                        : 'N/A'}
                    </div>
                    <div className="text-sm">
                      Tổng tiền:{' '}
                      <span className="font-semibold">{money(o.totalAmount)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded border text-xs ${orderStatusChip(
                          o.status
                        )}`}
                        title={String(o.status)}
                      >
                        {orderStatusToVi(o.status)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-xs ${paymentStatusChip(
                          o.paymentStatus
                        )}`}
                        title={String(o.paymentStatus)}
                      >
                        {paymentStatusToVi(o.paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Xem chi tiết: luôn có */}
                    <button
                      onClick={() =>
                        navigate(`/customer-dashboard/orders/${o.orderId}`)
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </button>

                    {/* Khi payment lỗi: chỉ cho xem chi tiết */}
                    {!isPaymentFailed(o) && (
                      <>
                        {/* Hủy đơn (pending/processing, chưa shipping) */}
                        {canCancel(o) && (
                          <button
                            onClick={() => handleCancel(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded"
                          >
                            <XCircle size={16} />
                            Hủy đơn
                          </button>
                        )}

                        {/* Hoàn hàng/hoàn tiền – khi đã hoàn thành */}
                        {isCompleted(o.status) && (
                          <button
                            onClick={() => requestRefund(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded"
                          >
                            <RotateCcw size={16} />
                            Yêu cầu hoàn hàng/hoàn tiền
                          </button>
                        )}

                        {/* Đánh giá – khi đã hoàn thành */}
                        {isCompleted(o.status) && (
                          <button
                            onClick={() => openReview(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded"
                          >
                            <Star size={16} />
                            Đánh giá
                          </button>
                        )}

                        {/* Thanh toán – chỉ khi unpaid và chưa bị hủy */}
                        {canPay(o) && (
                          <button
                            onClick={() => payWithMoMo(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                          >
                            <Wallet size={16} />
                            Thanh toán
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* giữ layout cao như 5 thẻ để thanh phân trang không “nhảy” */}
              {Array.from({ length: placeholderCount }).map((_, i) => (
                <div
                  key={`ph-${i}`}
                  className="bg-white rounded-lg shadow border p-4 opacity-0 pointer-events-none select-none"
                  aria-hidden="true"
                >
                  placeholder
                </div>
              ))}
            </div>

            {/* phân trang */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-600">
                Hiển thị <b>{from}</b>–<b>{to}</b> trong <b>{total}</b> đơn hàng
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-50"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
                  const p = idx + 1;
                  const withinWindow =
                    p === 1 ||
                    p === totalPages ||
                    (p >= currentPage - 2 && p <= currentPage + 2);

                  if (!withinWindow) {
                    if (p === 2 && currentPage > 4)
                      return (
                        <span key={p} className="px-2">
                          …
                        </span>
                      );
                    if (p === totalPages - 1 && currentPage < totalPages - 3)
                      return (
                        <span key={p} className="px-2">
                          …
                        </span>
                      );
                    return null;
                  }

                  const active = p === currentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => goPage(p)}
                      className={`px-3 py-1.5 rounded border ${
                        active
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => goPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-50"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal đánh giá (dùng StarRating) */}
      {review.open && review.order && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">
              Đánh giá sản phẩm
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Điểm (1–5)
                  </label>
                  <StarRating
                    value={review.rating}
                    onChange={(n) => setReview((s) => ({ ...s, rating: n }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Ảnh (tùy chọn)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReview((s) => ({
                        ...s,
                        file: e.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Chọn sản phẩm trong đơn
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={review.orderItemId ?? undefined}
                  onChange={(e) =>
                    setReview((s) => ({
                      ...s,
                      orderItemId: Number(e.target.value),
                    }))
                  }
                >
                  {review.order.orderItems.map((it: OrderItem) => (
                    <option key={it.orderItemId} value={it.orderItemId}>
                      #{it.orderItemId} •{' '}
                      {it.accessoryId
                        ? `Phụ kiện ${it.accessoryId}`
                        : `Variant ${it.terrariumVariantId}`}
                      {' · '}SL {it.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Nhận xét
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={review.comment}
                  onChange={(e) =>
                    setReview((s) => ({ ...s, comment: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setReview((s) => ({ ...s, open: false }))}
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
