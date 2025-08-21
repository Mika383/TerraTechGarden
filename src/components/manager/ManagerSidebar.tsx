import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Plus, 
  List, 
  ArrowLeft, 
  Shapes, 
  Palette,
  ChevronDown,
  ChevronRight,
  Settings,
  Grid3X3,
  Layers,
  Package2,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const ManagerSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuTitle]: !prev[menuTitle]
    }));
  };

  const menuItems = [
    {
      title: 'Tổng quan',
      icon: Home,
      path: '/manager/dashboard',
      color: 'text-blue-600'
    },
    {
      title: 'Quản lý Terrarium',
      icon: Package2,
      color: 'text-green-600',
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
      title: 'Quản lý Phụ kiện',
      icon: Settings,
      color: 'text-purple-600',
      submenu: [
        {
          title: 'Danh sách Phụ kiện',
          icon: List,
          path: '/manager/accessory/list',
        },
        {
          title: 'Thêm Phụ kiện',
          icon: Plus,
          path: '/manager/accessory/create',
        },
      ],
    },
    {
      title: 'Quản lý Danh mục',
      icon: Grid3X3,
      color: 'text-orange-600',
      submenu: [
        {
          title: 'Danh sách Danh mục',
          icon: List,
          path: '/manager/category/list',
        },
        {
          title: 'Thêm Danh mục',
          icon: Plus,
          path: '/manager/category/create',
        },
      ],
    },
    {
      title: 'Quản lý Hình dạng',
      icon: Shapes,
      color: 'text-indigo-600',
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
      color: 'text-pink-600',
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
    {
      title: 'Quản lý loại bể',
      icon: Layers,
      color: 'text-teal-600',
      submenu: [
        {
          title: 'Danh sách loại bể',
          icon: List,
          path: '/manager/tank-method/list',
        },
        {
          title: 'Thêm loại bể',
          icon: Plus,
          path: '/manager/tank-method/create',
        },
      ],
    },
    {
      title: 'Quản lý danh mục gói quà',
      icon: Package,
      color: 'text-amber-600',
      submenu: [
        {
          title: 'Danh sách danh mục gói quà',
          icon: List,
          path: '/manager/combo-category/list',
        },
        {
          title: 'Thêm danh mục gói quà',
          icon: Plus,
          path: '/manager/combo-category/create',
        },
      ],
    },
     {
      title: 'Quản lý gói quà',
      icon: Package,
      color: 'text-amber-600',
      submenu: [
        {
          title: 'Danh sách gói quà',
          icon: List,
          path: '/manager/combo/list',
        },
        {
          title: 'Thêm gói quà',
          icon: Plus,
          path: '/manager/combo/create',
        },
      ],
    },
  ];

  const MenuItem = ({ item, isSubmenu = false }: { item: any; isSubmenu?: boolean }) => {
    const Icon = item.icon;
    const isExpanded = expandedMenus[item.title];

    if (item.submenu) {
      return (
        <div className="mb-1">
          <button
            onClick={() => toggleMenu(item.title)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1 rounded-md ${item.color || 'text-gray-600'} bg-gray-100 group-hover:bg-white transition-colors`}>
                <Icon className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.title}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="transition-transform duration-200">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
          </button>
          
          {!isCollapsed && (
            <div className={`ml-6 mt-1 space-y-1 transition-all duration-300 overflow-hidden ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              {item.submenu.map((subItem: any, index: number) => (
                <MenuItem key={index} item={subItem} isSubmenu={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            isSubmenu ? 'ml-2' : ''
          } ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
          }`
        }
      >
        <div className={`p-1 rounded-md transition-colors ${
          isSubmenu 
            ? 'bg-transparent' 
            : 'bg-gray-100 group-hover:bg-white'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isCollapsed && (
          <span className="font-medium text-sm">{item.title}</span>
        )}
      </NavLink>
    );
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl border-r border-gray-100 transition-all duration-300 flex flex-col h-full`}>
      {/* Header */}
      <div className={`p-4 border-b border-gray-100 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-800">Bảng điều khiển quản lý</h2>
                <p className="text-xs text-gray-500">Quản lý hệ thống</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <Menu className="w-4 h-4 text-gray-600" />
            ) : (
              <X className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group"
        >
          <div className="p-1 rounded-md bg-gray-100 group-hover:bg-red-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <span className="font-medium text-sm">Trở về trang chủ</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ManagerSidebar;