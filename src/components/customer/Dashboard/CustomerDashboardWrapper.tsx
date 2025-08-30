import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const CustomerDashboardWrapper: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardWrapper;