import React from 'react';
import { Outlet } from 'react-router-dom';
import ManagerHeader from './ManagerHeader';
import ManagerSidebar from './ManagerSidebar';

const ManagerLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ManagerSidebar />
      <div className="flex-1 flex flex-col">
        <ManagerHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;