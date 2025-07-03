import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { notification, Modal } from 'antd';
import axios, { AxiosError } from 'axios';

interface Accessory {
  accessoryId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  status: string;
}

const AccessoryList: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://terarium.shop/api/Accessory/get-all');
        if (response.data.status === 200) {
          setAccessories(response.data.data);
        } else {
          notification.error({
            message: 'Lỗi',
            description: 'Không thể tải danh sách phụ kiện',
            placement: 'topRight',
          });
        }
      } catch (error) {
        console.error('Error fetching accessories:', error);
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi tải dữ liệu',
          placement: 'topRight',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAccessories();
  }, []);

  const filteredAccessories = accessories.filter((accessory) => {
    const matchesSearch = accessory.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || accessory.categoryId.toString() === filterCategory;
    const matchesStatus = filterStatus === 'all' || accessory.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phụ kiện này?')) {
      try {
        const response = await axios.delete(`https://terarium.shop/api/Accessory/delete-accessory${id}`);
        console.log('Delete response:', response); // Debug: Log full response
        console.log('Delete response data:', response.data); // Debug: Log response data

        // Check for success based on status code (200 OK or 204 No Content)
        if (response.status === 200 || response.status === 204) {
          setAccessories(accessories.filter((a) => a.accessoryId !== id));
          alert('Phụ kiện đã được xóa thành công!');
        } else {
          throw new Error(response.data.message || `Unexpected status code: ${response.status}`);
        }
      } catch (error: any) {
        console.error('Error deleting accessory:', error.response || error); // Debug: Log error details
        alert(`Có lỗi xảy ra khi xóa phụ kiện: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phụ kiện</h1>
          <p className="text-gray-600">Quản lý danh sách phụ kiện trong hệ thống</p>
        </div>
        <Link
          to="/manager/accessory/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phụ kiện</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm phụ kiện..."
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
            <option value="1">Danh mục 1</option>
            <option value="2">Danh mục 2</option>
            {/* Add more categories as needed */}
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
            Tìm thấy {filteredAccessories.length} kết quả
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Danh mục</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số lượng</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccessories.map((accessory) => (
                <tr key={accessory.accessoryId} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{accessory.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {accessory.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {`Danh mục ${accessory.categoryId}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatPrice(accessory.price)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {accessory.stock}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        accessory.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {accessory.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(accessory.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/accessory/${accessory.accessoryId}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/manager/accessory/edit/${accessory.accessoryId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(accessory.accessoryId)}
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

        {filteredAccessories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy phụ kiện nào phù hợp với tiêu chí tìm kiếm
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessoryList;