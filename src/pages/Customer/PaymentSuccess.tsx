// src/pages/Customer/PaymentSuccess.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { getOrderById } from "@/api/order";
import { getAccessoryById } from "@/api/accessory";
import {
  getTerrariumVariantById,
  getTerrariumById,
} from "@/api/terrarium";

// ---- Types ----
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
  vnp_TxnRef?: string; // chính là orderId
  vnp_SecureHash?: string;
}

// Dữ liệu hiển thị sau khi “enrich” từng item
type EnrichedItem = {
  orderItemId: number;
  name: string;
  image: string;          // <-- NOTE: luôn là string (fix TS 2322)
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

// ---- Helpers ----
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

const money = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN") + " VND";

// ---- UI blocks ----
const PaymentInfo: React.FC<{ params: PaymentParams }> = ({ params }) => {
  const isSuccess = params.vnp_ResponseCode === "00";
  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border ${isSuccess ? "border-green-200" : "border-red-200"}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Thông tin thanh toán</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Số tiền:</strong> {money(Number(params.vnp_Amount || 0) / 100)}</p>
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
          <p><strong>Mã đơn hàng (TxnRef):</strong> {params.vnp_TxnRef || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

const OrderTable: React.FC<{ items: EnrichedItem[] }> = ({ items }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border">
      <thead className="bg-gray-50">
        <tr className="text-left">
          <th className="p-2 border w-10">#</th>
          <th className="p-2 border">Sản phẩm</th>
          <th className="p-2 border w-16">SL</th>
          <th className="p-2 border w-40">Đơn giá</th>
          <th className="p-2 border w-40">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, idx) => (
          <tr key={it.orderItemId}>
            <td className="p-2 border">{idx + 1}</td>
            <td className="p-2 border">
              <div className="flex items-center gap-3">
                {/* image là string nên không còn lỗi TS 2322 */}
                <img src={it.image || "/default.jpg"} alt={it.name} className="w-10 h-10 object-cover rounded" />
                <span className="font-medium">{it.name}</span>
              </div>
            </td>
            <td className="p-2 border">{it.quantity}</td>
            <td className="p-2 border">{money(it.unitPrice)}</td>
            <td className="p-2 border">{money(it.totalPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OrderDetails: React.FC<{
  order: any;
  enriched: EnrichedItem[];
}> = ({ order, enriched }) => (
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
    <OrderTable items={enriched} />
  </div>
);

// ---- Main component ----
const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useState<PaymentParams>({});
  const [order, setOrder] = useState<any>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // parse query
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const p: PaymentParams = {};
    sp.forEach((v, k) => ((p as any)[k] = v));

    // mock dev if needed
    if (import.meta.env.DEV && sp.size === 0) {
      Object.assign(p, {
        vnp_Amount: "65012200",
        vnp_BankCode: "NCB",
        vnp_TransactionNo: "15121707",
        vnp_CardType: "ATM",
        vnp_OrderInfo: "Thanh toan don hang #67",
        vnp_PayDate: "20250807224944",
        vnp_ResponseCode: "00",
        vnp_TxnRef: "67",
      });
    }
    setParams(p);
  }, [location.search]);

  // load order + enrich items
  useEffect(() => {
    const fetchOrder = async () => {
      if (!(params.vnp_TxnRef && params.vnp_ResponseCode === "00")) return;
      setLoading(true);
      setOrderError(null);
      try {
        const od = await getOrderById(Number(params.vnp_TxnRef));
        if (!od?.orderId) {
          setOrderError("Không tìm thấy đơn hàng.");
          return;
        }
        setOrder(od);

        // Enrich từng item
        const items: EnrichedItem[] = await Promise.all(
          (od.orderItems || []).map(async (it: any): Promise<EnrichedItem> => {
            // default
            let name = "Sản phẩm";
            let image = "/default.jpg";

            if (it.terrariumVariantId) {
              const variant = await getTerrariumVariantById(it.terrariumVariantId);
              if (variant) {
                name = variant.variantName || name;
                image = (variant.urlImage as string) || image;
                // Nếu muốn lấy ảnh terrarium khi variant không có ảnh
                if (!variant.urlImage && variant.terrariumId) {
                  const t = await getTerrariumById(variant.terrariumId);
                  image = t?.terrariumImages?.[0]?.imageUrl || image;
                }
              }
            } else if (it.accessoryId) {
              const acc = await getAccessoryById(it.accessoryId);
              if (acc) {
                name = acc.name || name;
                image = acc.accessoryImages?.[0]?.imageUrl || image;
              }
            }

            return {
              orderItemId: it.orderItemId,
              name,
              image: image || "",        // <- luôn string
              quantity: it.quantity ?? 0,
              unitPrice: it.unitPrice ?? 0,
              totalPrice: it.totalPrice ?? (it.quantity ?? 0) * (it.unitPrice ?? 0),
            };
          })
        );

        setEnrichedItems(items);
      } catch (e) {
        setOrderError("Lỗi khi lấy thông tin đơn hàng!");
        toast.error("Lỗi khi lấy thông tin đơn hàng!");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.vnp_TxnRef, params.vnp_ResponseCode]);

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
            {order && <OrderDetails order={order} enriched={enrichedItems} />}
            {orderError && (
              <p className="text-center text-red-500 font-semibold">{orderError}</p>
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
            onClick={() => navigate("/customer-dashboard/orders")}
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
