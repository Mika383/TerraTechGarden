import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

import { getOrderById } from "@/api";
import { getVouchers } from "@/api/voucher";
import { getTerrariumById, getTerrariumVariantById } from "@/api/terrarium";
import { getAccessoryById } from "@/api/accessory";

import type { Order, OrderItem } from "@/types/order";
import type { Voucher } from "@/types/voucher";

/* ================= Helpers ================= */
type KV = Record<string, string | undefined>;
const money = (n?: number | null) =>
  Number(n ?? 0).toLocaleString("vi-VN") + " VND";

const FALLBACK_IMG = "/TerraTechLogo.png";

// type-guard: chỉ nhận number "thật"
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

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
  if (["resultCode", "transId", "payType", "partnerCode"].some((k) => k in q))
    return "MoMo";
  if (["orderCode", "signature"].some((k) => k in q)) return "PayOS";
  return "Unknown";
};

const isPaymentSuccess = (q: KV): boolean => {
  const gw = detectGateway(q);
  const status = (q.status ?? "").toLowerCase();
  if (gw === "MoMo")
    return q.resultCode === "0" || status === "success" || status === "successful";
  if (gw === "VNPay")
    return q.vnp_ResponseCode === "00" || q.vnp_TransactionStatus === "00";
  if (gw === "PayOS")
    return status === "paid" || status === "success" || status === "successful";
  return (
    status === "success" ||
    status === "successful" ||
    q.resultCode === "0" ||
    q.resultCode === "00"
  );
};

const rawOrderIdFromParams = (q: KV) =>
  q.orderId ||
  q.order ||
  q.order_id ||
  q.orderID ||
  q.oid ||
  q.vnp_TxnRef ||
  q.orderCode ||
  "";

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

const extractBank = (q: KV, gw: ReturnType<typeof detectGateway>): string => {
  if (gw === "VNPay") return q.vnp_BankCode || "N/A";
  if (gw === "MoMo") return q.bankName || q.bankCode || q.payType || "MoMo";
  if (gw === "PayOS") return q.bank || q.method || "N/A";
  return q.bank || "N/A";
};

const extractPayType = (q: KV, gw: ReturnType<typeof detectGateway>): string =>
  (gw === "VNPay" ? q.vnp_CardType : q.payType) ||
  q.method ||
  q.paymentMethod ||
  "N/A";

const extractOrderInfo = (q: KV): string =>
  decodeSafely(q.orderInfo || q.vnp_OrderInfo || q.description);

const extractMessage = (
  q: KV,
  success: boolean,
  gw: ReturnType<typeof detectGateway>
): string => {
  if (q.message) return decodeSafely(q.message);
  if (gw === "VNPay") {
    if (q.vnp_ResponseCode === "00" || q.vnp_TransactionStatus === "00")
      return "Thành công.";
    return q.vnp_ResponseCode ? `Mã phản hồi: ${q.vnp_ResponseCode}` : "—";
  }
  return success ? "Thành công." : "Thất bại.";
};

