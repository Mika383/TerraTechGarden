import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOutlined } from "@ant-design/icons";
import { getNotificationsByUser } from "@/api/notification";

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId") || 0);

  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await getNotificationsByUser(userId);
        setData(res);
      } catch (e) {
        console.error("Load noti error:", e);
      }
    })();
  }, [userId]);

  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-6">Thông báo</h1>

      <div className="space-y-4">
        {paged.map((n) => (
          <div
            key={n.notificationId}
            className={`flex items-center p-4 rounded-lg shadow-md ${
              n.isRead ? "bg-gray-100" : "bg-white"
            }`}
          >
            <BellOutlined className="text-2xl text-green-600 mr-4" />
            <div className="flex-1">
              <p className="text-lg">{n.title}</p>
              <p className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
              <p className="text-sm">{n.message}</p>
            </div>
            {!n.isRead && (
              <button className="text-blue-500 hover:text-blue-700">Đánh dấu đã đọc</button>
            )}
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
