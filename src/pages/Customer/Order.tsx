import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrdersByUser } from "@/api/order";
import OrderItem from "../../components/customer/Dashboard/OrderItem";
import { SearchOutlined } from "@ant-design/icons";
import { Spin, Pagination } from "antd";

const statusMap: Record<string, string> = {
  pending: "Chờ thanh toán",
  shipping: "Đang vận chuyển",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const filterOptions = ["Tất cả", "Chờ thanh toán", "Đang vận chuyển", "Hoàn thành", "Đã hủy"];

// Hàm lấy thêm info cho item đầu tiên (phân biệt accessory hoặc variant)
const fetchItemInfo = async (item: any) => {
  if (item.accessoryId) {
    const res = await fetch(`https://terarium.shop/api/Accessory/get-${item.accessoryId}`);
    const json = await res.json();
    return {
      name: json.data.name,
      image: json.data.accessoryImages?.[0]?.imageUrl || "/default.jpg",
    };
  } else if (item.terrariumVariantId) {
    const res = await fetch(
      `https://terarium.shop/api/TerrariumVariant/get-terrariumVariant/${item.terrariumVariantId}`
    );
    const json = await res.json();
    return {
      name: json.data.variantName,
      image: json.data.urlImage || "/default.jpg",
    };
  }
  return { name: "Sản phẩm", image: "/default.jpg" };
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const [orders, setOrders] = useState<any[]>([]);
  const [itemInfos, setItemInfos] = useState<{ [key: string]: { name: string; image: string } }>({});
  const [loading, setLoading] = useState(false);

  // 🆕 State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const userId = Number(localStorage.getItem("userId") || 0);

  useEffect(() => {
    setLoading(true);
    getOrdersByUser(userId)
      .then(async (ordersData) => {
        setOrders(ordersData);

        // Lấy info của item đầu tiên mỗi order (tối ưu cache)
        const cache: { [key: string]: { name: string; image: string } } = {};
        const promises = ordersData.map(async (order: any) => {
          const item = order.orderItems?.[0];
          if (!item) return null;
          const cacheKey = `${item.accessoryId ? "a" + item.accessoryId : ""}${item.terrariumVariantId ? "v" + item.terrariumVariantId : ""}`;
          if (cache[cacheKey]) return { key: order.orderId, ...cache[cacheKey] };
          const info = await fetchItemInfo(item);
          cache[cacheKey] = info;
          return { key: order.orderId, ...info };
        });
        const infos = await Promise.all(promises);

        const infoObj: any = {};
        infos.forEach((info) => {
          if (info) infoObj[info.key] = { name: info.name, image: info.image };
        });
        setItemInfos(infoObj);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const getStatusVN = (status: string) => statusMap[status] || status;

  const filteredOrders = orders.filter((order) => {
    const info = itemInfos[order.orderId] || {};
    const name = info.name || "Sản phẩm";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusVN = getStatusVN(order.status);
    const matchesFilter = filter === "Tất cả" || statusVN === filter;
    return matchesSearch && matchesFilter;
  });

  // 🆕 Cắt dữ liệu theo trang
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  return (
    <div className="container mx-auto py-8 px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Đơn Mua</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <SearchOutlined className="absolute left-3 top-2 text-gray-400" />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2 border-b border-gray-200">
          {filterOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-t-md font-medium transition-colors ${
                filter === status
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order) => {
              const info = itemInfos[order.orderId] || {};
              return (
                <OrderItem
                  key={order.orderId}
                  name={info.name || "Sản phẩm"}
                  price={order.totalAmount}
                  image={info.image || "/default.jpg"}
                  date={
                    order.orderDate
                      ? new Date(order.orderDate).toLocaleDateString("vi-VN")
                      : ""
                  }
                  status={getStatusVN(order.status)}
                  onClick={() => navigate(`/order/${order.orderId}`)}
                />
              );
            })
          ) : (
            <p className="text-center text-gray-500">Không có đơn hàng nào.</p>
          )}
        </div>
      )}

      {/* 🆕 Pagination */}
      {filteredOrders.length > pageSize && (
        <div className="flex justify-center mt-6">
          <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredOrders.length}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          showSizeChanger
        />

        </div>
      )}
    </div>
  );
};

export default Orders;
