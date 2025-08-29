// src/pages/Customer/OrderDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wallet, XCircle, RotateCcw, Star, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

import { getOrderById, createMoMoPayment, cancelOrder } from '@/api/order';
import { requestRefund, uploadToCloudinary } from '@/api/refund';
import OrderItemsDisplay from '@/components/OrderItemsDisplay';

import type { Order } from '@/types/order';
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


// ---- Star rating (giữ) ----
const StarRating: React.FC<{ value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }> = ({ value, onChange, size = 'md' }) => {
  const starSize = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="inline-flex items-center">
      {[1,2,3,4,5].map(i => {
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

// ---- Modal HỦY ĐƠN ----
const CancelModal: React.FC<{
  open: boolean; order?: Order | null; onClose: () => void;
  onSubmit: (payload: { reason: string; note: string }) => Promise<void>;
}> = ({ open, order, onClose, onSubmit }) => {
  const [reason, setReason] = useState('Khách hàng yêu cầu hủy');
  const [note, setNote] = useState('');
  if (!open || !order) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
        <div className="px-5 py-3 border-b font-semibold">Hủy đơn #{order.orderId}</div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lý do hủy <span className="text-red-500">*</span></label>
            <textarea className="w-full border rounded px-3 py-2 min-h-[90px]" value={reason} onChange={(e)=>setReason(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ghi chú (tùy chọn)</label>
            <input className="w-full border rounded px-3 py-2" value={note} onChange={(e)=>setNote(e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">Được hủy khi đơn đang Chờ xử lý/Đang xử lý.</p>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">Đóng</button>
          <button
            disabled={!reason.trim()}
            onClick={() => onSubmit({ reason: reason.trim(), note: note.trim() })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded inline-flex items-center gap-2"
          >
            <XCircle size={16} /> Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Modal HOÀN TIỀN ----
const RefundModal: React.FC<{
  open: boolean; order?: Order | null; onClose: () => void;
  onSubmit: (payload: { reason: string; urls: string[] }) => Promise<void>;
}> = ({ open, order, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  if (!open || !order) return null;

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    if (f.length) setFiles((s) => [...s, ...f]);
  };
  const removeFile = (i: number) => setFiles((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!reason.trim()) { toast.error('Vui lòng nhập lý do.'); return; }
    try {
      setBusy(true);
      const urls: string[] = [];
      for (const f of files) {
        const url = await uploadToCloudinary(f);
        urls.push(url);
      }
      await onSubmit({ reason: reason.trim(), urls });
      setFiles([]); setReason('');
    } catch (e) {
      console.error(e); toast.error('Gửi yêu cầu hoàn thất bại.');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg">
        <div className="px-5 py-3 border-b font-semibold">Yêu cầu hoàn – Đơn #{order.orderId}</div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lý do <span className="text-red-500">*</span></label>
            <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Mô tả vấn đề..." />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Ảnh minh chứng</label>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded cursor-pointer">
              <ImageIcon size={16}/> Chọn ảnh
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles}/>
            </label>
            {files.length>0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((f,i)=>(
                  <div key={i} className="border rounded p-2 flex items-center justify-between text-xs">
                    <span className="truncate max-w-[150px]">{f.name}</span>
                    <button onClick={()=>removeFile(i)} className="text-red-600 hover:underline">bỏ</button>
                  </div>
                ))}
              </div>
            )}
            {busy && <div className="text-xs text-gray-500 mt-2">Đang tải ảnh lên Cloudinary...</div>}
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">Đóng</button>
          <button disabled={busy || !reason.trim()} onClick={submit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded inline-flex items-center gap-2">
            <CheckCircle2 size={16}/> Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // modals
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  // review modal (giữ logic cũ nếu có)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ orderItemId?: number; rating: number; comment: string; file?: File | null; }>({ rating: 5, comment: '' });

  const userId = Number(localStorage.getItem('userId') || 15);

  const load = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được chi tiết đơn.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

  const pay = async () => {
    if (!order) return;
    try {
      const { payUrl } = await createMoMoPayment({ orderId: order.orderId, orderInfo: `Order #${order.orderId}`, payAll: true });
      window.location.href = payUrl;
    } catch (e) { console.error(e); toast.error('Không tạo được giao dịch.'); }
  };

  const submitCancel = async ({ reason, note }: { reason: string; note: string }) => {
    if (!order) return;
    try {
      await cancelOrder(order.orderId, userId, { cancelReason: reason || 'Khách hàng yêu cầu hủy', additionalNotes: note || '' });
      toast.success('Đã gửi yêu cầu hủy đơn.');
      setCancelOpen(false);
      await load();
    } catch (e) { console.error(e); toast.error('Hủy đơn thất bại.'); }
  };

  const submitRefund = async ({ reason, urls }: { reason: string; urls: string[] }) => {
    if (!order) return;
    try {
      await requestRefund({ orderId: order.orderId, userId, reason, images: urls });
      toast.success('Đã gửi yêu cầu hoàn.');
      setRefundOpen(false);
      await load();
    } catch (e) { console.error(e); toast.error('Gửi yêu cầu hoàn thất bại.'); }
  };

  const header = useMemo(() => {
    const o = order;
    if (!o) return null;
    return (
      <div className="bg-white rounded-lg shadow border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <div className="font-semibold text-gray-800">Đơn hàng #{o.orderId}</div>
          <div className="text-sm text-gray-500">Ngày đặt: {o.orderDate ? new Date(o.orderDate).toLocaleString('vi-VN') : 'N/A'}</div>
          <div className="text-sm">Tổng tiền: <span className="font-semibold">{money(o.totalAmount)}</span></div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={orderStatusChip(o.status)}>{orderStatusToVi(o.status)}</span>
            {o.paymentStatus && <span className={paymentStatusChip(o.paymentStatus)}>{paymentStatusToVi(o.paymentStatus)}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate('/orders')} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded">Danh sách</button>
          {!isCancelled(o.status) && (String(o.status).toLowerCase().includes('pending') || String(o.status).toLowerCase().includes('processing')) && (
            <button onClick={() => setCancelOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded">
              <XCircle size={16} /> Hủy đơn
            </button>
          )}
          {isCompleted(o.status) && (
            <>
              <button onClick={() => setReviewOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                <Star size={16}/> Đánh giá
              </button>
              <button onClick={() => setRefundOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded">
                <RotateCcw size={16}/> Yêu cầu hoàn
              </button>
            </>
          )}
          {canPay(o) && (
            <button onClick={pay} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
              <Wallet size={16}/> Thanh toán
            </button>
          )}
        </div>
      </div>
    );
  }, [order, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-green-700">Chi tiết đơn hàng</h1>

        {loading ? (
          <div className="text-center text-gray-600">Đang tải...</div>
        ) : !order ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">Không tìm thấy đơn hàng.</div>
        ) : (
          <>
            {header}

            <div className="bg-white rounded-lg shadow border p-4">
              <OrderItemsDisplay order={order} />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CancelModal open={cancelOpen} order={order} onClose={() => setCancelOpen(false)} onSubmit={submitCancel} />
      <RefundModal open={refundOpen} order={order} onClose={() => setRefundOpen(false)} onSubmit={submitRefund} />

      {/* Modal đánh giá (giữ nếu bạn đang dùng) */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">Đánh giá sản phẩm</div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Điểm (1–5)</label>
                <StarRating value={5} onChange={()=>{}} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nhận xét</label>
                <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" placeholder="Cảm nhận của bạn..." />
              </div>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <button onClick={()=>setReviewOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">Đóng</button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Gửi đánh giá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
