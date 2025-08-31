// src/pages/Customer/PaymentFail.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, XCircle, AlertCircle } from "lucide-react";
import { getOrderById } from "@/api/order";
import OrderItemsDisplay from "@/components/OrderItemsDisplay";

const FALLBACK_IMG = "/TerraTechLogo.png";

// ---- Payment query params (dynamic) ----
interface PaymentParams {
  [key: string]: string | undefined;
  // Các field phổ biến nhưng có thể không có
  orderId?: string;      
  status?: string;       
  amount?: string;       
  transId?: string;      
  payType?: string;      
  bank?: string;         
  message?: string;      
  orderInfo?: string;    
  resultCode?: string;   
  responseTime?: string; 
}

// ---- Helpers ----
const money = (n?: number) => (n ?? 0).toLocaleString("vi-VN") + " VND";

const formatMoMoTime = (timestamp?: string) => {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(Number(timestamp));
    return date.toLocaleString("vi-VN");
  } catch {
    return timestamp;
  }
};

const safeDecodeURIComponent = (str?: string) => {
  if (!str) return "N/A";
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

const isPaymentFailure = (p: PaymentParams) => {
  // Kiểm tra nhiều điều kiện có thể để xác định thất bại
  return (
    p.resultCode && p.resultCode !== "0" && p.resultCode !== "00" ||
    p.status?.toLowerCase() === "fail" ||
    p.status?.toLowerCase() === "failed" ||
    p.status?.toLowerCase() === "error" ||
    p.success === "false" ||
    p.success === "0"
  );
};

/** Lấy orderId từ nhiều field có thể có */
const getOrderIdFromParams = (params: PaymentParams): string => {
  return (
    params.orderId || 
    params.order_id || 
    params.orderID ||
    params.order || 
    params.oid ||
    params.ref ||
    params.reference ||
    ""
  );
};

/** Lấy transaction ID từ nhiều field có thể có */
const getTransactionId = (params: PaymentParams): string => {
  return (
    params.transId ||
    params.transactionId ||
    params.transaction_id ||
    params.txnRef ||
    params.vnp_TransactionNo ||
    params.trans_id ||
    ""
  );
};

/** Lấy amount từ nhiều field có thể có */
const getAmount = (params: PaymentParams): number => {
  const amountStr = (
    params.amount ||
    params.vnp_Amount ||
    params.total ||
    params.totalAmount ||
    params.value ||
    "0"
  );
  
  // MoMo trả về số nguyên (VND), VNPay có thể trả về x100
  let amount = Number(amountStr);
  if (amount > 1000000000) { // Nếu > 1 tỷ thì có thể đã nhân 100
    amount = amount / 100;
  }
  return amount;
};

/** Lấy message từ nhiều field có thể có */
const getPaymentMessage = (params: PaymentParams): string => {
  return safeDecodeURIComponent(
    params.message ||
    params.vnp_OrderInfo ||
    params.orderInfo ||
    params.description ||
    params.desc ||
    params.error_description ||
    ""
  ) || "N/A";
};

/** Lấy payment method từ nhiều field có thể có */
const getPaymentMethod = (params: PaymentParams): string => {
  return (
    params.payType ||
    params.payment_method ||
    params.vnp_BankCode ||
    params.gateway ||
    "N/A"
  );
};

/** Lấy thời gian từ nhiều field có thể có */
const getPaymentTime = (params: PaymentParams): string => {
  const timeStr = (
    params.responseTime ||
    params.vnp_PayDate ||
    params.created_at ||
    params.timestamp ||
    ""
  );
  
  if (!timeStr) return "N/A";
  
  try {
    // Nếu là timestamp (số)
    if (/^\d+$/.test(timeStr)) {
      const timestamp = timeStr.length === 10 ? Number(timeStr) * 1000 : Number(timeStr);
      return new Date(timestamp).toLocaleString("vi-VN");
    }
    
    // Nếu là định dạng VNPay (yyyyMMddHHmmss)
    if (/^\d{14}$/.test(timeStr)) {
      const year = timeStr.substring(0, 4);
      const month = timeStr.substring(4, 6);
      const day = timeStr.substring(6, 8);
      const hour = timeStr.substring(8, 10);
      const minute = timeStr.substring(10, 12);
      const second = timeStr.substring(12, 14);
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString("vi-VN");
    }
    
    // Thử parse trực tiếp
    return new Date(timeStr).toLocaleString("vi-VN");
  } catch {
    return timeStr;
  }
};

/** Trích số đầu tiên từ chuỗi (vd "1294-a5d2..." -> 1294). Trả về null nếu không có số. */
const extractNumericId = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const m = String(raw).match(/\d+/);
  return m ? Number(m[0]) : null;
};