const extractTime = (q: KV, gw: ReturnType<typeof detectGateway>): string => {
  if (gw === "VNPay" && q.vnp_PayDate) {
    const dt = parseVnpDate(q.vnp_PayDate);
    return dt ? dt.toLocaleString("vi-VN") : (q.vnp_PayDate as string);
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

/* ============ Grouping helpers (copy spirit từ OrderDetail) ============ */
const attachBundleVariantByMain = (items: OrderItem[]): OrderItem[] => {
  let currentMainVariant: number | null = null;
  return items.map((it) => {
    if (it.itemType === "MAIN_ITEM") {
      currentMainVariant = isNumber(it.terrariumVariantId)
        ? it.terrariumVariantId
        : null;
      return it;
    }
    if (it.itemType === "BUNDLE_ACCESSORY") {
      if (!isNumber(it.terrariumVariantId) && isNumber(currentMainVariant)) {
        return { ...it, terrariumVariantId: currentMainVariant! };
      }
    }
    return it;
  });
};

const groupBundlesByVariant = (items: OrderItem[]) => {
  const out = new Map<
    number,
    { items: OrderItem[]; totalPrice: number; totalQty: number }
  >();
  items
    .filter((x) => x.itemType === "BUNDLE_ACCESSORY")
    .forEach((it) => {
      const vid = isNumber(it.terrariumVariantId) ? it.terrariumVariantId : 0;
      if (!out.has(vid)) out.set(vid, { items: [], totalPrice: 0, totalQty: 0 });
      const g = out.get(vid)!;
      g.items.push(it);
      g.totalPrice += it.totalPrice || 0;
      g.totalQty += it.quantity || 0;
    });
  return out;
};

/* ================== UI block ================== */
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
    <div
      className={`bg-white p-6 rounded-lg shadow-lg border ${
        success ? "border-green-200" : "border-red-200"
      }`}
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Thông tin thanh toán{gateway !== "Unknown" ? ` (${gateway})` : ""}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p>
            <strong>Cổng thanh toán:</strong>{" "}
            {gateway === "Unknown" ? "Không xác định" : gateway}
          </p>
          <p>
            <strong>Số tiền:</strong> {money(amount)}
          </p>
          <p>
            <strong>Mã giao dịch:</strong> {transId}
          </p>
          <p>
            <strong>Phương thức:</strong> {payType}
          </p>
          {bank && bank !== "N/A" && (
            <p>
              <strong>Ngân hàng:</strong> {bank}
            </p>
          )}
        </div>
        <div>
          <p>
            <strong>Thông tin đơn hàng:</strong> {orderInfo}
          </p>
          <p>
            <strong>Thời gian:</strong> {timeStr}
          </p>
          <p>
            <strong>Thông báo:</strong> {message}
          </p>
          <p>
            <strong>Trạng thái:</strong>
            <span
              className={`ml-2 font-semibold ${
                success ? "text-green-600" : "text-red-500"
              }`}
            >
              {success ? "Thành công" : "Thất bại"}
            </span>
          </p>
        </div>
      </div>
      <p>
        <strong>Mã đơn hàng:</strong> {displayOrderId}
      </p>
    </div>
  );
};

