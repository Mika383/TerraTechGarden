// src/pages/MembershipFail.tsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { XCircle, AlertCircle, RefreshCw } from "lucide-react";

const MembershipFail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc query params từ URL:
  // /membership-fail?status=fail&type=membership&error=user_cancelled&message=...
  const { status, isMembership, errorCode, errorMessage, amount, transactionId } = useMemo(() => {
    const sp = new URLSearchParams(location.search || "");
    
    const status = (sp.get("status") || "").toLowerCase();           // fail | error | cancelled | timeout | ...
    const type = (sp.get("type") || "").toLowerCase();               // membership (kỳ vọng)
    const errorCode = sp.get("error") || sp.get("error_code") || sp.get("resultCode") || "";
    const errorMessage = sp.get("message") || sp.get("error_message") || sp.get("description") || "";
    const amount = sp.get("amount") || "";
    const transactionId = sp.get("transId") || sp.get("transaction_id") || sp.get("txnRef") || "";
    
    return {
      status,
      isMembership: type === "membership",
      errorCode,
      errorMessage: errorMessage ? decodeURIComponent(errorMessage) : "",
      amount: amount ? Number(amount) : 0,
      transactionId,
    };
  }, [location.search]);

  // Xác định loại lỗi và thông báo tương ứng
  const getErrorInfo = () => {
    const baseTitle = "Thanh toán gói thành viên thất bại";
    
    switch (status) {
      case "cancelled":
      case "canceled":
        return {
          title: "Thanh toán bị hủy",
          description: "Bạn đã hủy giao dịch mua gói thành viên. Bạn có thể thử lại bất cứ lúc nào.",
          icon: AlertCircle,
          iconClass: "text-yellow-500"
        };
      
      case "timeout":
        return {
          title: "Thanh toán hết thời gian",
          description: "Giao dịch đã hết thời gian chờ. Vui lòng thử lại với phiên thanh toán mới.",
          icon: AlertCircle,
          iconClass: "text-orange-500"
        };
      
      case "error":
      case "fail":
      case "failed":
      default:
        return {
          title: baseTitle,
          description: isMembership 
            ? "Giao dịch mua gói thành viên không thành công. Vui lòng kiểm tra lại thông tin và thử lại."
            : "Giao dịch không hợp lệ hoặc thiếu thông tin. Vui lòng thử lại.",
          icon: XCircle,
          iconClass: "text-red-500"
        };
    }
  };

  const errorInfo = getErrorInfo();

  // Format tiền VND
  const formatMoney = (amount: number) => {
    return amount > 0 ? amount.toLocaleString("vi-VN") + " VND" : "";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <errorInfo.icon className={`mx-auto w-16 h-16 mb-4 ${errorInfo.iconClass}`} />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {errorInfo.title}
        </h1>

        <p className="text-gray-600 mb-4">
          {errorInfo.description}
        </p>

        {/* Hiển thị thông tin lỗi chi tiết nếu có */}
        {(errorMessage || errorCode || amount > 0 || transactionId) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Chi tiết lỗi
            </h3>
            
            {errorMessage && (
              <p className="text-sm text-red-700 mb-1">
                <strong>Lý do:</strong> {errorMessage}
              </p>
            )}
            
            {errorCode && (
              <p className="text-sm text-red-700 mb-1">
                <strong>Mã lỗi:</strong> {errorCode}
              </p>
            )}
            
            {amount > 0 && (
              <p className="text-sm text-red-700 mb-1">
                <strong>Số tiền:</strong> {formatMoney(amount)}
              </p>
            )}
            
            {transactionId && (
              <p className="text-sm text-red-700 mb-1">
                <strong>Mã giao dịch:</strong> {transactionId}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {/* Nút thử lại - ưu tiên cao nhất */}
          <button
            onClick={() => navigate("/customer-dashboard/membership")}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại thanh toán
          </button>

          {/* Nút về trang chủ */}
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Về trang chủ
          </button>

          {/* Nút liên hệ hỗ trợ (nếu cần) */}
          {(status === "error" || errorCode) && (
            <button
              onClick={() => navigate("/contact")}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Liên hệ hỗ trợ
            </button>
          )}
        </div>

        {/* Gợi ý nhỏ: trường hợp query type không phải membership */}
        {!isMembership && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              <strong>Lưu ý:</strong> Loại giao dịch không phải <code className="bg-yellow-100 px-1 rounded">membership</code>. 
              Có thể bạn đang truy cập sai đường dẫn.
            </p>
          </div>
        )}

        {/* DEV info */}
        {import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              [DEV] Debug info
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify({ 
                status, 
                isMembership, 
                errorCode, 
                errorMessage, 
                amount, 
                transactionId,
                fullParams: Object.fromEntries(new URLSearchParams(location.search))
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default MembershipFail;