import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { notification } from 'antd';

interface CategoryFormData {
  categoryId: number;
  categoryName: string;
  description: string;
}

interface CategoryFormErrors {
  categoryName?: string;
  description?: string;
}

const CategoryEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    categoryId: 0,
    categoryName: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: CategoryFormErrors = {};

    if (!formData.categoryName.trim()) {
      errors.categoryName = 'Tên danh mục là bắt buộc';
    }
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Load existing category data
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const response = await fetch(`https://terarium.shop/api/Category/get/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            notification.error({
              message: 'Lỗi',
              description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
              placement: 'topRight',
            });
            // Optionally redirect to login page
            // navigate('/login');
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setFormData({
            categoryId: result.data.categoryId,
            categoryName: result.data.categoryName,
            description: result.data.description,
          });
        } else {
          throw new Error(result.message || 'Failed to load category');
        }
      } catch (error) {
        console.error('Error loading category:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while loading category');
        notification.error({
          message: 'Lỗi',
          description: 'Có lỗi xảy ra khi tải dữ liệu danh mục',
          placement: 'topRight',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadCategory();
    }
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (formErrors[name as keyof CategoryFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        placement: 'topRight',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      const response = await fetch(`https://terarium.shop/api/Category/update-category/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          // Optionally redirect to login page
          // navigate('/login');
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Danh mục đã được cập nhật thành công!',
          placement: 'topRight',
        });
        navigate('/manager/category/list');
      } else {
        throw new Error(result.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Có lỗi xảy ra khi cập nhật danh mục: ${errorMessage}`);
      notification.error({
        message: 'Lỗi',
        description: `Có lỗi xảy ra khi cập nhật danh mục: ${errorMessage}`,
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
              onClick={() => navigate('/manager/category/list')}
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
          onClick={() => navigate('/manager/category/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Danh mục</h1>
          <p className="text-gray-600">Cập nhật thông tin danh mục #{formData.categoryId}</p>
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
                    Tên Danh mục *
                  </label>
                  <input
                    type="text"
                    name="categoryName"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.categoryName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.categoryName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên danh mục"
                    disabled={loading}
                  />
                  {formErrors.categoryName && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.categoryName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về danh mục"
                    disabled={loading}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
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
                  <span>{loading ? 'Đang cập nhật...' : 'Cập nhật Danh mục'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/manager/category/list')}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default CategoryEdit;