// ---- UI blocks ----
const PaymentInfoDisplay: React.FC<{ params: PaymentParams }> = ({ params }) => {
  const failed = isPaymentFailure(params);
  const amount = getAmount(params);
  const rawOrderId = getOrderIdFromParams(params);
  const displayOrderId = rawOrderId || (extractNumericId(rawOrderId) ?? "N/A");
  const transactionId = getTransactionId(params);
  const paymentMethod = getPaymentMethod(params);
  const paymentTime = getPaymentTime(params);
  const paymentMessage = getPaymentMessage(params);
  
  // Xác định gateway
  let gateway = "Unknown";
  if (params.vnp_TransactionNo || params.vnp_Amount) {
    gateway = "VNPay";
  } else if (params.transId || params.payType !== undefined) {
    gateway = "MoMo";
  } else if (params.gateway) {
    gateway = params.gateway;
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border ${failed ? "border-red-200" : "border-green-200"}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Thông tin thanh toán</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Cổng thanh toán:</strong> {gateway}</p>
          <p><strong>Số tiền:</strong> {money(amount)}</p>
          <p><strong>Mã giao dịch:</strong> {transactionId || "N/A"}</p>
          <p><strong>Phương thức:</strong> {paymentMethod}</p>
          <p><strong>Ngân hàng:</strong> {params.bank || params.vnp_BankCode || gateway}</p>
        </div>

        <div>
          <p><strong>Thông tin đơn hàng:</strong> {paymentMessage}</p>
          <p><strong>Thời gian:</strong> {paymentTime}</p>
          {params.resultCode && <p><strong>Mã kết quả:</strong> {params.resultCode}</p>}
          {params.vnp_ResponseCode && <p><strong>Mã phản hồi:</strong> {params.vnp_ResponseCode}</p>}
          <p>
            <strong>Trạng thái:</strong>
            <span className={`ml-2 font-semibold ${failed ? "text-red-500" : "text-green-600"}`}>
              {failed ? "Thất bại" : "Thành công"}
            </span>
          </p>
          <p><strong>Mã đơn hàng:</strong> {String(displayOrderId)}</p>
        </div>
      </div>

      {/* Hiển thị tất cả tham số nhận được (cho debug) */}
      {import.meta.env.DEV && Object.keys(params).length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            [DEV] Tất cả tham số nhận được ({Object.keys(params).length})
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(params, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

const OrderDetails: React.FC<{ order: any }> = ({ order }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Chi tiết đơn hàng</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <p><strong>Mã đơn:</strong> {order.orderId}</p>
        <p><strong>Tổng tiền:</strong> {money(order.totalAmount)}</p>
        <p><strong>Đặt cọc:</strong> {money(order.deposit)}</p>
      </div>
      <div>
        <p><strong>Trạng thái đơn:</strong> {order.status || "N/A"}</p>
        <p><strong>Trạng thái thanh toán:</strong> {order.paymentStatus || "N/A"}</p>
        <p><strong>Mã giao dịch cổng:</strong> {order.transactionId || "N/A"}</p>
        <p><strong>Ngày đặt:</strong> {order.orderDate ? new Date(order.orderDate).toLocaleString("vi-VN") : "N/A"}</p>
      </div>
    </div>

    <p className="font-semibold mb-2">Sản phẩm:</p>
    
    {/* Sử dụng OrderItemsDisplay component mới */}
    <OrderItemsDisplay order={order} showActions={false} />
  </div>
);

// ---- Main component ----
const PaymentFail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [params, setParams] = useState<PaymentParams>({});
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // parse tất cả tham số từ URL
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const p: PaymentParams = {};
    
    // Lấy tất cả tham số động
    sp.forEach((value, key) => {
      p[key] = value;
    });

    // DEV mock khi không có query
    if (import.meta.env.DEV && sp.size === 0) {
      Object.assign(p, {
        orderId: "1294-dca2a6690c5e42ef987050ec8556a1d4",
        status: "fail",
        amount: "480000",
        transId: "1756601973306",
        payType: "",
        bank: "",
        message: "Giao dịch bị từ chối bởi người dùng.",
        orderInfo: "Đơn hàng #1294 (Partial)",
        resultCode: "1006",
        responseTime: `${Date.now()}`,
      });
    }
    
    setParams(p);
  }, [location.search]);

  // lấy đơn hàng khi có orderId
  useEffect(() => {
    const fetchOrder = async () => {
      const rawOrderId = getOrderIdFromParams(params);
      const numericOrderId = extractNumericId(rawOrderId);

      // chỉ chạy khi có orderId
      if (!numericOrderId) return;

      setLoading(true);
      setOrderError(null);
      try {
        const od = await getOrderById(numericOrderId);
        if (!od?.orderId) {
          setOrderError("Không tìm thấy đơn hàng.");
          return;
        }
        setOrder(od);
      } catch (e) {
        setOrderError("Lỗi khi lấy thông tin đơn hàng!");
        toast.error("Lỗi khi lấy thông tin đơn hàng!");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params]);

  const failed = isPaymentFailure(params);
  const paymentMessage = getPaymentMessage(params);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl border-4 border-red-300">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Thanh toán thất bại
          </h1>
          <p className="mt-2 text-gray-600">
            Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu cần thiết.
          </p>
          
          {/* Thông báo lỗi chi tiết */}
          {paymentMessage && paymentMessage !== "N/A" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">
                  Lý do: {paymentMessage}
                </span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : (
          <>
            <PaymentInfoDisplay params={params} />
            {order && (
              <OrderItemsDisplay order={order} />
            )}
            {orderError && (
              <p className="text-center text-red-500 font-semibold">{orderError}</p>
            )}
          </>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate("/customer-dashboard/orders")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Xem lịch sử đơn hàng
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Thử thanh toán lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;