import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';

interface Shape {
  shapeId: number;
  shapeName: string;
  shapeDescription: string;
  shapeMaterial: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: Shape[];
}

const ShapeList: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shapes from API
  useEffect(() => {
    const fetchShapes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage

        const response = await fetch('https://terarium.shop/api/Shape/get-all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            // Optionally redirect to login page
            // window.location.href = '/login';
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (result.status === 200) {
          setShapes(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch shapes');
        }
      } catch (error) {
        console.error('Error fetching shapes:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        toast.error('Không thể tải danh sách hình dạng');
      } finally {
        setLoading(false);
      }
    };

    fetchShapes();
  }, []);

  const filteredShapes = shapes.filter((shape) =>
    shape.shapeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shape.shapeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shape.shapeMaterial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hình dạng này?')) {
      try {
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await fetch(`https://terarium.shop/api/Shape/delete-shape/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            // Optionally redirect to login page
            // window.location.href = '/login';
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove from local state
        setShapes(shapes.filter((s) => s.shapeId !== id));
        toast.success('Xóa hình dạng thành công');
      } catch (error) {
        console.error('Error deleting shape:', error);
        toast.error('Không thể xóa hình dạng');
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lỗi: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Hình dạng</h1>
          <p className="text-gray-600">Quản lý danh sách hình dạng terrarium trong hệ thống</p>
        </div>
        <Link
          to="/manager/shape/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Hình dạng</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm hình dạng..."
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mô tả</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Chất liệu</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShapes.map((shape) => (
                <tr key={shape.shapeId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{shape.shapeId}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{shape.shapeName}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{shape.shapeDescription}</td>
                  <td className="py-3 px-4 text-gray-600">{shape.shapeMaterial}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      {/* <Link
                        to={`/shape/${shape.shapeId}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link> */}
                      <Link
                        to={`/manager/shape/edit/${shape.shapeId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(shape.shapeId)}
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

        {filteredShapes.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy hình dạng nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có hình dạng nào được tạo'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShapeList;