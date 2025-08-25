// src/pages/Customer/PaymentSuccess.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { getOrderById } from "@/api/order";
import { getAccessoryById } from "@/api/accessory";
import { getTerrariumVariantById, getTerrariumById } from "@/api/terrarium";

const FALLBACK_IMG = "/TerraTechLogo.png"; // ✅ logo nền trắng

// ---- MoMo query params ----
interface MoMoParams {
  orderId?: string;      // mã đơn hàng (có thể là "1228-xxxxx")
  status?: string;       // "success" | ...
  amount?: string;       // số tiền (VND) dạng string
  transId?: string;      // mã giao dịch momo
  payType?: string;      // ví dụ: "aio_qr"
  bank?: string;         // có thể rỗng
  message?: string;      // Thông báo
  orderInfo?: string;    // mô tả đơn hàng (URL-encoded)
  resultCode?: string;   // "0" => thành công
  responseTime?: string; // timestamp ms
}

// Dữ liệu hiển thị sau khi "enrich" từng item
type EnrichedItem = {
  orderItemId: number;
  name: string;
  image: string;   // luôn string
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

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

const isMoMoSuccess = (p: MoMoParams) =>
  p.resultCode === "0" || p.status?.toLowerCase() === "success";

/** Lấy raw orderId từ nhiều khóa khác nhau do gateway có thể khác tên */
const rawOrderIdFromParams = (all: Record<string, string | undefined>) =>
  all.orderId || all.order || all.order_id || all.oid || "";

/** Trích số đầu tiên từ chuỗi (vd "1228-a5d2..." -> 1228). Trả về null nếu không có số. */
const extractNumericId = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const m = String(raw).match(/\d+/);
  return m ? Number(m[0]) : null;
};

// ---- UI blocks ----
const PaymentInfoMoMo: React.FC<{ params: MoMoParams }> = ({ params }) => {
  const success = isMoMoSuccess(params);
  const amount = params.amount ? Number(params.amount) : 0;
  const showResultCode = !success && !!params.resultCode; // ❗ chỉ hiện khi KHÔNG thành công
  const rawId = rawOrderIdFromParams(params as any);
  const displayOrderId = rawId || (extractNumericId(rawId) ?? "N/A");

  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border ${success ? "border-green-200" : "border-red-200"}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Thông tin thanh toán (MoMo)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Cổng thanh toán:</strong> MoMo</p>
          <p><strong>Số tiền:</strong> {money(amount)}</p>
          <p><strong>Mã giao dịch:</strong> {params.transId || "N/A"}</p>
          <p><strong>Phương thức:</strong> {params.payType || "N/A"}</p>
          <p><strong>Ngân hàng:</strong> {params.bank || "MoMo"}</p>
        </div>

        <div>
          <p><strong>Thông tin đơn hàng:</strong> {safeDecodeURIComponent(params.orderInfo)}</p>
          <p><strong>Thời gian:</strong> {formatMoMoTime(params.responseTime)}</p>
          {showResultCode && <p><strong>Mã kết quả:</strong> {params.resultCode}</p>}
          <p><strong>Thông báo:</strong> {safeDecodeURIComponent(params.message)}</p>
          <p>
            <strong>Trạng thái:</strong>
            <span className={`ml-2 font-semibold ${success ? "text-green-600" : "text-red-500"}`}>
              {success ? "Thành công" : "Thất bại"}
            </span>
          </p>
          <p><strong>Mã đơn hàng:</strong> {String(displayOrderId)}</p>
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
                <img
                  src={it.image || FALLBACK_IMG}
                  alt={it.name}
                  className="w-10 h-10 object-cover rounded border bg-white"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                />
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

const OrderDetails: React.FC<{ order: any; enriched: EnrichedItem[] }> = ({ order, enriched }) => (
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

  const [params, setParams] = useState<MoMoParams>({});
  const [order, setOrder] = useState<any>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // parse chỉ tham số MoMo
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const p: Record<string, string> = {};
    sp.forEach((v, k) => (p[k] = v));

    // DEV mock khi không có query
    if (import.meta.env.DEV && sp.size === 0) {
      Object.assign(p, {
        orderId: "1221",
        status: "success",
        amount: "1305000",
        transId: "4565913774",
        payType: "aio_qr",
        bank: "",
        message: "Thành công.",
        orderInfo: "Đơn hàng #1221 (Full -10%)",
        resultCode: "0",
        responseTime: `${Date.now()}`,
      });
    }
    setParams(p as MoMoParams);
  }, [location.search]);

  // lấy đơn hàng & enrich item khi thanh toán thành công
  useEffect(() => {
    const fetchOrder = async () => {
      const rawId = rawOrderIdFromParams(params as any);
      const numericOrderId = extractNumericId(rawId);

      // chỉ chạy khi có orderId và thanh toán thành công
      if (!(numericOrderId && isMoMoSuccess(params))) return;

      setLoading(true);
      setOrderError(null);
      try {
        const od = await getOrderById(numericOrderId);
        if (!od?.orderId) {
          setOrderError("Không tìm thấy đơn hàng.");
          return;
        }
        setOrder(od);

        const items: EnrichedItem[] = await Promise.all(
          (od.orderItems || []).map(async (it: any): Promise<EnrichedItem> => {
            let name = "Sản phẩm";
            let image = FALLBACK_IMG;

            if (it.terrariumVariantId) {
              const variant = await getTerrariumVariantById(it.terrariumVariantId);
              if (variant) {
                name = variant.variantName || name;
                image = (variant.urlImage as string) || image;
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
              image: image || FALLBACK_IMG,
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
  }, [params]);

  const success = isMoMoSuccess(params);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl border-4 border-gray-300">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Thanh toán {success ? "thành công!" : "thất bại"}
          </h1>
          <p className="mt-2 text-gray-600">
            {success
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
            <PaymentInfoMoMo params={params} />
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
