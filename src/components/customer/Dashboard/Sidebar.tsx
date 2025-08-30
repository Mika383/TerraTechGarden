
// Sidebar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  WalletOutlined,
  MailOutlined, 
  UserOutlined, 
  ShoppingCartOutlined, 
  HeartOutlined, 
  StarOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Xử lý logic đăng xuất ở đây
    // Ví dụ: xóa token, redirect về trang login
    localStorage.removeItem('token'); // hoặc logic đăng xuất khác
    navigate('/login');
  };

  const menuItems = [
    { name: 'Tài khoản của tôi', path: '/customer-dashboard', icon: <UserOutlined /> },
    { name: 'Thông báo', path: '/customer-dashboard/notifications', icon: <MailOutlined /> },
    { name: 'Đơn mua', path: '/customer-dashboard/orders', icon: <ShoppingCartOutlined /> },
    { name: 'Yêu thích', path: '/customer-dashboard/favorites', icon: <HeartOutlined /> },
    { name: 'Tạo Layout Terrarium', path: '/customer-dashboard/create-layout', icon: <ExperimentOutlined /> },
    { name: 'Layout của tôi', path: '/customer-dashboard/my-layouts', icon: <AppstoreOutlined /> },
    { name: 'Trò chuyện với staff', path: '/customer-dashboard/chat', icon: <MessageOutlined /> },
    { name: 'Ví của tôi', path: '/customer-dashboard/wallet', icon: <WalletOutlined /> }
  ];

  return (
    <div className="fixed left-0 w-64 h-full bg-white shadow-xl border-r border-gray-200">
      {/* Navigation Menu */}
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={item.name}
                  className={`group flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ease-in-out ${
                    isActive 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-green-600 hover:pl-4'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <span className={`mr-3 text-lg transition-all duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-green-600'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 ease-in-out group"
          >
            <LogoutOutlined className="mr-3 text-lg group-hover:transform group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-sm">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;