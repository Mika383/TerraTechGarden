import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';

interface Theme {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
  terrariumEnvironments: any[];
}

const ThemeList: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch themes from API
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://terarium.shop/api/Environment');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setThemes(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch themes');
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching themes');
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  const filteredThemes = themes.filter((theme) =>
    theme.environmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.environmentDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) {
      try {
        const response = await fetch(`https://terarium.shop/api/Environment/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove from local state
        setThemes(themes.filter((t) => t.environmentId !== id));
        alert('Chủ đề đã được xóa thành công!');
      } catch (error) {
        console.error('Error deleting theme:', error);
        alert('Có lỗi xảy ra khi xóa chủ đề');
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chủ đề</h1>
          <p className="text-gray-600">Quản lý danh sách chủ đề terrarium trong hệ thống</p>
        </div>
        <Link
          to="/manager/theme/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Chủ đề</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm chủ đề..."
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số terrarium</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredThemes.map((theme) => (
                <tr key={theme.environmentId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{theme.environmentId}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{theme.environmentName}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{theme.environmentDescription}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {theme.terrariumEnvironments ? theme.terrariumEnvironments.length : 0}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        to={`/theme/${theme.environmentId}`}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/manager/theme/edit/${theme.environmentId}`}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(theme.environmentId)}
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

        {filteredThemes.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Không tìm thấy chủ đề nào phù hợp với tiêu chí tìm kiếm' : 'Chưa có chủ đề nào'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeList;