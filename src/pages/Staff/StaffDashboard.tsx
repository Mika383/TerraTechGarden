// pages/StaffDashboard.tsx
import { useNavigate } from 'react-router-dom';

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-blue-50 p-4">
        <h2 className="text-xl font-bold mb-6">Staff Dashboard</h2>
        <ul className="space-y-4">
          <li className="flex items-center space-x-2 text-blue-600">
            <span>🏠</span>
            <span>Tổng quan</span>
          </li>
          <li className="flex items-center space-x-2">
            <span>📦</span>
            <span>Quản lý đơn hàng</span>
          </li>
          <li className="flex items-center space-x-2">
            <span>📞</span>
            <span>Hỗ trợ khách hàng</span>
          </li>
          <li className="mt-6">
            <button
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              onClick={() => navigate('/')}
            >
              Trở về
            </button>
          </li>
        </ul>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold mb-6">Bảng Điều Khiển Nhân Viên</h1>
        <p>Đây là giao diện riêng biệt cho nhân viên, không sử dụng Navbar hoặc Footer.</p>
        {/* Thêm các thành phần như danh sách đơn hàng, thông tin khách hàng, v.v. */}
      </div>
    </div>
  );
};

export default StaffDashboard;