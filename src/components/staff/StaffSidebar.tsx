import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, MessageSquare, ArrowLeft } from 'lucide-react';

const StaffSidebar: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Tổng quan',
      icon: Home,
      path: '/staff/dashboard',
    },
    {
      title: 'Quản lý Đơn hàng',
      icon: ShoppingCart,
      submenu: [
        {
          title: 'Danh sách Đơn hàng',
          icon: ShoppingCart,
          path: '/staff/order/list',
        },
        {
          title: 'Đơn hàng đang xử lý',
          icon: ShoppingCart,
          path: '/staff/order/pending',
        },
      ],
    },
    {
      title: 'Chăm sóc Khách hàng',
      icon: MessageSquare,
      submenu: [
        {
          title: 'Tin nhắn Khách hàng',
          icon: MessageSquare,
          path: '/staff/support/messages',
        },
        {
          title: 'Yêu cầu Hỗ trợ',
          icon: MessageSquare,
          path: '/staff/support/requests',
        },
      ],
    },
  ];

  const MenuItem = ({ item, isSubmenu = false }: { item: any; isSubmenu?: boolean }) => {
    const Icon = item.icon;

    if (item.submenu) {
      return (
        <div className="mb-2">
          <div className="flex items-center space-x-3 px-3 py-2 text-gray-700 font-medium">
            <Icon className="w-5 h-5" />
            <span>{item.title}</span>
          </div>
          <div className="ml-4">
            {item.submenu.map((subItem: any, index: number) => (
              <MenuItem key={index} item={subItem} isSubmenu={true} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
            isSubmenu ? 'ml-4' : ''
          } ${
            isActive
              ? 'bg-green-500 text-white'
              : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
          }`
        }
      >
        <Icon className="w-5 h-5" />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Staff Panel</h2>
            <p className="text-sm text-gray-500">Quản lý đơn hàng & hỗ trợ</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Trở về trang chủ</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default StaffSidebar;