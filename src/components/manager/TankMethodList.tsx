import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';

interface TankMethod {
  tankMethodId: number;
  tankMethodType: string;
  tankMethodDescription: string;
  terrariumTankMethods: any[];
}

const TankMethodList: React.FC = () => {
  const [tankMethods, setTankMethods] = useState<TankMethod[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tank methods from API
  useEffect(() => {
    const fetchTankMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://terarium.shop/api/TankMethod');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setTankMethods(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch tank methods');
        }
      } catch (error) {
        console.error('Error fetching tank methods:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching tank methods');
      } finally {
        setLoading(false);
      }
    };

    fetchTankMethods();
  }, []);

  const filteredTankMethods = tankMethods.filter((method) =>
    method.tankMethodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.tankMethodDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phương pháp này?')) {
      try {
        const response = await fetch(`https://terarium.shop/api/TankMethod/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove from local state
        setTankMethods(tankMethods.filter((t) => t.tankMethodId !== id));
        alert('Phương pháp đã được xóa thành công!');
      } catch (error) {
        console.error('Error deleting tank method:', error);
        alert('Có lỗi xảy ra khi xóa phương pháp');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="text-red-500">❌</div>
          <div>
            <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phương pháp Tank</h1>
          <p className="text-gray-600">Quản lý danh sách phương pháp tank trong hệ thống</p>
        </div>
        <Link
          to="/manager/tank-method/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phương pháp</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm phương pháp..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Loại</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mô tả</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số terrarium</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTankMethods.map((method) => (
                <tr key={method.tankMethodId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{method.tankMethodId}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{method.tankMethodType}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{method.tankMethodDescription}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {method.terrariumTankMethods ? method.terrariumTankMethods.length : 0}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/tank-method/${method.tankMethodId}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/manager/tank-method/edit/${method.tankMethodId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(method.tankMethodId)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTankMethods.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy phương pháp nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có phương pháp nào'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TankMethodList;