import React from 'react';
import OrderList from '../../components/staff/OrderList';
// import ChatWithCustomer from '@/components/staff/ChatWithCustomer';

const StaffDashboard: React.FC = () => {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bảng Điều Khiển Nhân Viên</h1>
      <p className="text-gray-600 mb-6">Tổng quan và quản lý đơn hàng</p>
      <OrderList />
      {/* <ChatWithCustomer/> */}
    </>
  );
};

export default StaffDashboard;