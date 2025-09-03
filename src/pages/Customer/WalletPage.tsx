import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined, PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

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

interface MoMoResponse {
  payUrl: string;
  qrImageBase64: string;
}

interface Transaction {
  transactionId: number;
  amount: number;
  type: string;
  createdDate: string;
  orderId: number | null;
  runningBalance: number;
  description: string;
}

interface TransactionHistoryResponse {
  status: number;
  message: string;
  data: {
    walletId: number;
    userId: number;
    currentBalance: number;
    walletType: string;
    fromDate: string;
    toDate: string;
    transactions: Transaction[];
    statistics: {
      totalIncome: number;
      totalExpense: number;
      netChange: number;
      totalTransactions: number;
      highestTransaction: number;
      lowestTransaction: number;
    };
  };
}

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useMemo(() => Number(localStorage.getItem('userId') || 0), []);

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  // States cho modal nạp tiền
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [topupDescription, setTopupDescription] = useState<string>('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);

  // States cho lịch sử giao dịch
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryResponse['data'] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // States cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const fetchTransactionHistory = async () => {
    if (!userId) {
      setHistoryError('Bạn chưa đăng nhập.');
      return;
    }
    
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      
      const url = `${BASE_URL}/Wallet/balance-history/${userId}`;
      const res = await fetch(url, { headers: authHeaders() });
      
      if (res.status === 401) {
        setHistoryError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Không lấy được lịch sử giao dịch (HTTP ${res.status})`);
      }
      
      const data: TransactionHistoryResponse = await res.json();
      setTransactionHistory(data.data);
      setCurrentPage(1); // Reset về trang đầu khi load lại data
    } catch (e: any) {
      setHistoryError(e?.message || 'Không lấy được lịch sử giao dịch.');
      setTransactionHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!userId) {
      setTopupError('Bạn chưa đăng nhập.');
      return;
    }

    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      setTopupError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    try {
      setTopupLoading(true);
      setTopupError(null);
      
      const payload = {
        userId: userId,
        amount: amount,
        description: topupDescription || `Nạp tiền vào ví - ${amount.toLocaleString('vi-VN')} VND`
      };

      const response = await fetch(`${BASE_URL}/Payment/momo/wallet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        setTopupError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Lỗi tạo thanh toán (HTTP ${response.status})`);
      }

      const data: MoMoResponse = await response.json();
      
      if (data.payUrl) {
        // Mở link thanh toán MoMo trong tab mới
        window.open(data.payUrl, '_blank');
        
        // Đóng modal và reset form
        setShowTopupModal(false);
        setTopupAmount('');
        setTopupDescription('');
        
        // Thông báo cho người dùng
        alert('Đã mở trang thanh toán MoMo. Vui lòng hoàn tất thanh toán và quay lại để làm mới số dư.');
      } else {
        throw new Error('Không nhận được link thanh toán từ MoMo.');
      }

    } catch (e: any) {
      setTopupError(e?.message || 'Có lỗi xảy ra khi tạo thanh toán.');
    } finally {
      setTopupLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchBalance(), fetchTransactionHistory()]);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit':
        return 'text-green-600 bg-green-50';
      case 'Payment':
        return 'text-red-600 bg-red-50';
      case 'Refund':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'Deposit':
        return 'Nạp tiền';
      case 'Payment':
        return 'Thanh toán';
      case 'Refund':
        return 'Hoàn tiền';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Tính toán phân trang
  const paginatedTransactions = useMemo(() => {
    if (!transactionHistory?.transactions) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transactionHistory.transactions.slice(startIndex, endIndex);
  }, [transactionHistory?.transactions, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!transactionHistory?.transactions) return 0;
    return Math.ceil(transactionHistory.transactions.length / itemsPerPage);
  }, [transactionHistory?.transactions, itemsPerPage]);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    fetchBalance();
    fetchTransactionHistory();
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
              onClick={refreshAll}
              disabled={loading || historyLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-60"
              title="Làm mới số dư và lịch sử"
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
                  onClick={() => setShowTopupModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow"
                >
                  <PlusOutlined />
                  Nạp tiền
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

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-5 bg-white rounded-xl border shadow-sm">
              <h3 className="font-semibold text-slate-800">Nạp tiền ví</h3>
              <p className="text-slate-500 text-sm mt-1">
                Nạp tiền vào ví thông qua MoMo để thanh toán đơn hàng dễ dàng hơn.
              </p>
              <button
                onClick={() => setShowTopupModal(true)}
                className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Nạp tiền ngay
              </button>
            </div>

            <div className="p-5 bg-white rounded-xl border shadow-sm">
              <h3 className="font-semibold text-slate-800">Sử dụng ví</h3>
              <p className="text-slate-500 text-sm mt-1">
                Chọn "Sử dụng số dư ví" ở trang Thanh toán để trừ trực tiếp vào đơn hàng.
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="mt-3 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Đi tới Thanh toán
              </button>
            </div>
          </div>

          {/* Thống kê nếu có */}
          {transactionHistory?.statistics && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h4 className="text-sm font-medium text-slate-600">Tổng thu nhập</h4>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {currency(transactionHistory.statistics.totalIncome)}
                </p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h4 className="text-sm font-medium text-slate-600">Tổng chi tiêu</h4>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {currency(Math.abs(transactionHistory.statistics.totalExpense))}
                </p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h4 className="text-sm font-medium text-slate-600">Tổng giao dịch</h4>
                <p className="text-2xl font-bold text-slate-700 mt-1">
                  {transactionHistory.statistics.totalTransactions}
                </p>
              </div>
            </div>
          )}

          {/* Lịch sử giao dịch */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch</h2>
                {historyLoading && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                    Đang tải...
                  </span>
                )}
              </div>

              {historyError && (
                <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm mb-4">
                  {historyError}
                </div>
              )}

              {!historyLoading && !historyError && paginatedTransactions.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  Chưa có giao dịch nào.
                </p>
              )}

              {paginatedTransactions.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-2 font-medium text-slate-600">Ngày</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-600">Loại</th>
                          <th className="text-right py-3 px-2 font-medium text-slate-600">Số tiền</th>
                          <th className="text-right py-3 px-2 font-medium text-slate-600">Số dư</th>
                          <th className="text-left py-3 px-2 font-medium text-slate-600">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTransactions.map((transaction) => (
                          <tr key={transaction.transactionId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-2 text-sm text-slate-600">
                              {formatDate(transaction.createdDate)}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                                {getTransactionTypeLabel(transaction.type)}
                              </span>
                            </td>
                            <td className={`py-3 px-2 text-right font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.amount >= 0 ? '+' : ''}{currency(transaction.amount)}
                            </td>
                            <td className="py-3 px-2 text-right text-sm text-slate-600">
                              {currency(transaction.runningBalance)}
                            </td>
                            <td className="py-3 px-2 text-sm text-slate-600 max-w-xs truncate">
                              {transaction.description}
                              {transaction.orderId && (
                                <span className="ml-2 text-xs text-slate-400">
                                  (Đơn #{transaction.orderId})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Phân trang */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-slate-600">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, transactionHistory?.transactions.length || 0)} trong {transactionHistory?.transactions.length || 0} giao dịch
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LeftOutlined />
                          Trước
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 text-sm rounded-lg ${
                                  currentPage === pageNum
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                          <RightOutlined />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal nạp tiền */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Nạp tiền vào ví</h3>
              <button
                onClick={() => {
                  setShowTopupModal(false);
                  setTopupError(null);
                  setTopupAmount('');
                  setTopupDescription('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {topupError && (
              <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                {topupError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số tiền nạp (VND)
                </label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="1000"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chọn nhanh
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTopupAmount(amount.toString())}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
                    >
                      {currency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  value={topupDescription}
                  onChange={(e) => setTopupDescription(e.target.value)}
                  placeholder="Ghi chú cho giao dịch..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowTopupModal(false);
                    setTopupError(null);
                    setTopupAmount('');
                    setTopupDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
                  disabled={topupLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleTopup}
                  disabled={topupLoading || !topupAmount}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60"
                >
                  {topupLoading ? 'Đang xử lý...' : 'Nạp tiền'}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Bạn sẽ được chuyển đến trang MoMo để hoàn tất thanh toán. Sau khi thanh toán thành công, 
                hãy quay lại và nhấn "Làm mới" để cập nhật số dư.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletPage;