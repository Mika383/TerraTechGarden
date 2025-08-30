// src/pages/Customer/Notifications.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOutlined, CheckCircleTwoTone } from "@ant-design/icons";
import { getNotificationsByUser } from "@/api/notification";

const BASE_URL = "https://terarium.shop/api";

type Noti = {
  notificationId: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  userId?: number;
};

// —— Helpers ——
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Chuẩn hoá response cho cả 2 trường hợp: [] hoặc { data: [] }
function normalizeNotiResponse(res: unknown): Noti[] {
  const list: unknown[] = Array.isArray((res as any)?.data)
    ? (res as any).data
    : Array.isArray(res)
    ? (res as any)
    : [];

  return list.map((n: any): Noti => ({
    notificationId: Number(n?.notificationId ?? 0),
    title: String(n?.title ?? ""),
    message: String(n?.message ?? ""),
    createdAt: String(n?.createdAt ?? new Date().toISOString()),
    isRead: Boolean(n?.isRead ?? false),
    userId: n?.userId != null ? Number(n.userId) : undefined,
  }));
}

// PUT đúng endpoint, không body
async function putMarkAsReadExact(id: number): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/Notification/mark-as-read/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return res.ok || res.status === 204;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId") || 0);

  const [data, setData] = useState<Noti[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // loading cho thao tác đọc
  const [readingIds, setReadingIds] = useState<Record<number, boolean>>({});
  const [readingAll, setReadingAll] = useState(false);

  // Load lần đầu
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await getNotificationsByUser(userId);
        setData(normalizeNotiResponse(res));
      } catch (e) {
        console.error("Load noti error:", e);
      }
    })();
  }, [userId]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paged = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const unreadCount = useMemo(() => data.filter((n) => !n.isRead).length, [data]);

  // ---- API mark-as-read (1 item) ----
  const markOne = async (id: number) => {
    // Optimistic update
    setReadingIds((m) => ({ ...m, [id]: true }));
    setData((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
    try {
      const ok = await putMarkAsReadExact(id);
      if (ok) {
        // Báo Navbar cập nhật badge ngay (Navbar lắng nghe 'notification:received' -> gọi unread-count)
        window.dispatchEvent(new CustomEvent("notification:received"));
      } else {
        // revert nếu lỗi
        setData((prev) =>
          prev.map((n) => (n.notificationId === id ? { ...n, isRead: false } : n))
        );
        console.error("PUT mark-as-read failed:", id);
      }
    } catch (e) {
      setData((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: false } : n))
      );
      console.error("mark-as-read error:", e);
    } finally {
      setReadingIds((m) => {
        const { [id]: _, ...rest } = m;
        return rest;
      });
    }
  };

  // ---- Đã đọc tất cả (batch PUT) ----
  const markAll = async () => {
    const ids = data.filter((n) => !n.isRead).map((n) => n.notificationId);
    if (ids.length === 0) return;
    setReadingAll(true);
    // Optimistic update
    setData((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));
    try {
      const results = await Promise.all(ids.map((id) => putMarkAsReadExact(id)));
      if (results.every(Boolean)) {
        window.dispatchEvent(new CustomEvent("notification:received"));
      } else {
        console.warn("Some mark-as-read PUT failed");
        // Tuỳ chọn: refetch để đồng bộ tuyệt đối
        try {
          const res = await getNotificationsByUser(userId);
          setData(normalizeNotiResponse(res));
        } catch {}
      }
    } catch (e) {
      console.error("mark-all error:", e);
      try {
        const res = await getNotificationsByUser(userId);
        setData(normalizeNotiResponse(res));
      } catch {}
    } finally {
      setReadingAll(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Thông báo</h1>

        {/* Nút đã đọc tất cả */}
        <button
          onClick={markAll}
          disabled={unreadCount === 0 || readingAll}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition
            ${
              unreadCount === 0 || readingAll
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          title={unreadCount > 0 ? "Đánh dấu đã đọc tất cả" : "Không còn thông báo chưa đọc"}
        >
          <CheckCircleTwoTone twoToneColor="#10b981" className="mr-1" />
          {readingAll ? "Đang xử lý..." : `Đã đọc tất cả (${unreadCount})`}
        </button>
      </div>

      <div className="space-y-4">
        {paged.map((n) => (
          <div
            key={n.notificationId}
            className={`flex items-start p-4 rounded-lg shadow-sm border transition
              ${n.isRead ? "bg-gray-100 border-gray-200" : "bg-blue-50 border-blue-300"}`}
          >
            {/* Icon + dot trạng thái */}
            <div className="relative mr-4">
              <BellOutlined className={`text-2xl ${n.isRead ? "text-gray-400" : "text-green-600"}`} />
              {!n.isRead && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white" />
              )}
            </div>

            {/* Nội dung */}
            <div className="flex-1">
              <p className={`text-lg font-medium ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>
                {n.title}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(n.createdAt).toLocaleString("vi-VN")}
              </p>
              <p className="text-sm mt-1">{n.message}</p>
            </div>

            {/* Action */}
            <div className="ml-4">
              {n.isRead ? (
                <span className="text-xs text-gray-400 italic">Đã đọc</span>
              ) : (
                <button
                  onClick={() => markOne(n.notificationId)}
                  disabled={!!readingIds[n.notificationId]}
                  className={`text-sm font-medium ${
                    readingIds[n.notificationId]
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {readingIds[n.notificationId] ? "Đang đánh dấu..." : "Đánh dấu đã đọc"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      <button
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={() => navigate("/customer-dashboard")}
      >
        Quay lại
      </button>
    </div>
  );
};

export default Notifications;
