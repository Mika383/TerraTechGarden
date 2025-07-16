import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search, Image as ImageIcon } from 'lucide-react';
import { notification } from 'antd';

interface Accessory {
  accessoryId: number;
  name: string;
  description: string;
  price: number;
}

interface TerrariumImage {
  terrariumImageId: number;
  terrariumId: number;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
}

interface Terrarium {
  terrariumId: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  status: string;
  environments: string[];
  shapes: string[];
  tankMethods: string[];
  accessories: Accessory[];
  createdAt: string;
  updatedAt: string;
  bodyHTML: string;
  terrariumImages: TerrariumImage[];
}

const TerrariumList: React.FC = () => {
  const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch terrariums from API
  useEffect(() => {
    const fetchTerrariums = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://terarium.shop/api/Terrarium/get-all');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setTerrariums(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch terrariums');
        }
      } catch (error) {
        console.error('Error fetching terrariums:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching terrariums');
        notification.error({
          message: 'Lỗi',
          description: error instanceof Error ? error.message : 'An error occurred while fetching terrariums',
          placement: 'topRight',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTerrariums();
  }, []);

  const filteredTerrariums = terrariums.filter((terrarium) =>
    terrarium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terrarium.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa terrarium này?')) {
      try {
        const response = await fetch(`https://terarium.shop/api/Terrarium/delete-terraium-${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove from local state
        setTerrariums(terrariums.filter((t) => t.terrariumId !== id));
        notification.success({
          message: 'Thành công',
          description: 'Terrarium đã được xóa thành công!',
          placement: 'topRight',
        });
      } catch (error) {
        console.error('Error deleting terrarium:', error);
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi xóa terrarium',
          placement: 'topRight',
        });
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPrimaryImage = (images: TerrariumImage[]) => {
    return images.find(img => img.isPrimary) || images[0];
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Hình ảnh</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mô tả</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số lượng tồn</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Môi trường</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Hình dạng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Phương pháp bể</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Phụ kiện</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTerrariums.map((terrarium) => {
                const primaryImage = getPrimaryImage(terrarium.terrariumImages);
                return (
                  <tr key={terrarium.terrariumId} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{terrarium.terrariumId}</td>
                    <td className="py-3 px-4">
                      {primaryImage ? (
                        <img
                          src={primaryImage.imageUrl}
                          alt={primaryImage.altText}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{terrarium.name}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{terrarium.description}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {formatPrice(terrarium.price)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{terrarium.stock}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(terrarium.status)}`}>
                        {getStatusText(terrarium.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {terrarium.environments.length > 0
                        ? terrarium.environments.join(', ')
                        : 'Không có'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {terrarium.shapes.length > 0
                        ? terrarium.shapes.join(', ')
                        : 'Không có'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {terrarium.tankMethods.length > 0
                        ? terrarium.tankMethods.join(', ')
                        : 'Không có'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {terrarium.accessories.length > 0 ? (
                        <div className="space-y-1">
                          {terrarium.accessories.slice(0, 2).map((accessory) => (
                            <div key={accessory.accessoryId} className="text-xs">
                              {accessory.name}
                            </div>
                          ))}
                          {terrarium.accessories.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{terrarium.accessories.length - 2} khác
                            </div>
                          )}
                        </div>
                      ) : (
                        'Không có'
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(terrarium.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/terrarium/${terrarium.terrariumId}`}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/manager/terrarium/edit/${terrarium.terrariumId}`}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(terrarium.terrariumId)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTerrariums.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy terrarium nào phù hợp với tiêu chí tìm kiếm
          </div>
        )}
      </div>
    </div>
  );
};

export default TerrariumList;