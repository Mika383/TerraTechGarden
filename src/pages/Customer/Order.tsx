// src/pages/Customer/Order.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Eye, Star, Wallet, XCircle, ChevronLeft, ChevronRight, RotateCcw, Image as ImageIcon, CheckCircle2
} from 'lucide-react';

import { createMoMoPayment, getOrdersByUser, cancelOrder } from '@/api/order';
import { requestRefund, uploadToCloudinary } from '@/api/refund';
import type { Order, OrderItem } from '@/types/order';

import {
  orderStatusToVi,
  paymentStatusToVi,
  orderStatusChip,
  paymentStatusChip,
  isCompleted,
  isUnpaid,
  isCancelled,
  canPay,
  money,
} from '@/utils/orderStatus';


// ===================== StarRating (giữ nguyên) =====================
const StarRating: React.FC<{ value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }> = ({ value, onChange, size = 'md' }) => {
  const starSize = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="inline-flex items-center">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= value;
        return (
          <button key={i} onClick={() => onChange(i)} className="focus:outline-none" title={`${i} sao`}>
            <span className={`${starSize} ${active ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">{value}/5</span>
    </div>
  );
};

// ===================== Modal: HỦY ĐƠN =====================
type CancelModalState = {
  open: boolean;
  order?: Order | null;
  reason: string;
  note: string;
  loading: boolean;
};

const CancelOrderModal: React.FC<{
  state: CancelModalState;
  onClose: () => void;
  onSubmit: (payload: { reason: string; note: string }) => Promise<void>;
}> = ({ state, onClose, onSubmit }) => {
  if (!state.open || !state.order) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
        <div className="px-5 py-3 border-b font-semibold">Hủy đơn hàng #{state.order.orderId}</div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lý do hủy <span className="text-red-500">*</span></label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[90px]"
              placeholder="Ví dụ: Khách yêu cầu hủy đơn, đặt nhầm, ..."
              value={state.reason}
              onChange={(e) => state.order && (state.reason = e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ghi chú bổ sung (tùy chọn)</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Thêm ghi chú cho shop xử lý"
              value={state.note}
              onChange={(e) => state.order && (state.note = e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Được hủy khi đơn đang <b>Chờ xử lý/Đang xử lý</b>. Tiền (nếu đã thanh toán) hoàn về ví theo chính sách.
          </p>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">Đóng</button>
          <button
            disabled={state.loading || !state.reason.trim()}
            onClick={() => onSubmit({ reason: state.reason.trim(), note: state.note.trim() })}
            className="px-4 py-2 bg-red-600 disabled:opacity-60 hover:bg-red-700 text-white rounded inline-flex items-center gap-2"
          >
            <XCircle size={16} /> Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================== Modal: HOÀN TIỀN =====================
type RefundModalState = {
  open: boolean;
  order?: Order | null;
  reason: string;
  files: File[];
  uploading: boolean;
  submitting: boolean;
};

const RefundModal: React.FC<{
  state: RefundModalState;
  setState: React.Dispatch<React.SetStateAction<RefundModalState>>;
  onClose: () => void;
  onSubmit: (payload: { reason: string; urls: string[] }) => Promise<void>;
}> = ({ state, setState, onClose, onSubmit }) => {
  if (!state.open || !state.order) return null;

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    if (f.length) setState((s) => ({ ...s, files: [...s.files, ...f] }));
  };

  const removeFile = (i: number) => setState((s) => ({ ...s, files: s.files.filter((_, idx) => idx !== i) }));

  // bên trong RefundModal
const doSubmit = async () => {
  if (!state.reason.trim()) { toast.error('Vui lòng nhập lý do hoàn tiền.'); return; }

  try {
    setState(s => ({ ...s, submitting: true, uploading: true }));
    const urls: string[] = [];
    // Upload tất cả file đang chọn
    for (const f of state.files) {
      const u = await uploadToCloudinary(f);
      urls.push(u);
    }
    setState(s => ({ ...s, uploading: false }));

    // Gọi API chỉ với URL Cloudinary
    await onSubmit({ reason: state.reason.trim(), urls });

    toast.success('Đã gửi yêu cầu hoàn.');
    setState(s => ({ ...s, open: false, order: null, reason: '', files: [] }));
  } catch (e: any) {
    console.error(e);
    toast.error('Gửi yêu cầu hoàn tiền thất bại.');
  } finally {
    setState(s => ({ ...s, submitting: false, uploading: false }));
  }
};


  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg">
        <div className="px-5 py-3 border-b font-semibold">Yêu cầu hoàn hàng/hoàn tiền – Đơn #{state.order.orderId}</div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lý do <span className="text-red-500">*</span></label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              placeholder="Mô tả vấn đề: hàng lỗi, trầy xước, thiếu phụ kiện..."
              value={state.reason}
              onChange={(e) => setState((s) => ({ ...s, reason: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Ảnh minh chứng (có thể chọn nhiều)</label>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded cursor-pointer">
              <ImageIcon size={16} />
              Chọn ảnh
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
            </label>

            {state.files.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {state.files.map((f, i) => (
                  <div key={i} className="border rounded p-2 flex items-center justify-between text-xs">
                    <span className="truncate max-w-[150px]">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-red-600 hover:underline">bỏ</button>
                  </div>
                ))}
              </div>
            )}
            {state.uploading && <div className="text-xs text-gray-500 mt-2">Đang tải ảnh lên Cloudinary...</div>}
          </div>

          <p className="text-xs text-gray-500">Yêu cầu sẽ được duyệt bởi quản trị viên. Bạn sẽ nhận thông báo khi có cập nhật.</p>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">Đóng</button>
          <button
            disabled={state.submitting || !state.reason.trim()}
            onClick={doSubmit}
            className="px-4 py-2 bg-green-600 disabled:opacity-60 hover:bg-green-700 text-white rounded inline-flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};

// ===================== Trang Order =====================
const Order: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);

  // modal đánh giá (giữ lại)
  const [review, setReview] = useState<{
    open: boolean;
    order?: Order | null;
    orderItemId?: number | null;
    rating: number;
    comment: string;
    file?: File | null;
  }>({ open: false, rating: 5, comment: '' });

  // modal hủy đơn
  const [cancelState, setCancelState] = useState<CancelModalState>({
    open: false,
    order: null,
    reason: '',
    note: '',
    loading: false,
  });

  // modal hoàn tiền
  const [refundState, setRefundState] = useState<RefundModalState>({
    open: false,
    order: null,
    reason: '',
    files: [],
    uploading: false,
    submitting: false,
  });

  const userId = Number(localStorage.getItem('userId') || 15);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getOrdersByUser(userId);
      setOrders(data || []);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const total = orders.length;
  const pageSize = 5;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const pagedOrders = useMemo(() => orders.slice((page - 1) * pageSize, page * pageSize), [orders, page, pageSize]);
  const placeholderCount = Math.max(0, pageSize - pagedOrders.length);

  const payWithMoMo = async (o: Order) => {
    try {
      const { payUrl } = await createMoMoPayment({
        orderId: o.orderId,
        orderInfo: `Order #${o.orderId}`,
        payAll: true,
      });
      window.location.href = payUrl;
    } catch (err) {
      console.error(err);
      toast.error('Không tạo được giao dịch MoMo.');
    }
  };

  // ===== HỦY ĐƠN =====
  const openCancel = (o: Order) =>
    setCancelState({ open: true, order: o, reason: 'Khách hàng yêu cầu hủy', note: '', loading: false });
  const submitCancel = async ({ reason, note }: { reason: string; note: string }) => {
    if (!cancelState.order) return;
    try {
      setCancelState((s) => ({ ...s, loading: true }));
      await cancelOrder(cancelState.order.orderId, userId, {
        cancelReason: reason || 'Khách hàng yêu cầu hủy',
        additionalNotes: note || '',
      });
      toast.success(`Đã gửi yêu cầu hủy đơn #${cancelState.order.orderId}`);
      setCancelState((s) => ({ ...s, open: false, order: null, reason: '', note: '', loading: false }));
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Hủy đơn thất bại.');
      setCancelState((s) => ({ ...s, loading: false }));
    }
  };

  // ===== HOÀN TIỀN =====
  const openRefund = (o: Order) =>
    setRefundState({ open: true, order: o, reason: '', files: [], uploading: false, submitting: false });

  const submitRefund = async ({ reason, urls }: { reason: string; urls: string[] }) => {
    if (!refundState.order) return;
    try {
      await requestRefund({
        orderId: refundState.order.orderId,
        userId,
        reason,
        images: urls,
      });
      toast.success('Đã gửi yêu cầu hoàn hàng/hoàn tiền.');
      setRefundState((s) => ({ ...s, open: false, order: null, reason: '', files: [] }));
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Gửi yêu cầu hoàn tiền thất bại.');
    }
  };

  const openReview = (o: Order) => {
    setReview({ open: true, order: o, orderItemId: undefined, rating: 5, comment: '', file: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-green-700">Đơn hàng của tôi</h1>

        <div className="bg-white rounded-lg shadow border p-4">
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
                        Ngày đặt: {o.orderDate ? new Date(o.orderDate).toLocaleString('vi-VN') : 'N/A'}
                      </div>
                      <div className="text-sm">Tổng tiền: <span className="font-semibold">{money(o.totalAmount)}</span></div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={orderStatusChip(o.status)}>{orderStatusToVi(o.status)}</span>
                        {o.paymentStatus && <span className={paymentStatusChip(o.paymentStatus)}>{paymentStatusToVi(o.paymentStatus)}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => navigate(`/orders/${o.orderId}`)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                        <Eye size={16} /> Xem chi tiết
                      </button>

                      {/* Hủy đơn – khi đang chờ xử lý/đang xử lý và chưa giao */}
                      {!isCancelled(o.status) && (String(o.status).toLowerCase().includes('pending') || String(o.status).toLowerCase().includes('processing')) && (
                        <button onClick={() => openCancel(o)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded">
                          <XCircle size={16} /> Hủy đơn
                        </button>
                      )}

                      {/* Yêu cầu hoàn tiền – chỉ khi đơn đã hoàn thành */}
                      {isCompleted(o.status) && (
                        <>
                          <button onClick={() => openReview(o)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            <Star size={16} /> Đánh giá
                          </button>
                          <button onClick={() => openRefund(o)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded">
                            <RotateCcw size={16} /> Yêu cầu hoàn
                          </button>
                        </>
                      )}

                      {/* Thanh toán – chỉ khi unpaid và chưa bị hủy */}
                      {canPay(o) && (
                        <button onClick={() => payWithMoMo(o)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded">
                          <Wallet size={16} /> Thanh toán
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* giữ layout cao như 5 thẻ để thanh phân trang không “nhảy” */}
                {Array.from({ length: placeholderCount }).map((_, i) => (
                  <div key={`ph-${i}`} className="h-[1px]" />
                ))}
              </div>

              <div className="flex justify-center items-center gap-2 mt-4">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 rounded bg-gray-100 disabled:opacity-50">
                  <ChevronLeft />
                </button>
                <span className="text-sm">Trang {page}/{maxPage}</span>
                <button disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))} className="px-3 py-2 rounded bg-gray-100 disabled:opacity-50">
                  <ChevronRight />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal hủy đơn */}
      <CancelOrderModal
        state={cancelState}
        onClose={() => setCancelState((s) => ({ ...s, open: false }))}
        onSubmit={submitCancel}
      />

      {/* Modal hoàn tiền */}
      <RefundModal
        state={refundState}
        setState={setRefundState}
        onClose={() => setRefundState((s) => ({ ...s, open: false }))}
        onSubmit={submitRefund}
      />
    </div>
  );
};

export default Order;
