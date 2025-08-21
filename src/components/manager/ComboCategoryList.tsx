import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface ComboCategory {
  comboCategoryId: number;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  totalCombos: number;
  activeCombos: number;
  createdAt: string;
}

const ComboCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<ComboCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://terarium.shop/api/ComboCategories?includeInactive=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setCategories(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching categories');
        toast.error('Không thể tải danh sách danh mục gói quà');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://terarium.shop/api/ComboCategories/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove from local state
        setCategories(categories.filter((c) => c.comboCategoryId !== id));
        toast.success('Danh mục đã được xóa thành công!');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Có lỗi xảy ra khi xóa danh mục');
      }
    }
  };

  const toggleActive = async (category: ComboCategory) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/ComboCategories/${category.comboCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          comboCategoryId: category.comboCategoryId,
          name: category.name,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: !category.isActive,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setCategories(categories.map(c => 
        c.comboCategoryId === category.comboCategoryId 
          ? { ...c, isActive: !c.isActive }
          : c
      ));
      
      toast.success(`Danh mục đã được ${!category.isActive ? 'kích hoạt' : 'vô hiệu hóa'}!`);
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái danh mục');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <div className="text-red-500">⌘</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục Gói quà</h1>
          <p className="text-gray-600">Quản lý danh sách danh mục gói quà combo trong hệ thống</p>
        </div>
        <Link
          to="/manager/combo-category/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Danh mục</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục gói quà..."
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
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thứ tự</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Tổng combo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Combo hoạt động</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.comboCategoryId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{category.comboCategoryId}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{category.name}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{category.description}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{category.displayOrder}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{category.totalCombos}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{category.activeCombos}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActive(category)}
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        category.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {category.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3" />
                          <span>Hoạt động</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3" />
                          <span>Tạm dừng</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600 text-sm">
                    {formatDate(category.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/manager/combo-category/edit/${category.comboCategoryId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(category.comboCategoryId)}
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

        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy danh mục nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có danh mục gói quà nào'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboCategoryList;