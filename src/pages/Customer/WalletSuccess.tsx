// src/pages/Customer/WalletSuccess.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, CircleX, Wallet, Home } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ---- Helpers ----
const money = (v?: number) =>
  (Math.round((v ?? 0)) || 0).toLocaleString('vi-VN') + ' VND';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Nếu project đã có getUserIdFromToken thì import; không thì dùng localStorage fallback
const getUserId = (): number | null => {
  try {
    const v = localStorage.getItem('userId');
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

type StatusKey = 'success' | 'fail' | 'cancel' | 'unknown';

const WalletSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const status = (sp.get('status') || '').toLowerCase() as StatusKey;
  const normalizedStatus: StatusKey = ['success', 'fail', 'cancel'].includes(status)
    ? (status as StatusKey)
    : 'unknown';

  const amount = useMemo(() => Number(sp.get('amount') || 0), [sp]);

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const userId = getUserId();

  useEffect(() => {
    // Với fail/cancel vẫn có thể tải số dư để người dùng kiểm chứng
    const fetchBalance = async () => {
      if (!userId) {
        setErr('Không tìm thấy người dùng. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(
          `${BASE_URL}/Wallet/balance?userId=${userId}`,
          { headers: { ...getAuthHeaders(), accept: 'application/json' } }
        );
        if (!res.ok) throw new Error(`Lỗi tải số dư (${res.status})`);
        // API trả trực tiếp số (vd: 1397010.9)
        const text = await res.text();
        const num = Number(text);
        setBalance(Number.isFinite(num) ? num : 0);
      } catch (e: any) {
        setErr(e?.message || 'Không thể tải số dư ví.');
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [userId]);

  // UI theo trạng thái
  const iconMap = {
    success: CheckCircle,
    fail: XCircle,
    cancel: CircleX,
    unknown: XCircle,
  } as const;
  const colorMap = {
    success: { icon: 'text-green-500', title: 'text-green-700' },
    fail: { icon: 'text-red-500', title: 'text-red-700' },
    cancel: { icon: 'text-yellow-500', title: 'text-yellow-700' },
    unknown: { icon: 'text-gray-500', title: 'text-gray-700' },
  } as const;
  const titleMap = {
    success: 'Nạp tiền vào ví thành công!',
    fail: 'Thanh toán thất bại',
    cancel: 'Thanh toán đã bị huỷ',
    unknown: 'Trạng thái không xác định',
  } as const;

  const Icon = iconMap[normalizedStatus];
  const colors = colorMap[normalizedStatus];
  const title = titleMap[normalizedStatus];

  const subtitle =
    normalizedStatus === 'success'
      ? amount > 0
        ? `Bạn vừa nạp ${money(amount)} vào ví.`
        : 'Yêu cầu nạp tiền đã được xử lý.'
      : normalizedStatus === 'fail'
      ? 'Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
      : normalizedStatus === 'cancel'
      ? 'Bạn đã huỷ giao dịch. Không có khoản tiền nào được trừ.'
      : 'Vui lòng kiểm tra lại đường dẫn hoặc liên hệ hỗ trợ.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 max-w-lg w-full text-center">
        <Icon className={`mx-auto w-16 h-16 mb-4 ${colors.icon}`} />
        <h1 className={`text-2xl font-bold mb-2 ${colors.title}`}>{title}</h1>
        <p className="text-gray-600 mb-4">{subtitle}</p>

        {/* Số dư ví */}
        <div className="bg-gray-50 border rounded-md px-4 py-3 text-left mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5" />
            <span className="font-semibold">Số dư ví hiện tại</span>
          </div>
          {loading ? (
            <p className="text-gray-500">Đang tải số dư…</p>
          ) : err ? (
            <p className="text-red-600">{err}</p>
          ) : (
            <p className="text-xl font-bold">{money(balance ?? 0)}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </button>
          <button
            onClick={() => navigate('/customer-dashboard/wallet')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition"
          >
            <Wallet className="w-4 h-4" />
            Tới ví của tôi
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Nếu số dư chưa cập nhật, vui lòng tải lại trang sau vài giây.
        </p>
      </div>
    </div>
  );
};

export default WalletSuccess;
