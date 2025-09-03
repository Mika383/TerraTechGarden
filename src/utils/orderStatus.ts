// src/utils/orderStatus.ts
// Map trạng thái → tiếng Việt + màu chip (Tailwind classes)

export const VI_ORDER_STATUS: Record<string, string> = {
  failed: 'Thất bại',
  cancle: 'Đã hủy',        // (BE có thể trả sai chính tả)
  cancel: 'Đã hủy',
  canceled: 'Đã hủy',
  cancelled: 'Đã hủy',
  rejected: 'Bị từ chối', // ✅ rõ nghĩa bạn yêu cầu
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang vận chuyển',
  completed: 'Hoàn thành',
  requestrefund: 'Yêu cầu hoàn tiền',
  refuning: 'Đang hoàn tiền', // (nếu BE trả "refuning")
  refunded: 'Đã hoàn tiền',
};

export const VI_PAYMENT_STATUS: Record<string, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  failed: 'Thanh toán lỗi',
};

export const orderStatusToVi = (s: string | number): string => {
  const key = String(s ?? '').toLowerCase();
  return VI_ORDER_STATUS[key] || String(s ?? 'N/A');
};

export const paymentStatusToVi = (s?: string | number): string => {
  if (s == null) return 'N/A';
  const key = String(s).toLowerCase();
  return VI_PAYMENT_STATUS[key] || String(s);
};

export const orderStatusChip = (s: string | number): string => {
  switch (String(s).toLowerCase()) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'processing':
    case 'confirmed':
    case 'shipping':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'requestrefund':
    case 'refuning':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'failed':
    case 'cancle':
    case 'cancel':
    case 'canceled':
    case 'cancelled':
    case 'rejected': // ✅ coi như huỷ bởi hệ thống/manager
      return 'bg-red-50 text-red-700 border-red-200';
    case 'refunded':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export const paymentStatusChip = (s?: string | number): string => {
  switch (String(s ?? '').toLowerCase()) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'unpaid':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

// ===== Helpers nhanh theo ngữ nghĩa =====
export const isCompleted = (s: string | number) =>
  String(s).toLowerCase() === 'completed';

export const isPending = (s: string | number) =>
  String(s).toLowerCase() === 'pending';

export const isProcessing = (s: string | number) =>
  String(s).toLowerCase() === 'processing';

export const isRejected = (s: string | number) =>
  String(s).toLowerCase() === 'rejected'; // ✅ bị hủy bởi hệ thống/manager khi còn pending/processing

export const isUnpaid = (s?: string | number) =>
  String(s ?? '').toLowerCase() === 'unpaid';

// 👉 Các trạng thái coi như "đã huỷ" → không cho thanh toán/cập nhật
export const isCancelled = (s: string | number) => {
  const key = String(s).toLowerCase();
  return ['cancel', 'cancle', 'canceled', 'cancelled', 'failed', 'rejected'].includes(key);
};

// Cho phép thanh toán nếu: chưa thanh toán & chưa bị huỷ/rejected/failed
export const canPay = (o: { status: string | number; paymentStatus?: string | number }) => {
  return isUnpaid(o.paymentStatus) && !isCancelled(o.status);
};

// Định dạng tiền VND
export const money = (n: number | undefined | null) =>
  Number(n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
