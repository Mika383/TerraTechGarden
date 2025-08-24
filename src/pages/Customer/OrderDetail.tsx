import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wallet, XCircle, RotateCcw, Star } from 'lucide-react';

import { getOrderById, createMoMoPayment } from '@/api/order';
import { getAccessoryById } from '@/api/accessory';
import { getTerrariumById, getTerrariumVariantById } from '@/api/terrarium';

import type { Order, OrderItem } from '@/types/order';
import {
  orderStatusToVi,
  paymentStatusToVi,
  orderStatusChip,
  paymentStatusChip,
  isCompleted,
  isUnpaid,
  isPending,
  isProcessing,
} from '@/utils/orderStatus';

import { createFeedback, uploadFeedbackImage } from '@/api/feedback';

const FALLBACK_IMG = '/TerraTechLogo.png';
const money = (v?: number) => (v ?? 0).toLocaleString('vi-VN') + ' VND';

/** Chọn sao 1–5 */
const StarRating: React.FC<{
  value: number;
  onChange: (n: number) => void;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, onChange, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const starSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
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

type EnrichedItem = {
  orderItemId: number;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  accessoryId?: number | null;
  terrariumVariantId?: number | null;
  terrariumId?: number | null;
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // modal đánh giá
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    orderItemId?: number;
    rating: number;
    comment: string;
    file?: File | null;
  }>({ rating: 5, comment: '' });

  const load = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      if (!data) {
        toast.error('Không tìm thấy đơn hàng.');
        return;
      }
      setOrder(data);

      const enriched: EnrichedItem[] = await Promise.all(
        (data.orderItems || []).map(async (it: OrderItem) => {
          let name = 'Sản phẩm';
          let image = FALLBACK_IMG;
          let terrariumId: number | null = null;

          if (it.terrariumVariantId) {
            const variant = await getTerrariumVariantById(Number(it.terrariumVariantId));
            name = variant?.variantName || name;
            image = (variant?.urlImage as string) || image;
            terrariumId = variant?.terrariumId ?? null;

            if (!variant?.urlImage && terrariumId) {
              const t = await getTerrariumById(terrariumId);
              image = t?.terrariumImages?.[0]?.imageUrl || image;
            }
          } else if (it.accessoryId) {
            const acc = await getAccessoryById(Number(it.accessoryId));
            name = acc?.name || name;
            image = acc?.accessoryImages?.[0]?.imageUrl || image;
          }

          return {
            orderItemId: it.orderItemId,
            name,
            image: image || FALLBACK_IMG,
            quantity: it.quantity ?? 0,
            unitPrice: it.unitPrice ?? 0,
            totalPrice: it.totalPrice ?? (it.quantity ?? 0) * (it.unitPrice ?? 0),
            accessoryId: it.accessoryId ?? null,
            terrariumVariantId: it.terrariumVariantId ?? null,
            terrariumId,
          };
        })
      );

      setItems(enriched);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // được hủy khi: Pending | Processing và paymentStatus = Unpaid (UI-only)
  const canCancel = !!(
    order &&
    (isPending(order.status) || isProcessing(order.status)) &&
    isUnpaid(order.paymentStatus)
  );

  const payNow = async () => {
    if (!order) return;
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

  const reorder = () => {
    if (!items.length) return;
    const payload = items.map((it) => ({
      id: `oid_${it.orderItemId}`,
      name: it.name,
      price: it.unitPrice,
      image: it.image || FALLBACK_IMG,
      quantity: it.quantity,
      selected: true,
      accessoryId: it.accessoryId ?? undefined,
      variantId: it.terrariumVariantId ?? undefined,
    }));
    localStorage.setItem('checkoutItems', JSON.stringify(payload));
    toast.success('Đã đưa sản phẩm vào thanh toán.');
    navigate('/checkout');
  };

  const openReview = (it: EnrichedItem) => {
    setReviewTarget({
      orderItemId: it.orderItemId,
      rating: 5,
      comment: '',
      file: null,
    });
    setReviewOpen(true);
  };

  const submitReview = async () => {
    try {
      if (!reviewTarget.orderItemId) return;

      // 1) Tạo feedback trước
      const fb = await createFeedback({
        orderItemId: reviewTarget.orderItemId,
        rating: reviewTarget.rating,
        comment: reviewTarget.comment || '',
      });
      const fid: number =
        fb?.feedbackId ?? fb?.data?.feedbackId ?? fb?.id ?? fb?.data?.id;

      // 2) Chờ 1 nhịp rồi mới upload ảnh (tránh 500 do BE chưa kịp tạo id)
      if (fid && reviewTarget.file) {
        await new Promise((r) => setTimeout(r, 400));
        await uploadFeedbackImage(fid, reviewTarget.file);
      }

      toast.success('Đã gửi đánh giá!');
      setReviewOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Gửi đánh giá thất bại.');
    }
  };

  const header = useMemo(() => {
    if (!order) return null;
    return (
      <div className="bg-white rounded-lg shadow p-4 border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-800">Đơn hàng #{order.orderId}</div>
            <div className="text-sm text-gray-500">
              Ngày đặt: {order.orderDate ? new Date(order.orderDate).toLocaleString('vi-VN') : 'N/A'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2 py-0.5 rounded border text-xs ${orderStatusChip(order.status)}`}
              title={String(order.status)}
            >
              {orderStatusToVi(order.status)}
            </span>
            <span
              className={`px-2 py-0.5 rounded border text-xs ${paymentStatusChip(order.paymentStatus)}`}
              title={String(order.paymentStatus)}
            >
              {paymentStatusToVi(order.paymentStatus)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
          <div>
            <div>Tổng tiền: <b>{money(order.totalAmount)}</b></div>
            <div>Đặt cọc: <b>{money(order.deposit)}</b></div>
          </div>
          <div>
            <div>Mã giao dịch: {order.transactionId || 'N/A'}</div>
            <div>Phương thức: {order.paymentMethod || 'MoMo'}</div>
          </div>
          <div className="flex gap-2 sm:justify-end">
            <button
              onClick={() => toast.info('Hủy đơn: BE chưa cung cấp API. Sẽ bổ sung sau.')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded border ${
                canCancel
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
              disabled={!canCancel}
              title="Chỉ hủy khi Pending/Processing và chưa thanh toán"
            >
              <XCircle size={16} />
              Hủy đơn
            </button>

            {isUnpaid(order.paymentStatus) && (
              <button
                onClick={payNow}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                <Wallet size={16} />
                Thanh toán
              </button>
            )}

            <button
              onClick={reorder}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded"
            >
              <RotateCcw size={16} />
              Đặt lại
            </button>
          </div>
        </div>
      </div>
    );
  }, [order]); // eslint-disable-line

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
              <div className="font-semibold mb-3">Sản phẩm</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="p-2 border w-10">#</th>
                      <th className="p-2 border">Sản phẩm</th>
                      <th className="p-2 border w-16">SL</th>
                      <th className="p-2 border w-36">Đơn giá</th>
                      <th className="p-2 border w-36">Thành tiền</th>
                      <th className="p-2 border w-40">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={it.orderItemId} className="align-top">
                        <td className="p-2 border">{idx + 1}</td>
                        <td className="p-2 border">
                          <div className="flex items-center gap-3">
                            <img
                              src={it.image || FALLBACK_IMG}
                              alt={it.name}
                              className="w-12 h-12 object-cover rounded border bg-white"
                              onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                            />
                            <button
                              className="text-left hover:underline text-green-700"
                              onClick={() =>
                                it.accessoryId
                                  ? navigate(`/accessory/${it.accessoryId}`)
                                  : it.terrariumId
                                  ? navigate(`/terrarium/${it.terrariumId}`)
                                  : undefined
                              }
                            >
                              {it.name}
                            </button>
                          </div>
                        </td>
                        <td className="p-2 border">{it.quantity}</td>
                        <td className="p-2 border">{money(it.unitPrice)}</td>
                        <td className="p-2 border">{money(it.totalPrice)}</td>
                        <td className="p-2 border">
                          {order && isCompleted(order.status) && (
                            <button
                              onClick={() => openReview(it)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded"
                            >
                              <Star size={14} />
                              Đánh giá
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal đánh giá – dùng StarRating & chờ 1 nhịp trước khi upload ảnh */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-5 py-3 border-b font-semibold">Đánh giá sản phẩm</div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Điểm (1–5)</label>
                  <StarRating
                    value={reviewTarget.rating}
                    onChange={(n) => setReviewTarget((s) => ({ ...s, rating: n }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ảnh (tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReviewTarget((s) => ({ ...s, file: e.target.files?.[0] ?? null }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Nhận xét</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={reviewTarget.comment}
                  onChange={(e) => setReviewTarget((s) => ({ ...s, comment: e.target.value }))}
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

export default OrderDetail;