/* ========================= Main ========================= */
type VariantMeta = {
  terrariumId: number;
  variantName?: string;
  image?: string;
};
type AccessoryMeta = { name: string; image?: string };

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState<KV>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  // Meta for rendering like OrderDetail
  const [variantMeta, setVariantMeta] = useState<Record<number, VariantMeta>>(
    {}
  );
  const [terrariumName, setTerrariumName] = useState<Record<number, string>>(
    {}
  );
  const [accessoryMeta, setAccessoryMeta] = useState<
    Record<number, AccessoryMeta>
  >({});

  const [bundleOpen, setBundleOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const vs = await getVouchers();
        setVouchers(Array.isArray(vs) ? vs : []);
      } catch {
        // silent
      }
    })();
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const q: KV = {};
    sp.forEach((v, k) => (q[k] = v));
    setQuery(q);
  }, [location.search]);

  const success = useMemo(() => isPaymentSuccess(query), [query]);

  // Lấy order + fetch meta
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

        const processed = {
          ...od,
          orderItems: attachBundleVariantByMain(od.orderItems || []),
        };
        setOrder(processed);

        // ======= collect ids for meta =======
        const vIds = new Set<number>();
        const aIds = new Set<number>();
        (processed.orderItems || []).forEach((it) => {
          if (isNumber(it.terrariumVariantId)) vIds.add(it.terrariumVariantId);
          if (isNumber(it.accessoryId)) aIds.add(it.accessoryId);
        });

        // --- VARIANTS ---
        const needVariant: number[] = [...vIds].filter(
          (vid) => !variantMeta[vid]
        );
        if (needVariant.length) {
          const results = await Promise.allSettled(
            needVariant.map(async (vid: number) => {
              const v = await getTerrariumVariantById(vid);
              return {
                vid,
                terrariumId: Number(v?.terrariumId || 0),
                variantName: (v as any)?.variantName as string | undefined,
                image: (v as any)?.urlImage as string | undefined,
              };
            })
          );
          const add: Record<number, VariantMeta> = {};
          const terrs = new Set<number>();
          results.forEach((r) => {
            if (r.status === "fulfilled") {
              add[r.value.vid] = {
                terrariumId: r.value.terrariumId,
                variantName: r.value.variantName,
                image: r.value.image,
              };
              if (isNumber(r.value.terrariumId)) terrs.add(r.value.terrariumId);
            }
          });
          if (Object.keys(add).length)
            setVariantMeta((m) => ({ ...m, ...add }));

          // --- TERRARIUM names ---
          const terrToFetch: number[] = [...terrs].filter(
            (tid) => !terrariumName[tid]
          );
          if (terrToFetch.length) {
            const terrFetch = await Promise.allSettled(
              terrToFetch.map(async (tid: number) => {
                const t = await getTerrariumById(tid);
                return { tid, name: t?.terrariumName as string | undefined };
              })
            );
            const tAdd: Record<number, string> = {};
            terrFetch.forEach((r) => {
              if (r.status === "fulfilled")
                tAdd[r.value.tid] = r.value.name || `Terrarium #${r.value.tid}`;
            });
            if (Object.keys(tAdd).length)
              setTerrariumName((m) => ({ ...m, ...tAdd }));
          }
        }

        // --- ACCESSORIES ---
        const needAcc: number[] = [...aIds].filter((aid) => !accessoryMeta[aid]);
        if (needAcc.length) {
          const accs = await Promise.allSettled(
            needAcc.map(async (aid: number) => {
              const a = await getAccessoryById(aid);
              return {
                aid,
                name: a?.name || `Phụ kiện #${aid}`,
                image: a?.accessoryImages?.[0]?.imageUrl || FALLBACK_IMG,
              };
            })
          );
          const addA: Record<number, AccessoryMeta> = {};
          accs.forEach((r) => {
            if (r.status === "fulfilled")
              addA[r.value.aid] = { name: r.value.name, image: r.value.image };
          });
          if (Object.keys(addA).length)
            setAccessoryMeta((m) => ({ ...m, ...addA }));
        }
      } catch {
        setOrderError("Lỗi khi lấy thông tin đơn hàng!");
        toast.error("Lỗi khi lấy thông tin đơn hàng!");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, success]);

  /* ================== Tính tiền & COD ================== */
  const originalAmount = order?.originalAmount ?? 0;

  const voucherUsed = useMemo(() => {
    if (!order?.voucherId) return undefined;
    return vouchers.find((v) => v.voucherId === order.voucherId);
  }, [order?.voucherId, vouchers]);

  const voucherDiscount = useMemo(() => {
    if (!voucherUsed) return 0;
    if (voucherUsed.discountPercent && voucherUsed.discountPercent > 0) {
      return (originalAmount * voucherUsed.discountPercent) / 100;
    } else if (voucherUsed.discountAmount && voucherUsed.discountAmount > 0) {
      return voucherUsed.discountAmount;
    }
    return 0;
  }, [voucherUsed, originalAmount]);

  const totalAmount = order?.totalAmount ?? 0;
  const fullPaymentDiscount = Math.max(
    0,
    originalAmount - voucherDiscount - totalAmount
  );
  const deposit = order?.deposit ?? 0;

  let codAmount;
  if (deposit === 0) codAmount = 0;
  else if (deposit > 0) codAmount = Math.max(0, totalAmount - deposit);
  else codAmount = totalAmount;

  // ====== For rendering items ======
  const items: OrderItem[] = order?.orderItems || [];
  const mainItems = useMemo(
    () => items.filter((x) => x.itemType === "MAIN_ITEM"),
    [items]
  );
  const bundleGroups = useMemo(() => groupBundlesByVariant(items), [items]);
  const singles = useMemo(
    () => items.filter((x) => x.itemType === "SINGLE"),
    [items]
  );

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

            {/* ====== Tóm tắt đơn hàng ====== */}
            {order && (
              <div className="bg-white p-6 rounded-lg shadow-lg border border-amber-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Tóm tắt đơn hàng
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính (giá gốc)</span>
                    <span className="font-medium">{money(originalAmount)}</span>
                  </div>

                  {voucherUsed && (
                    <div className="flex justify-between text-yellow-700">
                      <span>
                        Giảm voucher <b>{voucherUsed.code}</b>
                      </span>
                      <span>−{money(voucherDiscount)}</span>
                    </div>
                  )}

                  {fullPaymentDiscount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Ưu đãi thanh toán toàn bộ</span>
                      <span>−{money(fullPaymentDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-blue-700">
                    <span>Đã đặt cọc</span>
                    <span>-{money(deposit)}</span>
                  </div>

                  <hr />

                  <div className="flex justify-between font-semibold text-base">
                    <span>Tổng tiền cần thanh toán</span>
                    <span className="text-green-700">{money(totalAmount)}</span>
                  </div>

                  <div className="flex justify-between text-red-600">
                    <span>Thanh toán khi nhận hàng</span>
                    <span>{money(codAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ====== SẢN PHẨM (tự render, nhóm theo variant) ====== */}
            {!!mainItems.length && (
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b font-semibold">Sản phẩm chính</div>
                <div className="divide-y">
                  {mainItems.map((it) => {
                    const vid = isNumber(it.terrariumVariantId)
                      ? it.terrariumVariantId
                      : 0;
                    const vm = vid ? variantMeta[vid] : undefined;
                    const terrName = vm?.terrariumId
                      ? terrariumName[vm.terrariumId] ||
                        `Terrarium #${vm.terrariumId}`
                      : "Terrarium";
                    const img = vm?.image || FALLBACK_IMG;

                    return (
                      <div
                        key={it.orderItemId}
                        className="p-4 flex items-start gap-3"
                      >
                        <img
                          src={img}
                          alt={terrName}
                          className="w-16 h-16 rounded border object-cover bg-white"
                          onError={(e) =>
                            ((e.currentTarget as HTMLImageElement).src =
                              FALLBACK_IMG)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800">
                            {terrName}
                          </div>
                          {vm?.variantName && (
                            <div className="text-sm text-gray-500">
                              Phân loại: <b>{vm.variantName}</b>
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            {money(it.unitPrice)} × {it.quantity}
                          </div>
                        </div>
                        <div className="w-28 text-right font-semibold text-gray-800">
                          {money(it.totalPrice)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {bundleGroups.size > 0 && (
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b font-semibold">Bộ phụ kiện</div>

                {[...bundleGroups.entries()].map(([variantId, g]) => {
                  const vm = variantMeta[variantId];
                  const tid = vm?.terrariumId || 0;
                  const terrName = tid
                    ? terrariumName[tid] || `Terrarium #${tid}`
                    : `Variant #${variantId}`;
                  const isOpen = !!bundleOpen[variantId];

                  return (
                    <div key={variantId} className="divide-y border-t">
                      <div className="p-4 flex items-center justify-between bg-gray-50">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800">
                            Bộ phụ kiện của{" "}
                            <span className="text-green-700">
                              {terrName}
                              {vm?.variantName ? ` • ${vm.variantName}` : ""}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            SL: <b>{g.totalQty}</b>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-green-700 font-semibold">
                            {money(g.totalPrice)}
                          </div>
                          <button
                            onClick={() =>
                              setBundleOpen((m) => ({
                                ...m,
                                [variantId]: !m[variantId],
                              }))
                            }
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                          >
                            {isOpen ? "Thu gọn" : "Mở rộng"}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="divide-y">
                          {g.items.map((it) => {
                            const aid = isNumber(it.accessoryId)
                              ? it.accessoryId
                              : 0;
                            const acc = aid ? accessoryMeta[aid] : undefined;
                            const name =
                              acc?.name ||
                              it.productName ||
                              (aid ? `Phụ kiện #${aid}` : "Phụ kiện");
                            const img = acc?.image || FALLBACK_IMG;

                            return (
                              <div
                                key={it.orderItemId}
                                className="p-4 flex items-start gap-3"
                              >
                                <img
                                  src={img}
                                  alt={name}
                                  className="w-14 h-14 rounded border object-cover bg-white"
                                  onError={(e) =>
                                    ((e.currentTarget as HTMLImageElement).src =
                                      FALLBACK_IMG)
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800">
                                    {name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {money(it.unitPrice)} × {it.quantity}
                                  </div>
                                </div>
                                <div className="w-28 text-right font-semibold text-gray-800">
                                  {money(it.totalPrice)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!!singles.length && (
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b font-semibold">Sản phẩm lẻ</div>
                <div className="divide-y">
                  {singles.map((it) => {
                    const aid = isNumber(it.accessoryId) ? it.accessoryId : 0;
                    const acc = aid ? accessoryMeta[aid] : undefined;
                    const name =
                      acc?.name ||
                      it.productName ||
                      (aid ? `Phụ kiện #${aid}` : "Phụ kiện");
                    const img = acc?.image || FALLBACK_IMG;

                    return (
                      <div
                        key={it.orderItemId}
                        className="p-4 flex items-start gap-3"
                      >
                        <img
                          src={img}
                          alt={name}
                          className="w-14 h-14 rounded border object-cover bg-white"
                          onError={(e) =>
                            ((e.currentTarget as HTMLImageElement).src =
                              FALLBACK_IMG)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800">
                            {name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {money(it.unitPrice)} × {it.quantity}
                          </div>
                        </div>
                        <div className="w-28 text-right font-semibold text-gray-800">
                          {money(it.totalPrice)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {orderError && (
              <p className="text-center text-red-500 font-semibold">
                {orderError}
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
