import React from 'react';
import StaffHeader from '../../components/staff/StaffHeader';
import StaffSidebar from '../../components/staff/StaffSidebar';
import OrderList from '../../components/staff/OrderList';
import ChatWithCustomer from '@/components/staff/ChatWithCustomer';

const StaffDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffSidebar />
      <div className="flex-1 flex flex-col">
        <StaffHeader />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Bảng Điều Khiển Nhân Viên</h1>
          <p className="text-gray-600 mb-6">Tổng quan và quản lý đơn hàng</p>
          {/* <OrderList /> */}
          <ChatWithCustomer/>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;