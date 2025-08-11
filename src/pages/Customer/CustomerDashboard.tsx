// src/pages/Customer/CustomerDashboard.tsx
import React, { useEffect, useState } from 'react';
import ProfileHeader from '../../components/customer/Dashboard/ProfileHeader';
import ReviewSection from '../../components/customer/Dashboard/ReviewSection';
import AddressSection from '../../components/customer/Dashboard/AddressSection';
import OrderItem from '../../components/customer/Dashboard/OrderItem';
import { message, Spin } from 'antd';
import { getOrdersByUser } from '@/api/order';
import { Order } from '@/types/order';
import { useAuth } from '@/hooks/useAuth';

const CustomerDashboard: React.FC = () => {
  const { userId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoadingOrders(true);
        const res = await getOrdersByUser(userId);
        setOrders(res || []);
      } catch (err: any) {
        message.error(err?.message || 'Không thể tải đơn hàng');
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [userId]);

  return (
    <div className="container mx-auto py-12 px-6">
      {/* Header hồ sơ */}
      <ProfileHeader />

      {/* Địa chỉ */}
      <AddressSection />

      {/* Đơn hàng */}
      <h2 className="text-2xl font-bold mb-4 mt-8">Đơn Mua</h2>
      {loadingOrders ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : orders.length > 0 ? (
        orders.map((order, index) => {
          const firstItem = order.orderItems?.[0];
          return (
            <OrderItem
              key={index}
              name={
                firstItem?.accessoryId
                  ? `Phụ kiện #${firstItem.accessoryId}`
                  : firstItem?.terrariumVariantId
                  ? `Terrarium variant #${firstItem.terrariumVariantId}`
                  : 'Sản phẩm'
              }
              price={firstItem?.totalPrice || 0}
              image={'/default.jpg'} // TODO: Có API lấy ảnh sản phẩm thì thay vào đây
              date={order.orderDate}
              status={String(order.status)}
            />
          );
        })
      ) : (
        <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
      )}

      {/* Review - TODO: load từ API nếu có */}
      <ReviewSection reviews={[]} />
    </div>
  );
};

export default CustomerDashboard;
