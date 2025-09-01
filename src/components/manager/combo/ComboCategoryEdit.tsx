import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { notification } from 'antd';

interface ComboCategoryFormData {
  comboCategoryId: number;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

interface ComboCategoryFormErrors {
  name?: string;
  description?: string;
  displayOrder?: string;
}

const ComboCategoryEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComboCategoryFormData>({
    comboCategoryId: 0,
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<ComboCategoryFormErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: ComboCategoryFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Tên danh mục là bắt buộc';
    }
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    }
    if (formData.displayOrder < 0) {
      errors.displayOrder = 'Thứ tự hiển thị không thể âm';
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
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://terarium.shop/api/ComboCategories/${id}`, {
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
            throw new Error('Unauthorized');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
          setFormData({
            comboCategoryId: result.data.comboCategoryId,
            name: result.data.name,
            description: result.data.description,
            displayOrder: result.data.displayOrder,
            isActive: result.data.isActive,
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
    const processedValue = name === 'displayOrder' ? parseInt(value) || 0 : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    
    if (formErrors[name as keyof ComboCategoryFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({
      ...prev,
      isActive: !prev.isActive,
    }));
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
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://terarium.shop/api/ComboCategories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          comboCategoryId: formData.comboCategoryId,
          name: formData.name,
          description: formData.description,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          notification.error({
            message: 'Lỗi',
            description: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            placement: 'topRight',
          });
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 200) {
        notification.success({
          message: 'Thành công',
          description: 'Danh mục gói quà đã được cập nhật thành công!',
          placement: 'topRight',
        });
        navigate('/manager/combo-category/list');
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

  if (error && initialLoading === false && !formData.comboCategoryId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="text-red-500">⌘</div>
          <div>
            <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/manager/combo-category/list')}
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
          onClick={() => navigate('/manager/combo-category/list')}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Danh mục Gói quà</h1>
          <p className="text-gray-600">Cập nhật thông tin danh mục #{formData.comboCategoryId}</p>
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
                    name="name"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên danh mục gói quà"
                    disabled={loading}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
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
                    placeholder="Mô tả chi tiết về danh mục gói quà"
                    disabled={loading}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.displayOrder ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    disabled={loading}
                  />
                  {formErrors.displayOrder && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.displayOrder}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Số thứ tự để sắp xếp hiển thị danh mục. Số nhỏ hơn sẽ hiển thị trước.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Trạng thái hoạt động</span>
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                    disabled={loading}
                  >
                    {formData.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>Hoạt động</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Tạm dừng</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {formData.isActive 
                    ? 'Danh mục đang được hiển thị và có thể sử dụng'
                    : 'Danh mục bị ẩn và không thể sử dụng'
                  }
                </p>
              </div>
            </div>

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
                  onClick={() => navigate('/manager/combo-category/list')}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Lưu ý</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• Thay đổi trạng thái sẽ ảnh hưởng đến việc hiển thị danh mục</p>
                <p>• Thứ tự hiển thị sẽ được áp dụng ngay sau khi lưu</p>
                <p>• Tên và mô tả nên rõ ràng để khách hàng dễ hiểu</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComboCategoryEdit;