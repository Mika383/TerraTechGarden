
// src/pages/Customer/PaymentSuccess.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getOrderById } from "@/api/order";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface PaymentParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHash?: string;
}

const formatPayDate = (dateStr?: string) => {
  if (!dateStr || dateStr.length !== 14) return dateStr || "N/A";
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  const hh = dateStr.slice(8, 10);
  const mm = dateStr.slice(10, 12);
  const ss = dateStr.slice(12, 14);
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
};

// Component hiển thị thông tin thanh toán
const PaymentInfo: React.FC<{ params: PaymentParams }> = ({ params }) => {
  const isSuccess = params.vnp_ResponseCode === "00";
  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border ${isSuccess ? "border-green-200" : "border-red-200"}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Thông tin thanh toán</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Số tiền:</strong> {(Number(params.vnp_Amount || 0) / 100).toLocaleString("vi-VN")} VND</p>
          <p><strong>Ngân hàng:</strong> {params.vnp_BankCode || "N/A"}</p>
          <p><strong>Mã giao dịch:</strong> {params.vnp_TransactionNo || "N/A"}</p>
          <p><strong>Loại thẻ:</strong> {params.vnp_CardType || "N/A"}</p>
        </div>
        <div>
          <p><strong>Thông tin đơn hàng:</strong> {params.vnp_OrderInfo || "N/A"}</p>
          <p><strong>Ngày thanh toán:</strong> {formatPayDate(params.vnp_PayDate)}</p>
          <p><strong>Mã phản hồi:</strong> {params.vnp_ResponseCode || "N/A"}</p>
          <p>
            <strong>Trạng thái:</strong>
            <span className={`ml-2 font-semibold ${isSuccess ? "text-green-600" : "text-red-500"}`}>
              {isSuccess ? "Thành công" : "Thất bại"}
            </span>
          </p>
          <p><strong>Mã đơn hàng:</strong> {params.vnp_TxnRef || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

// Component hiển thị chi tiết đơn hàng
const OrderDetails: React.FC<{ orderData: any }> = ({ orderData }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Chi tiết đơn hàng</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p><strong>Mã đơn:</strong> {orderData.orderId}</p>
        <p><strong>Tổng tiền:</strong> {orderData.totalAmount?.toLocaleString("vi-VN")} VND</p>
      </div>
      <div>
        <p><strong>Trạng thái đơn:</strong> {orderData.status || "N/A"}</p>
        <p><strong>Ngày đặt:</strong> {orderData.orderDate ? new Date(orderData.orderDate).toLocaleString("vi-VN") : "N/A"}</p>
      </div>
    </div>
    <div className="mt-4">
      <p className="font-semibold">Sản phẩm:</p>
      <ul className="ml-6 list-disc space-y-2">
        {orderData.orderItems?.map((item: any) => (
          <li key={item.orderItemId} className="text-gray-700">
            ID sản phẩm: {item.terrariumVariantId || item.accessoryId}, Số lượng: {item.quantity}, Đơn giá: {item.unitPrice?.toLocaleString("vi-VN")} VND
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useState<PaymentParams>({});
  const [orderData, setOrderData] = useState<any>(null);
  const [orderError, setOrderError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const searchParams = new URLSearchParams(location.search);
    const data: PaymentParams = {};
    searchParams.forEach((value, key) => {
      (data as any)[key] = value;
    });

    if (import.meta.env.DEV && searchParams.size === 0) {
      Object.assign(data, {
        vnp_Amount: "46036600",
        vnp_BankCode: "NCB",
        vnp_BankTranNo: "VNP15118521",
        vnp_CardType: "ATM",
        vnp_OrderInfo: "Thanh toan don hang #15",
        vnp_PayDate: "20250806102157",
        vnp_ResponseCode: "00",
        vnp_TmnCode: "61VOOD5J",
        vnp_TransactionNo: "15118521",
        vnp_TransactionStatus: "00",
        vnp_TxnRef: "15",
        vnp_SecureHash: "demo-hash-123",
      });
    }

    setParams(data);

    if (data.vnp_TxnRef && data.vnp_ResponseCode === "00") {
      getOrderById(Number(data.vnp_TxnRef))
        .then((res) => {
          if (res && res.orderId) setOrderData(res);
          else {
            setOrderError(true);
            toast.error("Không tìm thấy mã đơn hàng!");
          }
        })
        .catch(() => {
          setOrderError(true);
          toast.error("Lỗi khi lấy thông tin đơn hàng!");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [location.search]);

  const isSuccess = params.vnp_ResponseCode === "00";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl border-4 border-gray-300">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {isSuccess ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Thanh toán {isSuccess ? "thành công!" : "thất bại"}
          </h1>
          <p className="mt-2 text-gray-600">
            {isSuccess
              ? "Cảm ơn bạn đã mua hàng tại TerraTechGarden."
              : "Giao dịch không thành công. Vui lòng liên hệ hỗ trợ hoặc thử lại."}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            <PaymentInfo params={params} />
            {orderData && <OrderDetails orderData={orderData} />}
            {orderError && (
              <p className="text-center text-red-500 font-semibold">
                Không tìm thấy thông tin đơn hàng!
              </p>
            )}
          </>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate("/")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate("/order")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Xem lịch sử đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
