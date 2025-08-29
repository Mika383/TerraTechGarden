import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined } from '@ant-design/icons';

// Dùng env nếu có, fallback sang domain thật của bạn
const BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || 'https://terarium.shop/api';

const currency = (v: number) => (v || 0).toLocaleString('vi-VN') + ' VND';

// Header Authorization (nếu BE yêu cầu)
const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// Robust parse: BE có thể trả plain number (57000) hoặc JSON
async function parseBalance(res: Response): Promise<number> {
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const data = await res.json();
      // chấp nhận nhiều format: 57000 | { data: 57000 } | { balance: 57000 }
      if (typeof data === 'number') return data;
      if (typeof data?.data === 'number') return data.data;
      if (typeof data?.balance === 'number') return data.balance;
      // nếu BE chơi kiểu string
      const maybe = Number(String(data?.data ?? data?.balance ?? '').replace(/[^\d.-]/g, ''));
      if (!Number.isNaN(maybe)) return maybe;
      throw new Error('Invalid JSON wallet response');
    }
    // text/plain
    const text = await res.text();
    const num = Number(text.replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(num)) return num;
    throw new Error('Invalid text wallet response');
  } catch {
    throw new Error('Không đọc được số dư ví.');
  }
}

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useMemo(() => Number(localStorage.getItem('userId') || 0), []);

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!userId) {
      setErr('Bạn chưa đăng nhập.');
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      const url = `${BASE_URL}/Wallet/balance?userId=${userId}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) {
        setErr('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      if (!res.ok) {
        throw new Error(`Không lấy được số dư (HTTP ${res.status})`);
      }
      const value = await parseBalance(res);
      setBalance(value);
    } catch (e: any) {
      setErr(e?.message || 'Không lấy được số dư.');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Spacer nếu có header fixed cao ~64px */}
      <div className="h-[64px]" aria-hidden />

      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-700">Ví của tôi</h1>
              <p className="text-slate-600">Xem số dư ví và thực hiện các thao tác nhanh.</p>
            </div>
            <button
              onClick={fetchBalance}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-60"
              title="Làm mới số dư"
            >
              <ReloadOutlined />
              Làm mới
            </button>
          </div>

          {/* Error */}
          {err && (
            <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
              {err}
            </div>
          )}

          {/* Balance Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-slate-500 font-medium">Số dư hiện tại</p>
                <div className="mt-1 text-3xl sm:text-4xl font-extrabold text-emerald-700">
                  {loading ? 'Đang tải...' : currency(balance ?? 0)}
                </div>
                <p className="text-slate-500 mt-1 text-sm">
                  ID người dùng: <b>{userId || 'N/A'}</b>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/membership')}
                  className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow"
                >
                  Mua Membership
                </button>
                <button
                  onClick={() => navigate('/customer-dashboard/orders')}
                  className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Xem đơn mua
                </button>
              </div>
            </div>
          </div>

          {/* Actions (định hướng) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-5 bg-white rounded-xl border shadow-sm">
              <h3 className="font-semibold text-slate-800">Nạp tiền ví</h3>
              <p className="text-slate-500 text-sm mt-1">
                Tạm thời hỗ trợ thanh toán khi đặt hàng hoặc mua membership.
              </p>
              <button
                onClick={() => navigate('/membership')}
                className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Nạp thông qua Membership
              </button>
            </div>

            <div className="p-5 bg-white rounded-xl border shadow-sm">
              <h3 className="font-semibold text-slate-800">Sử dụng ví</h3>
              <p className="text-slate-500 text-sm mt-1">
                Chọn “Sử dụng số dư ví” ở trang Thanh toán để trừ trực tiếp vào đơn hàng.
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="mt-3 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Đi tới Thanh toán
              </button>
            </div>
          </div>

          {/* Placeholder lịch sử (nếu sau này BE có endpoint) */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch</h2>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                  Đang cập nhật
                </span>
              </div>
              <p className="text-slate-500">
                Hiện chưa có API lịch sử giao dịch. Khi có endpoint, phần này sẽ hiển thị chi tiết nạp/chi ví.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletPage;
