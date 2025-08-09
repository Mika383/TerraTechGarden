import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffHeader from './StaffHeader';
import StaffSidebar from './StaffSidebar';

const StaffLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;