
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100">
        <AdminHeader />
        <Outlet /> {/* Nội dung của trang sẽ hiển thị ở đây */}
      </div>
    </div>
  );
};

export default AdminLayout;