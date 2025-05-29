import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';

interface Shape {
  id: number;
  name: string;
  description: string;
  image: string;
  createdAt: string;
}

const ShapeList: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with API call
  useEffect(() => {
    const mockData: Shape[] = [
      {
        id: 1,
        name: 'Hình cầu',
        description: 'Hình dạng tròn, phù hợp cho các terrarium nhỏ gọn',
        image: '/images/shape1.jpg',
        createdAt: '2024-01-15',
      },
      {
        id: 2,
        name: 'Hình hộp',
        description: 'Hình dạng hộp chữ nhật, lý tưởng cho các terrarium lớn',
        image: '/images/shape2.jpg',
        createdAt: '2024-01-10',
      },
    ];
    setShapes(mockData);
  }, []);

  const filteredShapes = shapes.filter((shape) =>
    shape.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hình dạng này?')) {
      setShapes(shapes.filter((s) => s.id !== id));
    }
  };

  // Use a local placeholder image or a reliable external service
  const placeholderImage = '/assets/placeholder.jpg';

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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Hình ảnh</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mô tả</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShapes.map((shape) => (
                <tr key={shape.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {/* <img
                      src={shape.image}
                      alt={shape.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        if (e.currentTarget.src !== placeholderImage) {
                          console.warn(`Failed to load image: ${shape.image}`);
                          e.currentTarget.src = placeholderImage;
                        }
                      }}
                    /> */}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{shape.name}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{shape.description}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(shape.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/shape/${shape.id}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/manager/shape/edit/${shape.id}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(shape.id)}
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

        {filteredShapes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy hình dạng nào phù hợp với tiêu chí tìm kiếm
          </div>
        )}
      </div>
    </div>
  );
};

export default ShapeList;