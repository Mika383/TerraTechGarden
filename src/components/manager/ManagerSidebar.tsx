import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Plus, List, ArrowLeft, Shapes, Palette } from 'lucide-react';

const ManagerSidebar: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Tổng quan',
      icon: Home,
      path: '/manager-dashboard',
    },
    {
      title: 'Quản lý Terrarium',
      icon: Package,
      submenu: [
        {
          title: 'Danh sách Terrarium',
          icon: List,
          path: '/manager/terrarium/list',
        },
        {
          title: 'Thêm Terrarium',
          icon: Plus,
          path: '/manager/terrarium/create',
        },
      ],
    },
    {
      title: 'Quản lý Hình dạng',
      icon: Shapes,
      submenu: [
        {
          title: 'Danh sách Hình dạng',
          icon: List,
          path: '/manager/shape/list',
        },
        {
          title: 'Thêm Hình dạng',
          icon: Plus,
          path: '/manager/shape/create',
        },
      ],
    },
    {
      title: 'Quản lý Chủ đề',
      icon: Palette,
      submenu: [
        {
          title: 'Danh sách Chủ đề',
          icon: List,
          path: '/manager/theme/list',
        },
        {
          title: 'Thêm Chủ đề',
          icon: Plus,
          path: '/manager/theme/create',
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
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Manager Panel</h2>
            <p className="text-sm text-gray-500">Quản lý hệ thống</p>
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

export default ManagerSidebar;