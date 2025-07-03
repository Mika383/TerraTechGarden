// AdminDashboard.tsx
import React from 'react';
import ManagerHeader from '../../components/manager/ManagerHeader';
import ManagerSidebar from '../../components/manager/ManagerSidebar';
import TerrariumList from '../../components/manager/TerrariumList';

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* <ManagerSidebar /> */}
      <div className="flex-1 flex flex-col">
        {/* <ManagerHeader /> */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Bảng Điều Khiển Quản Trị</h1>
          <p className="text-gray-600 mb-6">Tổng quan và quản lý terrarium</p>
          <TerrariumList />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;