// TerrariumList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';

interface Terrarium {
  id: number;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'inactive';
  image: string;
  description: string;
  createdAt: string;
}

const TerrariumList: React.FC = () => {
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - replace with API call
  useEffect(() => {
    const mockData: Terrarium[] = [
      {
        id: 1,
        name: 'Terrarium Rừng Nhiệt Đới',
        price: 250000,
        category: 'Tropical',
        status: 'active',
        image: '/images/terrarium1.jpg',
        description: 'Terrarium mô phỏng rừng nhiệt đới với thực vật xanh tươi',
        createdAt: '2024-01-15',
      },
      {
        id: 2,
        name: 'Terrarium Sa Mạc',
        price: 180000,
        category: 'Desert',
        status: 'active',
        image: '/images/terrarium2.jpg',
        description: 'Terrarium sa mạc với cây xương rồng và đá trang trí',
        createdAt: '2024-01-10',
      },
      {
        id: 3,
        name: 'Terrarium Rêu Xanh',
        price: 150000,
        category: 'Moss',
        status: 'inactive',
        image: '/images/terrarium3.jpg',
        description: 'Terrarium với rêu xanh tự nhiên',
        createdAt: '2024-01-05',
      },
    ];
    setTerrariums(mockData);
  }, []);

  const filteredTerrariums = terrariums.filter((terrarium) => {
    const matchesSearch = terrarium.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || terrarium.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || terrarium.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa terrarium này?')) {
      setTerrariums(terrariums.filter((t) => t.id !== id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Use a local placeholder image or a reliable external service
  const placeholderImage = '/assets/placeholder.jpg'; // Ensure this file exists in public/assets/

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Terrarium</h1>
          <p className="text-gray-600">Quản lý danh sách terrarium trong hệ thống</p>
        </div>
        <Link
          to="/manager/terrarium/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Terrarium</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm terrarium..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            <option value="Tropical">Nhiệt đới</option>
            <option value="Desert">Sa mạc</option>
            <option value="Moss">Rêu</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
          <div className="flex items-center text-gray-600">
            Tìm thấy {filteredTerrariums.length} kết quả
          </div>
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Danh mục</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTerrariums.map((terrarium) => (
                <tr key={terrarium.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img
                    //   src={terrarium.image}
                      alt={terrarium.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        // Prevent infinite loop by checking if the src is already the placeholder
                        if (e.currentTarget.src !== placeholderImage) {
                          console.warn(`Failed to load image: ${terrarium.image}`);
                          e.currentTarget.src = placeholderImage;
                        }
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{terrarium.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {terrarium.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {terrarium.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatPrice(terrarium.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        terrarium.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {terrarium.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(terrarium.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/terrarium/${terrarium.id}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/manager/terrarium/edit/${terrarium.id}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(terrarium.id)}
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

        {filteredTerrariums.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy terrarium nào phù hợp với tiêu chí tìm kiếm
          </div>
        )}
      </div>
    </div>
  );
};

export default TerrariumList;