import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { notification } from 'antd';

interface ThemeFormData {
  environmentId: number;
  environmentName: string;
  environmentDescription: string;
}

const ThemeEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ThemeFormData>({
    environmentId: 0,
    environmentName: '',
    environmentDescription: '',
  });

  // Load existing theme data
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        const response = await fetch(`https://terarium.shop/api/Environment/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setFormData({
            environmentId: result.data.environmentId,
            environmentName: result.data.environmentName,
            environmentDescription: result.data.environmentDescription,
          });
        } else {
          throw new Error(result.message || 'Failed to load theme');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while loading theme');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadTheme();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://terarium.shop/api/Environment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environmentId: formData.environmentId,
          environmentName: formData.environmentName,
          environmentDescription: formData.environmentDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Chủ đề đã được cập nhật thành công!',
          placement: 'topRight',
        });
        navigate('/manager/theme/list');
      } else {
        throw new Error(result.message || 'Failed to update theme');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Có lỗi xảy ra khi cập nhật chủ đề: ${errorMessage}`);
      notification.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra khi cập nhật chủ đề: ${errorMessage}`,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
            <button
              onClick={() => navigate('/manager/theme/list')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manager/theme/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Chủ đề</h1>
          <p className="text-gray-600">Cập nhật thông tin chủ đề #{formData.environmentId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Chủ đề *
                  </label>
                  <input
                    type="text"
                    name="environmentName"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.environmentName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên chủ đề"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="environmentDescription"
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.environmentDescription}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về chủ đề"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hành động</h3>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Đang cập nhật...' : 'Cập nhật Chủ đề'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/theme/list')}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ThemeEdit;