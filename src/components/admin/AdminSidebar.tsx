// src/components/admin/AdminSidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CogIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ShoppingCartIcon,
  CalendarIcon,
  BookOpenIcon,
  SparklesIcon,       // ✅ gói thành viên
  TicketIcon,         // ✅ voucher
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ bỏ dropdown đơn hàng
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-50 to-white p-6 shadow-lg h-screen">
      <h2 className="text-2xl font-bold text-blue-700 mb-8 border-b-2 border-blue-200 pb-2">
        Admin Dashboard
      </h2>

      <ul className="space-y-2">
        <li
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
            isActive('/admin/overview')
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
          onClick={() => navigate('/admin/overview')}
        >
          <HomeIcon className="h-6 w-6" />
          <span>Tổng quan</span>
        </li>

        <li
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
            isActive('/admin/accounts')
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
          onClick={() => navigate('/admin/accounts')}
        >
          <UsersIcon className="h-6 w-6" />
          <span>Quản lý tài khoản</span>
        </li>

        {/* ✅ Đơn hàng: 1 item, không dropdown */}
        <li
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
            isActive('/admin/orders')
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
          onClick={() => navigate('/admin/orders')}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <span>Quản lý đơn hàng</span>
        </li>

        {/* ✅ Gói thành viên */}
        <li
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
            isActive('/admin/memberships')
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
          onClick={() => navigate('/admin/memberships')}
        >
          <SparklesIcon className="h-6 w-6" />
          <span>Quản lý gói thành viên</span>
        </li>

        {/* ✅ Voucher */}
        <li
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
            isActive('/admin/vouchers')
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
          onClick={() => navigate('/admin/vouchers')}
        >
          <TicketIcon className="h-6 w-6" />
          <span>Quản lý voucher</span>
        </li>

        
       

        <li
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${
            isActive('/admin/statistics')
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
          }`}
          onClick={() => navigate('/admin/statistics')}
        >
          <ChartBarIcon className="h-6 w-6" />
          <span>Báo cáo & Thống kê</span>
        </li>

        

        {/* Bài viết: vẫn dropdown như cũ */}
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg cursor-pointer"
          onClick={() => setIsBlogDropdownOpen(!isBlogDropdownOpen)}
        >
          <BookOpenIcon className="h-6 w-6" />
          <span>Quản lý Bài viết</span>
          <ChevronDownIcon
            className={`h-5 w-5 ml-auto transition-transform ${
              isBlogDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </li>
        {isBlogDropdownOpen && (
          <ul className="ml-8 mt-1 space-y-1">
            <li
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isActive('/admin/blogs')
                  ? 'bg-blue-100 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => navigate('/admin/blogs')}
            >
              Bài viết
            </li>
            <li
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isActive('/admin/blog-categories')
                  ? 'bg-blue-100 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => navigate('/admin/blog-categories')}
            >
              Danh mục
            </li>
          </ul>
        )}

        <li className="mt-8">
          <button
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/')}
          >
            Trở về
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
