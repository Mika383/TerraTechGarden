// src/pages/MembershipSuccess.tsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

const MembershipSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc query params từ fallback URL:
  // /membership-success/payment-success?status=success&type=membership
  const { isSuccess, isMembership } = useMemo(() => {
    const sp = new URLSearchParams(location.search || "");
    const status = (sp.get("status") || "").toLowerCase();       // success | fail | canceled | ...
    const type = (sp.get("type") || "").toLowerCase();           // membership (kỳ vọng)
    return {
      isSuccess: status === "success",
      isMembership: type === "membership",
    };
  }, [location.search]);

  // Giữ nguyên layout; chỉ đổi icon + text theo trạng thái
  const Icon = isSuccess ? CheckCircle : XCircle;
  const iconClass = isSuccess ? "text-green-500" : "text-red-500";
  const titleText = isSuccess
    ? "Thanh toán thành công!"
    : "Thanh toán không thành công";
  const descText = isSuccess
    ? "Cảm ơn bạn đã mua gói thành viên. Quyền lợi của bạn sẽ được kích hoạt ngay lập tức."
    : isMembership
    ? "Giao dịch gói thành viên của bạn đã thất bại hoặc bị hủy. Vui lòng thử lại."
    : "Giao dịch không hợp lệ hoặc thiếu thông tin. Vui lòng thử lại.";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <Icon className={`mx-auto w-16 h-16 mb-4 ${iconClass}`} />
        <h1 className="text-2xl font-bold text-green-700 mb-2">
          {titleText}
        </h1>

        <p className="text-gray-600 mb-6">
          {descText}
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Về trang chủ
          </button>

          {/* Nút thử lại chỉ hiển thị khi fail */}
          {!isSuccess && (
            <button
              onClick={() => navigate("/customer-dashboard/membership")}
              className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Thử lại thanh toán
            </button>
          )}
        </div>

        {/* Gợi ý nhỏ: trường hợp query type không phải membership */}
        {!isMembership && (
          <div className="mt-4 text-xs text-gray-400">
            (Lưu ý: type không phải <b>membership</b> trong đường dẫn.)
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipSuccess;
