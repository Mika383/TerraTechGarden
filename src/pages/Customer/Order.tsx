// src/pages/Customer/Order.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, Star, Wallet, XCircle, ChevronLeft, ChevronRight, RotateCcw, RefreshCw } from 'lucide-react';

import { createMoMoPayment, getOrdersByUser, cancelOrder, getOrderById } from '@/api';
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
import { requestRefund as apiRequestRefund } from '@/api/refund';

// ===== Cloudinary config (bạn đã cung cấp) =====
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dsp6pjeey/upload';
const CLOUDINARY_UPLOAD_PRESET = 'TerraTech';

const money = (v?: number) => (v ?? 0).toLocaleString('vi-VN') + ' VND';
const PER_PAGE = 5;

/** Star rating (★) */
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
            <span className={`${starSize} ${active ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
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

// ===== NEW: modal state for Cancel & Refund =====
type CancelState = {
  open: boolean;
  submitting: boolean;
  order?: Order | null;
  reason: string;
  notes: string;
};

type RefundState = {
  open: boolean;
  submitting: boolean;
  order?: Order | null;
  reason: string;
  files: File[];            // chọn nhiều file
  uploadedUrls: string[];   // URL trả về từ Cloudinary
};

// ===== helper: upload 1 file lên Cloudinary, trả secure_url =====
async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload Cloudinary thất bại');
  const data = await res.json();
  // ưu tiên secure_url nếu có
  return data.secure_url || data.url;
}

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // NEW: modal states
  const [cancelM, setCancelM] = useState<CancelState>({
    open: false,
    submitting: false,
    order: null,
    reason: 'Khách hàng yêu cầu hủy',
    notes: '',
  });
  const [refundM, setRefundM] = useState<RefundState>({
    open: false,
    submitting: false,
    order: null,
    reason: '',
    files: [],
    uploadedUrls: [],
  });

  const userId = useMemo(() => Number(localStorage.getItem('userId') || 0), []);

  const load = async (showLoading = true) => {
    if (!userId) {
      toast.info('Bạn cần đăng nhập để xem đơn hàng.');
      return;
    }
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);

      const data = await getOrdersByUser(userId);
      const sorted = [...(Array.isArray(data) ? data : [])].sort((a, b) => {
        const ta = new Date(a.orderDate ?? '').getTime();
        const tb = new Date(b.orderDate ?? '').getTime();
        return tb - ta;
      });
      setOrders(sorted);
      if (showLoading) setPage(1);
    } catch {
      toast.error('Không tải được danh sách đơn.');
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Setup real-time polling
  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => {
      load(false);
    }, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Manual refresh
  const handleManualRefresh = () => {
    load(false);
  };

  // ——— ACTIONS ———
  const payWithMoMo = async (o: Order) => {
    try {
      // lấy đơn mới nhất
      const fresh = await getOrderById(o.orderId);
      if (!fresh) {
        toast.error('Không lấy được thông tin đơn hàng mới nhất.');
        return;
      }
      const totalAmount = Math.max(0, Number(fresh.totalAmount ?? 0));
      const deposit = Math.max(0, Number(fresh.deposit ?? 0));
      const isDepositOrder = deposit > 0;
      const amountToPay = isDepositOrder ? deposit : totalAmount;
      if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
        toast.info('Không có số tiền cần thanh toán.');
        return;
      }
      const voucherId = (fresh as any)?.voucherId ?? 0;

      const { payUrl } = await createMoMoPayment({
        orderId: fresh.orderId,
        orderInfo: `Thanh toán đơn #${fresh.orderId}`,
        finalAmount: amountToPay,
        voucherId,
        payAll: !isDepositOrder,
      } as any);

      window.location.href = payUrl;
    } catch (err) {
      console.error(err);
      toast.error('Không tạo được giao dịch MoMo.');
    }
  };

  // ==== OPEN modals ====
  const openCancelModal = (o: Order) => {
    setCancelM({
      open: true,
      submitting: false,
      order: o,
      reason: 'Khách hàng yêu cầu hủy',
      notes: '',
    });
  };

  const openRefundModal = (o: Order) => {
    if (!isCompleted(o.status)) {
      toast.info('Chỉ có thể yêu cầu hoàn hàng/hoàn tiền cho đơn đã hoàn thành.');
      return;
    }
    setRefundM({
      open: true,
      submitting: false,
      order: o,
      reason: '',
      files: [],
      uploadedUrls: [],
    });
  };

  // ==== SUBMIT modals ====
  const submitCancel = async () => {
    if (!cancelM.order) return;
    const reason = (cancelM.reason || '').trim();
    try {
      setCancelM(s => ({ ...s, submitting: true }));
      await cancelOrder(cancelM.order.orderId, userId, {
        cancelReason: reason || 'Khách hàng yêu cầu hủy',
        additionalNotes: cancelM.notes || '',
      });
      toast.success(`Đã gửi yêu cầu hủy đơn #${cancelM.order.orderId}`);
      setCancelM({ open: false, submitting: false, order: null, reason: 'Khách hàng yêu cầu hủy', notes: '' });
      await load(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Hủy đơn thất bại.');
      setCancelM(s => ({ ...s, submitting: false }));
    }
  };

  const submitRefund = async () => {
    if (!refundM.order) return;
    const reason = (refundM.reason || '').trim();
    if (!reason) {
      toast.info('Vui lòng nhập lý do hoàn hàng/hoàn tiền.');
      return;
    }
    try {
      setRefundM(s => ({ ...s, submitting: true }));

      // 1) Upload ảnh (nếu chọn)
      let urls: string[] = [];
      if (refundM.files.length > 0) {
        const results = await Promise.allSettled(refundM.files.map(f => uploadToCloudinary(f)));
        urls = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<string>).value);

        if (urls.length === 0) {
          toast.error('Upload ảnh lên Cloudinary thất bại.');
          setRefundM(s => ({ ...s, submitting: false }));
          return;
        }
      }

      // 2) Gửi yêu cầu refund + đính kèm URLs
      const res = await apiRequestRefund({
        orderId: refundM.order.orderId,
        userId,
        reason,
        images: urls, // gửi URL cho BE
      });

      const msg = res?.message || 'Yêu cầu hoàn tiền đã được gửi thành công!';
      toast.success(msg);
      setRefundM({ open: false, submitting: false, order: null, reason: '', files: [], uploadedUrls: [] });
      await load(false);
    } catch (err: any) {
      console.error('[Refund] error', err?.response?.status, err?.response?.data || err);
      const msg = err?.response?.data?.message || err?.response?.data || 'Gửi yêu cầu hoàn tiền thất bại.';
      toast.error(String(msg));
      setRefundM(s => ({ ...s, submitting: false }));
    }
  };

  const openReview = async (o: Order) => {
    try {
      const full = await getOrderById(o.orderId);
      const items = full?.orderItems ?? [];
      if (items.length === 0) {
        toast.info('Đơn hàng không có sản phẩm để đánh giá.');
        return;
      }
      const firstItemId = items[0]?.orderItemId ?? null;
      setReview({
        open: true,
        order: full as any,
        orderItemId: firstItemId,
        rating: 5,
        comment: '',
        file: null,
      });
    } catch (err) {
      console.error(err);
      toast.error('Không tải được chi tiết đơn hàng.');
    }
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
        comment: review.comment || ''
      });
      const fid: number =
        (fb as any)?.feedbackId ??
        (fb as any)?.data?.feedbackId ??
        (fb as any)?.id ??
        (fb as any)?.data?.id;

      if (fid && review.file) await uploadFeedbackImage(fid, review.file);
      toast.success('Đã gửi đánh giá. Cảm ơn bạn!');
      setReview((s) => ({ ...s, open: false }));
    } catch (e) {
      console.error(e);
      toast.error('Gửi đánh giá thất bại.');
    }
  };

  // —— Helpers (hiển thị nút) ——
  const isShipping = (o: Order) => String(o.status ?? '').toLowerCase() === 'shipping';
  const isPaymentFailed = (o: Order) => String(o.paymentStatus ?? '').toLowerCase() === 'failed';
  const canRate = (o: Order) => isCompleted(o.status);
  const isCanceled = (s: string | number) => {
    const v = String(s).toLowerCase();
    return v === 'cancel' || v === 'cancle' || v === 'canceled' || v === 'cancelled' || v === 'rejected';
  };
  const canPay = (o: Order) => isUnpaid(o.paymentStatus ?? undefined) && !isCanceled(o.status);
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Đơn hàng của tôi</h1>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Real-time indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {isRefreshing ? 'Đang cập nhật...' : 'Tự động cập nhật mỗi 10 giây'}
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Đang tải...</div>
        ) : total === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">Chưa có đơn hàng nào.</div>
        ) : (
          <>
            <div className="space-y-4 min-h-0">
              {pagedOrders.map((o) => (
                <div key={o.orderId} className="bg-white rounded-lg shadow border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-800">Đơn hàng #{o.orderId}</div>
                    <div className="text-sm text-gray-500">
                      Ngày đặt {o.orderDate ? new Date(o.orderDate).toLocaleString('vi-VN') : 'N/A'}
                    </div>
                    <div className="text-sm">
                      Tổng tiền <span className="font-semibold">{money(o.totalAmount)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded border text-xs ${orderStatusChip(o.status)}`} title={String(o.status)}>
                        {orderStatusToVi(o.status)}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-xs ${paymentStatusChip(o.paymentStatus ?? undefined)}`} title={String(o.paymentStatus ?? '')}>
                        {paymentStatusToVi(o.paymentStatus ?? undefined)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/customer-dashboard/orders/${o.orderId}`)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </button>

                    {!isPaymentFailed(o) && (
                      <>
                        {canCancel(o) && (
                          <button
                            onClick={() => openCancelModal(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded"
                          >
                            <XCircle size={16} />
                            Hủy đơn
                          </button>
                        )}

                        {isCompleted(o.status) && (
                          <button
                            onClick={() => openRefundModal(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded"
                          >
                            <RotateCcw size={16} />
                            Yêu cầu hoàn hàng/hoàn tiền
                          </button>
                        )}

                        {isCompleted(o.status) && (
                          <button
                            onClick={() => openReview(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded"
                          >
                            <Star size={16} />
                            Đánh giá
                          </button>
                        )}

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

              {Array.from({ length: Math.max(0, PER_PAGE - pagedOrders.length) }).map((_, i) => (
                <div key={`ph-${i}`} className="bg-white rounded-lg shadow border p-4 opacity-0 pointer-events-none select-none" aria-hidden="true">
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
                <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-50" aria-label="Trang trước">
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
                  const p = idx + 1;
                  const withinWindow = p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2);
                  if (!withinWindow) {
                    if (p === 2 && currentPage > 4) return <span key={p} className="px-2">…</span>;
                    if (p === totalPages - 1 && currentPage < totalPages - 3) return <span key={p} className="px-2">…</span>;
                    return null;
                  }
                  const active = p === currentPage;
                  return (
                    <button key={p} onClick={() => goPage(p)} className={`px-3 py-1.5 rounded border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  );
                })}

                <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-50" aria-label="Trang sau">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal đánh giá */}
      {review.open && review.order && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">Đánh giá sản phẩm</div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Điểm (1–5)</label>
                  <StarRating value={review.rating} onChange={(n) => setReview((s) => ({ ...s, rating: n }))} />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ảnh (tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReview((s) => ({ ...s, file: e.target.files?.[0] ?? null }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Chọn sản phẩm trong đơn</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={review.orderItemId ?? ''}
                  onChange={(e) => setReview((s) => ({ ...s, orderItemId: e.target.value ? Number(e.target.value) : null }))}
                >
                  {(review.order?.orderItems ?? []).map((it: OrderItem) => (
                    <option key={it.orderItemId} value={it.orderItemId}>
                      #{it.orderItemId} • {it.accessoryId ? `Phụ kiện ${it.accessoryId}` : `Variant ${it.terrariumVariantId}`} · SL {it.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Nhận xét</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={review.comment}
                  onChange={(e) => setReview((s) => ({ ...s, comment: e.target.value }))}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setReview((s) => ({ ...s, open: false }))} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                Đóng
              </button>
              <button onClick={submitReview} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal HỦY ĐƠN */}
      {cancelM.open && cancelM.order && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">Hủy đơn #{cancelM.order.orderId}</div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Lý do hủy</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={cancelM.reason}
                  onChange={(e) => setCancelM(s => ({ ...s, reason: e.target.value }))}
                  placeholder="Ví dụ: Đặt nhầm / Đổi ý / ..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ghi chú (tuỳ chọn)</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={cancelM.notes}
                  onChange={(e) => setCancelM(s => ({ ...s, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setCancelM(s => ({ ...s, open: false }))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                disabled={cancelM.submitting}
              >
                Đóng
              </button>
              <button
                onClick={submitCancel}
                className={`px-4 py-2 rounded text-white ${cancelM.submitting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                disabled={cancelM.submitting}
              >
                {cancelM.submitting ? 'Đang gửi...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal HOÀN HÀNG/HOÀN TIỀN + Cloudinary */}
      {refundM.open && refundM.order && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">
              Yêu cầu hoàn hàng/hoàn tiền • Đơn #{refundM.order.orderId}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Lý do</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Mô tả lý do hoàn hàng/hoàn tiền…"
                  value={refundM.reason}
                  onChange={(e) => setRefundM(s => ({ ...s, reason: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Ảnh minh chứng (có thể chọn nhiều)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setRefundM(s => ({ ...s, files }));
                  }}
                />
                {refundM.files.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {refundM.files.map((f, i) => (
                      <div key={i} className="border rounded p-2 text-xs text-gray-700">
                        <div className="truncate">{f.name}</div>
                        <div className="text-gray-500">{(f.size / 1024).toFixed(0)} KB</div>
                      </div>
                    ))}
                  </div>
                )}
                {refundM.uploadedUrls.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-1">Đã upload:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {refundM.uploadedUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                          <img src={url} alt={`proof-${i}`} className="w-full h-24 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setRefundM(s => ({ ...s, open: false }))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                disabled={refundM.submitting}
              >
                Đóng
              </button>

              <button
                onClick={async () => {
                  // Tải ảnh lên trước để hiển thị preview URL đã upload (UX)
                  try {
                    setRefundM(s => ({ ...s, submitting: true }));
                    let urls: string[] = [];
                    if (refundM.files.length > 0) {
                      const results = await Promise.allSettled(refundM.files.map(f => uploadToCloudinary(f)));
                      urls = results
                        .filter(r => r.status === 'fulfilled')
                        .map(r => (r as PromiseFulfilledResult<string>).value);
                      setRefundM(s => ({ ...s, uploadedUrls: urls }));
                    }
                    // Sau đó submitRefund (gửi URL cho BE)
                    await submitRefund();
                  } catch (e) {
                    // submitRefund đã xử lý toast; ở đây đảm bảo state
                    setRefundM(s => ({ ...s, submitting: false }));
                  }
                }}
                className={`px-4 py-2 rounded text-white ${refundM.submitting ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                disabled={refundM.submitting}
              >
                {refundM.submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
