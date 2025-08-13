import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Card, Steps, Divider, Tag, Button } from "antd";
import { 
  ArrowLeftOutlined, 
  ShoppingOutlined, 
  CarOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined 
} from "@ant-design/icons";

const { Step } = Steps;

interface OrderItem {
  orderItemId: number;
  orderId: number;
  accessoryId: number | null;
  terrariumVariantId: number | null;
  accessoryQuantity: number | null;
  terrariumVariantQuantity: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderItemWithInfo extends OrderItem {
  name: string;
  image: string;
}

interface Order {
  orderId: number;
  userId: number;
  voucherId: number;
  deposit: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  shippingAddress: string;
  customerNote: string;
  recipientName: string;
  recipientPhone: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "orange" },
  shipping: { label: "Đang vận chuyển", color: "blue" },
  completed: { label: "Hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

// Hàm lấy thông tin sản phẩm (tương tự checkout)
const fetchItemInfo = async (item: OrderItem) => {
  if (item.accessoryId) {
    const res = await fetch(`https://terarium.shop/api/Accessory/get/${item.accessoryId}`);
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

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("ID đơn hàng không hợp lệ");
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin order items
      const orderItemsResponse = await fetch(
        `https://terarium.shop/api/OrderItem/get-by-order/${orderId}`
      );
      
      if (!orderItemsResponse.ok) {
        throw new Error("Không thể lấy thông tin đơn hàng");
      }
      
      const orderItemsData: OrderItem[] = await orderItemsResponse.json();
      
      // Lấy thông tin chi tiết cho từng item
      const itemsWithInfo = await Promise.all(
        orderItemsData.map(async (item) => {
          const info = await fetchItemInfo(item);
          return {
            ...item,
            name: info.name,
            image: info.image,
          };
        })
      );
      
      setOrderItems(itemsWithInfo);
      
      // Mock order data - trong thực tế bạn sẽ cần API để lấy thông tin order
      // Tạm thời tạo mock data dựa trên orderItems
      if (itemsWithInfo.length > 0) {
        const mockOrder: Order = {
          orderId: parseInt(orderId || "0"),
          userId: 1,
          voucherId: 0,
          deposit: 0,
          totalAmount: itemsWithInfo.reduce((sum, item) => sum + item.totalPrice, 0),
          status: "shipping", // Mock status
          orderDate: new Date().toISOString(),
          shippingAddress: "123 Đường ABC, Quận 1, TP.HCM",
          customerNote: "Giao hàng vào buổi chiều",
          recipientName: "Nguyễn Văn A",
          recipientPhone: "0123456789",
        };
        setOrder(mockOrder);
      }
      
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const getOrderStep = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "shipping":
        return 1;
      case "completed":
        return 2;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const getStepStatus = (status: string) => {
    if (status === "cancelled") return "error";
    return "process";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8 px-6 text-center">
        <div className="text-red-500 text-xl mb-4">
          {error || "Không tìm thấy đơn hàng"}
        </div>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate("/orders")}
        >
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const statusInfo = statusMap[order.status] || { label: order.status, color: "default" };

  return (
    <div className="container mx-auto py-8 px-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/orders")}
          >
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            Đơn hàng #{order.orderId}
          </h1>
        </div>
        <Tag color={statusInfo.color} className="text-lg px-4 py-1">
          {statusInfo.label}
        </Tag>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái - Thông tin vận chuyển & Chi tiết đơn hàng */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tiến trình vận chuyển */}
          <Card title="Tiến trình vận chuyển" className="shadow-sm">
            {order.status !== "cancelled" ? (
              <Steps 
                current={getOrderStep(order.status)} 
                status={getStepStatus(order.status)}
                direction="vertical"
              >
                <Step
                  title="Chờ thanh toán"
                  description="Đơn hàng đang chờ thanh toán"
                  icon={<ClockCircleOutlined />}
                />
                <Step
                  title="Đang vận chuyển"
                  description="Đơn hàng đang được vận chuyển"
                  icon={<CarOutlined />}
                />
                <Step
                  title="Hoàn thành"
                  description="Đơn hàng đã được giao thành công"
                  icon={<CheckCircleOutlined />}
                />
              </Steps>
            ) : (
              <div className="text-center py-8">
                <div className="text-red-500 text-xl mb-2">Đơn hàng đã bị hủy</div>
                <p className="text-gray-500">Đơn hàng của bạn đã bị hủy</p>
              </div>
            )}
          </Card>

          {/* Thông tin giao hàng */}
          <Card title="Thông tin giao hàng" className="shadow-sm">
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Người nhận: </span>
                <span>{order.recipientName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Số điện thoại: </span>
                <span>{order.recipientPhone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Địa chỉ: </span>
                <span>{order.shippingAddress}</span>
              </div>
              {order.customerNote && (
                <div>
                  <span className="font-medium text-gray-700">Ghi chú: </span>
                  <span className="italic">{order.customerNote}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Sản phẩm trong đơn hàng */}
          <Card title="Sản phẩm đã đặt" className="shadow-sm">
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.orderItemId} className="flex items-center p-4 border rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-600">
                      Đơn giá: {item.unitPrice.toLocaleString("vi-VN")} VND
                    </p>
                    <p className="text-gray-600">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      {item.totalPrice.toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Cột phải - Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <Card title="Tóm tắt đơn hàng" className="shadow-sm sticky top-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-medium">#{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="font-medium">
                  {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              </div>
              
              <Divider />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>
                    {orderItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString("vi-VN")} VND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>30.000 VND</span>
                </div>
                {order.deposit > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Đặt cọc:</span>
                    <span>{order.deposit.toLocaleString("vi-VN")} VND</span>
                  </div>
                )}
              </div>
              
              <Divider />
              
              <div className="flex justify-between text-xl font-bold text-green-600">
                <span>Tổng cộng:</span>
                <span>{order.totalAmount.toLocaleString("vi-VN")} VND</span>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-2">
                {order.status === "pending" && (
                  <Button type="primary" block size="large">
                    Thanh toán ngay
                  </Button>
                )}
                {order.status === "shipping" && (
                  <Button block size="large">
                    Theo dõi đơn hàng
                  </Button>
                )}
                {order.status === "completed" && (
                  <Button type="primary" block size="large">
                    Mua lại
                  </Button>
                )}
                {(order.status === "pending" || order.status === "shipping") && (
                  <Button danger block>
                    Hủy đơn hàng
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;