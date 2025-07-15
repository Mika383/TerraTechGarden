import { useNavigate } from 'react-router-dom';
import { HomeIcon, UsersIcon, CurrencyDollarIcon, CogIcon, ChartBarIcon, ChevronDownIcon, ShoppingCartIcon, CalendarDaysIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useState } from 'react'; 

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const toggleOrderDropdown = () => {
    setIsOrderDropdownOpen(!isOrderDropdownOpen);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-blue-50 to-white p-6 shadow-lg h-screen">
      <h2 className="text-2xl font-bold text-blue-700 mb-8 border-b-2 border-blue-200 pb-2">Admin Dashboard</h2>
      <ul className="space-y-2">
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/admin/overview')}
        >
          <HomeIcon className="h-6 w-6" />
          <span>Tổng quan</span>
        </li>
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/admin/accounts')}
        >
          <UsersIcon className="w-6 h-6" />
          <span>Quản lý tài khoản</span>
        </li>
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={toggleOrderDropdown}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <span>Quản lý đơn hàng</span>
          <ChevronDownIcon
            className={`h-5 w-5 ml-auto transition-transform ${isOrderDropdownOpen ? 'rotate-180' : ''}`}
          />
        </li>
        {isOrderDropdownOpen && (
          <ul className="ml-8 mt-1 space-y-1">
            <li
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => navigate('/admin/orders/all')}
            >
              Tổng đơn
            </li>
            <li
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => navigate('/admin/orders/preparing')}
            >
              Đang chuẩn bị hàng
            </li>
            <li
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => navigate('/admin/orders/shipping')}
            >
              Đang vận chuyển
            </li>
            <li
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => navigate('/admin/orders/completed')}
            >
              Đã hoàn thành
            </li>
            <li
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => navigate('/admin/orders/canceled')}
            >
              Đã hủy
            </li>
          </ul>
        )}
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/admin/revenue')}
        >
          <CurrencyDollarIcon className="h-6 w-6" />
          <span>Quản lý doanh thu</span>
        </li>
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/admin/settings')}
        >
          <CogIcon className="h-6 w-6" />
          <span>Cài đặt hệ thống</span>
        </li>
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/admin/statistics')}
        >
          <ChartBarIcon className="h-6 w-6" />
          <span>Báo cáo & Thống kê</span>
        </li>
        <li
          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/admin/shift-management')}
        >
          <CalendarIcon className="h-6 w-6" />
          <span>Quản lý ca làm</span>
        </li>
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