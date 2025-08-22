import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MailOutlined, 
  UserOutlined, 
  ShoppingCartOutlined, 
  HeartOutlined, 
  StarOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  ExperimentOutlined,
  AppstoreOutlined 
} from '@ant-design/icons';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Tài khoản của tôi', path: '/customer-dashboard', icon: <UserOutlined /> },
    { name: 'Thông báo', path: '/customer-dashboard/notifications', icon: <MailOutlined /> },
    { name: 'Đơn mua', path: '/customer-dashboard/orders', icon: <ShoppingCartOutlined /> },
    { name: 'Đánh giá của tôi', path: '/customer-dashboard/reviews', icon: <ShoppingCartOutlined /> },
    { name: 'Yêu thích', path: '/customer-dashboard/favorites', icon: <HeartOutlined /> },
    { name: 'Wishlist', path: '/customer-dashboard/wishlist', icon: <StarOutlined /> },
    { name: 'Tạo Layout Terrarium', path: '/customer-dashboard/create-layout', icon: <ExperimentOutlined /> },
    { name: 'Layout của tôi', path: '/customer-dashboard/my-layouts', icon: <AppstoreOutlined /> },
    { name: 'Layout đã lưu', path: '/customer-dashboard/layouts', icon: <FileTextOutlined /> },
    { name: 'Trò chuyện với staff', path: '/customer-dashboard/chat', icon: <MessageOutlined /> },
  ];

  return (
    <div className="w-64 bg-white shadow-lg p-6 min-h-screen">
      <h2 className="text-2xl font-bold text-green-600 mb-6">Terrarium Dashboard</h2>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
              location.pathname === item.path ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;