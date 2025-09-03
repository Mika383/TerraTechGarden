// src/pages/Customer/PaymentSuccess.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { getOrderById } from "@/api/order";
import type { Order, OrderItem } from "@/types/order";
import OrderItemsDisplay from "@/components/OrderItemsDisplay";

// ================= Helpers (dynamic, no hard-code) =================
type KV = Record<string, string | undefined>;

const money = (n?: number) => (n ?? 0).toLocaleString("vi-VN") + " VND";

const parseVnpDate = (v?: string) => {
  if (!v || v.length !== 14) return undefined;
  const y = +v.slice(0, 4);
  const m = +v.slice(4, 6) - 1;
  const d = +v.slice(6, 8);
  const hh = +v.slice(8, 10);
  const mm = +v.slice(10, 12);
  const ss = +v.slice(12, 14);
  const dt = new Date(y, m, d, hh, mm, ss);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

const decodeSafely = (s?: string) => {
  if (!s) return "N/A";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const detectGateway = (q: KV): "VNPay" | "MoMo" | "PayOS" | "Unknown" => {
  const keys = Object.keys(q);
  if (keys.some((k) => k.startsWith("vnp_"))) return "VNPay";
  if (["resultCode", "transId", "payType"].some((k) => k in q)) return "MoMo";
  if (["orderCode", "signature"].some((k) => k in q)) return "PayOS";
  return "Unknown";
};

const isPaymentSuccess = (q: KV): boolean => {
  const gw = detectGateway(q);
  const status = (q.status ?? "").toLowerCase();
  if (gw === "MoMo") return q.resultCode === "0" || status === "success" || status === "successful";
  if (gw === "VNPay") return q.vnp_ResponseCode === "00" || q.vnp_TransactionStatus === "00";
  if (gw === "PayOS") return status === "paid" || status === "success" || status === "successful";
  return status === "success" || status === "successful" || q.resultCode === "0" || q.resultCode === "00";
};

const rawOrderIdFromParams = (q: KV) =>
  q.orderId || q.order || q.order_id || q.orderID || q.oid || q.vnp_TxnRef || q.orderCode || "";

const extractNumericId = (raw?: string): number | null => {
  if (!raw) return null;
  const m = String(raw).match(/\d+/);
  return m ? Number(m[0]) : null;
};

const extractAmount = (q: KV): number => {
  const gw = detectGateway(q);
  if (gw === "VNPay" && q.vnp_Amount) {
    const v = Number(q.vnp_Amount);
    return Number.isFinite(v) ? Math.floor(v / 100) : 0;
  }
  const v = Number(q.amount);
  return Number.isFinite(v) ? v : 0;
};

const extractTransId = (q: KV): string =>
  q.transId || q.vnp_TransactionNo || q.transactionId || "N/A";

const extractBank = (q: KV, gw: ReturnType<typeof detectGateway>): string =>
  (gw === "VNPay" ? q.vnp_BankCode : q.bank) || "N/A";

const extractPayType = (q: KV, gw: ReturnType<typeof detectGateway>): string =>
  (gw === "VNPay" ? q.vnp_CardType : q.payType) || q.method || q.paymentMethod || "N/A";

const extractOrderInfo = (q: KV): string =>
  decodeSafely(q.orderInfo || q.vnp_OrderInfo || q.description);

const extractMessage = (q: KV, success: boolean, gw: ReturnType<typeof detectGateway>): string => {
  if (q.message) return decodeSafely(q.message);
  if (gw === "VNPay") {
    if (q.vnp_ResponseCode === "00" || q.vnp_TransactionStatus === "00") return "Thành công.";
    return q.vnp_ResponseCode ? `Mã phản hồi: ${q.vnp_ResponseCode}` : "—";
  }
  return success ? "Thành công." : "Thất bại.";
};

const extractTime = (q: KV, gw: ReturnType<typeof detectGateway>): string => {
  if (gw === "VNPay" && q.vnp_PayDate) {
    const dt = parseVnpDate(q.vnp_PayDate);
    return dt ? dt.toLocaleString("vi-VN") : q.vnp_PayDate!;
  }
  const t = q.responseTime || q.timestamp || q.timeStamp;
  if (!t) return "N/A";
  const n = Number(t);
  if (!Number.isNaN(n)) {
    try {
      return new Date(n).toLocaleString("vi-VN");
    } catch {}
  }
  return t;
};

// ===== NEW: Gom combo theo comboId -> mỗi combo hiển thị 1 parent có childItems =====
function toDisplayOrder(order: Order): Order {
  const items = order.orderItems || [];

  const nonCombo = items.filter(
    (i) => i.itemType !== "COMBO" || !i.comboId || i.comboId <= 0
  );

  const comboItems = items.filter(
    (i) => i.itemType === "COMBO" && i.comboId && i.comboId > 0
  );

  const groups = new Map<number, { header?: OrderItem; children: OrderItem[] }>();

  for (const it of comboItems) {
    const id = it.comboId as number;
    const g = groups.get(id) || { header: undefined, children: [] };

    // Heuristic nhận biết dòng header: có unitPrice > 0 hoặc không có tên/ảnh
    const looksHeader =
      (it.unitPrice ?? 0) > 0 || (!it.productName && !it.imageUrl);

    if (looksHeader && !g.header) g.header = { ...it };
    else g.children.push({ ...it });

    groups.set(id, g);
  }

  const groupedParents: OrderItem[] = [];
  for (const [cid, g] of groups.entries()) {
    // Chọn child đại diện để hiển thị tên/ảnh nếu header thiếu
    const mainChild =
      g.children.find((c) => c.terrariumVariantId) ||
      g.children.find((c) => !!c.productName) ||
      g.children[0];

    const header: OrderItem =
      g.header ??
      ({
        orderItemId: Number(`9${cid}`), // synthetic id để tránh trùng
        itemType: "COMBO",
        comboId: cid,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      } as OrderItem);

    const parent: OrderItem = {
      ...header,
      productName: header.productName ?? mainChild?.productName ?? `Combo #${cid}`,
      imageUrl: header.imageUrl ?? mainChild?.imageUrl ?? null,
      childItems: g.children,
    };

    groupedParents.push(parent);
  }

  return {
    ...order,
    // Top-level chỉ còn: các item thường + 1 item đại diện cho mỗi combo
    orderItems: [...nonCombo, ...groupedParents],
  };
}

// ================== UI blocks (giữ layout/logic hiện tại) ==================
const PaymentInfoCard: React.FC<{ query: KV }> = ({ query }) => {
  const gateway = detectGateway(query);
  const success = isPaymentSuccess(query);
  const amount = extractAmount(query);
  const rawId = rawOrderIdFromParams(query);
  const displayOrderId = rawId || String(extractNumericId(rawId) ?? "N/A");
  const transId = extractTransId(query);
  const bank = extractBank(query, gateway);
  const payType = extractPayType(query, gateway);
  const orderInfo = extractOrderInfo(query);
  const timeStr = extractTime(query, gateway);
  const message = extractMessage(query, success, gateway);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border ${success ? "border-green-200" : "border-red-200"}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Thông tin thanh toán{gateway !== "Unknown" ? ` (${gateway})` : ""}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Cổng thanh toán:</strong> {gateway === "Unknown" ? "Không xác định" : gateway}</p>
          <p><strong>Số tiền:</strong> {money(amount)}</p>
          <p><strong>Mã giao dịch:</strong> {transId}</p>
          <p><strong>Phương thức:</strong> {payType}</p>
          <p><strong>Ngân hàng:</strong> {bank}</p>
        </div>
        <div>
          <p><strong>Thông tin đơn hàng:</strong> {orderInfo}</p>
          <p><strong>Thời gian:</strong> {timeStr}</p>
          {!success && query.resultCode && <p><strong>Mã kết quả:</strong> {query.resultCode}</p>}
          {!success && query.vnp_ResponseCode && <p><strong>VNPay code:</strong> {query.vnp_ResponseCode}</p>}
          <p><strong>Thông báo:</strong> {message}</p>
          <p>
            <strong>Trạng thái:</strong>
            <span className={`ml-2 font-semibold ${success ? "text-green-600" : "text-red-500"}`}>
              {success ? "Thành công" : "Thất bại"}
            </span>
          </p>
          <p><strong>Mã đơn hàng:</strong> {displayOrderId}</p>
        </div>
      </div>
    </div>
  );
};

// ========================= Main component =========================
const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState<KV>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const q: KV = {};
    sp.forEach((v, k) => (q[k] = v));
    setQuery(q);
  }, [location.search]);

  const success = useMemo(() => isPaymentSuccess(query), [query]);

  // NEW: order đã được gom combo để truyền vào UI
  const orderForDisplay = useMemo(() => (order ? toDisplayOrder(order) : null), [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      const rawId = rawOrderIdFromParams(query);
      const numericOrderId = extractNumericId(rawId);
      if (!(numericOrderId && success)) return;

      setLoading(true);
      setOrderError(null);
      try {
        const od = await getOrderById(numericOrderId);
        if (!od?.orderId) {
          setOrderError("Không tìm thấy đơn hàng.");
          return;
        }
        setOrder(od);
      } catch {
        setOrderError("Lỗi khi lấy thông tin đơn hàng!");
        toast.error("Lỗi khi lấy thông tin đơn hàng!");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [query, success]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl border-4 border-gray-300">
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
            <PaymentInfoCard query={query} />
            {/* Truyền order đã gom combo */}
            {orderForDisplay && <OrderItemsDisplay order={orderForDisplay} />}
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
