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

    </div>
  );
};

export default CustomerDashboard;
